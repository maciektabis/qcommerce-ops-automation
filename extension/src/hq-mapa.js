(function () {
  "use strict";

  // --- KONFIGURACJA TELEGRAMA ---
  const TG_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE";

  const TG_CHANNELS = {
    default: "-1003926003984", // Grupa testowa dla awaryjnych rzutów

    // ID czatów firmowych celowo zmienione:

    // --- WARSZAWA ---
    4: "-1000000000000", // N1
    5: "-1000000000000", // N2
    6: "-1000000000000", // N3
    7: "-1000000000000", // N4
    8: "-1000000000000", // N5
    9: "-1000000000000", // N6
    10: "-1000000000000", // N7
    11: "-1000000000000", // N8
    12: "-1000000000000", // N9
    15: "-1000000000000", // N10
    // "14": "default",       // N11 -> Nie istnieje
    20: "-1000000000000", // N12
    22: "-1000000000000", // N13
    24: "-1000000000000", // N14
    29: "-1000000000000", // N15
    42: "-1000000000000", // N16
    47: "-1000000000000", // N17
    50: "-1000000000000", // N18 (Ząbki)
    18: "-1000000000000", // N19 (Piaseczno)

    // --- KRAKÓW ---
    16: "-1000000000000", // N20
    17: "-1000000000000", // N21
    21: "-1000000000000", // N22
    32: "-1000000000000", // N23
    51: "-1000000000000", // N24

    // --- WROCŁAW ---
    23: "-1000000000000", // N30
    27: "-1000000000000", // N31
    33: "-1000000000000", // N32
    37: "-1000000000000", // N33
    43: "-1000000000000", // N34

    // --- POZNAŃ ---
    31: "-1000000000000", // N50
    39: "-1000000000000", // N51
    41: "-1000000000000", // N52
    48: "-1000000000000", // N53

    // --- TRÓJMIASTO ---
    26: "-1000000000000", // N40
    28: "-1000000000000", // N41
    30: "-1000000000000", // N42
    38: "-1000000000000", // N43
    // 44: "-1000000000000,  N44

    // --- INNE MIASTA ---
    55: "-1000000000000", // N80 (Jastarnia)
    40: "-1000000000000", // N60 (Katowice)
    49: "-1000000000000", // N61 (Katowice)
    53: "-1000000000000", // N70 (Łódź)
    54: "-1000000000000", // N71 (Łódź)

    // --- TEST ---
    61: "-1002057013548", // DC1111
  };

  async function sendTelegram(storeId, message) {
    const chatId = TG_CHANNELS[storeId] || TG_CHANNELS["default"];
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
    } catch (e) {
      console.error("Błąd Telegrama:", e);
    }
  }
  // --- KONIEC LOGIKI TELEGRAMA ---

  const cityMap = {
    "Test (DC1111)": [61],
    Warszawa: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 14, 20, 22, 24, 29, 42, 47, 50, 18,
    ],
    Kraków: [16, 17, 21, 32, 51],
    Wrocław: [23, 27, 33, 37, 43],
    Poznań: [31, 39, 41, 48],
    Trójmiasto: [26, 28, 30, 38, 44],
    Jastarnia: [55],
    Katowice: [40, 49],
    Łódź: [53, 54],
  };

  const norkaNames = {
    4: "N1",
    5: "N2",
    6: "N3",
    7: "N4",
    8: "N5",
    9: "N6",
    10: "N7",
    11: "N8",
    12: "N9",
    15: "N10",
    14: "N11",
    20: "N12",
    22: "N13",
    24: "N14",
    29: "N15",
    42: "N16",
    47: "N17",
    50: "N18 (Ząbki)",
    18: "N19 (Pias.)",
    16: "N20",
    17: "N21",
    21: "N22",
    32: "N23",
    51: "N24",
    23: "N30",
    27: "N31",
    33: "N32",
    37: "N33",
    43: "N34",
    31: "N50",
    39: "N51",
    41: "N52",
    48: "N53",
    26: "N40",
    28: "N41",
    30: "N42",
    38: "N43",
    44: "N44",
    55: "N80",
    40: "N60",
    49: "N61",
    53: "N70",
    54: "N71",
    61: "DC1111",
  };

  const defaultMsg = {
    pl: "Pogoda robi swoje i nasi kurierzy jeżdżą ostrożnie, dlatego czas dostaw jest nieco dłuższy niż zwykle.",
    en: "It keeps raining. No wonder our couriers are driving more carefully. Ups! Delivery times may be slightly longer.",
    uk: "Погода робить своє, i наші кур’єри їздять обережно, tomu час доставки трохи довший.",
  };

  const statusColors = {
    Normal: "#ef4444",
    Difficult: "#10b981",
    Extreme: "#10b981",
    Inactive: "#10b981",
  };

  const GOOGLE_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL";

  function getBearerToken() {
    const raw = localStorage.getItem("BearerToken");
    return raw ? JSON.parse(raw).token : null;
  }

  function updateButtonColors(activeCond) {
    const config = {
      Normal: "btn-normal",
      Difficult: "btn-difficult",
      Extreme: "btn-extreme",
      Inactive: "btn-inactive",
    };
    Object.entries(config).forEach(([cond, id]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      if (cond === activeCond) {
        btn.style.background = cond === "Normal" ? "#ef4444" : "#10b981";
        btn.style.color = "#fff";
        btn.style.border = "4px solid #fff";
      } else {
        btn.style.background = "#334155";
        btn.style.color = "#94a3b8";
        btn.style.border = "4px solid transparent";
      }
    });
  }

  async function refreshActiveFromSheet() {
    const listContainer = document.getElementById(
      "company-name-active-times-list",
    );
    const btn = document.getElementById("btn-refresh-active-times");
    if (!listContainer) return;

    if (btn) btn.textContent = "⏳ Skanuję Arkusz...";

    try {
      const response = await fetch(GOOGLE_APP_URL);
      const activeData = await response.json();

      if (!activeData || activeData.length === 0 || activeData.error) {
        listContainer.innerHTML = `<button id="btn-refresh-active-times" style="width:100%; padding:10px; background:#fbbf24; color:#1e293b; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-bottom:10px;">🔄 Odśwież dane z arkusza</button><div style="padding:10px; text-align:center; color:#94a3b8;">Brak aktywnych wydłużeń.</div>`;
      } else {
        let html =
          '<div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">';
        const grouped = {};
        activeData.forEach((item) => {
          if (!grouped[item.city]) grouped[item.city] = [];
          grouped[item.city].push(item);
        });

        for (const city in grouped) {
          html += `<div style="border-left: 3px solid #fbbf24; padding-left:8px; margin-bottom:5px;">
                     <b style="color:#fbbf24; font-size:12px; text-transform:uppercase;">${city}:</b><br>`;

          grouped[city].forEach((row) => {
            const norkaLabel = row.norka ? `Norka ${row.norka}` : "Całe miasto";
            let displayTime = row.timeTo || "";
            const match = String(displayTime).match(/T(\d{2}:\d{2})/);
            if (match) displayTime = match[1];

            html += `<div style="font-size:13px; margin-bottom:2px;">
                      🚀 ${norkaLabel}: <span style="color:#10b981; font-weight:bold;">do ${displayTime}</span> <span style="color:#94a3b8;">(${row.status})</span>
                     </div>`;
          });
          html += `</div>`;
        }
        html += "</div>";

        listContainer.innerHTML =
          `<button id="btn-refresh-active-times" style="width:100%; padding:10px; background:#fbbf24; color:#1e293b; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">🔄 Odśwież dane z arkusza</button>` +
          html;
      }

      document.getElementById("btn-refresh-active-times").onclick =
        refreshActiveFromSheet;
    } catch (e) {
      listContainer.innerHTML = `<button id="btn-refresh-active-times" style="width:100%; padding:10px; background:#fbbf24; color:#1e293b; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-bottom:10px;">🔄 Spróbuj ponownie</button><div style="color:#ef4444; padding:10px; text-align:center;">Błąd pobierania danych.</div>`;
      document.getElementById("btn-refresh-active-times").onclick =
        refreshActiveFromSheet;
    }
  }

  function refreshNorkiChecklist() {
    const city = document.getElementById("company-name-city-select").value;
    const container = document.getElementById("company-name-norki-checklist");
    if (!cityMap[city]) return;
    container.innerHTML = cityMap[city]
      .map(
        (id) => `
      <label style="display:flex; align-items:center; gap:10px; font-size:16px; cursor:pointer; background:#0f172a; padding:12px; border-radius:8px; border:1px solid #334155; box-sizing:border-box;">
        <input type="checkbox" class="company-name-norka-check" value="${id}" checked style="transform: scale(1.5);"> 
        <span id="company-name-dot-${id}" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#475569; transition:0.3s;" title="Ładowanie..."></span>
        <span style="color:#e2e8f0; font-weight: 600;">${norkaNames[id] || id}</span>
      </label>
    `,
      )
      .join("");
  }

  function toggleAllNorki(checked) {
    document
      .querySelectorAll(".company-name-norka-check")
      .forEach((el) => (el.checked = checked));
  }

  function setDefaultMessages() {
    document.getElementById("company-name-msg-pl").value = defaultMsg.pl;
    document.getElementById("company-name-msg-en").value = defaultMsg.en;
    document.getElementById("company-name-msg-uk").value = defaultMsg.uk;
  }

  async function fetchStatus() {
    const token = getBearerToken();
    if (!token) return;
    const city = document.getElementById("company-name-city-select").value;
    const norkiIds = cityMap[city];
    const firstNorkaId = norkiIds[0];

    updateButtonColors("NONE");

    try {
      const resMsg = await fetch(
        `https://internal-hq.company/api/hq-darkstores/${firstNorkaId}/settings/generic-messages`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } },
      );
      if (resMsg.ok) {
        const m = await resMsg.json();
        if (m.success && m.value && m.value.length > 0) {
          m.value.forEach((msg) => {
            if (msg.language === "Pl")
              document.getElementById("company-name-msg-pl").value =
                msg.message;
            if (msg.language === "En")
              document.getElementById("company-name-msg-en").value =
                msg.message;
            if (msg.language === "Uk")
              document.getElementById("company-name-msg-uk").value =
                msg.message;
          });
        } else setDefaultMessages();
      } else setDefaultMessages();
    } catch (e) {
      setDefaultMessages();
    }

    norkiIds.forEach(async (id) => {
      try {
        const res = await fetch(
          `https://internal-hq.company/api/darkstores/${id}/traffic-conditions`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const d = await res.json();
          const dot = document.getElementById(`company-name-dot-${id}`);
          if (dot) {
            dot.style.background = statusColors[d.condition] || "#475569";
            dot.title = d.condition;
          }
          if (id === firstNorkaId) updateButtonColors(d.condition);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  async function logToGoogleSheets(cond, targets, opts = {}) {
    if (cond === "Normal") return;
    const timeFrom = document.getElementById("company-name-time-from").value;
    const timeTo = document.getElementById("company-name-time-to").value;

    if (!opts.isContinuation && !opts.isSplit && (!timeFrom || !timeTo)) {
      if (cond !== "Inactive") {
        const proceed = confirm(
          "Nie podałeś godzin Od/Do. Arkusz Google nie zostanie zaktualizowany. Czy kontynuować samą zmianę statusu?",
        );
        if (!proceed) throw new Error("User cancelled");
      }
      return;
    }

    const city = document.getElementById("company-name-city-select").value;
    const allCityNorki = cityMap[city].map((id) => id.toString());
    const isAllSelected = allCityNorki.every((id) => targets.includes(id));
    const dateStr = new Date().toLocaleDateString("pl-PL");
    const statusPl = {
      Difficult: "Wydłużone",
      Extreme: "Ekstremalne",
      Inactive: "Wyłączone",
    }[cond];
    const payloads = [];

    const basePayload = {
      date: dateStr,
      city: city,
      timeFrom: timeFrom,
      timeTo: timeTo,
      status: statusPl,
      isContinuation: opts.isContinuation || false,
      isSplit: opts.isSplit || false,
      splitTime: opts.splitTime || null,
    };

    if (isAllSelected) {
      payloads.push({ ...basePayload, norka: "" });
    } else {
      targets.forEach((id) => {
        let norkaName = norkaNames[id] || id.toString();
        if (typeof norkaName === "string" && norkaName.startsWith("N"))
          norkaName = norkaName.replace("N", "").split(" ")[0];
        payloads.push({ ...basePayload, norka: norkaName });
      });
    }

    const fetchPromises = payloads.map((p) =>
      fetch(GOOGLE_APP_URL, {
        method: "POST",
        body: JSON.stringify(p),
        mode: "no-cors",
        credentials: "include",
      }).catch((e) => console.error("Błąd", e)),
    );
    await Promise.all(fetchPromises);
  }

  async function sendUpdate(cond, btn) {
    const token = getBearerToken();
    if (!token) return;
    const targets = Array.from(
      document.querySelectorAll(".company-name-norka-check:checked"),
    ).map((c) => c.value);
    if (!targets.length) return alert("Wybierz norki!");

    // --- AUTOMATYCZNE ROZWIDLANIE STATUSÓW I WCZEŚNIEJSZE ZAKOŃCZENIE ---
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const isActive = (id) => {
      const el = document.getElementById(id);
      return (
        el &&
        (el.style.border.includes("fff") ||
          el.style.border.includes("white") ||
          el.style.border.includes("rgb(255, 255, 255)"))
      );
    };

    let activeStatus = null;
    if (isActive("btn-difficult")) activeStatus = "Difficult";
    else if (isActive("btn-extreme")) activeStatus = "Extreme";
    else if (isActive("btn-inactive")) activeStatus = "Inactive";

    let isSplit = false;
    let isEndingEarly = false;

    // Rozpoznawanie, czy rozdzielamy statusy, czy po prostu wracamy do "Normalnych"
    if (activeStatus && activeStatus !== cond) {
      if (cond !== "Normal") {
        isSplit = true;
        // Podmieniamy Godzinę OD w panelu na aktualną, aby skrypt wziął ją do wysłania nowego wiersza!
        document.getElementById("company-name-time-from").value = currentTime;
      } else {
        isEndingEarly = true; // Kliknięto "Normalne" przed końcem czasu
      }
    }

    const oldTxt = btn.textContent;
    btn.disabled = true;
    btn.textContent = "⏳ Wysyłanie...";

    try {
      if (isSplit) {
        // 1. Zamykamy stary status w arkuszu na aktualną godzinę
        await logToGoogleSheets(activeStatus, targets, {
          isCloseOld: true,
          splitTime: currentTime,
        });
        // 2. Główny zapis nowego statusu
        await logToGoogleSheets(cond, targets, false);
      } else if (isEndingEarly) {
        // 3. Gdy wracamy do Normalnych - zamykamy stary status na aktualną godzinę i NIE otwieramy nowego
        await logToGoogleSheets(activeStatus, targets, {
          isCloseOld: true,
          splitTime: currentTime,
        });
      } else {
        // 4. Standardowe dodanie (gdy nic nie było aktywne)
        await logToGoogleSheets(cond, targets, false);
      }

      const timeTo = document.getElementById("company-name-time-to").value;
      let tgMsg = "";
      if (cond === "Difficult" && timeTo)
        tgMsg = `Włączamy WYDŁUŻONE czasy do ${timeTo}, prosimy zachować ostrożność podczas jazdy 🦊`;
      else if (cond === "Extreme" && timeTo)
        tgMsg = `Włączamy EKSTREMALNE czasy do ${timeTo}, prosimy zachować ostrożność podczas jazdy 🦊`;
      else if (cond === "Inactive")
        tgMsg = `Wprowadzamy WYŁĄCZONE czasy (nie liczą się do statystyk). Prosimy zachować ostrożność podczas jazdy 🦊`;

      // Jeśli tgMsg jest puste (jak przy kliknięciu "Normalne"), bot nic nie wyśle
      if (tgMsg) targets.forEach((id) => sendTelegram(id, tgMsg));
      setTimeout(refreshActiveFromSheet, 2000);
    } catch (e) {
      btn.textContent = oldTxt;
      btn.disabled = false;
      return;
    }

    // Dalsza część funkcji sendUpdate (trafficPayload itd...) pozostaje BEZ ZMIAN.
    const trafficPayload = {
      condition: cond,
      difficultTimeCoefficient: 1.2,
      extremeTimeCoefficient: 1.3,
      atLocationTimeInSec: 270,
      timeTargetInSecPerKm: 150,
    };
    const messagesPayload = {
      isEnabled: true,
      genericMessages: [
        {
          language: "Pl",
          message: document.getElementById("company-name-msg-pl").value,
        },
        {
          language: "En",
          message: document.getElementById("company-name-msg-en").value,
        },
        {
          language: "Uk",
          message: document.getElementById("company-name-msg-uk").value,
        },
      ],
    };

    let done = 0;
    btn.textContent = `⏳ ${done}/${targets.length}`;

    await Promise.all(
      targets.map(async (id) => {
        const reqA = fetch(
          `https://darkstores.k8s.company-name.app/api/darkstores/${id}/traffic-conditions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(trafficPayload),
          },
        );
        const reqB = fetch(
          `https://hq.company-name.app/api/hq-darkstores/${id}/settings/generic-messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messagesPayload),
          },
        );
        await Promise.all([reqA, reqB]);
        const dot = document.getElementById(`company-name-dot-${id}`);
        if (dot) dot.style.background = statusColors[cond] || "#475569";
        done++;
        btn.textContent = `⏳ ${done}/${targets.length}`;
      }),
    );

    btn.textContent = "✅ Gotowe!";
    updateButtonColors(cond);
    setTimeout(() => {
      btn.textContent = oldTxt;
      btn.disabled = false;
    }, 2000);
  }
  function injectPanel() {
    if (document.getElementById("company-name-hq-panel")) return;

    function setupLisekHub() {
      if (!document.getElementById("company-name-master-hub")) {
        const hub = document.createElement("div");
        hub.id = "company-name-master-hub";
        hub.style.cssText =
          "position:fixed; bottom:30px; left:30px; z-index:999999; font-family:sans-serif;";

        const mainBtn = document.createElement("button");
        mainBtn.innerHTML = "🦊 Menu Company";
        mainBtn.style.cssText =
          "position:relative; z-index:2; background:#1e293b; color:#fff; border:2px solid #3b82f6; border-radius:30px; padding:12px 24px; font-weight:bold; cursor:pointer; font-size:16px; box-shadow:0 5px 15px rgba(0,0,0,0.5); transition:transform 0.2s; user-select:none;";

        const menu = document.createElement("div");
        menu.id = "company-name-hub-menu";
        menu.style.cssText =
          "position:absolute; bottom:100%; left:0; margin-bottom:12px; display:none; flex-direction:column; gap:10px; width:max-content; z-index:1;";

        hub.appendChild(mainBtn);
        hub.appendChild(menu);
        document.body.appendChild(hub);

        let isDragging = false;
        let hasMoved = false;
        let offsetX = 0;
        let offsetY = 0;
        mainBtn.onmouseover = () => {
          if (!isDragging) mainBtn.style.transform = "scale(1.05)";
        };
        mainBtn.onmouseout = () => {
          if (!isDragging) mainBtn.style.transform = "scale(1)";
        };

        mainBtn.addEventListener("mousedown", (e) => {
          isDragging = true;
          hasMoved = false;
          const rect = hub.getBoundingClientRect();
          offsetX = e.clientX - rect.left;
          offsetY = e.clientY - rect.top;
          if (hub.style.bottom) {
            hub.style.top = rect.top + "px";
            hub.style.bottom = "auto";
          }
          mainBtn.style.cursor = "grabbing";
          mainBtn.style.transform = "scale(1.05)";
        });

        window.addEventListener("mousemove", (e) => {
          if (!isDragging) return;
          hasMoved = true;
          hub.style.left = e.clientX - offsetX + "px";
          hub.style.top = e.clientY - offsetY + "px";
        });

        window.addEventListener("mouseup", () => {
          if (isDragging) {
            isDragging = false;
            mainBtn.style.cursor = "pointer";
            mainBtn.style.transform = "scale(1)";
          }
        });

        mainBtn.addEventListener("click", (e) => {
          if (hasMoved) {
            e.preventDefault();
            return;
          }
          menu.style.display = menu.style.display === "none" ? "flex" : "none";
        });
      }

      const menu = document.getElementById("company-name-hub-menu");
      const btn = document.createElement("button");
      btn.innerHTML = "🦊 Wydłużone Czasy";
      btn.style.cssText =
        "background:#334155; color:#fff; border:1px solid #475569; border-radius:8px; padding:12px 20px; font-weight:bold; cursor:pointer; font-size:15px; box-shadow:0 4px 6px rgba(0,0,0,0.3); width: 100%; text-align: left; transition: 0.2s;";
      btn.onmouseover = () => (btn.style.filter = "brightness(1.2)");
      btn.onmouseout = () => (btn.style.filter = "brightness(1)");
      btn.onclick = () => {
        document
          .querySelectorAll(".company-name-app-panel")
          .forEach((p) => (p.style.display = "none"));
        const target = document.getElementById("company-name-hq-panel");
        if (target) {
          target.style.display = "flex";
          if (!target.style.top && !target.style.left) {
            target.style.top = "10vh";
            target.style.left = window.innerWidth / 2 - 225 + "px";
          }
        }
        menu.style.display = "none";
      };
      menu.appendChild(btn);
    }
    setupLisekHub();

    const panel = document.createElement("div");
    panel.id = "company-name-hq-panel";
    panel.className = "company-name-app-panel";
    panel.style.cssText = `position:fixed; z-index:999999; background:#1e293b; border:2px solid #334155; border-radius:12px; font-family:sans-serif; font-size: 16px; color:#f8fafc; display:none; flex-direction:column; box-shadow:0 15px 40px rgba(0,0,0,0.7); box-sizing:border-box; overflow:hidden; width: 450px; max-height: 90vh; resize: both;`;

    panel.innerHTML = `
      <div id="company-name-header" style="background:#0f172a; padding:15px; cursor:grab; font-weight:bold; font-size: 18px; text-align:center; color:#fbbf24; flex-shrink:0; user-select:none; display:flex; justify-content:center; align-items:center; position:relative;">
        🦊 Wydłużone Czasy
        <div style="position:absolute; right:15px; display:flex; gap:15px; align-items:center;">
          <div id="company-name-hq-close-btn" style="cursor:pointer; font-size:28px; line-height:1; color:#94a3b8; transition: 0.2s; font-weight:bold;" title="Zamknij">&times;</div>
        </div>
      </div>
      <div id="company-name-content" style="display:flex; padding:20px; flex-direction:column; gap:18px; flex-grow:1; overflow-y:auto; box-sizing:border-box;">
        
        <details open style="background:#0f172a; border:2px solid #fbbf24; border-radius:10px;">
          <summary style="padding:12px 15px; font-size:15px; font-weight: bold; color:#fbbf24; cursor:pointer; user-select:none;">
            🔥 Aktualnie włączone (Z Arkusza)
          </summary>
          <div id="company-name-active-times-list" style="padding:10px; font-size:13px; color:#cbd5e1; border-top:1px solid #334155; max-height:200px; overflow-y:auto; background:#111827;">
             <button id="btn-refresh-active-times" style="width:100%; padding:10px; background:#fbbf24; color:#1e293b; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">🔄 Pobierz dane z arkusza</button>
          </div>
        </details>

        <select id="company-name-city-select" style="width:100%; background:#0f172a; color:#fff; padding:12px; border:2px solid #475569; font-size: 16px; font-weight:bold; border-radius:8px; cursor:pointer;">
          ${Object.keys(cityMap)
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("")}
        </select>
        
        <details open style="background:#111827; border:1px solid #334155; border-radius:10px;">
          <summary style="padding:15px; font-size:20px; font-weight: 800; color:#94a3b8; cursor:pointer; user-select:none; display:flex; justify-content:space-between; align-items:center;">
            <span>🔍 Wybierz norki</span>
            <div style="display:flex; gap:20px;">
              <span id="company-name-all" style="color:#3b82f6; font-size:18px; font-weight:bold; text-decoration:underline;">[Wszystkie]</span>
              <span id="company-name-none" style="color:#ef4444; font-size:18px; font-weight:bold; text-decoration:underline;">[Odznacz]</span>
            </div>
          </summary>
          <div id="company-name-norki-checklist" style="padding:15px; display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap:10px; max-height:450px; overflow-y:auto; border-top:1px solid #334155;"></div>
        </details>
        
        <div style="background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #475569;">
          <div style="font-size: 14px; color: #cbd5e1; font-weight: bold; margin-bottom: 8px;">⏳ Czas trwania (do Arkusza):</div>
          <div style="display: flex; gap: 10px;">
            <label style="flex:1; color:#94a3b8; font-size:14px; display:flex; flex-direction:column; gap:4px;">Od: <input type="time" id="company-name-time-from" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; padding:8px; font-size: 16px; font-family:sans-serif;"></label>
            <label style="flex:1; color:#94a3b8; font-size:14px; display:flex; flex-direction:column; gap:4px;">Do: <input type="time" id="company-name-time-to" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; padding:8px; font-size: 16px; font-family:sans-serif;"></label>
          </div>
        </div>

        <div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <button id="btn-normal" style="padding:15px; border-radius:8px; cursor:pointer; font-size: 16px; font-weight:bold; border:none; transition:0.2s;">Normalne</button>
            <button id="btn-difficult" style="padding:15px; border-radius:8px; cursor:pointer; font-size: 16px; font-weight:bold; border:none; transition:0.2s;">Wydłużone</button>
            <button id="btn-extreme" style="padding:15px; border-radius:8px; cursor:pointer; font-size: 16px; font-weight:bold; border:none; transition:0.2s;">Ekstremalne</button>
            <button id="btn-inactive" style="padding:15px; border-radius:8px; cursor:pointer; font-size: 16px; font-weight:bold; border:none; transition:0.2s;">Wyłączone</button>
          </div>
          <button id="btn-continue" style="width:100%; margin-top:12px; padding:15px; border-radius:8px; cursor:pointer; font-size: 16px; font-weight:bold; border:none; transition:0.2s; background:#3b82f6; color:#fff;">🔄 Kontynuacja (Tylko Arkusz)</button>
          
          <div id="continue-inline-form" style="display:none; margin-top:12px; background:#1e293b; padding:12px; border-radius:8px; border:2px solid #3b82f6;">
            <div style="font-size:14px; color:#cbd5e1; font-weight:bold; margin-bottom:8px;">Podaj nową godzinę DO:</div>
            <input type="time" id="continue-inline-time" style="width:100%; background:#0f172a; color:#fff; border:1px solid #475569; padding:10px; border-radius:6px; font-size:16px; box-sizing:border-box; margin-bottom:10px;">
            <div style="display:flex; gap:10px;">
              <button id="btn-continue-save" style="flex:1; padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold; border:none; background:#10b981; color:#fff; transition:0.2s;">✅ Zapisz</button>
              <button id="btn-continue-cancel" style="flex:1; padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold; border:none; background:#475569; color:#fff; transition:0.2s;">❌ Anuluj</button>
            </div>
          </div>
        </div>

        <details style="background:#111827; border:1px solid #334155; border-radius:10px;">
          <summary style="padding:12px 15px; font-size:16px; font-weight: bold; color:#94a3b8; cursor:pointer; user-select:none;">💬 Zmień komunikat</summary>
          <div style="padding:15px; display:flex; flex-direction:column; gap:12px; border-top:1px solid #334155;">
            <div><div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:#cbd5e1;"><span>🇵🇱 Polski</span><span class="company-name-copy" data-target="company-name-msg-pl" style="cursor:pointer; color:#94a3b8;">📋 Kopiuj</span></div><textarea id="company-name-msg-pl" style="width:100%; height:45px; background:#0f172a; color:#fff; border:1px solid #475569; font-size:13px; padding:10px; border-radius:8px; resize:none; box-sizing:border-box;"></textarea></div>
            <div><div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:#cbd5e1;"><span>🇬🇧 Angielski</span><span class="company-name-copy" data-target="company-name-msg-en" style="cursor:pointer; color:#94a3b8;">📋 Kopiuj</span></div><textarea id="company-name-msg-en" style="width:100%; height:45px; background:#0f172a; color:#fff; border:1px solid #475569; font-size:13px; padding:10px; border-radius:8px; resize:none; box-sizing:border-box;"></textarea></div>
            <div><div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:#cbd5e1;"><span>🇺🇦 Ukraiński</span><span class="company-name-copy" data-target="company-name-msg-uk" style="cursor:pointer; color:#94a3b8;">📋 Kopiuj</span></div><textarea id="company-name-msg-uk" style="width:100%; height:45px; background:#0f172a; color:#fff; border:1px solid #475569; font-size:13px; padding:10px; border-radius:8px; resize:none; box-sizing:border-box;"></textarea></div>
          </div>
        </details>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById("btn-refresh-active-times").onclick =
      refreshActiveFromSheet;

    document.querySelectorAll(".company-name-copy").forEach((btn) => {
      btn.onclick = (e) => {
        const text = document.getElementById(
          e.target.getAttribute("data-target"),
        ).value;
        navigator.clipboard.writeText(text);
        const old = e.target.textContent;
        e.target.textContent = "✅ Skopiowano!";
        setTimeout(() => (e.target.textContent = old), 1500);
      };
    });

    const closeBtn = document.getElementById("company-name-hq-close-btn");
    closeBtn.onclick = (e) => {
      e.preventDefault();
      panel.style.display = "none";
    };

    const h = document.getElementById("company-name-header");
    let isD = false,
      ox,
      oy;
    h.addEventListener("mousedown", (e) => {
      if (e.target === closeBtn) return;
      isD = true;
      const r = panel.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      h.style.cursor = "grabbing";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isD) return;
      panel.style.left = e.clientX - ox + "px";
      panel.style.top = e.clientY - oy + "px";
    });
    window.addEventListener("mouseup", () => {
      isD = false;
      h.style.cursor = "grab";
    });

    document.getElementById("company-name-city-select").onchange = () => {
      refreshNorkiChecklist();
      fetchStatus();
    };
    document.getElementById("company-name-all").onclick = (e) => {
      e.preventDefault();
      toggleAllNorki(true);
    };
    document.getElementById("company-name-none").onclick = (e) => {
      e.preventDefault();
      toggleAllNorki(false);
    };
    ["normal", "difficult", "extreme", "inactive"].forEach((id) => {
      document.getElementById(`btn-${id}`).onclick = function () {
        sendUpdate(id.charAt(0).toUpperCase() + id.slice(1), this);
      };
    });

    // --- KLIKNIĘCIA DLA FORMULARZA KONTYNUACJI (Z DYNAMICZNYM STATUSEM) ---
    const btnContinue = document.getElementById("btn-continue");
    const inlineForm = document.getElementById("continue-inline-form");
    const inlineInput = document.getElementById("continue-inline-time");
    const btnSave = document.getElementById("btn-continue-save");
    const btnCancel = document.getElementById("btn-continue-cancel");

    btnContinue.onclick = function () {
      const targets = Array.from(
        document.querySelectorAll(".company-name-norka-check:checked"),
      ).map((c) => c.value);
      if (!targets.length) return alert("Wybierz norki!");
      btnContinue.style.display = "none";
      inlineForm.style.display = "block";
      inlineInput.value = "";
      inlineInput.focus();
    };

    btnCancel.onclick = function () {
      inlineForm.style.display = "none";
      btnContinue.style.display = "block";
    };

    btnSave.onclick = async function () {
      const targets = Array.from(
        document.querySelectorAll(".company-name-norka-check:checked"),
      ).map((c) => c.value);
      const newTime = document.getElementById("continue-inline-time").value;
      if (!newTime) return alert("Proszę wpisać nową godzinę!");
      document.getElementById("company-name-time-to").value = newTime;

      let currentStatus = "Difficult";
      let statusLabel = "WYDŁUŻONE";
      const btnExt = document.getElementById("btn-extreme");
      const btnInact = document.getElementById("btn-inactive");
      const isActive = (el) =>
        el &&
        (el.style.border.includes("fff") ||
          el.style.border.includes("white") ||
          el.style.border.includes("rgb(255, 255, 255)"));

      if (isActive(btnExt)) {
        currentStatus = "Extreme";
        statusLabel = "EKSTREMALNE";
      } else if (isActive(btnInact)) {
        currentStatus = "Inactive";
        statusLabel = "WYŁĄCZONE (nie liczą się do statystyk)";
      }

      btnSave.disabled = true;
      btnSave.textContent = "⏳ Zapisuję...";
      try {
        // Przekazujemy { isContinuation: true }
        await logToGoogleSheets(currentStatus, targets, {
          isContinuation: true,
        });

        targets.forEach((id) =>
          sendTelegram(
            id,
            `Kontynuujemy ${statusLabel} czasy do ${newTime}, prosimy zachować ostrożność podczas jazdy 🦊`,
          ),
        );

        btnSave.textContent = "✅ Zapisano!";
        setTimeout(refreshActiveFromSheet, 1500);
        setTimeout(() => {
          document.getElementById("continue-inline-form").style.display =
            "none";
          document.getElementById("btn-continue").style.display = "block";
          btnSave.disabled = false;
          btnSave.textContent = "✅ Zapisz";
        }, 1500);
      } catch (e) {
        btnSave.textContent = "❌ Błąd";
        btnSave.disabled = false;
      }
    };

    refreshNorkiChecklist();
    fetchStatus();
    refreshActiveFromSheet();
  }

  if (window.location.hostname === "hq.company-name.app")
    setTimeout(injectPanel, 2000);
})();
