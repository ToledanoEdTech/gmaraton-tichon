import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Student, 
  HistoryEntry 
} from './types';
import { 
  fetchStudentsFromSheet,
  updateStudentScoreInSheet, 
  calculateClassSummaries, 
  getTopStudents,
  exportToCSV,
  saveHistory,
  getStoredHistory
} from './services/dataManager';
import { GOOGLE_SCRIPT_URL } from './constants';
import { ClassCard } from './components/ClassCard';
import { Leaderboard } from './components/Leaderboard';
import { AdminModal } from './components/AdminModal';
import { HistoryModal } from './components/HistoryModal';
import { ClassDetailModal } from './components/ClassDetailModal';
import { Top150Modal } from './components/Top150Modal';
import { Search, Lock, TrendingUp, Sparkles, RefreshCw, AlertCircle, BookOpen, X, Trophy } from 'lucide-react';

// תמונות רקע ל-header — פרוסות לרוחב כל הפס (כל תמונה = פס רקע). להוספה: שים ב-public/ והוסף לרשימה
const HEADER_BG_IMAGES: string[] = [
  'yeshiva-side.jpg',
  'header-2.jpg',
  'header-1.jpg',
  'header-3.jpg',
  'header-4.jpg',
  'header-5.jpg',
];

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Modals state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTop150Open, setIsTop150Open] = useState(false);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<string | null>(null);
  

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [yeshivaImageError, setYeshivaImageError] = useState(false);
  const [headerImageErrors, setHeaderImageErrors] = useState<Record<string, boolean>>({});
  const studentsLengthRef = useRef(0);
  useEffect(() => { studentsLengthRef.current = students.length; }, [students]);

  const loadData = async (
    forceRefresh = false,
    options: { keepCurrentIfEmpty?: boolean; silent?: boolean } = {}
  ) => {
    const { keepCurrentIfEmpty = false, silent = false } = options;
    if (!silent) setIsLoading(true);
    setErrorMsg("");

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
      if (!silent) setIsLoading(false);
      return;
    }

    try {
      const data = await fetchStudentsFromSheet(forceRefresh);
      if (keepCurrentIfEmpty && forceRefresh && data.length === 0 && studentsLengthRef.current > 0) {
        return;
      }
      setStudents(data);
    } catch (e) {
      if (!keepCurrentIfEmpty) setErrorMsg("שגיאה בטעינת הנתונים. אנא בדוק את החיבור לאינטרנט.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };


  // Initialize Data
  useEffect(() => {
    setHistory(getStoredHistory());
    loadData();
    
    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);


  // Calculate derived states
  const classSummaries = useMemo(() => calculateClassSummaries(students), [students]);
  const top10 = useMemo(() => getTopStudents(students, 10), [students]);

  // Handle adding points
  const handleAddPoints = async (studentId: string, points: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Optimistic Update (Immediate UI update)
    const oldStudents = [...students];
    const oldTop10Ids = getTopStudents(oldStudents, 10).map(s => s.id);
    
    // Create optimistic new state
    const newStudents = students.map(s => 
        s.id === studentId ? { ...s, score: s.score + points } : s
    );
    setStudents(newStudents); // Update UI immediately

    // Send to Google Sheet
    const success = await updateStudentScoreInSheet(student, points);

    if (!success) {
      // Revert if failed
      alert("שגיאה בעדכון הנתונים בגוגל שיטס. הנתונים לא נשמרו.");
      setStudents(oldStudents);
      return;
    }

    // If success, verify History logic based on the new optimistic state
    const newTop10Ids = getTopStudents(newStudents, 10).map(s => s.id);
    const newHistory = [...history];
    
    oldTop10Ids.forEach(id => {
        if (!newTop10Ids.includes(id)) {
           const dropout = oldStudents.find(s => s.id === id);
           if (dropout) {
             newHistory.unshift({
               timestamp: Date.now(),
               studentName: dropout.name,
               reason: 'dropped_out_of_top10',
               details: `Dropped from rank`
             });
           }
        }
    });

    saveHistory(newHistory);
    setHistory(newHistory);
  };

  // Handle adding points to multiple students
  const handleAddPointsToMultiple = async (studentIds: string[], points: number) => {
    if (studentIds.length === 0) return;

    // Optimistic Update (Immediate UI update)
    const oldStudents = [...students];
    const oldTop10Ids = getTopStudents(oldStudents, 10).map(s => s.id);
    
    // Create optimistic new state
    const newStudents = students.map(s => 
        studentIds.includes(s.id) ? { ...s, score: s.score + points } : s
    );
    setStudents(newStudents); // Update UI immediately

    // Send to Google Sheet for each student
    const updatePromises = studentIds.map(async (studentId) => {
      const student = oldStudents.find(s => s.id === studentId);
      if (!student) return false;
      return await updateStudentScoreInSheet(student, points);
    });

    const results = await Promise.all(updatePromises);
    const allSuccess = results.every(r => r === true);

    if (!allSuccess) {
      // Revert if any failed
      alert("שגיאה בעדכון הנתונים בגוגל שיטס. חלק מהעדכונים לא נשמרו.");
      setStudents(oldStudents);
      return;
    }

    // If success, verify History logic based on the new optimistic state
    const newTop10Ids = getTopStudents(newStudents, 10).map(s => s.id);
    const newHistory = [...history];
    
    oldTop10Ids.forEach(id => {
        if (!newTop10Ids.includes(id)) {
           const dropout = oldStudents.find(s => s.id === id);
           if (dropout) {
             newHistory.unshift({
               timestamp: Date.now(),
               studentName: dropout.name,
               reason: 'dropped_out_of_top10',
               details: `Dropped from rank`
             });
           }
        }
    });

    saveHistory(newHistory);
    setHistory(newHistory);
  };

  // Search Logic
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 0) {
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(q.toLowerCase()) || 
        s.grade.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setSearchResults(filtered);
      if (filtered.length === 1 && filtered[0].name.toLowerCase() === q.toLowerCase()) {
        setSelectedStudent(filtered[0]);
      } else {
        setSelectedStudent(null);
      }
    } else {
      setSearchResults([]);
      setSelectedStudent(null);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Missing Configuration State
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
              <div className="max-w-md bg-slate-800 p-8 rounded-xl border border-red-500 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">הגדרת מערכת נדרשת</h1>
                  <p className="text-slate-300 mb-4">
                      כדי להפעיל את המערכת, עליך ליצור סקריפט בגוגל שיטס ולהדביק את ה-URL בקובץ <code className="bg-slate-900 px-2 py-1 rounded text-amber-500">constants.ts</code>.
                  </p>
                  <p className="text-sm text-slate-400">הוראות מלאות מופיעות בצ'אט.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="relative min-h-screen bg-slate-900 flex flex-col font-sans text-white overflow-x-hidden selection:bg-amber-500/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
         {/* Base dark gradient */}
         <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#0f172a] to-[#0a0f1c]"></div>
         
         {/* Animated blobs for atmosphere */}
         <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-32 left-20 w-96 h-96 bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

         {/* Texture Overlay */}
         <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      </div>

      {/* Loading Overlay */}
      {isLoading && students.length === 0 && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white">
              <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl bg-amber-500/30 animate-pulse"></div>
                  <RefreshCw className="w-16 h-16 animate-spin text-amber-500 relative z-10" />
              </div>
              <p className="text-2xl font-bold animate-pulse mt-6 text-amber-100">טוען נתונים מהגמרתון...</p>
          </div>
      )}

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col p-3 md:p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full">
        
        {/* Header — רקע: 6 תמונות פרוסות לרוחב כל הפס, מעליהן לוגו וכפתורים */}
        <header className="relative mb-10 rounded-3xl overflow-hidden shadow-2xl border border-white/10 h-[200px] md:h-[240px] lg:h-[280px] bg-slate-900">
          {/* שכבת רקע — כל תמונה תופסת חלק שווה, במסגרת עדינה */}
          <div className="absolute inset-0 z-0 flex flex-row p-[3px] gap-[2px] md:p-1 md:gap-1">
            {HEADER_BG_IMAGES.map((src) => (
              <div key={src} className="flex-1 min-w-0 h-full overflow-hidden rounded-sm md:rounded border border-white/20 bg-slate-800 shadow-inner">
                {!headerImageErrors[src] ? (
                  <img
                    src={`/${src}`}
                    alt=""
                    className="w-full h-full object-cover object-center"
                    onError={() => setHeaderImageErrors((prev) => ({ ...prev, [src]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <BookOpen className="w-10 h-10 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* כיסוי כהה עדין — כדי שהטקסט יקרא */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/75 via-black/50 to-black/75 pointer-events-none" />
          {/* תוכן מעל הרקע: לוגו למעלה במרכז, כפתורים למטה צמוד לשמאל */}
          <div className="absolute inset-0 z-[2] flex flex-col p-4 md:p-6">
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-amber-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity rounded-2xl" />
                  <div className={`relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform flex items-center justify-center shadow-2xl shadow-amber-500/30 ring-2 ring-white/20 border-2 border-amber-300/50 overflow-hidden ${logoError ? 'bg-gradient-to-br from-amber-400 to-yellow-600' : 'bg-white'}`}>
                    {logoError ? (
                      <BookOpen className="text-slate-900 w-8 h-8 md:w-12 md:h-12" />
                    ) : (
                      <img
                        src="/logo.png"
                        alt="לוגו ישיבת צביה אלישיב לוד"
                        className="w-[90%] h-[90%] object-contain"
                        onError={() => setLogoError(true)}
                      />
                    )}
                  </div>
                </div>
                <div className="min-w-0 text-center md:text-right">
                  <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-2xl mb-0.5">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">מבצע הגמרתון</span>
                  </h1>
                  <p className="text-slate-200 text-xs md:text-sm lg:text-base font-light flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <span className="font-medium">ישיבת צביה אלישיב לוד</span>
                    <span className="text-amber-300 font-semibold italic">מגדילים תורה בשמחה</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5 md:gap-3 pt-2">
              <button onClick={loadData} className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white p-2 md:p-4 rounded-lg md:rounded-xl hover:text-amber-300 transition-all border border-white/25 shadow-lg" title="רענן נתונים">
                <RefreshCw className={`w-5 h-5 md:w-7 md:h-7 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setIsTop150Open(true)} className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-amber-300 border border-white/25 px-2.5 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2.5 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-xs md:text-base font-bold">
                <Trophy className="w-4 h-4 md:w-6 md:h-6 flex-shrink-0" /> <span className="whitespace-nowrap">150 המובילים</span>
              </button>
              <button onClick={() => setIsHistoryOpen(true)} className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-amber-300 border border-white/25 px-2.5 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2.5 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-xs md:text-base font-bold">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 flex-shrink-0" /> <span className="whitespace-nowrap">היסטוריה</span>
              </button>
              <button onClick={() => setIsAdminOpen(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 px-2.5 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2.5 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-xs md:text-base font-bold">
                <Lock className="w-4 h-4 md:w-6 md:h-6 flex-shrink-0" /> <span className="whitespace-nowrap">עדכון ניקוד</span>
              </button>
            </div>
          </div>
        </header>

        {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl mb-8 text-center flex items-center justify-center gap-2 animate-pulse">
                <AlertCircle className="w-5 h-5" />
                {errorMsg}
            </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Classes and Search (8 cols) - SCROLLABLE */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Search Bar Container */}
            <div className="relative">
              {/* Search Bar */}
              <div className="bg-slate-800/60 backdrop-blur-md p-2 rounded-3xl border border-slate-700/50 flex flex-col relative group focus-within:ring-2 focus-within:ring-amber-500/50 transition-all shadow-xl">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Search className="text-amber-500 w-6 h-6 md:w-8 md:h-8 opacity-70 group-focus-within:opacity-100 transition-opacity" />
                  <input
                    type="text"
                    placeholder="חפש תלמיד לבדיקת ניקוד אישי..."
                    className="bg-transparent w-full text-white text-base md:text-lg lg:text-xl placeholder-slate-500 outline-none font-medium"
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  />
                </div>
              </div>

              {/* Search Results Dropdown - Fixed position above class rankings */}
              {isSearchFocused && searchQuery.length > 0 && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl z-[10000] max-h-96 overflow-y-auto">
                  <div className="p-2">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-right p-4 hover:bg-slate-800/80 rounded-xl transition-all flex items-center justify-between group/item"
                      >
                        <div className="text-left">
                          <span className="text-2xl font-black text-amber-500">{student.score.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 block">נקודות</span>
                        </div>
                        <div className="flex-1 text-right mr-4">
                          <h3 className="text-xl font-bold text-white group-hover/item:text-amber-400 transition-colors">{student.name}</h3>
                          <p className="text-slate-400 text-base">{student.grade}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Student Details - Fixed position above class rankings */}
              {selectedStudent && searchResults.length === 0 && (
                 <div className="absolute top-full mt-4 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-8 shadow-2xl z-[10000] animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/30">
                                <Sparkles className="w-8 h-8" />
                           </div>
                           <div>
                               <h3 className="text-3xl font-black text-white mb-1">{selectedStudent.name}</h3>
                               <p className="text-slate-400 text-xl font-medium">{selectedStudent.grade}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="block text-6xl font-black text-amber-500 drop-shadow-lg tracking-tighter">{selectedStudent.score.toLocaleString()}</span>
                           <span className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">נקודות</span>
                        </div>
                    </div>
                 </div>
              )}
            </div>

            {/* Class Stats Grid */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 md:px-2">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-100 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-amber-500" />
                        דירוג הכיתות
                    </h2>
                </div>
                
                {students.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-10 pt-4">
                    {classSummaries.map((summary, index) => (
                        <ClassCard 
                            key={summary.grade} 
                            data={summary} 
                            rank={index} 
                            onClick={() => setSelectedClassForDetail(summary.grade)}
                        />
                    ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-24 border-2 border-slate-800/50 border-dashed rounded-3xl bg-slate-800/10">
                        <p className="text-xl font-bold text-slate-300">לא נמצאו נתונים להצגה</p>
                        <p className="text-base mt-2 max-w-md mx-auto opacity-70">
                            ממתין לנתונים מהגמרתון...
                        </p>
                        <button onClick={loadData} className="mt-6 text-amber-500 underline hover:text-amber-400 font-medium">נסה לטעון שוב</button>
                    </div>
                )}
            </div>

            {/* Motivation Banner */}
            <div className="mt-8 md:mt-12 bg-gradient-to-r from-amber-900/40 via-slate-800/60 to-amber-900/40 border border-amber-500/20 rounded-3xl p-6 md:p-8 lg:p-10 text-center relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
              <div className="absolute -left-10 top-0 opacity-10 rotate-12">
                  <BookOpen className="w-40 h-40" />
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-amber-400 mb-4 drop-shadow-md tracking-tight">"כי הם חיינו ואורך ימינו"</h3>
              <p className="text-slate-200 text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed font-light">
                  כל דקה של לימוד מוסיפה אור לעולם! המשיכו לצבור נקודות, לחזק את הכיתה ולהגדיל תורה בישיבה.
              </p>
            </div>

          </div>

          {/* Right Column: Leaderboard (4 cols) - STICKY */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit transition-all duration-500">
             <Leaderboard students={top10} />
             
             {/* Small Footer in sidebar */}
             <div className="mt-6 text-center text-slate-600 text-xs">
                 <p>© ישיבת צביה אלישיב לוד | תשפ"ו</p>
                 <p className="mt-1">נוצר ע"י יוסף טולידנו</p>
             </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      <AdminModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        students={students}
        onAddPoints={handleAddPoints}
        onAddPointsToMultiple={handleAddPointsToMultiple}
        onExport={() => exportToCSV(students)}
        onClassBonusUpdated={async () => { await loadData(true, { keepCurrentIfEmpty: true, silent: true }); }}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />

      <ClassDetailModal
        isOpen={!!selectedClassForDetail}
        onClose={() => setSelectedClassForDetail(null)}
        classNameStr={selectedClassForDetail || ""}
        students={students}
      />

      <Top150Modal
        isOpen={isTop150Open}
        onClose={() => setIsTop150Open(false)}
        students={students}
      />

    </div>
  );
};

export default App;