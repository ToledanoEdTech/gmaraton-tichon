import { Student } from './types';

// Password for admin actions
export const ADMIN_PASSWORD = "zvia123";

// ---------------------------------------------------------
// Google Apps Script Web App URL
// ---------------------------------------------------------
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz89WP-K6IiCD72k8plcYdBz9DQcjkP76vGgNq5bhW1FyglIf0qMXFmHF4AhX9TBAY1/exec"; 

// Initial Mock Data is empty now. Data comes from Google Sheets.
export const INITIAL_STUDENTS: Student[] = [];

// --- סוגיות וכרטיסיות ---
export const TOTAL_SUGIOT = 35;
export const TOTAL_KARTISIOT = 11;
export const POINTS_PER_SUGIA = 10;
export const POINTS_PER_KARTISIA = 10;
/** בונוס לכיתה כשכל התלמידים מסיימים סוגיה או כרטיסייה */
export const BONUS_FOR_FULL_CLASS_COMPLETION = 300;
