import React, { useMemo, useState } from 'react';
import { Student } from '../types';
import { getClassProgressOrComputed } from '../services/dataManager';
import { TOTAL_SUGIOT, TOTAL_KARTISIOT } from '../constants';
import { X, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const ProgressTableModal: React.FC<Props> = ({ isOpen, onClose, students }) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [tabMode, setTabMode] = useState<'sugiot' | 'kartisiot'>('sugiot');

  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => s.grade))).sort();
  }, [students]);

  const classStudents = useMemo(() => {
    if (!selectedGrade) return [];
    return students.filter(s => s.grade === selectedGrade).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedGrade, students]);

  const progressMap = useMemo(() => getClassProgressOrComputed(students), [students]);
  const progress = selectedGrade ? (progressMap[selectedGrade] ?? {
    grade: selectedGrade,
    studentCount: classStudents.length,
    sugiotCounts: Array.from({ length: TOTAL_SUGIOT }, (_, i) => classStudents.filter(s => (s.sugiotCompleted || []).includes(i + 1)).length),
    kartisiotCounts: Array.from({ length: TOTAL_KARTISIOT }, (_, i) => classStudents.filter(s => (s.kartisiotCompleted || []).includes(i + 1)).length),
    autoBonus: 0
  }) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            התקדמות סוגיות וכרטיסיות
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <p className="text-slate-400 text-sm mb-4">בחר כיתה כדי לראות כמה תלמידים סיימו כל סוגיה וכרטיסייה. כיתה שמסיימת כולה מקבלת בונוס 300.</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">כיתה</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full max-w-xs bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- בחר כיתה --</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          {progress && progress.studentCount > 0 && (
            <>
              <div className="flex gap-2 p-1 rounded-lg bg-slate-800/50 border border-slate-700 mb-4">
                <button
                  type="button"
                  onClick={() => setTabMode('sugiot')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${tabMode === 'sugiot' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  סוגיות (1–{TOTAL_SUGIOT})
                </button>
                <button
                  type="button"
                  onClick={() => setTabMode('kartisiot')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${tabMode === 'kartisiot' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  כרטיסיות (1–{TOTAL_KARTISIOT})
                </button>
              </div>
              {tabMode === 'sugiot' && (
                <>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg mb-2">
                    <div className="text-sm font-medium text-slate-300 p-2 border-b border-slate-700">סוגיות — כמה סיימו</div>
                    <div className="flex flex-wrap gap-1 p-2">
                      {progress.sugiotCounts.map((c, i) => {
                        const total = progress.studentCount;
                        const full = total > 0 && c === total;
                        return (
                          <span key={i} className={`px-2 py-1 rounded text-sm ${full ? 'bg-green-500/20 text-green-400 font-bold' : 'bg-slate-700 text-slate-400'}`} title={`סוגיה ${i + 1}`}>
                            {i + 1}: {c}/{total}{full ? ' ✓' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-300 mt-3 mb-1">טבלת תלמידים — סוגיות</div>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg max-h-[320px] overflow-y-auto">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-800 z-10">
                        <tr className="text-slate-300">
                          <th className="p-2 border-b border-slate-600 text-right min-w-[100px]">תלמיד</th>
                          {Array.from({ length: TOTAL_SUGIOT }, (_, i) => i + 1).map((n) => (
                            <th key={n} className="p-0.5 border-b border-slate-600 w-6" title={`סוגיה ${n}`}>{n}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((s) => (
                          <tr key={s.id} className="border-b border-slate-700">
                            <td className="p-2 text-right font-medium text-white whitespace-nowrap sticky right-0 bg-slate-900 z-10">{s.name}</td>
                            {Array.from({ length: TOTAL_SUGIOT }, (_, i) => i + 1).map((num) => (
                              <td key={num} className="p-0.5">
                                {(s.sugiotCompleted || []).includes(num) ? (
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
                </>
              )}
              {tabMode === 'kartisiot' && (
                <>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg mb-2">
                    <div className="text-sm font-medium text-slate-300 p-2 border-b border-slate-700">כרטיסיות — כמה סיימו</div>
                    <div className="flex flex-wrap gap-1 p-2">
                      {progress.kartisiotCounts.map((c, i) => {
                        const total = progress.studentCount;
                        const full = total > 0 && c === total;
                        return (
                          <span key={i} className={`px-2 py-1 rounded text-sm ${full ? 'bg-green-500/20 text-green-400 font-bold' : 'bg-slate-700 text-slate-400'}`} title={`כרטיסייה ${i + 1}`}>
                            {i + 1}: {c}/{total}{full ? ' ✓' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-300 mt-3 mb-1">טבלת תלמידים — כרטיסיות</div>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg max-h-[320px] overflow-y-auto">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-800 z-10">
                        <tr className="text-slate-300">
                          <th className="p-2 border-b border-slate-600 text-right min-w-[100px]">תלמיד</th>
                          {Array.from({ length: TOTAL_KARTISIOT }, (_, i) => i + 1).map((n) => (
                            <th key={n} className="p-0.5 border-b border-slate-600 w-6" title={`כרטיסייה ${n}`}>{n}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((s) => (
                          <tr key={s.id} className="border-b border-slate-700">
                            <td className="p-2 text-right font-medium text-white whitespace-nowrap sticky right-0 bg-slate-900 z-10">{s.name}</td>
                            {Array.from({ length: TOTAL_KARTISIOT }, (_, i) => i + 1).map((num) => (
                              <td key={num} className="p-0.5">
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
                </>
              )}
              {progress.autoBonus > 0 && (
                <p className="text-amber-400 text-sm mt-3">בונוס השלמת כיתה: {progress.autoBonus} נקודות</p>
              )}
            </>
          )}
          {selectedGrade && (!progress || progress.studentCount === 0) && (
            <p className="text-slate-500">אין תלמידים בכיתה זו.</p>
          )}
        </div>
      </div>
    </div>
  );
};
