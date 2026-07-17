import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Medal, Trophy, RefreshCw, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { getPublicTeams, type PublicTeamEntry } from '../api/competitionApi';
import { VEX_SCORING_RULES } from './vexConstants';

interface LiveLeaderboardWidgetProps {
  compact?: boolean;
  maxRows?: number;
  pollIntervalMs?: number;
  onTeamClick?: (tournamentId: string) => void;
  className?: string;
}

export default function LiveLeaderboardWidget({
  compact = false,
  maxRows = 12,
  pollIntervalMs = 10000,
  onTeamClick,
  className = '',
}: LiveLeaderboardWidgetProps) {
  const [teams, setTeams] = useState<PublicTeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pulse, setPulse] = useState(false);

  const fetchTeams = async (isInitial = false) => {
    try {
      const data = await getPublicTeams();
      const sorted = [...data].sort((a, b) =>
        b.points - a.points || b.wins - a.wins || b.totalScore - a.totalScore
      );
      setTeams(sorted);
      setLastUpdate(new Date());
      if (!isInitial) setPulse(true);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams(true);
    const interval = setInterval(() => fetchTeams(false), pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [pulse]);

  const rows = teams.slice(0, maxRows);
  const top3 = rows.slice(0, 3);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-8 bg-slate-100 rounded" />
          <div className="h-8 bg-slate-100 rounded" />
          <div className="h-8 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center ${className}`}>
        <Medal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No standings yet</p>
        <p className="text-[10px] text-slate-400 mt-1">Updates automatically when matches complete</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Live Leaderboard</h3>
          <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
        </div>
        <button onClick={() => fetchTeams(false)} className="p-1 rounded text-white/50 hover:text-white transition-colors" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${pulse ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!compact && top3.length >= 3 && (
        <div className="px-3 py-3 bg-gradient-to-b from-amber-50/80 to-white border-b border-slate-100">
          <div className="flex items-end justify-center gap-2">
            {[1, 0, 2].map(pos => {
              const t = top3[pos];
              if (!t) return null;
              return (
                <div key={t.id} className={`flex flex-col items-center ${pos === 0 ? 'order-2' : pos === 1 ? 'order-1' : 'order-3'}`}>
                  <span className="text-lg">{['🥇', '🥈', '🥉'][pos]}</span>
                  <span className="text-[9px] font-black text-slate-700 truncate max-w-16 text-center">{t.teamName}</span>
                  <span className="text-[10px] font-black text-amber-600">{t.points} RP</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {rows.map((t, i) => (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onTeamClick?.(t.tournamentId)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                i < 3 ? 'bg-amber-50/40' : ''
              } ${pulse && i < 3 ? 'ring-1 ring-amber-200/50' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                i === 0 ? 'bg-amber-500 text-white' :
                i === 1 ? 'bg-slate-400 text-white' :
                i === 2 ? 'bg-orange-500 text-white' :
                'bg-slate-100 text-slate-500'
              }`}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{t.teamName}</p>
                  {!compact && (
                  <p className="text-[9px] text-slate-400 truncate">
                    {t.tournamentName ? t.tournamentName : <span className="inline-flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> Unknown</span>}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-900 tabular-nums">{t.points}</p>
                <p className="text-[8px] text-slate-400 font-bold">{t.wins}W {t.losses}L</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> RP: W×{VEX_SCORING_RULES.winPoints} D×{VEX_SCORING_RULES.drawPoints}</span>
        <span>Updated {lastUpdate.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
