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
    50: "N18",
    18: "N19",
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

  // --- TWÓJ LINK DO WEBHOOKA ---
  const SHEETS_WEB_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL";

  function getBearerToken() {
    const raw = localStorage.getItem("BearerToken");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch (e) {
      return null;
    }
  }

  function getFormattedDate() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${d.getFullYear()}`;
  }

  function getCurrentTimeHM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // --- POBIERANIE AKTYWNYCH POLITYK ---
  async function refreshActivePoliciesFromSheet() {
    const listContainer = document.getElementById("policy-active-list");
    const btn = document.getElementById("btn-refresh-policy-active");
    if (!listContainer) return;

    if (btn) btn.textContent = "⏳ Skanuję Arkusz...";

    try {
      const response = await fetch(SHEETS_WEB_APP_URL);
      const activeData = await response.json();

      if (!activeData || activeData.length === 0 || activeData.error) {
        listContainer.innerHTML = `<button id="btn-refresh-policy-active" style="width:100%; padding:12px; background:#8b5cf6; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:15px; font-weight:bold; margin-bottom:10px;">🔄 Odśwież dane z arkusza</button><div style="padding:10px; text-align:center; font-size:15px; color:#94a3b8;">Brak aktywnych polityk.</div>`;
      } else {
        let html =
          '<div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">';

        activeData.forEach((row) => {
          let displayTime = row.timeTo || "";
          const match = String(displayTime).match(/T(\d{2}:\d{2})/);
          if (match) displayTime = match[1];

          html += `<div style="font-size:15px; margin-bottom:2px; background:#1e293b; padding:10px; border-radius:8px; border-left:5px solid #8b5cf6; display:flex; justify-content:space-between; align-items:center;">
                    <span>💰 <span style="color:#fbbf24; font-weight:bold;">${row.norka}</span> <span style="color:#cbd5e1; font-size:13px;">(${row.stawka})</span></span>
                    <span style="color:#10b981; font-weight:bold; padding-left:10px;">do ${displayTime}</span>
                   </div>`;
        });
        html += "</div>";

        listContainer.innerHTML =
          `<button id="btn-refresh-policy-active" style="width:100%; padding:12px; background:#8b5cf6; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:15px; font-weight:bold;">🔄 Odśwież dane z arkusza</button>` +
          html;
      }
      document.getElementById("btn-refresh-policy-active").onclick =
        refreshActivePoliciesFromSheet;
    } catch (e) {
      listContainer.innerHTML = `<button id="btn-refresh-policy-active" style="width:100%; padding:12px; background:#8b5cf6; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:15px; font-weight:bold; margin-bottom:10px;">🔄 Spróbuj ponownie</button><div style="color:#ef4444; padding:10px; font-size:15px; text-align:center;">Błąd pobierania danych. Upewnij się, że wdrożyłeś Nową Wersję w Google.</div>`;
      document.getElementById("btn-refresh-policy-active").onclick =
        refreshActivePoliciesFromSheet;
    }
  }

  // --- ZAPISYWANIE ---
  async function logToSheet(norka, stawka) {
    const endTimeInput = document.getElementById("policy-end").value;
    if (!endTimeInput) {
      alert("❌ Podaj godzinę zakończenia!");
      return;
    }

    const payload = {
      action: "POLICY",
      date: getFormattedDate(),
      from: getCurrentTimeHM(),
      to: endTimeInput,
      norka: norka.toLowerCase(),
      stawka: stawka.replace("+", ""),
      user: document.getElementById("policy-user").value.toUpperCase(),
      reason: document.getElementById("policy-reason").value,
    };

    try {
      await fetch(SHEETS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Błąd połączenia:", e);
    }
  }

  async function updateSheetEnd(norka) {
    const payload = {
      action: "UPDATE_POLICY_END",
      date: getFormattedDate(),
      norka: norka.toLowerCase(),
      currentTime: getCurrentTimeHM(),
    };
    try {
      await fetch(SHEETS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Błąd aktualizacji:", e);
    }
  }

  async function continuePolicyInSheet(norka, newTime, stawka) {
    const payload = {
      action: "CONTINUE_POLICY",
      date: getFormattedDate(),
      to: newTime,
      norka: norka.toLowerCase(),
      stawka: stawka.replace("+", ""),
      user: document.getElementById("policy-user").value.toUpperCase(),
      reason: "Kontynuacja",
    };
    try {
      await fetch(SHEETS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Błąd połączenia:", e);
    }
  }

  function updateButtonLabel() {
    const btn = document.getElementById("btn-toggle-policy");
    const checked = document.querySelectorAll(
      ".company-name-policy-check:checked",
    );
    if (checked.length === 0) {
      btn.textContent = "WYBIERZ NORKI";
      btn.style.opacity = "0.6";
      btn.style.background = "#8b5cf6";
      btn.style.boxShadow = "0 4px 0 #5b21b6";
      return;
    }
    const firstId = checked[0].value;
    const dot = document.getElementById(`policy-dot-${firstId}`);
    const isGreen =
      dot &&
      (dot.style.background.includes("rgb(16, 185, 129)") ||
        dot.style.background === "#10b981");
    btn.style.opacity = "1";
    btn.textContent = isGreen ? "WYŁĄCZ POLITYKĘ" : "WŁĄCZ POLITYKĘ";
    btn.style.background = isGreen ? "#ef4444" : "#10b981";
    btn.style.boxShadow = isGreen ? "0 4px 0 #991b1b" : "0 4px 0 #065f46";
  }

  async function fetchPolicyStatuses() {
    const token = getBearerToken();
    if (!token) return;
    const policyId = document.getElementById("policy-select").value;
    const city = document.getElementById("policy-city-select").value;
    try {
      const res = await fetch(
        `https://hq.company-name.app/api/hq-fee-policy/${policyId}/darkstores`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        const allDarkstores = data.value?.darkstores || [];
        cityMap[city].forEach((id) => {
          const dot = document.getElementById(`policy-dot-${id}`);
          if (dot) {
            const norkaData = allDarkstores.find(
              (d) => d.darkstoreId === parseInt(id),
            );
            dot.style.background =
              norkaData && norkaData.active === true ? "#10b981" : "#ef4444";
          }
        });
        updateButtonLabel();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function massPolicyAction(btn) {
    const targets = Array.from(
      document.querySelectorAll(".company-name-policy-check:checked"),
    );
    if (!targets.length) return;
    const policyId = document.getElementById("policy-select").value;
    const stawkaLabel =
      document.getElementById("policy-select").options[
        document.getElementById("policy-select").selectedIndex
      ].text;
    const token = getBearerToken();
    const isEnabling = btn.textContent.includes("WŁĄCZ");

    btn.disabled = true;
    let done = 0;
    for (let checkbox of targets) {
      const id = checkbox.value;
      btn.textContent = `⏳ ${++done}/${targets.length}`;
      try {
        const res = await fetch(
          `https://hq.company-name.app/api/hq-fee-policy/${policyId}/toggle/${id}`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          if (isEnabling) await logToSheet(norkaNames[id] || id, stawkaLabel);
          else await updateSheetEnd(norkaNames[id] || id);
        }
      } catch (e) {
        console.error(e);
      }
    }

    localStorage.setItem(
      "company-name-user-initials",
      document.getElementById("policy-user").value,
    );
    btn.textContent = "✅ GOTOWE!";
    setTimeout(() => {
      fetchPolicyStatuses();
      refreshActivePoliciesFromSheet();
      btn.disabled = false;
      document
        .querySelectorAll(".company-name-policy-check")
        .forEach((el) => (el.checked = false));
      updateButtonLabel();
    }, 1500);
  }

  function injectPanel() {
    if (document.getElementById("company-name-policy-panel")) return;

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
      btn.innerHTML = "💰 Opłaty Serwisowe";
      btn.style.cssText =
        "background:#8b5cf6; color:#fff; border:1px solid #a78bfa; border-radius:8px; padding:12px 20px; font-weight:bold; cursor:pointer; font-size:15px; box-shadow:0 4px 6px rgba(0,0,0,0.3); width: 100%; text-align: left; transition: 0.2s;";
      btn.onmouseover = () => (btn.style.filter = "brightness(1.2)");
      btn.onmouseout = () => (btn.style.filter = "brightness(1)");
      btn.onclick = () => {
        document
          .querySelectorAll(".company-name-app-panel")
          .forEach((p) => (p.style.display = "none"));
        const target = document.getElementById("company-name-policy-panel");
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

    const savedInitials =
      localStorage.getItem("company-name-user-initials") || "";
    const panel = document.createElement("div");
    panel.id = "company-name-policy-panel";
    panel.className = "company-name-app-panel";

    panel.style.cssText = `
      position:fixed; z-index:999997; background:#1e293b; border:2px solid #8b5cf6; border-radius:12px; 
      font-family:sans-serif; color:#f8fafc; display:none; flex-direction:column; 
      box-shadow:0 15px 40px rgba(0,0,0,0.7); box-sizing:border-box; overflow:hidden; 
      width: 450px; max-height: 90vh; resize: both;
    `;

    panel.innerHTML = `
     <div id="policy-header" style="background:#0f172a; padding:15px; cursor:grab; font-weight:bold; font-size: 18px; text-align:center; color:#8b5cf6; position:relative; user-select:none; flex-shrink: 0;">
  💰 Opłaty Serwisowe
  <div style="position:absolute; right:15px; top: 10px; display:flex; gap:15px; align-items:center;">
    <div id="policy-close-btn" style="cursor:pointer; font-size:24px; line-height:1; color:#94a3b8; transition: 0.2s; font-weight:bold;" title="Zamknij">&times;</div>
  </div>
</div>
      <div id="policy-content" style="display:flex; padding:20px; flex-direction:column; gap:15px; overflow-y:auto; flex-grow: 1;">
        
        <details open style="background:#0f172a; border:2px solid #8b5cf6; border-radius:10px;">
          <summary style="padding:12px 15px; font-size:16px; font-weight: bold; color:#a78bfa; cursor:pointer; user-select:none;">
            🔥 Aktualnie włączone (Z Arkusza)
          </summary>
          <div id="policy-active-list" style="padding:15px; font-size:14px; color:#cbd5e1; border-top:1px solid #334155; max-height:250px; overflow-y:auto; background:#111827;">
             <button id="btn-refresh-policy-active" style="width:100%; padding:12px; background:#8b5cf6; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:15px; font-weight:bold;">🔄 Pobierz dane z arkusza</button>
          </div>
        </details>

        <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #334155;">
           <select id="policy-select" style="width:100%; background:#1e293b; color:white; border:1px solid #8b5cf6; padding:12px; border-radius:8px; font-size:16px; font-weight:bold; margin-bottom:10px; cursor:pointer;">
              <option value="200">+5zł</option><option value="235">+10zł</option><option value="201">+15zł</option>
           </select>
           <select id="policy-city-select" style="width:100%; background:#1e293b; color:#fbbf24; border:1px solid #475569; padding:12px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;"></select>
        </div>

        <details open style="background:#0f172a; border:1px solid #334155; border-radius:10px;">
          <summary style="padding:15px; font-size:18px; font-weight:bold; color:#cbd5e1; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <span>🔍 Wybierz Norki</span>
            <div style="display:flex; gap:15px;"><span id="policy-all" style="color:#3b82f6; font-size:16px; text-decoration:underline;">[Wszystkie]</span><span id="policy-none" style="color:#ef4444; font-size:16px; text-decoration:underline;">[Odznacz]</span></div>
          </summary>
          <div id="policy-norki-list" style="padding:15px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; max-height:250px; overflow-y:auto; border-top:1px solid #334155;"></div>
        </details>

        <div style="background:#0f172a; padding:15px; border-radius:10px; border:1px solid #8b5cf6; display:flex; flex-direction:column; gap:10px;">
           <div style="display:flex; gap:15px;">
              <div style="flex:1">
                 <label style="font-size:14px; color:#cbd5e1; font-weight:bold; margin-bottom:5px; display:block;">Do Kiedy:</label>
                 <input type="time" id="policy-end" style="width:100%; background:#1e293b; color:white; border:1px solid #334155; border-radius:6px; padding:10px; font-size:16px; font-family:sans-serif;">
              </div>
              <div style="flex:1">
                 <label style="font-size:14px; color:#cbd5e1; font-weight:bold; margin-bottom:5px; display:block;">Inicjały:</label>
                 <input type="text" id="policy-user" value="${savedInitials}" style="width:100%; background:#1e293b; color:white; border:1px solid #334155; border-radius:6px; padding:10px; font-size:16px; font-family:sans-serif; text-transform:uppercase;">
              </div>
           </div>
           <input type="text" id="policy-reason" placeholder="Powód np. braki / wiatr..." style="width:100%; background:#1e293b; color:white; border:1px solid #334155; border-radius:6px; padding:12px; font-size:15px; margin-top:5px; box-sizing:border-box;">
        </div>
        
        <button id="btn-toggle-policy" style="background:#8b5cf6; color:white; border:none; padding:16px; border-radius:10px; cursor:pointer; font-size:18px; font-weight:900; box-shadow: 0 4px 0 #5b21b6; margin-top:5px; transition:0.2s;">WYBIERZ NORKI</button>
        
        <button id="btn-policy-continue" style="width:100%; background:#3b82f6; color:white; border:none; padding:16px; border-radius:10px; cursor:pointer; font-size:16px; font-weight:bold; margin-top:5px; transition:0.2s;">
          🔄 Kontynuacja (Tylko Arkusz)
        </button>

        <div id="policy-continue-form" style="display:none; margin-top:5px; background:#1e293b; padding:15px; border-radius:10px; border:2px solid #3b82f6;">
          <div style="font-size:15px; color:#cbd5e1; font-weight:bold; margin-bottom:10px;">Podaj nową godzinę DO:</div>
          <input type="time" id="policy-continue-time" style="width:100%; background:#0f172a; color:#fff; border:1px solid #475569; padding:12px; border-radius:8px; font-size:16px; font-family:sans-serif; box-sizing:border-box; margin-bottom:12px;">
          <div style="display:flex; gap:12px;">
            <button id="btn-policy-continue-save" style="flex:1; padding:14px; border-radius:8px; cursor:pointer; font-size:15px; font-weight:bold; border:none; background:#10b981; color:#fff; transition:0.2s;">✅ Zapisz</button>
            <button id="btn-policy-continue-cancel" style="flex:1; padding:14px; border-radius:8px; cursor:pointer; font-size:15px; font-weight:bold; border:none; background:#475569; color:#fff; transition:0.2s;">❌ Anuluj</button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(panel);

    const citySelect = document.getElementById("policy-city-select");
    citySelect.innerHTML = Object.keys(cityMap)
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    const refreshList = () => {
      document.getElementById("policy-norki-list").innerHTML = cityMap[
        citySelect.value
      ]
        .map(
          (id) => `
        <label style="font-size:15px; font-weight:bold; display:flex; align-items:center; gap:8px; cursor:pointer; padding:8px; background:#1e293b; border-radius:8px; border:1px solid #334155;">
          <input type="checkbox" class="company-name-policy-check" value="${id}" style="transform: scale(1.3);"> 
          <span id="policy-dot-${id}" style="width:12px; height:12px; border-radius:50%; background:#475569; display:inline-block;"></span>
          <span style="color:#e2e8f0;">${norkaNames[id] || id}</span>
        </label>`,
        )
        .join("");
      document
        .querySelectorAll(".company-name-policy-check")
        .forEach((cb) => (cb.onchange = updateButtonLabel));
      fetchPolicyStatuses();
    };

    citySelect.onchange = refreshList;
    document.getElementById("policy-select").onchange = fetchPolicyStatuses;
    document.getElementById("policy-all").onclick = () => {
      document
        .querySelectorAll(".company-name-policy-check")
        .forEach((el) => (el.checked = true));
      updateButtonLabel();
    };
    document.getElementById("policy-none").onclick = () => {
      document
        .querySelectorAll(".company-name-policy-check")
        .forEach((el) => (el.checked = false));
      updateButtonLabel();
    };
    document.getElementById("btn-toggle-policy").onclick = function () {
      massPolicyAction(this);
    };

    const btnContinue = document.getElementById("btn-policy-continue");
    const inlineForm = document.getElementById("policy-continue-form");
    const inlineInput = document.getElementById("policy-continue-time");
    const btnSave = document.getElementById("btn-policy-continue-save");
    const btnCancel = document.getElementById("btn-policy-continue-cancel");

    btnContinue.onclick = function () {
      const targets = Array.from(
        document.querySelectorAll(".company-name-policy-check:checked"),
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
        document.querySelectorAll(".company-name-policy-check:checked"),
      ).map((c) => c.value);
      const newTime = inlineInput.value;
      if (!newTime) return alert("Proszę wpisać nową godzinę DO!");

      const stawkaLabel =
        document.getElementById("policy-select").options[
          document.getElementById("policy-select").selectedIndex
        ].text;

      btnSave.disabled = true;
      btnSave.textContent = "⏳ Zapisuję...";

      try {
        for (let id of targets) {
          await continuePolicyInSheet(
            norkaNames[id] || id,
            newTime,
            stawkaLabel,
          );
        }
        btnSave.textContent = "✅ Zapisano!";
        setTimeout(refreshActivePoliciesFromSheet, 1500);

        setTimeout(() => {
          inlineForm.style.display = "none";
          btnContinue.style.display = "block";
          btnSave.disabled = false;
          btnSave.textContent = "✅ Zapisz";
        }, 1500);
      } catch (e) {
        btnSave.textContent = "❌ Błąd";
        btnSave.disabled = false;
      }
    };

    document.getElementById("btn-refresh-policy-active").onclick =
      refreshActivePoliciesFromSheet;

    const closeBtn = document.getElementById("policy-close-btn");
    closeBtn.onclick = (e) => {
      e.preventDefault();
      panel.style.display = "none";
    };

    const h = document.getElementById("policy-header");
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
    window.onmousemove = (e) => {
      if (!isD) return;
      panel.style.left = e.clientX - ox + "px";
      panel.style.top = e.clientY - oy + "px";
    };
    window.onmouseup = () => {
      isD = false;
      h.style.cursor = "grab";
    };

    refreshList();
    refreshActivePoliciesFromSheet();
  }

  setTimeout(injectPanel, 3000);
})();
