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

  const DEBUG_MODE = true;

  function logDebug(msg) {
    if (DEBUG_MODE)
      console.log(
        `%c🦊 [LISEK]%c ${msg}`,
        "color: #f59e0b; font-weight: bold;",
        "color: inherit;",
      );
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
    if (!timeStr || timeStr === "--" || timeStr === "_:_") return null;
    const [h, m] = timeStr.trim().split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function markAsNB(uniqueId) {
    const activeDate = getCurrentKadromierzDate();
    let nbData = JSON.parse(localStorage.getItem("km_nb_list") || "{}");
    if (!nbData[activeDate]) nbData[activeDate] = [];
    if (!nbData[activeDate].includes(uniqueId)) {
      nbData[activeDate].push(uniqueId);
      localStorage.setItem("km_nb_list", JSON.stringify(nbData));
    }
    renderAlerts(runAlertScanner());
  }

  function scrapePhonesFromDOM() {
    let phoneBook = JSON.parse(localStorage.getItem("km_phone_book") || "{}");
    let updated = false;

    document.querySelectorAll("tr").forEach((row) => {
      let phone = null;
      row.querySelectorAll("td").forEach((td) => {
        const txt = td.textContent.trim();
        const match = txt.match(
          /^(?:\+48)?\s*(\d{3})[-\s]?(\d{3})[-\s]?(\d{3})$/,
        );
        if (match) phone = `${match[1]}-${match[2]}-${match[3]}`;
        else if (/^\d{9}$/.test(txt))
          phone = `${txt.slice(0, 3)}-${txt.slice(3, 6)}-${txt.slice(6, 9)}`;
      });

      if (phone) {
        const tds = row.querySelectorAll("td");
        if (tds.length >= 2) {
          let rawNameCell = tds[1].textContent.replace(/\s+/g, " ").trim();
          if (rawNameCell && phoneBook[rawNameCell] !== phone) {
            phoneBook[rawNameCell] = phone;
            updated = true;
          }
        }
      }
    });

    if (updated) {
      localStorage.setItem("km_phone_book", JSON.stringify(phoneBook));
      logDebug(`Zaktualizowano bazę numerów! (Metoda strukturalna)`);
    }
  }

  function runAlertScanner() {
    const activeDate = getCurrentKadromierzDate();
    const todayStr = new Date().toISOString().split("T")[0];

    if (activeDate !== todayStr) {
      return { isSleeping: true, date: activeDate, alerts: [] };
    }

    const scrollY = window.scrollY;
    const nbData = JSON.parse(localStorage.getItem("km_nb_list") || "{}");
    const nbWorkers = nbData[activeDate] || [];

    const ignoreData = JSON.parse(
      localStorage.getItem("km_ignore_list") || "{}",
    );
    const ignoredWorkers = ignoreData[activeDate] || [];

    const phoneBook = JSON.parse(localStorage.getItem("km_phone_book") || "{}");

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
        if (closestWorker)
          closestWorker.tdBlocks.push({ element: td, left: left });
      }
    });

    const alerts = [];
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    workers.forEach((w) => {
      const uniqueId = `${w.norkaInfo.original}_${w.name}`;

      if (w.norkaInfo.id === "UNKNOWN" || w.tdBlocks.length === 0) return;
      if (nbWorkers.includes(uniqueId)) return;
      if (ignoredWorkers.includes(uniqueId)) return;

      w.tdBlocks.sort((a, b) => a.left - b.left);
      const startCellInfo = w.tdBlocks[0];
      const endCellInfo = w.tdBlocks[1];

      const extractTimes = (cellInfo) => {
        if (!cellInfo) return { planned: [], actual: [] };
        const planned = [];
        const actual = [];
        cellInfo.element.querySelectorAll("span").forEach((span) => {
          const txt = span.textContent.trim();
          if (/^\d{1,2}:\d{2}$/.test(txt)) {
            let isAct =
              span.classList.contains("clickable") || !!span.closest("a");
            if (span.style.color) {
              const c = span.style.color.replace(/\s/g, "").toLowerCase();
              if (
                c !== "rgb(0,0,0)" &&
                c !== "rgba(0,0,0,0.87)" &&
                c !== "inherit" &&
                c !== ""
              )
                isAct = true;
            }
            if (isAct) actual.push({ time: txt });
            else planned.push({ time: txt });
          }
        });
        return { planned, actual };
      };

      const startData = extractTimes(startCellInfo);
      const endData = extractTimes(endCellInfo);

      const plannedStart = startData.planned[0];
      const actualStart = startData.actual[0];
      const plannedEnd = endData.planned[endData.planned.length - 1];
      const actualEnd = endData.actual[endData.actual.length - 1];

      let pStartMins = plannedStart ? parseTimeMins(plannedStart.time) : null;
      let pEndMins = plannedEnd ? parseTimeMins(plannedEnd.time) : null;

      if (pStartMins !== null && pEndMins !== null) {
        if (plannedEnd.time === "00:00") {
          pEndMins = 1440;
        } else if (pEndMins <= pStartMins) {
          pEndMins += 1440;
        }
      }

      let userPhone = null;
      for (let key in phoneBook) {
        if (key.includes(w.name)) {
          userPhone = phoneBook[key];
          break;
        }
      }

      if (plannedStart && !actualStart && pStartMins !== null) {
        if (nowMins >= pStartMins) {
          const lateMins = nowMins - pStartMins;
          if (lateMins >= 3) {
            alerts.push({
              norka: w.norkaInfo.original,
              name: w.name,
              type: "Brak wejścia",
              val: `${lateMins} minut spóźniony`,
              color: "#f59e0b",
              showNbBtn: true,
              phone: userPhone,
            });
          }
        }
      }

      if (
        plannedEnd &&
        !actualEnd &&
        startData.actual.length > 0 &&
        pEndMins !== null
      ) {
        if (nowMins >= pEndMins) {
          const unloggedMins = nowMins - pEndMins;
          if (unloggedMins >= 30) {
            alerts.push({
              norka: w.norkaInfo.original,
              name: w.name,
              type: "Brak wylogowania",
              val: `${unloggedMins} minut po zmianie nie jest wylogowany`,
              color: "#ef4444",
              showNbBtn: false,
              phone: userPhone,
            });
          }
        }
      }
    });

    return { isSleeping: false, date: activeDate, alerts: alerts };
  }

  function renderAlerts(data) {
    const content = document.getElementById("km-alerts-content");
    const timeLabel = document.getElementById("km-alerts-time");
    if (!content || !timeLabel) return;

    const now = new Date();
    timeLabel.textContent = `Akt. ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (data.isSleeping) {
      content.innerHTML = `<div style="text-align: center; color: #9ca3af; padding: 30px 10px; font-size: 13px; line-height: 1.6;"><div style="font-size: 24px; margin-bottom: 8px;">💤</div><b>Radar uśpiony</b><br><br>Przeglądasz grafik z dnia:<br><span style="color: #fbbf24; font-weight: bold;">${data.date}</span><br><br>Alerty "na żywo" działają<br>tylko dla bieżącej daty.</div>`;
      return;
    }

    const alerts = data.alerts;
    if (alerts.length === 0) {
      content.innerHTML = `<div style="text-align: center; color: #10b981; padding: 20px 10px; font-size: 14px;">✅ Brak alertów na żywo!</div>`;
      return;
    }

    let html = "";
    alerts.forEach((a) => {
      let displayNorka = a.norka.toUpperCase();
      if (/^\d+$/.test(displayNorka)) displayNorka = "N" + displayNorka;

      const uniqueId = `${a.norka}_${a.name}`;

      const nbBtnHtml = a.showNbBtn
        ? `<button class="km-mark-nb-btn" data-id="${uniqueId}" style="background:#ef4444; color:white; border:none; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer;">OZNACZ JAKO NB</button>`
        : "";

      const ignoreBtnHtml = `<button class="km-mark-ignore-btn" data-id="${uniqueId}" style="background:#4b5563; color:white; border:none; padding:3px 6px; border-radius:4px; font-size:10px; cursor:pointer;">IGNORUJ</button>`;

      const phoneHtml = a.phone
        ? `<span style="color: #60a5fa; margin-left: 6px; letter-spacing: 1px;">📞 ${a.phone}</span>`
        : `<span style="color: #4b5563; margin-left: 6px;" title="Wejdź na chwilę w zakładkę Pracownicy, aby zaktualizować">📞 Brak w bazie</span>`;

      html += `<div class="km-alert-item" data-worker="${a.name}" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-bottom: 6px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 4px solid ${a.color}; transition: background 0.2s;">
        <div>
          <div style="font-weight: bold; color: #e5e7eb; margin-bottom: 3px;"><span style="color: #fbbf24; margin-right: 6px;">${displayNorka}</span>${a.name}</div>
          <div style="font-size: 10px; color: #9ca3af; text-transform: uppercase;">${a.type} ${phoneHtml}</div>
          <div style="margin-top:4px; display:flex; gap:6px; position:relative; z-index:2;">${nbBtnHtml}${ignoreBtnHtml}</div>
        </div>
        <div style="font-weight: bold; color: ${a.color}; font-size: 12px; text-align: right;">${a.val}</div>
      </div>`;
    });
    content.innerHTML = html;
  }

  function injectAlertsUI() {
    if (document.getElementById("km-alerts-panel")) return;

    const style = document.createElement("style");
    style.textContent = `
      .km-alert-item:hover { background: rgba(255,255,255,0.1) !important; }
      
      #km-alerts-panel.km-minimized {
        height: 40px !important; 
        min-height: 40px !important;
        resize: none !important;
      }
      #km-alerts-panel.km-minimized #km-alerts-content {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.id = "km-alerts-panel";

    panel.style.cssText = `
      position: fixed; bottom: 80px; right: 30px;
      z-index: 2147483646; background: #111827;
      border: 2px solid #374151; border-radius: 8px;
      padding: 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: none; flex-direction: column;
      font-family: sans-serif;
      width: 350px; height: 450px;
      min-width: 250px; 
      resize: both; overflow: hidden;
      box-sizing: border-box;
    `;

    panel.innerHTML = `
      <div id="km-alerts-header" style="
        cursor: grab;
        background: #1f2937;
        color: #9ca3af;
        padding: 0 12px;
        height: 40px;
        box-sizing: border-box;
        font-weight: bold;
        font-size: 13px;
        border-bottom: 1px solid #374151;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        width: 100%;
      ">
        <span style="display: flex; align-items: center;">
          🔔 Alerty Na Żywo
          <span id="km-clear-nb" style="cursor:pointer; font-size: 14px; margin-left: 8px;" title="Wyczyść pamięć NB i zignorowanych">🗑️</span>
        </span>
        <div style="display: flex; align-items: center; justify-content: flex-end;">
             <span id="km-alerts-time" style="font-weight: normal; font-size: 11px; margin-right: 10px;">...</span>
             <span id="km-minimize-alerts" style="cursor:pointer; font-size: 14px; font-weight: bold; transform: translateY(-2px); width: 20px; text-align: center; color: #e5e7eb;" title="Minimalizuj/Maksymalizuj">_</span>
        </div>
      </div>

      <div id="km-alerts-content" style="
        padding: 10px;
        overflow-y: auto;
        flex-grow: 1;
        font-size: 13px;
        color: #e5e7eb;
        width: 100%;
      ">
        <div style="text-align: center; color: #6b7280; padding: 15px 10px;">
          Ładowanie...
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const header = document.getElementById("km-alerts-header");
    makeDraggable(header, panel);
  }

  setInterval(() => {
    const allowed =
      location.pathname.includes("/attendance") ||
      location.pathname.includes("/companymanage");
    const btnPanel = document.getElementById("km-lisek-panel");
    const alertPanel = document.getElementById("km-alerts-panel");

    if (btnPanel) btnPanel.style.display = allowed ? "flex" : "none";
    if (alertPanel && !alertPanel.classList.contains("km-minimized")) {
      alertPanel.style.display = allowed ? "flex" : "none";
    }
  }, 1000);

  let refreshTimeout;
  document.body.addEventListener("click", (e) => {
    const minimizeBtn = e.target.closest("#km-minimize-alerts");
    if (minimizeBtn) {
      const panel = document.getElementById("km-alerts-panel");
      const isMinimized = panel.classList.contains("km-minimized");
      const rect = panel.getBoundingClientRect();

      // LOGI DEBUGOWANIA
      console.log(
        "%c=== DEBUG MINIMALIZACJI ===",
        "color: #f59e0b; font-weight: bold; font-size: 14px;",
      );
      console.log("Akcja:", isMinimized ? "MAKSYMALIZACJA" : "MINIMALIZACJA");
      console.log("Styl inline (panel.style.cssText):", panel.style.cssText);
      console.log("Pozycja (getBoundingClientRect):", {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        height: rect.height,
      });

      if (isMinimized) {
        panel.classList.remove("km-minimized");
        if (panel.dataset.origHeight) {
          panel.style.height = panel.dataset.origHeight;
        }
        minimizeBtn.innerHTML = "_";
        minimizeBtn.style.transform = "translateY(-2px)";
      } else {
        panel.dataset.origHeight = window.getComputedStyle(panel).height;
        panel.classList.add("km-minimized");
        minimizeBtn.innerHTML = "&#9633;";
        minimizeBtn.style.transform = "translateY(0px)";
      }
      return;
    }

    if (
      e.target.closest(".k-dropdown") ||
      e.target.closest(".k-list-container") ||
      e.target.closest(".k-item") ||
      e.target.closest("input[type='checkbox']")
    ) {
      const content = document.getElementById("km-alerts-content");
      if (content)
        content.innerHTML = `<div style="text-align: center; color: #60a5fa; padding: 20px 10px; font-weight: bold;">⏳ Filtrowanie grafiku...</div>`;
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        renderAlerts(runAlertScanner());
      }, 4500);
      return;
    }

    const clearBtn = e.target.closest("#km-clear-nb");
    if (clearBtn) {
      const activeDate = getCurrentKadromierzDate();

      let nbData = JSON.parse(localStorage.getItem("km_nb_list") || "{}");
      delete nbData[activeDate];
      localStorage.setItem("km_nb_list", JSON.stringify(nbData));

      let ignoreData = JSON.parse(
        localStorage.getItem("km_ignore_list") || "{}",
      );
      delete ignoreData[activeDate];
      localStorage.setItem("km_ignore_list", JSON.stringify(ignoreData));

      const content = document.getElementById("km-alerts-content");
      if (content)
        content.innerHTML = `<div style="text-align: center; color: #10b981; padding: 20px 10px; font-size: 14px;">✅ Pamięć wyczyszczona dla dnia: ${activeDate}!</div>`;
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        renderAlerts(runAlertScanner());
      }, 1500);
      return;
    }

    const nbBtn = e.target.closest(".km-mark-nb-btn");
    if (nbBtn) {
      markAsNB(nbBtn.dataset.id);
      return;
    }

    const ignoreBtn = e.target.closest(".km-mark-ignore-btn");
    if (ignoreBtn) {
      const uniqueId = ignoreBtn.dataset.id;
      const activeDate = getCurrentKadromierzDate();
      let ignoreData = JSON.parse(
        localStorage.getItem("km_ignore_list") || "{}",
      );
      if (!ignoreData[activeDate]) ignoreData[activeDate] = [];
      if (!ignoreData[activeDate].includes(uniqueId)) {
        ignoreData[activeDate].push(uniqueId);
        localStorage.setItem("km_ignore_list", JSON.stringify(ignoreData));
      }
      renderAlerts(runAlertScanner());
      return;
    }

    const alertItem = e.target.closest(".km-alert-item");
    if (alertItem) {
      const workerName = alertItem.dataset.worker;
      const targetEl = Array.from(
        document.querySelectorAll(".col_fullname"),
      ).find((el) => el.textContent.trim() === workerName);
      if (targetEl) {
        const row =
          targetEl.closest("tr, [role='row']") ||
          targetEl.parentElement.parentElement;
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          const originalBg = row.style.backgroundColor;
          const originalTransition = row.style.transition;
          row.style.transition = "background-color 0.3s";
          row.style.backgroundColor = "rgba(251, 191, 36, 0.3)";
          setTimeout(() => {
            row.style.backgroundColor = originalBg;
            setTimeout(() => {
              row.style.transition = originalTransition;
            }, 300);
          }, 1500);
        }
      }
      return;
    }

    const btn = e.target.closest(".k-refreshButton button, .k-refreshButton");
    if (btn) {
      const content = document.getElementById("km-alerts-content");
      if (content)
        content.innerHTML = `<div style="text-align: center; color: #60a5fa; padding: 20px 10px; font-weight: bold;">⏳ Skanowanie...</div>`;
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        renderAlerts(runAlertScanner());
      }, 2500);
    }
  });

  setTimeout(() => {
    injectAlertsUI();
    renderAlerts(runAlertScanner());
  }, 3500);
})();
