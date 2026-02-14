import React, { useMemo } from 'react';
import { Student } from '../types';
import { X, Trophy, Crown, Sparkles } from 'lucide-react';

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
        </div>

      </div>
    </div>
  );
};
