// 1. ZMIENNA Z ID ARKUSZA (Zaktualizowana o Twój link)
var SHEET_ID = "SHEET_ID";

// =========================================================================
// 1. ANTENA ODBIORCZA (Zapisywanie/Aktualizacja danych)
// =========================================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return handleHQApp(data.action, data);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 2. GŁÓWNY SKRYPT OBSŁUGUJĄCY LISKA
// =========================================================================
function handleHQApp(action, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  function getPolitykiSheet() {
    var allSheets = ss.getSheets();
    for (var i = 0; i < allSheets.length; i++) {
      if (allSheets[i].getName().toLowerCase().trim() === "polityki")
        return allSheets[i];
    }
    throw new Error("Nie znaleziono zakładki 'Polityki'");
  }

  // --- POLITYKI: Nowa ---
  if (action === "POLICY") {
    var sheet = getPolitykiSheet();
    var colA = sheet.getRange("A:A").getValues();
    var targetRow = 1;
    for (var i = colA.length - 1; i >= 0; i--) {
      if (colA[i][0] !== "") {
        targetRow = i + 2;
        break;
      }
    }

    // Ignorujemy Kolumnę D (Czas)
    sheet.getRange(targetRow, 1).setValue(data.date); // A
    sheet.getRange(targetRow, 2).setValue(data.from); // B
    sheet.getRange(targetRow, 3).setValue(data.to); // C
    sheet.getRange(targetRow, 5).setValue(data.norka); // E
    sheet.getRange(targetRow, 6).setValue(data.stawka); // F
    sheet.getRange(targetRow, 7).setValue(data.user); // G
    sheet.getRange(targetRow, 8).setValue(data.reason); // H
  }
  // --- POLITYKI: Wcześniejsze wyłączenie ---
  else if (action === "UPDATE_POLICY_END") {
    var sheet = getPolitykiSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var dataRange = sheet.getRange(1, 1, lastRow, 5).getDisplayValues();
      for (var i = lastRow - 1; i >= 0; i--) {
        var sheetDate = dataRange[i][0].trim();
        if (
          sheetDate === String(data.date) &&
          String(dataRange[i][4]).toLowerCase() ===
            String(data.norka).toLowerCase()
        ) {
          var rowToUpdate = i + 1;
          sheet.getRange(rowToUpdate, 3).setValue(data.currentTime); // Tylko DO
          break;
        }
      }
    }
  }
  // --- POLITYKI: Kontynuacja (NOWOŚĆ) ---
  else if (action === "CONTINUE_POLICY") {
    var sheet = getPolitykiSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var displayValues = sheet.getRange(1, 1, lastRow, 5).getDisplayValues();
      for (var i = lastRow - 1; i >= 0; i--) {
        var sheetDate = displayValues[i][0].trim();
        var sheetNorka = displayValues[i][4].trim().toLowerCase(); // Kolumna E

        if (
          sheetDate === String(data.date) &&
          sheetNorka === String(data.norka).toLowerCase()
        ) {
          var rowToUpdate = i + 1;
          sheet.getRange(rowToUpdate, 3).setValue(data.to); // Podmienia TYLKO godzinę DO
          break;
        }
      }
    }
  }
  // --- ZAMKNIĘCIA NOREK (Stara, nienaruszona logika) ---
  else if (action === "ZAMKNIJ") {
    var sheet = ss.getSheetByName("Raport Zamkniecia Norki");
    var maxRows = sheet.getLastRow();
    var colA = sheet.getRange("A1:A" + (maxRows || 10)).getValues();
    var targetRow = 10;
    for (var i = colA.length - 1; i >= 9; i--) {
      if (colA[i][0] !== "" && colA[i][0] !== null) {
        targetRow = i + 2;
        break;
      }
    }
    sheet.getRange(targetRow, 1).setValue(data.initials);
    sheet.getRange(targetRow, 2).setValue(data.norka);
    sheet.getRange(targetRow, 3).setValue(data.closeTime);
    sheet.getRange(targetRow, 4).setValue(data.closeDate);
    sheet.getRange(targetRow, 5).setValue(data.openTime);
    sheet.getRange(targetRow, 7).setValue(data.picker);
    sheet.getRange(targetRow, 8).setValue(data.reason);
  } else if (action === "OTWORZ") {
    var sheet = ss.getSheetByName("Raport Zamkniecia Norki");
    var lastRow = sheet.getLastRow();
    if (lastRow >= 10) {
      var norkaColumn = sheet.getRange(1, 2, lastRow, 1).getValues();
      for (var i = lastRow; i >= 10; i--) {
        if (
          norkaColumn[i - 1][0].toString().toLowerCase() ===
          data.norka.toString().toLowerCase()
        ) {
          sheet.getRange(i, 5).setValue(data.currentTime);
          break;
        }
      }
    }
  }
  return ContentService.createTextOutput(
    JSON.stringify({ status: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 3. WYSYŁANIE AKTYWNYCH POLITYK DO WTYCZKI (NOWOŚĆ)
// =========================================================================
// =========================================================================
// 3. WYSYŁANIE AKTYWNYCH POLITYK DO WTYCZKI (Odczyt)
// =========================================================================
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var allSheets = ss.getSheets();
    var sheet = null;

    for (var i = 0; i < allSheets.length; i++) {
      if (allSheets[i].getName().toLowerCase().trim() === "polityki") {
        sheet = allSheets[i];
        break;
      }
    }

    if (!sheet)
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(
        ContentService.MimeType.JSON,
      );

    var lastRow = sheet.getLastRow();
    if (lastRow < 2)
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(
        ContentService.MimeType.JSON,
      );

    var displayValues = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();

    var todayDate = new Date();
    var todayD = String(todayDate.getDate()).padStart(2, "0");
    var todayM = String(todayDate.getMonth() + 1).padStart(2, "0");
    var todayY = todayDate.getFullYear();
    var today = todayD + "." + todayM + "." + todayY;

    // NOWOŚĆ: Pobieramy dzisiejszą godzinę przeliczoną na minuty (np. 17:58 = 1078)
    var currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();

    var activeList = [];

    for (var i = 0; i < displayValues.length; i++) {
      var rowDate = displayValues[i][0].trim();
      var timeTo = displayValues[i][2].trim(); // Kolumna C (DO)
      var norka = displayValues[i][4].trim(); // Kolumna E (Norka)
      var stawka = displayValues[i][5].trim(); // Kolumna F (Stawka)

      if (rowDate === today && timeTo !== "") {
        // NOWOŚĆ: Sprawdzamy czy czas już nie minął
        var isFuture = true;
        var timeMatch = timeTo.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          var rowMins =
            parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
          if (rowMins === 0) rowMins = 1440; // 00:00 traktujemy jako koniec dnia

          if (rowMins <= currentMinutes) {
            isFuture = false; // Czas minął lub właśnie mija, zdejmujemy z radaru!
          }
        }

        // Dodajemy wpis do radaru TYLKO, jeśli godzina DO jest w przyszłości
        if (isFuture) {
          activeList.push({
            norka: norka,
            timeTo: timeTo,
            stawka: stawka,
          });
        }
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify(activeList),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
