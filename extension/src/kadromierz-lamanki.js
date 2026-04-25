(function () {
  "use strict";

  let debugLogs = [];
  function dlog(msg) {
    const time = new Date().toLocaleTimeString("pl-PL", { hour12: false });
    const line = `[${time}] 🦊 ${msg}`;
    console.log(line);
    debugLogs.push(line);
  }

  dlog("Moduł Łamanek v10 (Opcja Do Końca + Auto-Loop) załadowany!");

  // --- FUNKCJE POMOCNICZE ---
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    valueSetter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  }

  function simulateFullClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    };
    element.dispatchEvent(new MouseEvent("mousedown", opts));
    element.dispatchEvent(new MouseEvent("mouseup", opts));
    element.dispatchEvent(new MouseEvent("click", opts));
  }

  function getCurrentKadromierzDate() {
    const params = new URLSearchParams(window.location.search);
    const fromDate = params.get("from");
    if (fromDate) return fromDate;
    return new Date().toISOString().split("T")[0];
  }

  function normalizeNorkaId(id) {
    let clean = String(id)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (clean === "DC2000") return "N20";
    if (clean === "DC3000" || clean === "DC300") return "N30";
    if (clean === "DC4000") return "N40";
    if (clean === "DC5000") return "N50";
    if (clean === "DC6000") return "N60";
    if (clean === "DC7000") return "N70";
    if (/^\d+$/.test(clean)) return "N" + clean;
    return clean;
  }

  function parseTimeMins(timeStr) {
    if (!timeStr || timeStr.includes("_")) return null;
    const [h, m] = timeStr.trim().split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  // --- SKANER GRAFIKU ---
  function getWorkersBaseData() {
    const scrollY = window.scrollY;
    const workers = [];
    let currentOriginalNorka = "UNKNOWN";
    let currentIdNorka = "UNKNOWN";

    document.querySelectorAll("tr, .kadroGrid__row").forEach((row) => {
      const th = row.querySelector("th.tab_title, .kadroGrid__groupHeader");
      if (th) {
        const txt = (th.textContent || "")
          .replace(/drag_handle/gi, "")
          .replace(/=\s*/g, "")
          .trim();
        const match = txt.match(/^(DC\s?\d{3,4}|N\d{1,4}|\d{1,4})(?:\s+.*)?$/i);
        if (match) {
          currentOriginalNorka = txt;
          currentIdNorka = normalizeNorkaId(match[1]);
        } else if (txt) {
          currentOriginalNorka = txt;
          currentIdNorka = "UNKNOWN";
        }
      }

      const nameEl = row.querySelector(".col_fullname");
      if (nameEl) {
        const rect = row.getBoundingClientRect();
        if (rect.height > 0) {
          workers.push({
            name: nameEl.textContent.trim(),
            rowElement: row,
            top: rect.top + scrollY,
            bottom: rect.bottom + scrollY,
            norkaInfo: { original: currentOriginalNorka, id: currentIdNorka },
            tdBlocks: [],
          });
        }
      }
    });

    document.querySelectorAll("td").forEach((td) => {
      if (
        !td.closest(".kadroGrid__contentContainer") &&
        !td.classList.contains("fc-slot")
      ) {
        if (
          !td.querySelector(".k-attendanceBar__block") &&
          !td.querySelector(".clickable")
        )
          return;
      }

      if (/(\d{1,2}:\d{2}|_+:_+)/.test(td.textContent)) {
        const rect = td.getBoundingClientRect();
        if (rect.height === 0) return;
        const centerTop = rect.top + scrollY + rect.height / 2;
        const left = rect.left + window.scrollX;

        let closestWorker = null;
        let minD = Infinity;
        workers.forEach((w) => {
          if (centerTop >= w.top - 10 && centerTop <= w.bottom + 10) {
            closestWorker = w;
            minD = 0;
          } else if (!closestWorker) {
            const dist = Math.abs(centerTop - (w.top + w.bottom) / 2);
            if (dist < minD && dist < 100) {
              minD = dist;
              closestWorker = w;
            }
          }
        });
        if (closestWorker)
          closestWorker.tdBlocks.push({ element: td, left: left });
      }
    });

    return workers;
  }

  // --- AUTOMATYCZNE PRZEKLIKIWANIE ŁAMANEK Z PĘTLĄ I OPCJĄ "DO KOŃCA" ---
  async function automateShiftBridging(ignoreTimeLimit, activeBtn) {
    debugLogs = [];
    const modeName = ignoreTimeLimit ? "WSZYSTKO DO PRZODU" : "DO TERAZ";
    dlog(`START: Rozpoczynam analizę grafiku... [TRYB: ${modeName}]`);

    // Zapisujemy oryginalny wygląd klikniętego przycisku
    const originalHTML = activeBtn.innerHTML;
    const originalBg = activeBtn.style.background;

    activeBtn.textContent = "⏳ Przetwarzam...";
    activeBtn.style.background = "#fbbf24";

    try {
      const activeDate = getCurrentKadromierzDate();
      const nbData = JSON.parse(localStorage.getItem("km_nb_list") || "{}");
      const nbWorkers = nbData[activeDate] || [];

      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      let totalProcessedCount = 0;
      let passNumber = 1;
      let changesInThisPass = false;

      do {
        changesInThisPass = false;
        dlog(`=== Rozpoczynam SKAN NR ${passNumber} ===`);
        const workers = getWorkersBaseData();

        for (const w of workers) {
          if (w.norkaInfo.id === "UNKNOWN" || w.tdBlocks.length < 2) continue;

          const uniqueId = `${w.norkaInfo.original}_${w.name}`;
          if (nbWorkers.includes(uniqueId)) continue;

          w.tdBlocks.sort((a, b) => a.left - b.left);
          const startsCol = w.tdBlocks[0];
          const endsCol = w.tdBlocks[1];

          const starts = { planned: [], actual: [] };
          const ends = { planned: [], actual: [] };

          const extractSpans = (col, targetObj) => {
            col.element.querySelectorAll("span").forEach((span) => {
              const txt = span.textContent.trim();
              if (/^(\d{1,2}:\d{2}|_+:_+)$/.test(txt)) {
                let isActual =
                  span.classList.contains("clickable") ||
                  !!span.closest("a") ||
                  txt.includes("_");
                if (
                  span.style.color &&
                  span.style.color !== "rgb(0, 0, 0)" &&
                  span.style.color !== "inherit" &&
                  span.style.color !== ""
                )
                  isActual = true;
                if (isActual)
                  targetObj.actual.push({ time: txt, element: span });
                else targetObj.planned.push({ time: txt, element: span });
              }
            });
          };

          extractSpans(startsCol, starts);
          extractSpans(endsCol, ends);

          while (ends.planned.length > starts.planned.length) {
            ends.actual.unshift(ends.planned.pop());
          }
          while (starts.planned.length > ends.planned.length) {
            starts.actual.unshift(starts.planned.pop());
          }

          if (
            starts.planned.length >= 2 &&
            ends.planned.length >= 2 &&
            ends.actual.length >= 1
          ) {
            const openActualEndIndex = ends.actual.findIndex((e) =>
              e.time.includes("_"),
            );

            if (openActualEndIndex !== -1) {
              if (
                openActualEndIndex < ends.planned.length &&
                openActualEndIndex + 1 < starts.planned.length
              ) {
                const pStartStr = starts.planned[openActualEndIndex].time;
                const pEndStr = ends.planned[openActualEndIndex].time;
                const shift2PlannedStart =
                  starts.planned[openActualEndIndex + 1].time;
                const shift1ActualStart = starts.actual[openActualEndIndex]
                  ? starts.actual[openActualEndIndex].time
                  : pStartStr;
                const shift1ActualEndElem =
                  ends.actual[openActualEndIndex].element;

                const pStartMins = parseTimeMins(pStartStr);
                let pEndMins = parseTimeMins(pEndStr);

                if (pStartMins !== null && pEndMins !== null) {
                  if (pEndMins <= pStartMins) pEndMins += 1440;
                  let currentMins = nowMins;
                  if (currentMins < pStartMins) currentMins += 1440;

                  dlog(
                    `Kandydat: ${w.name} [${w.norkaInfo.id}]. Zmiana otwarta. Czas plan. końca: ${pEndStr}.`,
                  );

                  // KLUCZOWA ZMIANA: Sprawdzamy, czy ignorujemy czas (Opcja 2), czy jest on faktycznie późniejszy
                  if (ignoreTimeLimit || currentMins >= pEndMins) {
                    dlog(
                      `>>> PRZEKLIKUJĘ: ${w.name} na norce ${w.norkaInfo.id}.`,
                    );

                    // --- ETAP 1: Zapisanie pierwszej części ---
                    simulateFullClick(shift1ActualEndElem);
                    await delay(1000);

                    let modalInput = document.querySelector(
                      "input.kmd-textInput--modal",
                    );
                    if (modalInput) {
                      setNativeValue(
                        modalInput,
                        `${shift1ActualStart}-${pEndStr}`,
                      );
                      await delay(500);

                      let saveBtn = Array.from(
                        document.querySelectorAll("span, button"),
                      ).find(
                        (b) => b.textContent.trim().toLowerCase() === "zapisz",
                      );
                      if (saveBtn) simulateFullClick(saveBtn);
                      await delay(2500);
                    }

                    // --- ETAP 2: Otwarcie nowej zmiany ---
                    const freshWorkers = getWorkersBaseData();
                    const fw = freshWorkers.find(
                      (f) =>
                        f.name === w.name && f.norkaInfo.id === w.norkaInfo.id,
                    );

                    if (fw) {
                      let allBars = Array.from(
                        document.querySelectorAll(".k-attendanceBar__block"),
                      );
                      let workerBars = [];

                      allBars.forEach((bar) => {
                        const rect = bar.getBoundingClientRect();
                        if (rect.height === 0) return;
                        const centerTop =
                          rect.top + window.scrollY + rect.height / 2;
                        if (
                          centerTop >= fw.top - 15 &&
                          centerTop <= fw.bottom + 15
                        ) {
                          workerBars.push(bar);
                        }
                      });

                      let targetEl = null;
                      if (workerBars.length > 0) {
                        targetEl = workerBars[workerBars.length - 1];
                      } else {
                        if (fw.tdBlocks.length > 0) {
                          let spans = Array.from(
                            fw.tdBlocks[0].element.querySelectorAll("span"),
                          );
                          let matchedSpans = spans.filter(
                            (s) => s.textContent.trim() === shift2PlannedStart,
                          );
                          if (matchedSpans.length > 0)
                            targetEl = matchedSpans[matchedSpans.length - 1];
                        }
                      }

                      if (targetEl) {
                        simulateFullClick(targetEl);
                        await delay(1500);

                        let timeInput = document.querySelector(
                          "input.kmd-textInput--modal",
                        );

                        if (timeInput) {
                          timeInput.focus();
                          setNativeValue(timeInput, "");
                          await delay(200);

                          setNativeValue(
                            timeInput,
                            `${shift2PlannedStart}-__:__`,
                          );
                          await delay(600);

                          let addBtn = Array.from(
                            document.querySelectorAll("button"),
                          ).find(
                            (b) =>
                              b.textContent.trim().toUpperCase() === "DODAJ",
                          );
                          if (addBtn) simulateFullClick(addBtn);
                          await delay(2500);

                          // SUKCES
                          totalProcessedCount++;
                          changesInThisPass = true;
                          break; // Przerywamy sprawdzanie by zacząć nową pętlę ze świeżym grafikiem
                        }
                      }
                    }
                  } else {
                    dlog(`Pominięto: ${w.name}. Za wcześnie na cięcie.`);
                  }
                }
              }
            }
          }
        }
        passNumber++;
      } while (changesInThisPass && passNumber <= 15);

      // Przywracanie wyglądu przycisku
      activeBtn.innerHTML = originalHTML;
      activeBtn.style.background = originalBg;

      if (totalProcessedCount === 0) {
        alert("🦊 Lisek: Brak łamanek 💅 💅 💅 do przeklikania!");
      } else {
        alert(
          `🦊 Lisek: Zakończono! Przeklikano ${totalProcessedCount} łamanek 💅 💅 💅.`,
        );
      }
    } catch (error) {
      dlog(`KRYTYCZNY BŁĄD SKRYPTU: ${error.message}`);
      activeBtn.innerHTML = originalHTML;
      activeBtn.style.background = originalBg;
    }
  }

  // --- KULOODPORNA INJEKCJA INTERFEJSU ---
  function injectLamankiUI() {
    const panel = document.getElementById("km-lisek-panel");
    if (!panel) return;

    // Upewniamy się, że przyciski jeszcze nie istnieją
    if (document.getElementById("km-lamanki-btn-now")) {
      clearInterval(injectionInterval);
      return;
    }

    // Usunięcie ewentualnego starego, pojedynczego przycisku
    const oldBtn = document.getElementById("km-lamanki-btn");
    if (oldBtn) oldBtn.remove();

    // Przycisk 1: Klasyczne łamanki (do teraz)
    const btnNow = document.createElement("button");
    btnNow.id = "km-lamanki-btn-now";
    btnNow.innerHTML = "🔀 Łamanki <b>(Do teraz)</b>";
    btnNow.style.cssText = `
      background: #8b5cf6; color: white; border: none; border-radius: 6px;
      padding: 8px 10px; font-size: 13px; cursor: pointer; transition: 0.2s;
    `;
    btnNow.addEventListener(
      "mouseover",
      () => (btnNow.style.filter = "brightness(1.1)"),
    );
    btnNow.addEventListener(
      "mouseout",
      () => (btnNow.style.filter = "brightness(1)"),
    );
    btnNow.addEventListener("click", () =>
      automateShiftBridging(false, btnNow),
    );

    // Przycisk 2: Łamanki wszystko do końca
    const btnAll = document.createElement("button");
    btnAll.id = "km-lamanki-btn-all";
    btnAll.innerHTML = "⏭️ Łamanki <b>(Do końca)</b>";
    btnAll.style.cssText = `
      background: #7c3aed; color: white; border: none; border-radius: 6px;
      padding: 8px 10px; font-size: 13px; cursor: pointer; transition: 0.2s;
    `;
    btnAll.addEventListener(
      "mouseover",
      () => (btnAll.style.filter = "brightness(1.1)"),
    );
    btnAll.addEventListener(
      "mouseout",
      () => (btnAll.style.filter = "brightness(1)"),
    );
    btnAll.addEventListener("click", () => automateShiftBridging(true, btnAll));

    panel.appendChild(btnNow);
    panel.appendChild(btnAll);
    clearInterval(injectionInterval);
  }

  const injectionInterval = setInterval(injectLamankiUI, 500);
})();
