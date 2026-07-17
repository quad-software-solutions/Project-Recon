import { useState, useEffect } from 'react';
import { Tv, Trophy, Medal, BookOpen, Zap, ChevronRight } from 'lucide-react';
import { getAllPublicMatches } from '../api/competitionApi';

type NavId = 'live' | 'events' | 'rules' | 'leaderboard';

interface CompetitionNavPanelProps {
  activeSection?: NavId;
  onNavigate?: (section: NavId) => void;
}

const NAV: { id: NavId; label: string; icon: typeof Tv; target: string }[] = [
  { id: 'live', label: 'Live Matches', icon: Tv, target: 'live-matches' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Medal, target: 'sidebar-leaderboard' },
  { id: 'events', label: 'All Events', icon: Trophy, target: 'events' },
  { id: 'rules', label: 'VEX Rules', icon: BookOpen, target: 'rules' },
];

export default function CompetitionNavPanel({
  activeSection = 'live',
  onNavigate,
}: CompetitionNavPanelProps) {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const load = () =>
      getAllPublicMatches()
        .then(ms => setLiveCount(ms.filter(m => m.status === 'LIVE').length))
        .catch(() => {});
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (target: string, nav: NavId) => {
    onNavigate?.(nav);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
      <p className="px-3 pt-2 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Competition</p>
      {NAV.map(item => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.target, item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
              isActive
                ? 'bg-brand-red/10 text-brand-red'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-red' : 'text-slate-400'}`} />
            <span className="text-xs font-bold flex-1">{item.label}</span>
            {item.id === 'live' && liveCount > 0 && (
              <span className="flex items-center gap-0.5 text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                <Zap className="w-2.5 h-2.5" />{liveCount}
              </span>
            )}
            <ChevronRight className="w-3 h-3 opacity-40" />
          </button>
        );
      })}
    </nav>
  );
}
