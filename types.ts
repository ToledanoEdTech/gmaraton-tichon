// ClassGrade is now just a string to allow flexibility with Google Sheet tab names
export type ClassGrade = string;

/** רשימת מספרי סוגיות שהתלמיד השלים (1..35). כל סוגיה = 10 נקודות. סדר חופשי. */
export type SugiotCompleted = number[];
/** רשימת מספרי כרטיסיות שהתלמיד השלים (1..11). כל כרטיסייה = 10 נקודות. */
export type KartisiotCompleted = number[];

export interface Student {
  id: string;
  name: string;
  grade: ClassGrade;
  score: number;
  /** אילו סוגיות סיים (מספרים 1..35) — ללא כפילות */
  sugiotCompleted?: number[];
  /** אילו כרטיסיות סיים (מספרים 1..11) — ללא כפילות */
  kartisiotCompleted?: number[];
  /** לשמירת תאימות: מספר סוגיות (אורך sugiotCompleted) */
  sugiot?: number;
  /** לשמירת תאימות: מספר כרטיסיות (אורך kartisiotCompleted) */
  kartisiot?: number;
}

/** לכל כיתה: כמה תלמידים סיימו כל סוגיה (אינדקס 0 = סוגיה 1) וכל כרטיסייה */
export interface ClassProgress {
  grade: ClassGrade;
  studentCount: number;
  /** לכל סוגיה 1..35: כמה תלמידים סיימו לפחות את הסוגיה הזו */
  sugiotCounts: number[];
  /** לכל כרטיסייה 1..11: כמה תלמידים סיימו לפחות את הכרטיסייה הזו */
  kartisiotCounts: number[];
  /** בונוס אוטומטי (300 לכל סוגיה/כרטיסייה שכל הכיתה סיימה) */
  autoBonus: number;
}

export interface ClassSummary {
  grade: ClassGrade;
  totalScore: number;
  studentCount: number;
  classBonus?: number; // בונוס כיתתי נוסף
}

export interface HistoryEntry {
  timestamp: number;
  studentName: string;
  reason: 'dropped_out_of_top10' | 'added_points';
  details?: string;
}
