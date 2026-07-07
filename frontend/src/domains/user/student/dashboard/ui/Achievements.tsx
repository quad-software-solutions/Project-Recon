import React from 'react';
import { Crown, Trophy, Shield, Medal, Star, Target } from 'lucide-react';

export default function Achievements() {
  const badges = [
    { title: 'Robotics Master', date: 'Oct 2023', icon: Crown, color: 'text-yellow-500', bg: 'from-yellow-50 to-white', border: 'border-yellow-200' },
    { title: 'First Place Regionals', date: 'Nov 2023', icon: Trophy, color: 'text-yellow-400', bg: 'from-amber-50 to-white', border: 'border-amber-200' },
    { title: 'Code Guardian', date: 'Jan 2024', icon: Shield, color: 'text-[#2563EB]', bg: 'from-blue-50 to-white', border: 'border-blue-200' },
    { title: 'AI Innovator', date: 'Feb 2024', icon: Star, color: 'text-purple-500', bg: 'from-purple-50 to-white', border: 'border-purple-200' },
    { title: 'Perfect Attendance', date: 'Mar 2024', icon: Medal, color: 'text-slate-600', bg: 'from-slate-100 to-white', border: 'border-slate-200' },
    { title: 'Precision Engineer', date: 'Apr 2024', icon: Target, color: 'text-emerald-500', bg: 'from-emerald-50 to-white', border: 'border-emerald-200' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-xl">Achievements & Badges</h3>
          <p className="text-sm text-brand-muted mt-1">You've unlocked 6 badges this academic year.</p>
        </div>
        <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 font-bold text-sm flex items-center gap-2">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          Top 5% in Class
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badges.map((badge, i) => (
          <div key={i} className={`aspect-[3/4] bg-gradient-to-br ${badge.bg} border ${badge.border} rounded-2xl flex flex-col items-center justify-center p-4 shadow-sm hover:-translate-y-1.5 transition-all cursor-pointer group relative overflow-hidden`}>
            <div className="absolute top-0 w-full h-1/2 bg-white/40 group-hover:bg-white/60 transition-colors" />
            <badge.icon className={`w-10 h-10 ${badge.color} mb-4 drop-shadow-md relative z-10 group-hover:scale-110 transition-transform`} />
            <h4 className="font-sans font-bold text-slate-900 text-xs text-center leading-tight relative z-10">{badge.title}</h4>
            <p className="text-[9px] font-mono font-semibold text-slate-500 mt-1.5 relative z-10">{badge.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
