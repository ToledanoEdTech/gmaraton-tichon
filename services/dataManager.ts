import { Student, ClassSummary, HistoryEntry, ClassProgress } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

const HISTORY_KEY = 'gemarathon_history_v1';

let classBonusesCache: Record<string, number> = {};
let classProgressCache: Record<string, ClassProgress> = {};

export const fetchStudentsFromSheet = async (forceRefresh = false): Promise<Student[]> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    console.warn("Google Script URL is not configured.");
    return [];
  }

  // הוסף timestamp כדי למנוע cache, אבל בלי headers שגורמים ל-preflight
  const url = forceRefresh
    ? GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now()
    : GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();

  try {
    // חשוב: לא להוסיף headers מורכבים כדי למנוע preflight CORS
    const response = await fetch(url, {
      cache: forceRefresh ? 'no-store' : 'default'
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log("Raw data from sheet:", data); // Debug log
    
    // Handle both old format (array) and new format (object with students and classBonuses)
    let studentsArray: any[] = [];
    if (Array.isArray(data)) {
      studentsArray = data;
      classBonusesCache = {};
      classProgressCache = {};
    } else if (data.students && Array.isArray(data.students)) {
      studentsArray = data.students;
      // רק מהשרת (מ-D2) - לא חישוב אוטומטי
      // חשוב: מחליפים את ה-cache עם הערכים החדשים מהשרת
      classBonusesCache = {};
      if (data.classBonuses) {
        for (var grade in data.classBonuses) {
          classBonusesCache[grade] = data.classBonuses[grade];
        }
      }
      classProgressCache = data.classProgress || {};
      console.log("[fetchStudentsFromSheet] Class bonuses from server (D2 only):", classBonusesCache);
      console.log("[fetchStudentsFromSheet] Raw classBonuses from response:", JSON.stringify(data.classBonuses));
      console.log("[fetchStudentsFromSheet] VERIFICATION - classBonusesCache contents:");
      for (var gradeKey in classBonusesCache) {
        console.log("  " + gradeKey + ": " + classBonusesCache[gradeKey] + " (from D2, no calculation)");
      }
    } else {
      return [];
    }
    
    // Relaxed filtering:
    // 1. We map first to handle data cleaning
    // 2. We allow students with 0 score or invalid score (defaulting to 0) to ensure names appear
    return studentsArray
      .map((s: any) => {
         // Must have a name
         if (!s.name || s.name.toString().trim() === '') return null;
         
         // safe score parsing — ניקוד רק מהקובץ (גוגל שיטס)
         let parsedScore = Number(s.score);
         if (isNaN(parsedScore)) {
            console.warn(`Invalid score for student ${s.name}: ${s.score}. Defaulting to 0.`);
            parsedScore = 0;
         }
         return {
            id: s.id || `temp_${Math.random().toString(36).substr(2, 9)}`,
            name: s.name.toString().trim(),
            grade: s.grade || 'Unknown',
            score: parsedScore
         };
      })
      .filter((s: any) => s !== null) as Student[];
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return [];
  }
};

export const getClassBonuses = (): Record<string, number> => {
  return classBonusesCache;
};

export const getClassProgress = (): Record<string, ClassProgress> => {
  return classProgressCache;
};

/** מחשב התקדמות כיתתית מתוך רשימת התלמידים (למקרה שאין מהשרת) */
export const computeClassProgressFromStudents = (students: Student[]): Record<string, ClassProgress> => {
  const byGrade = new Map<string, Student[]>();
  students.forEach(s => {
    const list = byGrade.get(s.grade) || [];
    list.push(s);
    byGrade.set(s.grade, list);
  });
  const result: Record<string, ClassProgress> = {};
  byGrade.forEach((list, grade) => {
    result[grade] = { grade, studentCount: list.length };
  });
  return result;
};

/** מחזיר התקדמות כיתה — מהשרת או מחושב מתוך התלמידים */
export const getClassProgressOrComputed = (students: Student[]): Record<string, ClassProgress> => {
  const fromServer = getClassProgress();
  const computed = computeClassProgressFromStudents(students);
  const grades = new Set([...Object.keys(fromServer), ...Object.keys(computed)]);
  const result: Record<string, ClassProgress> = {};
  grades.forEach(grade => {
    result[grade] = fromServer[grade] ?? computed[grade]!;
  });
  return result;
};

export const updateStudentScoreInSheet = async (student: Student, points: number): Promise<boolean> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    alert("Please configure the Google Apps Script URL in constants.ts");
    return false;
  }

  try {
    console.log(`Updating student: "${student.name}" (grade: "${student.grade}") with ${points} points`);

    // We use no-cors or text/plain to avoid complex CORS preflight issues with GAS
    // Note: GAS doPost must handle the request payload accordingly.
    const payload = JSON.stringify({
      name: student.name.trim(),
      grade: student.grade.trim(),
      points: points
    });

    console.log("Sending payload:", payload);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return false;
    }

    // With GAS text/plain, we might receive an opaque response or a JSON text.
    // If we get here without error, we assume success or check response if possible.
    const responseText = await response.text();
    console.log("Raw response text:", responseText);

    try {
      const result = JSON.parse(responseText);
      console.log("Parsed response:", result);

      if (result.success === true) {
        console.log("Update successful:", result.message);
        return true;
      } else {
        console.error("GAS returned error:", result.error);
        if (result.availableStudents) {
          console.log("Available students in sheet:", result.availableStudents);
        }
        if (result.triedNames) {
          console.log("Tried name variations:", result.triedNames);
        }
        return false;
      }
    } catch (parseError) {
      console.warn("Could not parse response as JSON:", parseError);
      // If response contains "success" text, consider it successful
      return responseText.toLowerCase().includes('success');
    }
  } catch (error) {
    console.error("Failed to update score:", error);
    return false;
  }
};

export const getStoredHistory = (): HistoryEntry[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

export const saveHistory = (history: HistoryEntry[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const calculateClassSummaries = (students: Student[]): ClassSummary[] => {
  const map = new Map<string, number>();
  const countMap = new Map<string, number>();
  const grades = new Set<string>();

  students.forEach(s => {
    grades.add(s.grade);
    const currentScore = map.get(s.grade) || 0;
    const currentCount = countMap.get(s.grade) || 0;
    map.set(s.grade, currentScore + s.score);
    countMap.set(s.grade, currentCount + 1);
  });

  // Get class bonuses from cache - רק מהשרת (מ-D2), לא חישוב אוטומטי
  const bonuses = getClassBonuses();
  
  return Array.from(grades).map(grade => {
    const studentScores = map.get(grade) || 0;
    // רק מהשרת (מ-D2) - לא חישוב אוטומטי, לא הוספה, רק מה שיש ב-cache
    const classBonus = bonuses[grade] || 0;
    const totalScore = studentScores + classBonus;
    
    return {
      grade,
      totalScore: totalScore,
      studentCount: countMap.get(grade) || 0,
      classBonus: classBonus > 0 ? classBonus : undefined
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
};

export const getTopStudents = (students: Student[], limit: number = 10): Student[] => {
  return [...students].sort((a, b) => b.score - a.score).slice(0, limit);
};

/** תוצאה: success + totalBonus (הסכום הכולל אחרי ההוספה) מהשרת */
export const updateClassBonusInSheet = async (grade: string, bonus: number): Promise<{ success: boolean; totalBonus?: number }> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    alert("Please configure the Google Apps Script URL in constants.ts");
    return { success: false };
  }

  try {
    console.log(`[Class Bonus] Adding ${bonus} to class bonus for grade: "${grade}"`);

    const payload = JSON.stringify({
      type: 'classBonus',
      grade: grade.trim(),
      bonus: bonus
    });

    console.log("[Class Bonus] Sending payload:", payload);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    console.log("[Class Bonus] Response status:", response.status);
    console.log("[Class Bonus] Response ok:", response.ok);

    if (!response.ok) {
      console.error(`[Class Bonus] HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("[Class Bonus] Error response:", errorText);
      return { success: false };
    }

    const responseText = await response.text();
    console.log("[Class Bonus] Raw response text:", responseText);

    try {
      const result = JSON.parse(responseText);
      console.log("[Class Bonus] Parsed response:", result);

      if (result.success === true) {
        console.log("[Class Bonus] Update successful:", result.message);
        // עדכון cache לפי הסכום הכולל מהשרת — מפתח = שם הגיליון (כמו ב-doGet) כדי שהתצוגה תהיה נכונה
        const newTotal = typeof result.totalBonus === 'number' ? result.totalBonus : (classBonusesCache[grade] || 0) + bonus;
        const sheetKey = result.sheetName || grade;
        classBonusesCache[sheetKey] = newTotal;
        if (sheetKey !== grade) classBonusesCache[grade] = newTotal;
        console.log("[Class Bonus] Cache updated with totalBonus:", newTotal, "keys:", sheetKey, grade, classBonusesCache);
        return { success: true, totalBonus: newTotal };
      } else {
        console.error("[Class Bonus] GAS returned error:", result.error);
        alert(`שגיאה בעדכון הבונוס: ${result.error || 'שגיאה לא ידועה'}`);
        return { success: false };
      }
    } catch (parseError) {
      console.warn("[Class Bonus] Could not parse response as JSON:", parseError);
      console.warn("[Class Bonus] Response text was:", responseText);
      const isSuccess = responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('הצלחה');
      if (!isSuccess) {
        alert(`שגיאה בעדכון הבונוס. תגובה מהשרת: ${responseText.substring(0, 100)}`);
      }
      if (isSuccess) {
        classBonusesCache[grade] = (classBonusesCache[grade] || 0) + bonus;
        return { success: true, totalBonus: classBonusesCache[grade] };
      }
      return { success: false };
    }
  } catch (error) {
    console.error("[Class Bonus] Failed to update class bonus:", error);
    alert(`שגיאה בעדכון הבונוס: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    return { success: false };
  }
};

export const exportToCSV = (students: Student[]) => {
  const headers = ['ID', 'שם התלמיד', 'כיתה', 'ניקוד'];
  const rows = students.map(s => [s.id, s.name, s.grade, s.score]);

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += headers.join(",") + "\r\n";

  rows.forEach(row => {
    csvContent += row.join(",") + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "gemarathon_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Site lock: read from same-origin lock.json (no CORS). To lock/unlock: edit public/lock.json in GitHub and push.
export const getSiteLockStatus = async (): Promise<boolean> => {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/lock.json?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return false;
    const data = await response.json();
    return data.locked === true;
  } catch (error) {
    console.error("Failed to fetch site lock status:", error);
    return false;
  }
};
