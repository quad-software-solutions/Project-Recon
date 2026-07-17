import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import LiveLeaderboardWidget from './LiveLeaderboardWidget';
import { getAllPublicMatches, type MatchDetail } from '../api/competitionApi';
import VexMatchArena from './VexMatchArena';
import { sidesFromMatch } from './VexAllianceDisplay';

interface CompetitionLeaderboardPanelProps {
  onSelectMatch?: (id: string, tournamentId?: string) => void;
  onViewTournament?: (id: string) => void;
}

export default function CompetitionLeaderboardPanel({
  onSelectMatch,
  onViewTournament,
}: CompetitionLeaderboardPanelProps) {
  const [liveMatches, setLiveMatches] = useState<MatchDetail[]>([]);

  useEffect(() => {
    const load = () =>
      getAllPublicMatches()
        .then(ms => setLiveMatches(ms.filter(m => m.status === 'LIVE')))
        .catch(() => {});
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      id="sidebar-leaderboard"
      className="w-full xl:w-80 shrink-0 flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto pb-4 scroll-mt-24"
    >
      <LiveLeaderboardWidget
        compact
        maxRows={12}
        pollIntervalMs={10000}
        onTeamClick={onViewTournament}
      />

      {liveMatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600">On Field Now</span>
            <span className="ml-auto flex items-center gap-0.5 text-[8px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" />{liveMatches.length}
            </span>
          </div>
          <div className="space-y-2">
            {liveMatches.slice(0, 2).map(m => {
              const { sideA, sideB } = sidesFromMatch(m.sides);
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMatch?.(m.id, m.tournamentId)}
                  className="w-full text-left rounded-xl overflow-hidden hover:ring-2 hover:ring-red-300 transition-all"
                >
                  <VexMatchArena
                    sideA={sideA}
                    sideB={sideB}
                    status="LIVE"
                    round={m.round}
                    tournamentName={m.tournamentName}
                    winningSide={m.winningSide}
                    startedAt={m.startedAt}
                    size="card"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
