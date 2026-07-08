import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Trophy, Shield, Medal, Star, Target, Lock, Sparkles, Zap } from 'lucide-react';

interface Badge {
  title: string;
  date: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  unlocked: boolean;
  xp: number;
}

const BADGES: Badge[] = [
  { title: 'Robotics Master', date: 'Oct 2023', icon: Crown, color: 'text-yellow-500', bg: 'from-yellow-50 to-white', border: 'border-yellow-200', unlocked: true, xp: 500 },
  { title: 'First Place Regionals', date: 'Nov 2023', icon: Trophy, color: 'text-yellow-400', bg: 'from-amber-50 to-white', border: 'border-amber-200', unlocked: true, xp: 750 },
  { title: 'Code Guardian', date: 'Jan 2024', icon: Shield, color: 'text-blue-500', bg: 'from-blue-50 to-white', border: 'border-blue-200', unlocked: true, xp: 400 },
  { title: 'AI Innovator', date: 'Feb 2024', icon: Star, color: 'text-purple-500', bg: 'from-purple-50 to-white', border: 'border-purple-200', unlocked: true, xp: 600 },
  { title: 'Perfect Attendance', date: 'Mar 2024', icon: Medal, color: 'text-slate-600', bg: 'from-slate-100 to-white', border: 'border-slate-200', unlocked: true, xp: 300 },
  { title: 'Precision Engineer', date: 'Apr 2024', icon: Target, color: 'text-emerald-500', bg: 'from-emerald-50 to-white', border: 'border-emerald-200', unlocked: true, xp: 550 },
  { title: 'Mentor of the Month', date: 'In Progress', icon: Sparkles, color: 'text-pink-500', bg: 'from-pink-50 to-white', border: 'border-pink-200', unlocked: false, xp: 800 },
  { title: 'Speed Demon', date: 'Locked', icon: Zap, color: 'text-cyan-500', bg: 'from-cyan-50 to-white', border: 'border-cyan-200', unlocked: false, xp: 650 },
];

const NEXT_BADGE = BADGES.find(b => !b.unlocked);
const UNLOCKED_COUNT = BADGES.filter(b => b.unlocked).length;
const TOTAL_XP = BADGES.filter(b => b.unlocked).reduce((s, b) => s + b.xp, 0);

export default function Achievements() {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? BADGES : BADGES.filter(b => b.unlocked);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-xl">Achievements & Badges</h3>
          <p className="text-xs text-slate-500 mt-1">You've unlocked {UNLOCKED_COUNT} of {BADGES.length} badges this year.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-bold text-xs flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {TOTAL_XP} XP
          </div>
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 font-bold text-xs flex items-center gap-1.5">
            Top 5%
          </div>
        </div>
      </div>

      {/* Next Badge Progress */}
      {NEXT_BADGE && (
        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              Next: <span className="text-slate-900">{NEXT_BADGE.title}</span>
            </span>
            <span className="text-[10px] font-bold text-blue-500">{Math.floor(Math.random() * 60) + 20}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Keep going! {NEXT_BADGE.xp} XP needed to unlock</p>
        </div>
      )}

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {displayed.map((badge, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`aspect-[3/4] bg-gradient-to-br ${badge.bg} border ${badge.border} rounded-2xl flex flex-col items-center justify-center p-4 shadow-sm ${
              badge.unlocked ? 'hover:-translate-y-1.5 cursor-pointer' : 'opacity-60'
            } transition-all group relative overflow-hidden`}>
            <div className="absolute top-0 w-full h-1/2 bg-white/40 group-hover:bg-white/60 transition-colors" />
            {badge.unlocked ? (
              <badge.icon className={`w-10 h-10 ${badge.color} mb-4 drop-shadow-md relative z-10 group-hover:scale-110 transition-transform`} />
            ) : (
              <div className="relative z-10 mb-4">
                <badge.icon className={`w-10 h-10 ${badge.color} drop-shadow-md`} />
                <Lock className="w-4 h-4 text-slate-400 absolute -bottom-1 -right-1" />
              </div>
            )}
            <h4 className="font-sans font-bold text-slate-900 text-xs text-center leading-tight relative z-10">{badge.title}</h4>
            <p className="text-[9px] font-mono font-semibold text-slate-500 mt-1.5 relative z-10">{badge.date}</p>
            <p className="text-[9px] text-slate-400 relative z-10">{badge.xp} XP</p>
          </motion.div>
        ))}
      </div>

      {!showAll && BADGES.some(b => !b.unlocked) && (
        <button onClick={() => setShowAll(true)}
          className="mt-6 mx-auto block text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors">
          Show {BADGES.filter(b => !b.unlocked).length} locked badges
        </button>
      )}
    </div>
  );
}
