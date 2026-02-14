import React from 'react';
import { Student } from '../types';
import { X, Trophy } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const Top150Modal: React.FC<Props> = ({ isOpen, onClose, students }) => {
  if (!isOpen) return null;

  const top150 = [...students].sort((a, b) => b.score - a.score).slice(0, 150);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-amber-500" />
            150 המובילים
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {top150.length === 0 ? (
            <p className="text-center text-slate-500 p-8">אין עדיין נתונים להצגה.</p>
          ) : (
            <ul className="divide-y divide-slate-700/50">
              {top150.map((student, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                return (
                  <li
                    key={student.id}
                    className={`flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-slate-800/50 transition-colors ${
                      isTop3 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span
                        className={`flex-shrink-0 w-10 text-center font-bold tabular-nums ${
                          rank === 1
                            ? 'text-yellow-400 text-lg'
                            : rank === 2
                            ? 'text-gray-300 text-lg'
                            : rank === 3
                            ? 'text-orange-400 text-lg'
                            : 'text-slate-400'
                        }`}
                      >
                        {rank}
                      </span>
                      <div className="min-w-0 text-right">
                        <span className="font-semibold text-white block truncate">{student.name}</span>
                        <span className="text-xs text-slate-500">{student.grade}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 font-mono font-bold text-amber-500">
                      {student.score.toLocaleString()} נק'
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
