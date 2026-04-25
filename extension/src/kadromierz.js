(function () {
  "use strict";
  function makeDraggable(handle, panel) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.bottom = "auto";
      panel.style.right = "auto";
      handle.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      handle.style.cursor = "grab";
    });
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

  function getCityData(norkaId) {
    const id = normalizeNorkaId(norkaId);
    if (/^N([1-9]|1[0-9])$/.test(id)) return { city: "WAW", threshold: 10 };
    if (/^N(2[0-9])$/.test(id)) return { city: "KRK", threshold: 5 };
    if (/^N(3[0-4])$/.test(id)) return { city: "WRO", threshold: 5 };
    if (/^N(4[0-4])$/.test(id)) return { city: "GDA", threshold: 5 };
    if (/^N(5[0-3])$/.test(id)) return { city: "POZ", threshold: 5 };
    if (/^N(6[0-1])$/.test(id)) return { city: "KAT", threshold: 5 };
    if (/^N(7[0-1])$/.test(id)) return { city: "LDZ", threshold: 5 };
    return { city: "INNE", threshold: 999 };
  }

  function parseTimeMins(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.trim().split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function getLateMins(planned, actual) {
    if (!planned || !actual) return 0;
    const p = parseTimeMins(planned);
    const a = parseTimeMins(actual);
    if (p === null || a === null) return 0;
    let diff = a - p;
    if (diff < -720) diff += 1440;
    else if (diff > 720) diff -= 1440;
    return diff;
  }

  function scrapeKadromierz() {
    const scrollY = window.scrollY;
    const activeDate = getCurrentKadromierzDate();

    const nbData = JSON.parse(localStorage.getItem("km_nb_list") || "{}");
    const nbWorkers = nbData[activeDate] || [];

    const ignoreData = JSON.parse(
      localStorage.getItem("km_ignore_list") || "{}",
    );
    const ignoredWorkers = ignoreData[activeDate] || [];

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
            top: rect.top + scrollY,
            bottom: rect.bottom + scrollY,
            norkaInfo: {
              original: currentOriginalNorka,
              id: currentIdNorka,
            },
            tdBlocks: [],
          });
        }
      }
    });

    document.querySelectorAll("td").forEach((td) => {
      if (/\d{1,2}:\d{2}/.test(td.textContent)) {
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
        if (closestWorker) {
          closestWorker.tdBlocks.push({ element: td, left: left });
        }
      }
    });

    const lateWorkers = [];
    workers.forEach((w) => {
      const uniqueId = `${w.norkaInfo.original}_${w.name}`;

      if (w.norkaInfo.id === "UNKNOWN" || w.tdBlocks.length === 0) return;
      if (ignoredWorkers.includes(uniqueId)) return;

      w.tdBlocks.sort((a, b) => a.left - b.left);
      const startCellInfo = w.tdBlocks[0];
      if (!startCellInfo) return;

      const plannedStarts = [];
      const actualStarts = [];

      startCellInfo.element.querySelectorAll("span").forEach((span) => {
        const txt = span.textContent.trim();
        if (/^\d{1,2}:\d{2}$/.test(txt)) {
          let isActual =
            span.classList.contains("clickable") || !!span.closest("a");
          if (span.style.color) {
            const c = span.style.color.replace(/\s/g, "").toLowerCase();
            if (
              c !== "rgb(0,0,0)" &&
              c !== "rgba(0,0,0,0.87)" &&
              c !== "inherit" &&
              c !== ""
            ) {
              isActual = true;
            }
          }
          if (isActual) actualStarts.push({ time: txt });
          else plannedStarts.push({ time: txt });
        }
      });

      const cityInfo = getCityData(w.norkaInfo.id);
      const isNB = nbWorkers.includes(uniqueId);

      if (isNB) {
        lateWorkers.push({
          city: cityInfo.city,
          original: w.norkaInfo.original,
          name: w.name,
          lateMins: 0,
          isNB: true,
        });
        return;
      }

      plannedStarts.forEach((planned, index) => {
        const actual = actualStarts[index];
        if (actual) {
          const lateMins = getLateMins(planned.time, actual.time);
          if (lateMins >= cityInfo.threshold) {
            lateWorkers.push({
              city: cityInfo.city,
              original: w.norkaInfo.original,
              name: w.name,
              lateMins: lateMins,
              isNB: false,
            });
          }
        }
      });
    });

    return lateWorkers;
  }

  function generateAndCopyReport() {
    const lates = scrapeKadromierz();
    if (lates.length === 0) {
      alert("🦊 Lisek: Brak spóźnień/NB do skopiowania.");
      return;
    }

    function sortNorkas(a, b) {
      const aIsDC = a.original.toUpperCase().startsWith("DC");
      const bIsDC = b.original.toUpperCase().startsWith("DC");
      if (aIsDC && !bIsDC) return 1;
      if (!aIsDC && bIsDC) return -1;
      return a.original.localeCompare(b.original, undefined, { numeric: true });
    }

    let reportText = "";
    const citiesOrder = ["KRK", "WRO", "GDA", "POZ", "KAT", "LDZ", "WAW"];

    citiesOrder.forEach((city) => {
      const cityLates = lates.filter((l) => l.city === city);
      if (cityLates.length === 0) return;
      reportText += `spóźnienia i nieobecności ${city}:\n`;
      cityLates.sort(sortNorkas);
      cityLates.forEach((l) => {
        let display = l.original.toLowerCase();
        if (/^\d+$/.test(display)) display = "n" + display;

        if (l.isNB) reportText += `${display} - ${l.name} - nb\n`;
        else reportText += `${display} - ${l.name} - ${l.lateMins}min\n`;
      });
      reportText += `\n`;
    });

    navigator.clipboard
      .writeText(reportText.trim())
      .then(() => {
        const btn = document.getElementById("km-lisek-btn");
        btn.textContent = "✅ Skopiowano!";
        btn.style.background = "#10b981";
        setTimeout(() => {
          btn.textContent = "🦊 Raport Spóźnień";
          btn.style.background = "#3b82f6";
        }, 2500);
      })
      .catch((err) => {
        alert("Błąd kopiowania: " + err);
      });
  }

  function injectUI() {
    if (document.getElementById("km-lisek-panel")) return;

    const panel = document.createElement("div");
    panel.id = "km-lisek-panel";
    panel.style.cssText = `
      position: fixed; bottom: 30px; right: 30px; z-index: 2147483647;
      background: #111827; border: 2px solid #374151; border-radius: 8px;
      padding: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: flex; flex-direction: column; gap: 8px; font-family: sans-serif;
    `;

    const header = document.createElement("div");
    header.textContent = "🦊 Przeciągnij";
    header.style.cssText = `
      cursor: grab;
      background: #1f2937;
      padding: 4px;
      text-align: center;
      font-size: 12px;
      border-radius: 4px;
    `;

    const btn = document.createElement("button");
    btn.id = "km-lisek-btn";
    btn.textContent = "🦊 Raport Spóźnień";
    btn.style.cssText = `
      background: #3b82f6; color: white; border: none; border-radius: 6px;
      padding: 10px 16px; font-size: 14px; font-weight: bold; cursor: pointer;
    `;

    btn.addEventListener("click", generateAndCopyReport);

    panel.appendChild(header);
    panel.appendChild(btn);
    document.body.appendChild(panel);

    makeDraggable(header, panel);
  }

  setTimeout(injectUI, 1000);
})();
