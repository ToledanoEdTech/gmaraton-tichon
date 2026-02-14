// =====================================================
// גמרתון ישיבת צביה אלישיב לוד - Google Apps Script
// ניקוד נשאב אך ורק מהקובץ (גוגל שיטס). עדכון ניקוד מהאתר נכתב לקובץ.
// מבנה גיליון: שורה 1 כותרות, שורה 2 בונוס כיתתי ב-D2, משורה 3: עמודה B=שם, עמודה C=ניקוד.
// בונוס כיתתי: כל הזנה מתווספת לבונוס הקיים ב-D2 (לא מחליפה). אחרי שינוי — לפרסם מחדש (Deploy).
// =====================================================

function doPost(e) {
  try {
    console.log("=== NEW REQUEST STARTED ===");
    console.log("Raw request:", e);

    // בדוק אם יש נתונים
    if (!e.postData || !e.postData.contents) {
      console.log("ERROR: No postData received");
      return createJsonResponse({
        success: false,
        error: "לא התקבלו נתונים"
      });
    }

    // נתח את ה-JSON
    var data;
    try {
      data = JSON.parse(e.postData.contents);
      console.log("Parsed data:", JSON.stringify(data));
      console.log("Data type:", typeof data);
      console.log("Data.type value:", data.type);
      console.log("Is classBonus?", data.type === 'classBonus');
    } catch (parseError) {
      console.log("ERROR: Failed to parse JSON:", parseError);
      console.log("Raw contents:", e.postData.contents);
      return createJsonResponse({
        success: false,
        error: "נתונים לא תקינים: " + parseError.message
      });
    }

    // בדוק אם זה עדכון בונוס כיתתי או עדכון ניקוד תלמיד
    console.log("Checking if type is classBonus. data.type =", data.type, "comparison result:", data.type === 'classBonus');
    if (data.type === 'classBonus') {
      // עדכון בונוס כיתתי — חובה: להוסיף לבונוס הקיים, לא להחליף!
      console.log("=== CLASS BONUS UPDATE REQUEST (ADD to existing) ===");
      console.log("Received data:", JSON.stringify(data));
      
      var studentGrade = data.grade ? data.grade.toString().trim() : '';
      var bonusToAdd = Number(data.bonus);
      if (isNaN(bonusToAdd) || bonusToAdd < 0) bonusToAdd = 0;

      console.log("Parsed grade: '" + studentGrade + "', Bonus to ADD: " + bonusToAdd);

      if (!studentGrade) {
        console.log("ERROR: Missing grade for class bonus");
        return createJsonResponse({
          success: false,
          error: "חסרים נתונים נדרשים: כיתה או בונוס",
          receivedData: data
        });
      }

      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) {
        console.log("ERROR: Could not access spreadsheet");
        return createJsonResponse({
          success: false,
          error: "לא ניתן לגשת לגיליון"
        });
      }

      console.log("Looking for sheet with grade name: '" + studentGrade + "'");
      var sheet = findGradeSheet(spreadsheet, studentGrade);
      if (!sheet) {
        console.log("ERROR: Sheet not found for grade: " + studentGrade);
        // List all available sheets for debugging
        var allSheets = spreadsheet.getSheets();
        var sheetNames = [];
        for (var i = 0; i < allSheets.length; i++) {
          sheetNames.push(allSheets[i].getName());
        }
        console.log("Available sheets:", sheetNames.join(", "));
        return createJsonResponse({
          success: false,
          error: "לא נמצא גיליון לכיתה: " + studentGrade,
          availableSheets: sheetNames
        });
      }

      console.log("Found sheet: " + sheet.getName());
      
      // עדכן את הבונוס הכיתתי בעמודה D שורה 2 (אינדקס 1 במערך, עמודה 4)
      var bonusColumnIndex = 3; // עמודה D (אינדקס 3 במערך = עמודה 4 בפועל)
      var bonusRowIndex = 1; // שורה 2 (אינדקס 1 במערך = שורה 2 בפועל)
      var targetRow = bonusRowIndex + 1; // שורה 2 בפועל
      var targetColumn = bonusColumnIndex + 1; // עמודה D בפועל (עמודה 4)
      
      console.log("Sheet name: " + sheet.getName());
      console.log("Sheet has " + sheet.getLastRow() + " rows and " + sheet.getLastColumn() + " columns");
      
      // Ensure the sheet has enough rows and columns
      if (sheet.getLastRow() < targetRow) {
        console.log("Sheet doesn't have row " + targetRow + ", ensuring it exists...");
        sheet.getRange(targetRow, 1).setValue("");
      }
      if (sheet.getLastColumn() < targetColumn) {
        console.log("Sheet doesn't have column " + targetColumn + ", ensuring it exists...");
        sheet.getRange(1, targetColumn).setValue("");
      }
      
      var targetRange = sheet.getRange(targetRow, targetColumn);
      var currentValue = targetRange.getValue();
      console.log("Current value in D2 (raw):", currentValue, "type:", typeof currentValue);
      
      // פרסור אמין: תא יכול להיות מספר, מחרוזת "300", או ריק
      var currentBonus = 0;
      if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
        if (typeof currentValue === 'number' && !isNaN(currentValue)) {
          currentBonus = currentValue;
        } else {
          var s = String(currentValue).replace(/\s/g, '').replace(',', '.');
          var parsed = parseFloat(s);
          if (!isNaN(parsed)) currentBonus = parsed;
        }
      }
      // חובה: סה"כ חדש = קיים + מה שהוספנו (אף פעם לא להחליף!)
      var newTotalBonus = Number(currentBonus) + Number(bonusToAdd);
      if (isNaN(newTotalBonus)) newTotalBonus = currentBonus + bonusToAdd;
      
      console.log("D2 current=" + currentBonus + ", adding " + bonusToAdd + " -> new total=" + newTotalBonus + " (writing to D2)");
      targetRange.setValue(newTotalBonus);
      SpreadsheetApp.flush();
      Utilities.sleep(200);
      var newValue = targetRange.getValue();
      console.log("D2 after write:", newValue);

      console.log("=== CLASS BONUS UPDATE SUCCESSFUL (ADD) ===");
      return createJsonResponse({
        success: true,
        message: "בונוס כיתתי עודכן בהצלחה (נוסף לבונוס הקיים)",
        grade: studentGrade,
        bonusAdded: bonusToAdd,
        previousBonus: currentBonus,
        totalBonus: newTotalBonus,
        sheetName: sheet.getName(),
        targetCell: "D" + targetRow
      });
    }

    // עדכון ניקוד תלמיד — הניקוד נכתב לעמודה C (מהאתר לקובץ)
    var studentName = data.name ? data.name.toString().trim() : '';
    var studentGrade = data.grade ? data.grade.toString().trim() : '';
    var pointsToAdd = parseInt(data.points) || 0;

    console.log("Student: '" + studentName + "', Grade: '" + studentGrade + "', Points: " + pointsToAdd);

    // בדוק שכל הנתונים קיימים
    if (!studentName || !studentGrade || isNaN(pointsToAdd)) {
      console.log("ERROR: Missing required fields");
      return createJsonResponse({
        success: false,
        error: "חסרים נתונים נדרשים: שם, כיתה, או נקודות"
      });
    }

    // קבל את הגיליון
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      console.log("ERROR: Could not access spreadsheet");
      return createJsonResponse({
        success: false,
        error: "לא ניתן לגשת לגיליון"
      });
    }

    console.log("Spreadsheet accessed successfully");

    // חפש את הגיליון של הכיתה
    var sheet = findGradeSheet(spreadsheet, studentGrade);
    if (!sheet) {
      console.log("ERROR: Sheet not found for grade: " + studentGrade);
      return createJsonResponse({
        success: false,
        error: "לא נמצא גיליון לכיתה: " + studentGrade
      });
    }

    console.log("Found sheet: " + sheet.getName());

    // קבל את כל הנתונים מהגיליון
    var allData = sheet.getDataRange().getValues();
    if (allData.length < 2) {
      console.log("ERROR: Sheet has insufficient data");
      return createJsonResponse({
        success: false,
        error: "אין מספיק נתונים בגיליון"
      });
    }

    console.log("Sheet has " + allData.length + " rows");

    // לפי המבנה שתיארת: שמות בעמודה B (אינדקס 1), ניקוד בעמודה C (אינדקס 2)
    // מתחיל משורה 4 (אינדקס 3 במערך)
    var nameColumnIndex = 1; // עמודה B
    var scoreColumnIndex = 2; // עמודה C
    var dataStartRow = 3; // שורה 4 (אינדקס 3 במערך)

    console.log("Using fixed columns - Name: column " + (nameColumnIndex + 1) + ", Score: column " + (scoreColumnIndex + 1));

    // חפש את התלמיד החל משורה 4
    var studentInfo = findStudent(allData, nameColumnIndex, scoreColumnIndex, dataStartRow, studentName);
    if (!studentInfo.found) {
      console.log("ERROR: Student not found. Tried variations:", studentInfo.triedNames);
      return createJsonResponse({
        success: false,
        error: "תלמיד לא נמצא: " + studentName,
        triedNames: studentInfo.triedNames,
        availableStudents: studentInfo.availableStudents
      });
    }

    console.log("Found student at row " + studentInfo.rowIndex);

    // עדכן את הניקוד
    var currentScore = parseFloat(allData[studentInfo.rowIndex][scoreColumnIndex]) || 0;
    var newScore = currentScore + pointsToAdd;

    console.log("Updating score: " + currentScore + " + " + pointsToAdd + " = " + newScore);

    // עדכן את התא
    sheet.getRange(studentInfo.rowIndex + 1, scoreColumnIndex + 1).setValue(newScore);
    SpreadsheetApp.flush();

    console.log("=== UPDATE SUCCESSFUL ===");

    return createJsonResponse({
      success: true,
      message: "עודכן בהצלחה",
      student: studentName,
      grade: studentGrade,
      oldScore: currentScore,
      newScore: newScore,
      pointsAdded: pointsToAdd
    });

  } catch (error) {
    console.log("=== UNEXPECTED ERROR ===");
    console.error("Error:", error);
    return createJsonResponse({
      success: false,
      error: "שגיאה לא צפויה: " + error.message
    });
  }
}

function doGet(e) {
  try {
    console.log("=== GET REQUEST STARTED ===");

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      console.log("ERROR: Could not access spreadsheet");
      return createJsonResponse({
        students: [],
        classBonuses: {}
      });
    }

    var allSheets = spreadsheet.getSheets();
    var allStudents = [];
    var classBonuses = {};
    var classProgress = {}; // לכל כיתה: sugiotCounts, kartisiotCounts, studentCount, autoBonus

    console.log("Processing " + allSheets.length + " sheets");

    for (var i = 0; i < allSheets.length; i++) {
      var sheet = allSheets[i];
      var sheetName = sheet.getName();
      console.log("Processing sheet: " + sheetName);

      // קרא את הנתונים מהגיליון — רק עמודות A–D (כותרות, בונוס ב-D2, שם ב-B, ניקוד ב-C)
      var lastRow = Math.max(sheet.getLastRow(), 2);
      var lastCol = Math.max(Math.min(sheet.getLastColumn(), 4), 3);
      var sheetData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      console.log("[doGet] Sheet: " + sheetName + ", Reading range: rows 1-" + lastRow + ", cols 1-" + lastCol);

      if (sheetData.length < 2) {
        console.log("Skipping sheet " + sheetName + " - no data");
        continue;
      }

      // ============================================
      // קריאת בונוס כיתתי מ-D2 בלבד - רק הערך הזה!
      // D2 = שורה 2, עמודה D
      // ============================================
      var classBonus = 0;
      
      // קריאה ישירה מ-D2 - זה הכי אמין
      // חשוב: רק הערך מ-D2, ללא שום חישוב או הוספה
      try {
        var directD2Value = sheet.getRange(2, 4).getValue(); // שורה 2, עמודה D
        console.log("[doGet] Sheet: " + sheetName + ", D2 direct read (getRange(2,4)): " + directD2Value + " (type: " + typeof directD2Value + ")");
        
        if (directD2Value !== null && directD2Value !== undefined && directD2Value !== "") {
          var parsedValue = parseFloat(directD2Value);
          if (!isNaN(parsedValue)) {
            classBonus = parsedValue; // רק הערך מ-D2, ללא שום שינוי
            console.log("[doGet] Sheet: " + sheetName + ", D2 parsed to classBonus: " + classBonus);
          } else {
            console.log("[doGet] Sheet: " + sheetName + ", D2 is not a number: " + directD2Value);
            classBonus = 0;
          }
        } else {
          console.log("[doGet] Sheet: " + sheetName + ", D2 is empty/null/undefined, setting classBonus to 0");
          classBonus = 0;
        }
      } catch (error) {
        console.log("[doGet] Sheet: " + sheetName + ", Error reading D2: " + error.message);
        classBonus = 0;
      }
      
      // בדיקה נוספת - קרא שוב כדי לוודא
      var verifyD2 = sheet.getRange(2, 4).getValue();
      if (verifyD2 !== classBonus) {
        console.log("[doGet] WARNING: Sheet " + sheetName + " - D2 verification failed! First read: " + classBonus + ", Second read: " + verifyD2);
        var verifyParsed = parseFloat(verifyD2);
        if (!isNaN(verifyParsed)) {
          classBonus = verifyParsed;
          console.log("[doGet] Sheet: " + sheetName + ", Using verified value: " + classBonus);
        }
      }

      // ============================================
      // חשוב: הבונוס הכיתתי (classBonus) כבר נקרא מ-D2 למעלה
      // לא מוסיפים שום חישוב או בונוס נוסף!
      // ============================================
      
      var nameColumnIndex = 1;
      var scoreColumnIndex = 2;
      var dataStartRow = 3;
      var studentCount = 0;

      for (var row = dataStartRow; row < sheetData.length; row++) {
        var studentName = sheetData[row][nameColumnIndex];
        var studentScore = sheetData[row][scoreColumnIndex];

        if (studentName && studentName.toString().trim()) {
          studentCount++;
          var parsedScore = parseFloat(studentScore) || 0;
          allStudents.push({
            id: 'sheet_' + sheetName + '_row_' + row,
            name: studentName.toString().trim(),
            grade: sheetName,
            score: parsedScore
          });
        }
      }

      classBonuses[sheetName] = classBonus;
      console.log("[doGet] Sheet: " + sheetName + ", classBonuses from D2: " + classBonus);

      classProgress[sheetName] = {
        grade: sheetName,
        studentCount: studentCount
      };
    }

    console.log("Returning " + allStudents.length + " students");
    console.log("=== FINAL classBonuses object (from D2 ONLY, NO CALCULATION) ===");
    for (var gradeName in classBonuses) {
      console.log("  " + gradeName + ": " + classBonuses[gradeName] + " (from D2)");
    }
    console.log("Full classBonuses:", JSON.stringify(classBonuses));
    // חשוב: מחזירים רק את classBonuses מ-D2, ללא שום חישוב נוסף
    return createJsonResponse({
      students: allStudents,
      classBonuses: classBonuses,
      classProgress: classProgress
    });

  } catch (error) {
    console.error("Error in doGet:", error);
    return createJsonResponse({
      students: [],
      classBonuses: {}
    });
  }
}

// =====================================================
// פונקציות עזר
// =====================================================

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function findGradeSheet(spreadsheet, grade) {
  // נסה שמות שונים לכיתה
  var possibleNames = [
    grade,
    grade.replace('יי', 'י"י'),
    grade.replace('י', 'י"'),
    'כיתה ' + grade,
    grade.replace('יי', 'יב'),
    grade.replace('י', 'יא'),
    // הוסף וריאציות נוספות
    grade.replace('1ה', 'ח1'),
    grade.replace('ח1', '1ה'),
    grade.replace('2ה', 'ח2'),
    grade.replace('ח2', '2ה'),
    grade.replace('3ה', 'ח3'),
    grade.replace('ח3', '3ה'),
    grade.replace('4ה', 'ח4'),
    grade.replace('ח4', '4ה'),
    grade.replace('5ה', 'ח5'),
    grade.replace('ח5', '5ה'),
    'כיתה ' + grade.replace('1ה', 'ח1'),
    'כיתה ' + grade.replace('2ה', 'ח2'),
    'כיתה ' + grade.replace('3ה', 'ח3'),
    'כיתה ' + grade.replace('4ה', 'ח4'),
    'כיתה ' + grade.replace('5ה', 'ח5')
  ];

  console.log("Searching for sheet with grade: '" + grade + "'");
  console.log("Trying " + possibleNames.length + " possible names");

  // First try exact matches
  for (var i = 0; i < possibleNames.length; i++) {
    var sheet = spreadsheet.getSheetByName(possibleNames[i]);
    if (sheet) {
      console.log("Found sheet with exact name: '" + possibleNames[i] + "'");
      return sheet;
    }
  }

  // If not found, try partial matches
  console.log("Sheet not found with exact match, searching all sheets for partial match...");
  var allSheets = spreadsheet.getSheets();
  var normalizedGrade = grade.toLowerCase().replace(/\s+/g, '');
  
  for (var j = 0; j < allSheets.length; j++) {
    var sheetName = allSheets[j].getName();
    var normalizedSheetName = sheetName.toLowerCase().replace(/\s+/g, '');
    
    // בדוק אם שם הגיליון מכיל את שם הכיתה או להיפך
    if (normalizedSheetName === normalizedGrade || 
        normalizedSheetName.indexOf(normalizedGrade) !== -1 || 
        normalizedGrade.indexOf(normalizedSheetName) !== -1 ||
        // בדוק גם אם יש התאמה חלקית (למשל "1n" מתאים ל"1נ")
        (normalizedGrade.length >= 2 && normalizedSheetName.length >= 2 && 
         normalizedGrade.charAt(0) === normalizedSheetName.charAt(0) && 
         normalizedGrade.charAt(normalizedGrade.length - 1) === normalizedSheetName.charAt(normalizedSheetName.length - 1))) {
      console.log("Found similar sheet: '" + sheetName + "' (searched for: '" + grade + "')");
      return allSheets[j];
    }
  }

  console.log("Sheet not found for grade: '" + grade + "'");
  console.log("Available sheets:", allSheets.map(function(s) { return s.getName(); }).join(", "));
  return null;
}

function findColumns(headers) {
  var nameIndex = -1;
  var scoreIndex = -1;

  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().toLowerCase();

    if (header.includes('שם') && nameIndex === -1) {
      nameIndex = i;
    }

    if ((header.includes('ניקוד') || header.includes('score') || header.includes('ציון')) && scoreIndex === -1) {
      scoreIndex = i;
    }
  }

  return {
    nameIndex: nameIndex,
    scoreIndex: scoreIndex
  };
}

function findStudent(allData, nameColumnIndex, scoreColumnIndex, dataStartRow, searchName) {
  var trimmedSearchName = searchName.trim();
  var triedNames = [trimmedSearchName];
  var availableStudents = [];

  // צור וריאציות של השם
  if (trimmedSearchName.indexOf(' ') !== -1) {
    var nameParts = trimmedSearchName.split(' ');
    if (nameParts.length === 2) {
      // הפוך שם פרטי ומשפחה
      triedNames.push(nameParts[1] + ' ' + nameParts[0]);
      // נסה גם עם מקף
      triedNames.push(nameParts[0] + '-' + nameParts[1]);
      triedNames.push(nameParts[1] + '-' + nameParts[0]);
    }
  }

  console.log("Trying name variations:", triedNames);

  // חפש החל מהשורה שצוינה (שורה 4 = אינדקס 3)
  for (var row = dataStartRow; row < allData.length; row++) {
    var sheetStudentName = allData[row][nameColumnIndex];

    if (sheetStudentName) {
      var trimmedSheetName = sheetStudentName.toString().trim();

      // אסוף שמות זמינים לדיבוג
      if (availableStudents.length < 20) {
        availableStudents.push(trimmedSheetName);
      }

      // בדוק אם אחד מהשמות מתאים
      for (var i = 0; i < triedNames.length; i++) {
        if (trimmedSheetName === triedNames[i]) {
          console.log("Found match: '" + trimmedSheetName + "' with variation '" + triedNames[i] + "' at row " + (row + 1));
          return {
            found: true,
            rowIndex: row,
            triedNames: triedNames,
            availableStudents: availableStudents
          };
        }
      }
    }
  }

  return {
    found: false,
    rowIndex: -1,
    triedNames: triedNames,
    availableStudents: availableStudents
  };
}

/** מפרק תא (מחרוזת או מספר) לרשימת מספרים בטווח minNum..maxNum, ללא כפילות */
function parseCommaSeparatedNumbers(cellValue, minNum, maxNum) {
  var out = [];
  if (cellValue === undefined || cellValue === null) return out;
  var str = cellValue.toString().trim();
  if (!str) return out;
  var parts = str.split(/[\s,]+/);
  var seen = {};
  for (var p = 0; p < parts.length; p++) {
    var num = parseInt(parts[p], 10);
    if (!isNaN(num) && num >= minNum && num <= maxNum && !seen[num]) {
      seen[num] = true;
      out.push(num);
    }
  }
  return out;
}

/** ממיר למערך מספרים בטווח, ללא כפילות */
function ensureNumberArray(arr, minNum, maxNum) {
  var out = [];
  if (!arr || !Array.isArray(arr)) return out;
  var seen = {};
  for (var i = 0; i < arr.length; i++) {
    var num = parseInt(arr[i], 10);
    if (!isNaN(num) && num >= minNum && num <= maxNum && !seen[num]) {
      seen[num] = true;
      out.push(num);
    }
  }
  return out;
}