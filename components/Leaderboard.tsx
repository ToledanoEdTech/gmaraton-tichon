import React from 'react';
import { Student } from '../types';
import { Trophy, Medal, Crown, Award, Star } from 'lucide-react';

interface Props {
  students: Student[];
}

// Mapping of positions to Hebrew titles
const POSITION_TITLES: { [key: number]: string } = {
  1: 'צורבא מרבנן',
  2: 'לא פסיק פומיה מגירסא',
  3: 'סיני ועוקר הרים',
  4: 'גמיר וסביר',
  5: 'בור סוד שאינו מאבד טיפה'
};

// Icons for top 5 positions
const POSITION_ICONS: { [key: number]: React.ReactNode } = {
  1: <Crown className="w-5 h-5 text-yellow-400" />,
  2: <Medal className="w-5 h-5 text-gray-300" />,
  3: <Award className="w-5 h-5 text-orange-400" />,
  4: <Star className="w-5 h-5 text-blue-400" />,
  5: <Star className="w-4 h-4 text-purple-400" />
};

// Colors for top 5 positions
const POSITION_COLORS: { [key: number]: string } = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400',
  4: 'text-blue-400',
  5: 'text-purple-400'
};

// Background colors for top 5 positions
const POSITION_BG_COLORS: { [key: number]: string } = {
  1: 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/40',
  2: 'bg-gradient-to-r from-gray-400/20 via-gray-400/10 to-transparent border-gray-400/40',
  3: 'bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent border-orange-500/40',
  4: 'bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/40',
  5: 'bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/40'
};

// Ribbon colors and styles for top 5 positions
const RIBBON_STYLES: { [key: number]: { bg: string; text: string; borderTop: string; borderBottom: string; shadowColor: string } } = {
  1: {
    bg: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600',
    text: 'text-yellow-950',
    borderTop: '#eab308',
    borderBottom: '#ca8a04',
    shadowColor: 'rgba(234, 179, 8, 0.6)'
  },
  2: {
    bg: 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400',
    text: 'text-gray-950',
    borderTop: '#9ca3af',
    borderBottom: '#6b7280',
    shadowColor: 'rgba(156, 163, 175, 0.6)'
  },
  3: {
    bg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
    text: 'text-orange-950',
    borderTop: '#fb923c',
    borderBottom: '#ea580c',
    shadowColor: 'rgba(249, 115, 22, 0.6)'
  },
  4: {
    bg: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
    text: 'text-blue-950',
    borderTop: '#60a5fa',
    borderBottom: '#2563eb',
    shadowColor: 'rgba(59, 130, 246, 0.6)'
  },
  5: {
    bg: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
    text: 'text-purple-950',
    borderTop: '#a78bfa',
    borderBottom: '#9333ea',
    shadowColor: 'rgba(168, 85, 247, 0.6)'
  }
};

export const Leaderboard: React.FC<Props> = ({ students }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
        <Trophy className="w-8 h-8 text-torah-gold animate-pulse-slow" />
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500">
          עשרת המובילים
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <ul className="space-y-3">
          {students.map((student, index) => {
            const position = index + 1;
            const isTop5 = position <= 5;
            const isTop3 = position <= 3;
            const title = POSITION_TITLES[position];
            const icon = POSITION_ICONS[position];
            const titleColor = POSITION_COLORS[position] || 'text-slate-400';
            const bgColor = POSITION_BG_COLORS[position] || 'bg-slate-800/30';
            const borderColor = isTop5 ? 'border' : '';

            const ribbonStyle = isTop5 ? RIBBON_STYLES[position] : null;

            return (
              <li 
                key={student.id} 
                className={`relative flex flex-col p-3 md:p-4 rounded-xl transition-all duration-300 overflow-hidden ${
                  isTop5 
                    ? `${bgColor} ${borderColor} shadow-lg hover:shadow-xl hover:scale-[1.02]` 
                    : 'bg-slate-800/30 hover:bg-slate-800/50'
                }`}
              >
                {/* Elegant Title Badge Above Name */}
                {isTop5 && title && ribbonStyle && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-30">
                    {/* Shadow behind badge */}
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-56 h-6 bg-black/40 rounded-full blur-sm"></div>
                    {/* Badge container */}
                    <div
                      className={`relative ${ribbonStyle.bg} ${ribbonStyle.text} px-4 py-1 rounded-full shadow-lg border-2 flex items-center gap-2`}
                      style={{
                        borderTopColor: ribbonStyle.borderTop,
                        borderBottomColor: ribbonStyle.borderBottom,
                        borderLeftColor: ribbonStyle.borderTop,
                        borderRightColor: ribbonStyle.borderBottom,
                        boxShadow: `0 3px 10px rgba(0, 0, 0, 0.4), 0 0 15px ${ribbonStyle.shadowColor}, inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2)`
                      }}
                    >
                      {/* Small crown/star icon */}
                      {position === 1 && <Crown className="w-3 h-3 flex-shrink-0" />}
                      {position === 2 && <Medal className="w-3 h-3 flex-shrink-0" />}
                      {position === 3 && <Award className="w-3 h-3 flex-shrink-0" />}
                      {position === 4 && <Star className="w-3 h-3 flex-shrink-0" />}
                      {position === 5 && <Star className="w-3 h-3 flex-shrink-0" />}

                      <div
                        className="font-bold text-xs leading-tight whitespace-nowrap flex-shrink-0"
                        style={{
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
                        }}
                      >
                        {title}
                      </div>

                      {/* Shine effect */}
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-full pointer-events-none"></div>
                    </div>
                  </div>
                )}

                {/* Position Number and Icon Row */}
                {isTop5 ? (
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    {icon && (
                      <div className="flex-shrink-0">
                        {icon}
                      </div>
                    )}
                    <div className={`font-black text-lg ${titleColor} flex-shrink-0`}>
                      מקום {position}
                    </div>
                  </div>
                ) : (
                  <div className={`font-bold text-xl text-center mb-2 ${titleColor}`}>
                    {position}
                  </div>
                )}
                
                {/* Main Content Row */}
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1 pr-4">
                    {isTop3 ? (
                      <div className="font-black text-white text-lg md:text-xl lg:text-2xl mb-1 drop-shadow-md">{student.name}</div>
                    ) : isTop5 ? (
                      <div className="font-bold text-white text-base md:text-lg lg:text-xl mb-1">{student.name}</div>
                    ) : (
                      <div className="font-semibold text-white text-sm md:text-base">{student.name}</div>
                    )}
                    <div className={`text-xs md:text-xs ${isTop5 ? 'text-slate-300' : 'text-slate-400'} mt-0.5`}>{student.grade}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {position === 1 && <Medal className="w-5 h-5 text-yellow-400" />}
                    <span className={`font-mono font-bold text-amber-500 ${isTop3 ? 'text-lg md:text-xl lg:text-2xl' : 'text-base md:text-lg lg:text-xl'}`}>
                      {student.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
          {students.length === 0 && (
             <li className="text-center text-slate-500 py-4">עדיין אין נתונים</li>
          )}
        </ul>
      </div>
    </div>
  );
};
