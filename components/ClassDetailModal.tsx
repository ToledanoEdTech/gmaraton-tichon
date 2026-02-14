import React, { useMemo } from 'react';
import { Student } from '../types';
import { getClassProgressOrComputed } from '../services/dataManager';
import { TOTAL_SUGIOT, TOTAL_KARTISIOT } from '../constants';
import { X, Trophy, Crown, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classNameStr: string; // "className" is a reserved word in props usually, avoiding confusion
  students: Student[];
}

export const ClassDetailModal: React.FC<Props> = ({ isOpen, onClose, classNameStr, students }) => {
  
  const classStudents = useMemo(() => {
    return students
        .filter(s => s.grade === classNameStr)
        .sort((a, b) => b.score - a.score);
  }, [students, classNameStr]);

  const topStudents = classStudents.slice(0, 5);
  const totalScore = classStudents.reduce((sum, s) => sum + s.score, 0);
  const classProgress = useMemo(() => {
    const map = getClassProgressOrComputed(students);
    return classNameStr ? map[classNameStr] : null;
  }, [classNameStr, students]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 text-center border-b border-slate-700">
          <button 
             onClick={onClose} 
             className="absolute top-4 left-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex justify-center mb-2">
             <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20">
               <Crown className="w-10 h-10 text-amber-500" />
             </div>
          </div>
          
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-1">
            {classNameStr}
          </h2>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            סך הכל ניקוד כיתתי: <span className="text-white font-bold">{totalScore.toLocaleString()}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto bg-slate-900/50">
           <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base md:text-lg font-bold text-white">המובילים בכיתה</h3>
           </div>

           <div className="space-y-3">
             {topStudents.length > 0 ? (
                 topStudents.map((student, index) => {
                    const isFirst = index === 0;
                    const rankColor = index === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 
                                      index === 1 ? 'bg-slate-400/20 text-slate-300 border-slate-400/50' : 
                                      index === 2 ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 
                                      'bg-slate-800 text-slate-500 border-slate-700';
                    
                    return (
                        <div key={student.id} className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-gradient-to-r from-amber-900/20 to-slate-800 border-amber-500/30' : 'bg-slate-800 border-slate-700'} hover:scale-[1.01] transition-transform`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${rankColor}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg flex items-center gap-2">
                                        {student.name}
                                        {isFirst && <Crown className="w-4 h-4 text-amber-400 fill-current" />}
                                    </div>
                                    <div className="text-xs text-slate-400">תלמיד מצטיין</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-amber-500">{student.score.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">נקודות</div>
                            </div>
                        </div>
                    );
                 })
             ) : (
                 <div className="text-center py-8 text-slate-500">
                     עדיין אין נתונים לכיתה זו
                 </div>
             )}
           </div>

           {classStudents.length > 5 && (
               <div className="mt-6 text-center pt-4 border-t border-slate-800">
                   <p className="text-slate-500 text-sm">ועוד {classStudents.length - 5} תלמידים צדיקים...</p>
               </div>
           )}

           {classProgress && classProgress.studentCount > 0 && (
             <div className="mt-6 pt-4 border-t border-slate-800">
               <div className="flex items-center gap-2 mb-3">
                 <BookOpen className="w-5 h-5 text-amber-500" />
                 <h3 className="text-base font-bold text-white">התקדמות כיתה — סוגיות וכרטיסיות</h3>
               </div>
               <p className="text-slate-400 text-xs mb-2">כמה סיימו כל סוגיה/כרטיסייה. השלמת כולה = בונוס 300 נקודות.</p>
               <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/50">
                 <div className="text-xs text-slate-400 p-2 border-b border-slate-700">סוגיות (1–{Math.min(10, TOTAL_SUGIOT)} מוצגות)</div>
                 <div className="flex flex-wrap gap-1 p-2">
                   {classProgress.sugiotCounts.slice(0, 10).map((c, i) => {
                     const total = classProgress.studentCount;
                     const full = total > 0 && c === total;
                     return (
                       <span key={i} className={`px-2 py-0.5 rounded ${full ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`} title={`סוגיה ${i + 1}`}>
                         {i + 1}: {c}/{total}
                       </span>
                     );
                   })}
                   {TOTAL_SUGIOT > 10 && <span className="text-slate-500 px-2">+{TOTAL_SUGIOT - 10} עוד</span>}
                 </div>
                 <div className="text-xs text-slate-400 p-2 border-t border-slate-700">כרטיסיות</div>
                 <div className="flex flex-wrap gap-1 p-2">
                   {classProgress.kartisiotCounts.map((c, i) => {
                     const total = classProgress.studentCount;
                     const full = total > 0 && c === total;
                     return (
                       <span key={i} className={`px-2 py-0.5 rounded ${full ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`} title={`כרטיסייה ${i + 1}`}>
                         {i + 1}: {c}/{total}
                       </span>
                     );
                   })}
                 </div>
                 {classProgress.autoBonus > 0 && (
                   <p className="text-amber-400 text-xs p-2 border-t border-slate-700">בונוס השלמה: {classProgress.autoBonus} נקודות</p>
                 )}
               </div>
               <p className="text-slate-400 text-xs mt-2 mb-1">טבלת תלמידים — אילו סוגיות/כרטיסיות סיימו</p>
               <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-[280px] overflow-y-auto">
                 <table className="w-full text-center text-xs border-collapse">
                   <thead className="sticky top-0 bg-slate-800 z-10">
                     <tr className="text-slate-300">
                       <th className="p-1.5 border-b border-slate-600 text-right min-w-[90px]">תלמיד</th>
                       {Array.from({ length: Math.min(15, TOTAL_SUGIOT) }, (_, i) => i + 1).map((n) => (
                         <th key={'s'+n} className="p-0.5 border-b border-slate-600 w-6" title={`סוגיה ${n}`}>{n}</th>
                       ))}
                       {TOTAL_SUGIOT > 15 && <th className="p-0.5 border-slate-600">…</th>}
                       {Array.from({ length: TOTAL_KARTISIOT }, (_, i) => i + 1).map((n) => (
                         <th key={'k'+n} className="p-0.5 border-b border-slate-600 w-6 bg-slate-700/50" title={`כרטיסייה ${n}`}>כ{n}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {classStudents.map((s) => (
                       <tr key={s.id} className="border-b border-slate-700">
                         <td className="p-1.5 text-right font-medium text-white whitespace-nowrap sticky right-0 bg-slate-900 z-10">{s.name}</td>
                         {Array.from({ length: Math.min(15, TOTAL_SUGIOT) }, (_, i) => i + 1).map((num) => (
                           <td key={'s'+num} className="p-0.5">
                             {(s.sugiotCompleted || []).includes(num) ? (
                               <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-green-500/30 text-green-400 text-[10px]">✓</span>
                             ) : (
                               <span className="inline-block w-5 h-5 rounded border border-slate-700 text-slate-600">–</span>
                             )}
                           </td>
                         ))}
                         {TOTAL_SUGIOT > 15 && <td className="p-0.5 text-slate-500">…</td>}
                         {Array.from({ length: TOTAL_KARTISIOT }, (_, i) => i + 1).map((num) => (
                           <td key={'k'+num} className="p-0.5 bg-slate-800/30">
                             {(s.kartisiotCompleted || []).includes(num) ? (
                               <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-green-500/30 text-green-400 text-[10px]">✓</span>
                             ) : (
                               <span className="inline-block w-5 h-5 rounded border border-slate-700 text-slate-600">–</span>
                             )}
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
