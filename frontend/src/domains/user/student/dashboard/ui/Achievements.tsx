import React from 'react';
import { Crown, Trophy, Shield, Star, Medal, Target, Award } from 'lucide-react';
import { UserProfile } from '@/shared/types';

interface Props { currentUser: UserProfile; }

const ICON_MAP: Record<string, React.ElementType> = {
  'crown': Crown, 'trophy': Trophy, 'shield': Shield, 'star': Star,
  'medal': Medal, 'target': Target, 'award': Award,
};

const BG_COLORS = [
  'from-yellow-50 to-white', 'from-amber-50 to-white', 'from-blue-50 to-white',
  'from-purple-50 to-white', 'from-slate-100 to-white', 'from-emerald-50 to-white',
  'from-rose-50 to-white', 'from-cyan-50 to-white', 'from-orange-50 to-white',
];

const BORDER_COLORS = [
  'border-yellow-200', 'border-amber-200', 'border-brand-blue-bright/30',
  'border-purple-200', 'border-slate-200', 'border-emerald-200',
  'border-rose-200', 'border-cyan-200', 'border-orange-200',
];

export default function Achievements({ currentUser }: Props) {
  const badges = currentUser.badges || [];

  if (badges.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-900 text-xl">Achievements & Badges</h3>
            <p className="text-sm text-brand-muted mt-1">Complete challenges to earn badges!</p>
          </div>
        </div>
        <div className="text-center py-16 text-slate-400">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">No badges earned yet. Keep learning and competing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-bold text-slate-900 text-xl">Achievements & Badges</h3>
          <p className="text-sm text-brand-muted mt-1">You've unlocked {badges.length} badge{badges.length > 1 ? 's' : ''}.</p>
        </div>
        <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 font-bold text-sm flex items-center gap-2">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          {badges.length} Total
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badges.map((badge, i) => {
          const BadgeIcon = ICON_MAP[badge.toLowerCase().replace(/\s+/g, '')] || Award;
          const bgGrad = BG_COLORS[i % BG_COLORS.length];
          const border = BORDER_COLORS[i % BORDER_COLORS.length];
          return (
            <div key={i} className={`aspect-[3/4] bg-gradient-to-br ${bgGrad} border ${border} rounded-2xl flex flex-col items-center justify-center p-4 shadow-sm hover:-translate-y-1.5 transition-all cursor-pointer group relative overflow-hidden`}>
              <div className="absolute top-0 w-full h-1/2 bg-white/40 group-hover:bg-white/60 transition-colors" />
              <BadgeIcon className="w-10 h-10 text-slate-600 mb-4 drop-shadow-md relative z-10 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-slate-900 text-xs text-center leading-tight relative z-10">{badge}</h4>
            </div>
          );
        })}
      </div>
    </div>
  );
}
