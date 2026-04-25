(function () {
  "use strict";

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

  const defaultCloseMsg = {
    pl: "Robimy krótką przerwę w przyjmowaniu zamówień. Zapraszamy wkrótce!",
    en: "We're taking a short break from accepting orders. Please check back soon!",
    uk: "Тимчасово не приймаємо замовлень. Запрошуємо вас в найблищому часі!",
  };

  const GOOGLE_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL";

  function getBearerToken() {
    const raw = localStorage.getItem("BearerToken");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch (e) {
      return null;
    }
  }

  function getFormattedDate(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const y = dateObj.getFullYear();
    return `${d}.${m}.${y}`;
  }

  async function logToGoogleSheets(id, action) {
    if (!GOOGLE_APP_URL) return;
    let norkaName = norkaNames[id] || id.toString();
    if (id == 61 || norkaName === "DC1111") norkaName = "DC1111";
    else if (typeof norkaName === "string" && norkaName.startsWith("N"))
      norkaName = norkaName.replace("N", "").split(" ")[0];

    const initials = document.getElementById(
      "company-name-close-initials",
    ).value;
    const picker = document.getElementById("company-name-close-picker").value;
    const reason = document.getElementById("company-name-close-reason").value;
    const timeToUI = document.getElementById(
      "company-name-close-time-to",
    ).value;

    if (initials) localStorage.setItem("LisekInitials", initials);

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const currentDate = getFormattedDate(now);

    const payload = {
      action: action,
      norka: norkaName,
      initials: initials,
      closeTime: currentTime,
      closeDate: currentDate,
      openTime: timeToUI,
      currentTime: currentTime,
      picker: picker,
      reason: reason,
    };
    fetch(GOOGLE_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      mode: "no-cors",
      credentials: "include",
    }).catch((e) => console.error("Błąd zapisu do Arkusza", e));
  }

  async function fetchNorkiStatuses() {
    const token = getBearerToken();
    if (!token) return;
    const city = document.getElementById("close-city-select").value;
    const norkiIds = cityMap[city];
    norkiIds.forEach(async (id) => {
      try {
        const dot = document.getElementById(`close-dot-${id}`);
        if (!dot) return;
        dot.style.background = "#475569";
        dot.title = "Ładowanie...";
        const res = await fetch(
          `https://hq.company-name.app/api/hq-darkstores/${id}/settings`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const current = data.value || data;
          const isClosed = current.canOrder === false;
          dot.style.background = isClosed ? "#ef4444" : "#10b981";
          dot.title = isClosed ? "ZAMKNIĘTA" : "OTWARTA";
        }
      } catch (e) {
        console.error(`Błąd pobierania statusu norki ${id}:`, e);
      }
    });
  }

  async function updateNorkaStatus(id, shouldBeOpen, btn) {
    const token = getBearerToken();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const dateFrom = `${year}-${month}-${day}`;
    const timeFrom = `${hours}:${minutes}`;
    const dateToUI = document.getElementById(
      "company-name-close-date-to",
    ).value;
    const timeToUI = document.getElementById(
      "company-name-close-time-to",
    ).value;

    if (!shouldBeOpen && (!timeToUI || !dateToUI)) {
      alert(`Wypełnij datę i godzinę "DO" dla norki ${norkaNames[id] || id}!`);
      return false;
    }

    try {
      const res = await fetch(
        `https://hq.company-name.app/api/hq-darkstores/${id}/settings`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      const current = data.value;

      const payload = {
        ...current,
        canOrder: shouldBeOpen,
        isActive: true,
        unavailableFromDate: shouldBeOpen ? null : dateFrom,
        unavailableFromTime: shouldBeOpen ? null : `${dateFrom} ${timeFrom}:00`,
        unavailableUntilDate: shouldBeOpen ? null : dateToUI,
        unavailableUntilTime: shouldBeOpen
          ? null
          : `${dateToUI} ${timeToUI}:00`,
        messages: [
          {
            language: "Polski",
            message: shouldBeOpen
              ? ""
              : document.getElementById("company-name-close-msg-pl").value ||
                "",
          },
          {
            language: "Angielski",
            message: shouldBeOpen
              ? ""
              : document.getElementById("company-name-close-msg-en").value ||
                "",
          },
          {
            language: "Ukraiński",
            message: shouldBeOpen
              ? ""
              : document.getElementById("company-name-close-msg-uk").value ||
                "",
          },
        ],
      };
      const postRes = await fetch(
        `https://hq.company-name.app/api/hq-darkstores/update-settings-messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (postRes.ok) {
        logToGoogleSheets(id, shouldBeOpen ? "OTWORZ" : "ZAMKNIJ");
        return true;
      } else return false;
    } catch (e) {
      console.error(`[DEBUG] Wyjątek dla norki ${id}:`, e);
      return false;
    }
  }

  async function massAction(shouldBeOpen, btn) {
    const targets = Array.from(
      document.querySelectorAll(".company-name-close-check:checked"),
    ).map((c) => c.value);
    if (!targets.length) return alert("Wybierz norki!");
    if (
      !shouldBeOpen &&
      !document.getElementById("company-name-close-initials").value
    ) {
      alert("Podaj swoje inicjały (Kto zamyka)!");
      return;
    }

    const oldTxt = btn.textContent;
    btn.disabled = true;
    let successCount = 0;
    for (let i = 0; i < targets.length; i++) {
      btn.textContent = `⏳ ${i + 1}/${targets.length}`;
      const ok = await updateNorkaStatus(targets[i], shouldBeOpen, btn);
      if (ok) successCount++;
    }
    btn.textContent =
      successCount === targets.length ? "✅ Gotowe!" : "⚠️ Błędy (F12)";
    fetchNorkiStatuses();
    setTimeout(() => {
      btn.textContent = oldTxt;
      btn.disabled = false;
    }, 3000);
  }

  function injectPanel() {
    if (document.getElementById("company-name-close-panel")) return;

    function setupLisekHub() {
      if (!document.getElementById("company-name-master-hub")) {
        const hub = document.createElement("div");
        hub.id = "company-name-master-hub";
        hub.style.cssText =
          "position:fixed; bottom:30px; left:30px; z-index:999999; font-family:sans-serif;";

        const mainBtn = document.createElement("button");
        mainBtn.innerHTML = "🦊 Menu Liska";
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
      btn.innerHTML = "🔒 Zamykanie Norek";
      btn.style.cssText =
        "background:#ef4444; color:#fff; border:1px solid #f87171; border-radius:8px; padding:12px 20px; font-weight:bold; cursor:pointer; font-size:15px; box-shadow:0 4px 6px rgba(0,0,0,0.3); width: 100%; text-align: left; transition: 0.2s;";
      btn.onmouseover = () => (btn.style.filter = "brightness(1.2)");
      btn.onmouseout = () => (btn.style.filter = "brightness(1)");
      btn.onclick = () => {
        document
          .querySelectorAll(".company-name-app-panel")
          .forEach((p) => (p.style.display = "none"));
        const target = document.getElementById("company-name-close-panel");
        if (target) {
          target.style.display = "flex";
          if (!target.style.top && !target.style.left) {
            target.style.top = "10vh";
            target.style.left = window.innerWidth / 2 - 190 + "px";
          }
        }
        menu.style.display = "none";
      };
      menu.appendChild(btn);
    }
    setupLisekHub();

    const savedInitials = localStorage.getItem("LisekInitials") || "";
    const panel = document.createElement("div");
    panel.id = "company-name-close-panel";
    panel.className = "company-name-app-panel";

    panel.style.cssText = `
      position:fixed; z-index:999998; background:#1e293b; border:2px solid #ef4444; border-radius:12px; 
      font-family:sans-serif; color:#f8fafc; display:none; flex-direction:column; 
      box-shadow:0 15px 40px rgba(0,0,0,0.7); box-sizing:border-box; overflow:hidden;
      width: 380px; max-height: 90vh; resize: both;
    `;

    panel.innerHTML = `
      <div id="close-header" style="background:#0f172a; padding:15px; cursor:grab; font-weight:bold; font-size: 18px; text-align:center; color:#ef4444; flex-shrink:0; user-select:none; display:flex; justify-content:center; align-items:center; position:relative;">
        🔒 Zamykanie Norek
        <div style="position:absolute; right:15px; display:flex; gap:15px; align-items:center;">
          <div id="close-close-btn" style="cursor:pointer; font-size:28px; line-height:1; color:#94a3b8; transition: 0.2s; font-weight:bold;" title="Zamknij">&times;</div>
        </div>
      </div>
      
      <div id="close-content" style="display:flex; padding:15px; flex-direction:column; gap:12px; background: #1e293b; flex-grow:1; overflow-y:auto; box-sizing:border-box;">
        <select id="close-city-select" style="width:100%; background:#0f172a; color:#fbbf24; padding:12px; border-radius:8px; border:2px solid #475569; font-weight:bold; font-size:16px; flex-shrink:0;">
          ${Object.keys(cityMap)
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("")}
        </select>
        
        <div id="close-norki-list" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#0f172a; padding:12px; border-radius:10px; flex-shrink:0; border:1px solid #334155; min-height:80px;"></div>

        <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #334155; display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:13px; color:#cbd5e1; font-weight:bold; text-transform:uppercase;">📝 Dane do Arkusza Google:</div>
          <div style="display:flex; gap:10px;">
             <input type="text" id="company-name-close-initials" placeholder="Inicjały" value="${savedInitials}" style="flex:1; background:#1e293b; color:white; border:1px solid #475569; padding:10px; border-radius:6px; font-size:15px;">
             <select id="company-name-close-picker" style="flex:1; background:#1e293b; color:white; border:1px solid #475569; padding:10px; border-radius:6px; font-size:15px;">
                <option value="tak">Picker: Tak</option><option value="nie">Picker: Nie</option>
             </select>
          </div>
          <input type="text" id="company-name-close-reason" placeholder="Wewnętrzny powód (np. prosba Adama)" style="width:100%; box-sizing:border-box; background:#1e293b; color:white; border:1px solid #475569; padding:10px; border-radius:6px; font-size:15px;">
        </div>

        <div style="background:#0f172a; padding:12px; border-radius:10px; display:grid; grid-template-columns:1fr 1fr; gap:12px; border:1px solid #334155; flex-shrink:0;">
          <label style="font-size:13px; color:#94a3b8; font-weight:bold;">ZAMKNIĘTE DO:<input type="date" id="company-name-close-date-to" style="width:100%; background:#1e293b; color:white; border:1px solid #475569; padding:8px; margin-top:6px; border-radius:6px; box-sizing:border-box; font-size:14px;"></label>
          <label style="font-size:13px; color:#94a3b8; font-weight:bold;">GODZINA:<input type="time" id="company-name-close-time-to" style="width:100%; background:#1e293b; color:white; border:1px solid #475569; padding:8px; margin-top:6px; border-radius:6px; box-sizing:border-box; font-size:14px;"></label>
        </div>

        <details style="background:#111827; border:1px solid #334155; border-radius:10px; flex-shrink:0;">
          <summary style="padding:12px 15px; font-size:15px; font-weight: bold; color:#94a3b8; cursor:pointer; user-select:none;">💬 Zmień komunikat</summary>
          <div style="padding:12px; display:flex; flex-direction:column; gap:8px; border-top:1px solid #334155;">
            <input type="text" id="company-name-close-msg-pl" value="${defaultCloseMsg.pl}" placeholder="🇵🇱 Powód dla klienta" style="width:100%; box-sizing:border-box; background:#0f172a; color:white; border:1px solid #475569; padding:10px; border-radius:8px; font-size:14px;">
            <input type="text" id="company-name-close-msg-en" value="${defaultCloseMsg.en}" placeholder="🇬🇧 Reason for client" style="width:100%; box-sizing:border-box; background:#0f172a; color:white; border:1px solid #475569; padding:10px; border-radius:8px; font-size:14px;">
            <input type="text" id="company-name-close-msg-uk" value="${defaultCloseMsg.uk}" placeholder="🇺🇦 Prichina dla klienta" style="width:100%; box-sizing:border-box; background:#0f172a; color:white; border:1px solid #475569; padding:10px; border-radius:8px; font-size:14px;">
          </div>
        </details>

        <div style="display:flex; gap:12px; margin-top:8px; flex-shrink:0;">
          <button id="company-name-btn-close" style="flex:1; background:#ef4444; color:white; border:none; padding:16px 5px; border-radius:8px; cursor:pointer; font-weight:900; letter-spacing:0.5px; transition:0.2s; box-shadow: 0 4px 0 #991b1b; font-size:15px;">ZAPISZ I ZAMKNIJ</button>
          <button id="company-name-btn-open" style="flex:1; background:#10b981; color:white; border:none; padding:16px 5px; border-radius:8px; cursor:pointer; font-weight:900; letter-spacing:0.5px; transition:0.2s; box-shadow: 0 4px 0 #065f46; font-size:15px;">OTWÓRZ NORKĘ</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    const refreshList = () => {
      const city = document.getElementById("close-city-select").value;
      document.getElementById("close-norki-list").innerHTML = cityMap[city]
        .map(
          (id) => `
        <label style="font-size:15px; display:flex; align-items:center; gap:8px; cursor:pointer; padding:6px; background:#1e293b; border-radius:6px;">
          <input type="checkbox" class="company-name-close-check" value="${id}" style="width:18px; height:18px;"> 
          <span id="close-dot-${id}" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#475569; transition:0.3s;" title="Ładowanie..."></span>
          <span style="font-weight:600; color:#e2e8f0;">${norkaNames[id] || id}</span>
        </label>
      `,
        )
        .join("");
      fetchNorkiStatuses();
    };

    document.getElementById("close-city-select").onchange = refreshList;
    document.getElementById("company-name-btn-close").onclick = function () {
      massAction(false, this);
    };
    document.getElementById("company-name-btn-open").onclick = function () {
      massAction(true, this);
    };

    const closeBtn = document.getElementById("close-close-btn");
    closeBtn.onclick = (e) => {
      e.preventDefault();
      panel.style.display = "none";
    };

    const h = document.getElementById("close-header");
    let isD = false,
      ox,
      oy;
    h.onmousedown = (e) => {
      if (e.target === closeBtn) return;
      isD = true;
      ox = e.clientX - panel.offsetLeft;
      oy = e.clientY - panel.offsetTop;
      h.style.cursor = "grabbing";
    };
    document.onmousemove = (e) => {
      if (!isD) return;
      panel.style.left = e.clientX - ox + "px";
      panel.style.top = e.clientY - oy + "px";
    };
    document.onmouseup = () => {
      isD = false;
      h.style.cursor = "grab";
    };

    const now = new Date();
    document.getElementById("company-name-close-date-to").value = now
      .toISOString()
      .split("T")[0];

    refreshList();
  }

  if (window.location.hostname === "hq.company-name.app")
    setTimeout(injectPanel, 3000);
})();
