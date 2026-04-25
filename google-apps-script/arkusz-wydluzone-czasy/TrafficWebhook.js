// =========================================================================
// 1. FUNKCJA ODBIERAJĄCA DANE (Zapisywanie, Aktualizacja i Zamykanie)
// =========================================================================
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var lastRow = sheet.getLastRow();
    var isUpdated = false;

    if (lastRow >= 2) {
      var displayValues = sheet
        .getRange(2, 1, lastRow - 1, 6)
        .getDisplayValues();

      for (var i = displayValues.length - 1; i >= 0; i--) {
        var rowDate = displayValues[i][0].trim();
        var rowCity = displayValues[i][1].trim();
        var rowNorka = displayValues[i][2].trim();

        // Szukamy ostatniego wpisu dla tej samej daty, miasta i norki
        if (
          rowDate === data.date &&
          rowCity === String(data.city) &&
          rowNorka === String(data.norka)
        ) {
          if (data.isCloseOld) {
            // LOGIKA ZAMYKANIA: Wtyczka daje sygnał ucięcia czasu (przy zmianie na inny lub na Normalne)
            var targetRow = i + 2;
            sheet.getRange(targetRow, 5).setValue(data.splitTime); // Nadpisujemy "DO" aktualną godziną
            isUpdated = true; // Zaznaczamy jako załatwione, by nie tworzyć nowego wiersza!
            break;
          } else {
            // LOGIKA KONTYNUACJI / AKTUALIZACJI
            var rowTimeFrom = displayValues[i][3].trim().substring(0, 5);
            var reqTimeFrom = (data.timeFrom || "").trim().substring(0, 5);

            if (data.isContinuation || rowTimeFrom === reqTimeFrom) {
              var targetRow = i + 2;
              sheet.getRange(targetRow, 5).setValue(data.timeTo);
              sheet.getRange(targetRow, 6).setValue(data.status);
              isUpdated = true;
            }
            break;
          }
        }
      }
    }

    // Dodanie nowego wiersza (tylko wtedy, gdy to zupełnie nowa blokada lub otwieramy drugi etap po ucięciu)
    if (!isUpdated) {
      sheet.appendRow([
        data.date,
        data.city,
        data.norka,
        data.timeFrom,
        data.timeTo,
        data.status,
      ]);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 2. FUNKCJA WYSYŁAJĄCA DANE DO WTYCZKI (Odczyt dla radaru z czyszczeniem)
// =========================================================================
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) return returnJsonResponse([]);

    var displayValues = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();

    var todayDate = new Date();
    var todayD = String(todayDate.getDate()).padStart(2, "0");
    var todayM = String(todayDate.getMonth() + 1).padStart(2, "0");
    var todayY = todayDate.getFullYear();
    var today = todayD + "." + todayM + "." + todayY;

    var currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();
    var activeList = [];

    for (var i = 0; i < displayValues.length; i++) {
      var rowDate = displayValues[i][0].trim();
      var timeTo = displayValues[i][4].trim();
      var status = displayValues[i][5].trim();

      if (rowDate === today && status !== "Normalne" && status !== "") {
        var isFuture = true;

        var timeMatch = timeTo.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          var rowMins =
            parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
          if (rowMins === 0) rowMins = 1440;
          if (rowMins <= currentMinutes) {
            isFuture = false;
          }
        }

        if (isFuture) {
          activeList.push({
            city: displayValues[i][1].trim(),
            norka: displayValues[i][2].trim(),
            timeTo: timeTo,
            status: status,
          });
        }
      }
    }
    return returnJsonResponse(activeList);
  } catch (error) {
    return returnJsonResponse({ error: error.toString() });
  }
}

function returnJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
