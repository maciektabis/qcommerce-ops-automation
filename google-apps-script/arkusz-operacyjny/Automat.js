// --- KONFIGURACJA ---
// Tutaj znajdują się wszyscy odbiorcy raportu
var LISTA_MAILI = "company-emails";

var WSPOLNY_FOLDER_ID = "folder";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 COMMAND CENTER")
    .addItem("Otwórz Panel (Zapisywanie)", "showSidebar")
    .addSeparator()
    .addItem("👁️ PODGLĄD RAPORTU (Dzisiaj)", "pokazPodgladDzis")
    .addItem("📝 UTWÓRZ SZKIC (Dzisiaj)", "wyslijRaportDzis")
    .addSeparator()
    .addItem("⏪ PODGLĄD RAPORTU (Wczoraj)", "pokazPodgladWczoraj")
    .addItem("⏪ UTWÓRZ SZKIC (Wczoraj)", "wyslijRaportWczoraj")
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Lisek Command Center")
    .setWidth(500);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Funkcja wyliczająca datę (zwraca dzisiejszą lub wczorajszą)
function pobierzDate(wczoraj) {
  var date = new Date();
  if (wczoraj) {
    date.setDate(date.getDate() - 1); // Cofamy o 1 dzień
  }
  return Utilities.formatDate(date, "Europe/Warsaw", "dd.MM.yyyy");
}

// --- PRZYCISKI MENU: DZISIAJ ---
function pokazPodgladDzis() {
  pokazPodgladDlaDaty(pobierzDate(false));
}
function wyslijRaportDzis() {
  wyslijSzkicDlaDaty(pobierzDate(false));
}

// --- PRZYCISKI MENU: WCZORAJ ---
function pokazPodgladWczoraj() {
  pokazPodgladDlaDaty(pobierzDate(true));
}
function wyslijRaportWczoraj() {
  wyslijSzkicDlaDaty(pobierzDate(true));
}

// --- GŁÓWNE LOGIKI WYWOŁUJĄCE RAPORT ---
function pokazPodgladDlaDaty(dataSprawdzana) {
  var raportData = generujPelnyHtmlRaportu("podglad", dataSprawdzana);
  var htmlOutput = HtmlService.createHtmlOutput(raportData.html)
    .setWidth(950)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(
    htmlOutput,
    "👁️ Podgląd Raportu (" + dataSprawdzana + ")",
  );
}

function wyslijSzkicDlaDaty(dataSprawdzana) {
  var raportData = generujPelnyHtmlRaportu("email", dataSprawdzana);
  GmailApp.createDraft(
    LISTA_MAILI,
    "Raport Lisek " + dataSprawdzana,
    "Otwórz e-mail w formacie HTML",
    {
      htmlBody: raportData.html,
      inlineImages: raportData.images,
    },
  );
  SpreadsheetApp.getUi().alert(
    "📝 UTWORZONO SZKIC RAPORTU!\n\nSzkic za dzień " +
      dataSprawdzana +
      ' jest gotowy i zaadresowany do wszystkich odbiorców. Wejdź w folder "Szkice" w Gmailu i zaplanuj wysyłkę.',
  );
}

// Zapisywanie danych z kolejki panelu bocznego (zapisuje zawsze z dzisiejszą datą, tu nic nie zmieniamy)
function zapiszDaneDoArkusza(dataQueue) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dzis = Utilities.formatDate(new Date(), "Europe/Warsaw", "dd.MM.yyyy");
    var dailyFolder = getOrCreateDailyFolder(dzis);

    dataQueue.forEach(function (item) {
      if (item.type === "spoznienie") {
        var shSpozn = ss.getSheetByName("Spóźnienia");
        var lines = item.val.split("\n");
        var currentCity = "INNE";
        lines.forEach(function (line) {
          var l = line.trim();
          if (!l) return;
          if (l.toLowerCase().includes("spóźnienia") && l.includes(":")) {
            currentCity = l.split(":").shift().split(" ").pop().toUpperCase();
            return;
          }
          var parts = l.split("-");
          if (parts.length >= 2) {
            var norka = parts[0].trim();
            var nazwisko = parts[1] ? parts[1].trim() : "";
            var czas = parts[2] ? parts[2].trim() : "nb";
            shSpozn.appendRow([
              dzis,
              currentCity + " " + norka,
              nazwisko,
              czas,
            ]);
          }
        });
      }

      if (item.type === "skradzione") {
        var shSkrad = ss.getSheetByName("Skradzione ordery");
        var listaNr = String(item.numery)
          .split(/[ ,;]+/)
          .filter(Boolean);
        listaNr.forEach(function (nr) {
          shSkrad.appendRow([dzis, nr, item.kurier, item.norka]);
        });
      }

      if (item.type === "kolejkowanie") {
        var shKolej = ss.getSheetByName("Kolejkowanie");
        var norkaFmt = String(item.norka).trim();
        if (!norkaFmt.toLowerCase().startsWith("n")) norkaFmt = "n" + norkaFmt;
        var note = "Brak zdjęcia";
        if (item.image) {
          var fileName =
            "Kolejka_" +
            norkaFmt +
            "_" +
            item.godzina.replace(":", "-") +
            ".png";
          dailyFolder.createFile(
            Utilities.newBlob(
              Utilities.base64Decode(item.image.split(",")[1]),
              "image/png",
              fileName,
            ),
          );
          note = "✅ Foto na Drive";
        }
        shKolej.appendRow([dzis, norkaFmt, item.godzina, note]);
      }

      if (item.type === "przerzut_img" && item.image) {
        var existingFiles = dailyFolder.getFiles();
        while (existingFiles.hasNext()) {
          var f = existingFiles.next();
          if (f.getName().startsWith("Przerzuty_Lista_")) {
            f.setTrashed(true);
          }
        }
        var fileNamePrzerzut =
          "Przerzuty_Lista_" +
          Utilities.formatDate(new Date(), "Europe/Warsaw", "HH-mm-ss") +
          ".png";
        dailyFolder.createFile(
          Utilities.newBlob(
            Utilities.base64Decode(item.image.split(",")[1]),
            "image/png",
            fileNamePrzerzut,
          ),
        );
      }
    });
    return "✅ Pomyślnie zapisano " + dataQueue.length + " pozycji.";
  } catch (e) {
    return "❌ Błąd: " + e.message;
  }
}

// Główna logika generowania HTML (przyjmuje teraz zmienną dataSprawdzana zamiast tylko 'dzis')
function generujPelnyHtmlRaportu(tryb, dataSprawdzana) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var html =
    "<div style='font-family: Arial, sans-serif; font-size: 15px; max-width: 900px; margin: auto; border: 1px solid #eee; padding: 20px; color: #000;'>";
  html +=
    "<h2 style='background:#000000; color:white; padding:15px; margin:0; text-align:center; font-size: 18px;'>RAPORT DZIENNY - " +
    dataSprawdzana +
    "</h2>";

  html += generujListeSpoznien(ss, dataSprawdzana);
  html += generujListeSkradzionych(ss, dataSprawdzana);

  var htmlKolejkowanie = "";
  var htmlPrzerzutyImg = "";
  var inlineImages = {};
  var imgCount = 0;

  try {
    var dailyFolder = getOrCreateDailyFolder(dataSprawdzana);
    var files = dailyFolder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      var fileName = file.getName();
      var imgKey = "img_" + imgCount;
      var imgSrc = "";

      if (tryb === "podglad") {
        imgSrc =
          "data:image/png;base64," +
          Utilities.base64Encode(file.getBlob().getBytes());
      } else {
        inlineImages[imgKey] = file.getBlob();
        imgSrc = "cid:" + imgKey;
      }
      var imgHtml =
        "<div style='margin-bottom:25px; border-bottom: 1px solid #eee; padding-bottom:15px;'>";
      if (fileName.startsWith("Przerzuty")) {
        imgHtml +=
          "<img src='" +
          imgSrc +
          "' alt='Lista Przerzutów' style='width: 100%; max-width: 800px; border-radius: 5px; cursor: zoom-in;'></div>";
        htmlPrzerzutyImg += imgHtml;
      } else {
        var title = fileName
          .replace(".png", "")
          .replace("Kolejka_", "")
          .replace(/_/g, " ")
          .replace(/-/g, ":");
        imgHtml +=
          "<span style='font-weight: bold;'>" +
          title +
          "</span><br><br><img src='" +
          imgSrc +
          "' alt='Kolejka' style='width: 100%; max-width: 800px; border-radius: 5px;'></div>";
        htmlKolejkowanie += imgHtml;
      }
      imgCount++;
    }
  } catch (e) {}

  if (htmlKolejkowanie !== "") {
    html +=
      "<h3 style='border-left: 5px solid #000; padding-left: 10px; color: #000; margin-top:35px; font-size: 16px; text-transform: uppercase;'>KOLEJKOWANIE</h3>" +
      htmlKolejkowanie;
  }
  html +=
    "<h4 style='color:#000; margin-top: 40px; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; font-size: 16px; text-transform: uppercase;'>LISTA PRZERZUTÓW</h4>" +
    (htmlPrzerzutyImg || "<p><i>Brak screena na dziś.</i></p>");
  html += generujTabele(
    ss,
    "Wypadki",
    "WYPADKI",
    [1, 2, 3, 4, 5, 6, 7],
    [
      "Norka",
      "Kurier",
      "Opis",
      "Nr Pojazdu",
      "Usterki",
      "Kontynuował?",
      "Oświadczenie",
    ],
    dataSprawdzana,
    "#d32f2f",
    0,
  );
  // Poniżej znajduje się poprawiona tabela polityk z kolumną Kwota (indeks 5)
  html += generujTabele(
    ss,
    "Polityki",
    "POLITYKI",
    [1, 2, 3, 4, 5, 6, 7],
    ["Od", "Do", "Czas", "Norka", "Kwota", "Kto", "Powód"],
    dataSprawdzana,
    "#00695c",
    0,
  );
  html += generujTabele(
    ss,
    "Raport Zamkniecia Norki",
    "RAPORT ZAMKNIĘCIA",
    [0, 1, 2, 4, 5, 6, 7],
    ["Kto", "Norka", "Zamknięcie", "Otwarcie", "Czas", "Picker?", "Powód"],
    dataSprawdzana,
    "#424242",
    3,
  );

  return { html: html + "</div>", images: inlineImages };
}

// Funkcje pomocnicze
function getOrCreateDailyFolder(dzis) {
  var mainFolder = DriveApp.getFolderById(WSPOLNY_FOLDER_ID);
  var subFolderName = "Raporty_" + dzis;
  var subFolders = mainFolder.getFoldersByName(subFolderName);
  return subFolders.hasNext()
    ? subFolders.next()
    : mainFolder.createFolder(subFolderName);
}

function generujListeSkradzionych(ss, dzis) {
  var sheet = ss.getSheetByName("Skradzione ordery");
  var data = sheet.getDataRange().getDisplayValues();
  var rows = data.filter((r, i) => i > 0 && String(r[0]).includes(dzis));
  if (rows.length == 0) return "";
  var html =
    "<h3 style='border-left: 5px solid #000; padding-left: 10px; color: #000; margin-top: 30px; font-size: 16px; text-transform: uppercase;'>SKRADZIONE ORDERY</h3><div style='background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 5px;'>";
  rows.forEach((r) => {
    html += "<p>" + r[3] + ", " + r[2] + " - nr: " + r[1] + "</p>";
  });
  return html + "</div>";
}

function generujListeSpoznien(ss, dzis) {
  var sheet = ss.getSheetByName("Spóźnienia");
  var data = sheet.getDataRange().getDisplayValues();
  var rows = data.filter((r, i) => i > 0 && String(r[0]).includes(dzis));
  if (rows.length == 0) return "";
  var html =
    "<h3 style='border-left: 5px solid #000; padding-left: 10px; color: #000; margin-top: 30px; font-size: 16px; text-transform: uppercase;'>SPÓŹNIENIA I NIEOBECNOŚCI</h3><div style='background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 5px;'>";
  var miasta = {};
  rows.forEach((r) => {
    var norkaPelna = String(r[1]);
    var miasto = norkaPelna.split(" ")[0];
    var norkaTylko = norkaPelna.split(" ").slice(1).join(" ");
    if (!miasta[miasto]) miasta[miasto] = [];
    miasta[miasto].push(norkaTylko + " - " + r[2] + " - " + r[3]);
  });
  for (var m in miasta) {
    html +=
      "<p style='margin-bottom: 15px;'><b>spóźnienia i nieobecności " +
      m +
      ":</b><br>" +
      miasta[m].join("<br>") +
      "</p>";
  }
  return html + "</div>";
}

function generujTabele(
  ss,
  sheetName,
  title,
  colIndices,
  headers,
  dzis,
  kolor,
  dateColIdx,
) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return "";
  var data = sheet.getDataRange().getDisplayValues();
  var rows = data.filter(
    (r, i) => i > 0 && String(r[dateColIdx || 0]).includes(dzis),
  );
  var html =
    "<h4 style='color:#000; margin-top: 40px; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; font-size: 16px; text-transform: uppercase;'>" +
    title +
    "</h4>";
  if (rows.length == 0)
    return (
      html + "<p style='color: #999; font-style: italic;'>Brak wpisów.</p>"
    );
  html +=
    "<table border='1' style='border-collapse:collapse; width:100%; font-size:14px; text-align: left;'>";
  html +=
    "<tr style='background:" +
    kolor +
    "; color: white;'> " +
    headers.map((h) => "<th style='padding:8px;'>" + h + "</th>").join("") +
    "</tr>";
  rows.forEach((r) => {
    html +=
      "<tr>" +
      colIndices
        .map((idx) => {
          var val = r[idx];
          if (sheetName === "Wypadki" && (idx === 6 || idx === 7))
            val =
              val === "TAK" || val === "TRUE" || val === "PRAWDA"
                ? "✅ TAK"
                : "❌ NIE";
          return (
            "<td style='padding:8px; border: 1px solid #ddd;'>" +
            (val || "-") +
            "</td>"
          );
        })
        .join("") +
      "</tr>";
  });
  return html + "</table>";
}
