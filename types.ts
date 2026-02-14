// ClassGrade is now just a string to allow flexibility with Google Sheet tab names
export type ClassGrade = string;

export interface Student {
  id: string;
  name: string;
  grade: ClassGrade;
  score: number;
}

export interface ClassProgress {
  grade: ClassGrade;
  studentCount: number;
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
