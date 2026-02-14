import React from 'react';
import { HistoryEntry } from '../types';
import { X, History } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  const dropouts = history.filter(h => h.reason === 'dropped_out_of_top10');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-amber-500" />
            היסטוריית העשירייה הפותחת
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
           {dropouts.length === 0 ? (
             <p className="text-center text-slate-500">אף תלמיד לא יצא מהעשירייה עדיין.</p>
           ) : (
             <ul className="space-y-4">
               {dropouts.map((entry, idx) => (
                 <li key={idx} className="bg-slate-800 p-3 rounded border-r-4 border-red-500 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white text-lg">{entry.studentName}</span>
                      <p className="text-slate-400 text-sm">יצא מהרשימה בעקבות עליית תלמיד אחר</p>
                    </div>
                    <div className="text-xs text-slate-500 text-left">
                       {new Date(entry.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                 </li>
               ))}
             </ul>
           )}
        </div>

      </div>
    </div>
  );
};
