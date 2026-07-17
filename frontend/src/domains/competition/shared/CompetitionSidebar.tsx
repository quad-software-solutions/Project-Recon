import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Tv, Trophy, Medal, Gamepad2, BookOpen, Zap, ChevronRight,
} from 'lucide-react';
import LiveLeaderboardWidget from './LiveLeaderboardWidget';
import { getAllPublicMatches, type MatchDetail } from '../api/competitionApi';
import VexAllianceDisplay, { sidesFromMatch } from './VexAllianceDisplay';

type NavId = 'live' | 'events' | 'rules' | 'leaderboard';

interface CompetitionSidebarProps {
  activeSection?: NavId;
  onNavigate?: (section: NavId) => void;
  onSelectMatch?: (id: string, tournamentId?: string) => void;
  onViewTournament?: (id: string) => void;
}

const NAV: { id: NavId; label: string; icon: typeof Tv; target: string }[] = [
  { id: 'live', label: 'Live Matches', icon: Tv, target: 'live-matches' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Medal, target: 'sidebar-leaderboard' },
  { id: 'events', label: 'All Events', icon: Trophy, target: 'events' },
  { id: 'rules', label: 'VEX Rules', icon: BookOpen, target: 'rules' },
];

export default function CompetitionSidebar({
  activeSection = 'live',
  onNavigate,
  onSelectMatch,
  onViewTournament,
}: CompetitionSidebarProps) {
  const [liveMatches, setLiveMatches] = useState<MatchDetail[]>([]);

  useEffect(() => {
    const load = () => getAllPublicMatches().then(ms => setLiveMatches(ms.filter(m => m.status === 'LIVE'))).catch(() => {});
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (target: string, nav: NavId) => {
    onNavigate?.(nav);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 gap-4 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto pb-4">
      {/* Navigation */}
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
              {item.id === 'live' && liveMatches.length > 0 && (
                <span className="flex items-center gap-0.5 text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" />{liveMatches.length}
                </span>
              )}
              <ChevronRight className="w-3 h-3 opacity-40" />
            </button>
          );
        })}
      </nav>

      {/* Live matches mini */}
      {liveMatches.length > 0 && (
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-3 text-white shadow-lg shadow-red-500/20">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">Live Alliances</span>
          </div>
          <div className="space-y-2">
            {liveMatches.slice(0, 2).map(m => {
              const { sideA, sideB } = sidesFromMatch(m.sides);
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMatch?.(m.id, m.tournamentId)}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-xl p-2.5 text-left transition-all"
                >
                  <p className="text-[9px] font-bold text-white/70 mb-1.5">{m.round}</p>
                  <VexAllianceDisplay
                    sideA={sideA}
                    sideB={sideB}
                    variant="compact"
                    isLive
                    showLabels
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live leaderboard */}
      <div id="sidebar-leaderboard">
        <LiveLeaderboardWidget
          compact
          maxRows={10}
          pollIntervalMs={10000}
          onTeamClick={onViewTournament}
        />
      </div>
    </aside>
  );
}
