import React from 'react';
import { ClassSummary } from '../types';
import { BookOpen, Users, Crown, Sparkles, TrendingUp } from 'lucide-react';

interface Props {
  data: ClassSummary;
  rank: number;
  onClick: () => void;
}

export const ClassCard: React.FC<Props> = ({ data, rank, onClick }) => {
  const isFirst = rank === 0;
  const isSecond = rank === 1;
  const isThird = rank === 2;

  // Base styles
  let containerClasses = "relative w-full rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl overflow-visible";
  let contentClasses = "relative overflow-hidden rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-full border-t border-white/10";
  let badgeStyle = "";
  let badgeText = "";
  
  // Rank specific styling
  if (isFirst) {
    containerClasses += " bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 shadow-[0_0_40px_rgba(245,158,11,0.3)] z-10 scale-105";
    contentClasses += " bg-slate-900/90 backdrop-blur-sm border-2 border-amber-400/50";
    badgeStyle = "bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/50 ring-2 ring-amber-200";
    badgeText = "👑 מקום ראשון";
  } else if (isSecond) {
    containerClasses += " bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700 shadow-lg z-0";
    contentClasses += " bg-slate-900/95 border border-slate-400/30";
    badgeStyle = "bg-slate-300 text-slate-900 font-bold shadow-md ring-1 ring-slate-100";
    badgeText = "🥈 מקום שני";
  } else if (isThird) {
    containerClasses += " bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg z-0";
    contentClasses += " bg-slate-900/95 border border-orange-500/30";
    badgeStyle = "bg-orange-500 text-white font-bold shadow-md ring-1 ring-orange-300";
    badgeText = "🥉 מקום שלישי";
  } else {
    containerClasses += " bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md";
    contentClasses += " bg-slate-800/50";
    badgeStyle = "bg-slate-700 text-slate-400 border border-slate-600";
    badgeText = `מקום ${rank + 1}`;
  }

  return (
    <button onClick={onClick} className={containerClasses}>
      {/* Floating Badge - positioned absolute but visible */}
      <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-1.5 rounded-full text-sm font-black tracking-wider z-20 whitespace-nowrap ${badgeStyle}`}>
        {badgeText}
      </div>

      {/* Main Content Wrapper */}
      <div className={contentClasses}>
        
        {/* Decorative Background Icon */}
        <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12 pointer-events-none">
            <BookOpen className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 text-white" />
        </div>

        {/* Header */}
        <div className="mt-4 flex flex-col items-center z-10 w-full space-y-2">
            <h3 className={`text-lg md:text-xl lg:text-2xl font-black ${isFirst ? 'text-amber-400 drop-shadow-sm' : 'text-white'}`}>
                {data.grade}
            </h3>
            
            {/* Divider */}
            <div className={`h-1 rounded-full w-12 ${isFirst ? 'bg-amber-500' : 'bg-slate-600'}`}></div>
        </div>

        {/* Score */}
        <div className="py-6 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
                <span className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight ${isFirst ? 'text-white drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]' : 'text-slate-200'}`}>
                    {data.totalScore.toLocaleString()}
                </span>
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-widest">
                {isFirst && <Sparkles className="w-3 h-3 text-amber-400" />}
                נקודות זכות
                {isFirst && <Sparkles className="w-3 h-3 text-amber-400" />}
            </span>
            {data.classBonus && data.classBonus > 0 && (
                <div className="mt-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                    <span className="text-xs font-bold text-amber-400">
                        +{data.classBonus.toLocaleString()} בונוס כיתתי
                    </span>
                </div>
            )}
        </div>

        {/* Footer info */}
        <div className="w-full bg-slate-950/30 rounded-lg py-2 px-4 flex items-center justify-between text-sm border border-white/5">
            <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-4 h-4" />
                <span>{data.studentCount} תלמידים</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500/80 group-hover:text-amber-400 transition-colors">
                <span className="text-xs font-bold">לפירוט</span>
                <TrendingUp className="w-3 h-3" />
            </div>
        </div>

        {/* Shine Effect for 1st place */}
        {isFirst && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 animate-pulse-slow pointer-events-none"></div>
        )}
      </div>
    </button>
  );
};