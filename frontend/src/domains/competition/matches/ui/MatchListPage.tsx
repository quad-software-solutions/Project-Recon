import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search, Gamepad2, Filter, Loader2, AlertCircle, Activity, CheckCircle,
  Calendar, XCircle, Video, Zap, AlertTriangle,
} from 'lucide-react';
import { fetchAllMatches } from '../../api/matchApi';
import type { MatchDetail } from '../../api/matchMappers';
import MatchCard from './MatchCard';
import VexMatchArena from '../../shared/VexMatchArena';
import { sidesFromMatch } from '../../shared/VexAllianceDisplay';

interface MatchListPageProps {
  onSelectMatch: (matchId: string, tournamentId?: string) => void;
}

type StatusTab = 'all' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

const STATUS_TABS: { id: StatusTab; label: string; icon: typeof Activity }[] = [
  { id: 'all', label: 'All', icon: Gamepad2 },
  { id: 'LIVE', label: 'Live', icon: Zap },
  { id: 'SCHEDULED', label: 'Scheduled', icon: Calendar },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
  { id: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

function LiveCountdown({ scheduledAt }: { scheduledAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(scheduledAt).getTime() - now;
  if (diff <= 0) return <span className="text-red-500 font-bold">STARTED</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono font-bold text-slate-700">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

export default function MatchListPage({ onSelectMatch }: MatchListPageProps) {
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const perPage = 12;

  const fetchMatches = (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    fetchAllMatches()
      .then(data => {
        setMatches(data);
        setLastRefresh(new Date());
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMatches(true); }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchMatches(false), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setPage(1); }, [statusTab, search, tournamentFilter]);

  const tournaments = useMemo(
    () => [...new Set(matches.map(m => m.tournamentName).filter(Boolean))].sort(),
    [matches]
  );

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'LIVE'), [matches]);

  const filtered = matches.filter(m => {
    if (statusTab !== 'all' && m.status !== statusTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const sideA = m.sides.find(s => s.side === 'SIDE_A')?.teams.join(' ') || '';
      const sideB = m.sides.find(s => s.side === 'SIDE_B')?.teams.join(' ') || '';
      if (!m.round.toLowerCase().includes(q) && !sideA.includes(q) && !sideB.includes(q) && !m.tournamentName.toLowerCase().includes(q)) return false;
    }
    if (tournamentFilter !== 'all' && m.tournamentName !== tournamentFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const counts: Record<string, number> = { all: matches.length };
  for (const m of matches) counts[m.status] = (counts[m.status] || 0) + 1;

  const stats = useMemo(
    () => ({
      total: matches.length,
      live: counts.LIVE || 0,
      scheduled: counts.SCHEDULED || 0,
      completed: counts.COMPLETED || 0,
      cancelled: counts.CANCELLED || 0,
    }),
    [matches, counts.LIVE, counts.SCHEDULED, counts.COMPLETED, counts.CANCELLED],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          <p className="text-xs text-slate-400 font-medium">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold text-red-600 underline">Try again</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-brand-red" />
          Matches
        </h3>
        <p className="text-xs text-slate-500 mt-1">Track live scores, results, and upcoming matches</p>
      </div>

      {/* Live matches highlight — alliance cards */}
      {liveMatches.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl p-5 mb-6 text-white shadow-xl shadow-red-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">
                {liveMatches.length} Live Alliance Match{liveMatches.length > 1 ? 'es' : ''}
              </span>
            </div>
            <span className="text-[9px] text-white/60">Updated {lastRefresh.toLocaleTimeString()}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveMatches.slice(0, 4).map(m => {
              const { sideA, sideB } = sidesFromMatch(m.sides);
              return (
                <button key={m.id} onClick={() => onSelectMatch(m.id, m.tournamentId)}
                  className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-all text-left border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-white/70 truncate">{m.tournamentName || <span className="inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Unknown tournament</span>}</p>
                    <Video className="w-4 h-4 shrink-0 text-white/70" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/50 mb-2">{m.round}</p>
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
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Live', value: stats.live },
          { label: 'Scheduled', value: stats.scheduled },
          { label: 'Completed', value: stats.completed },
          { label: 'Cancelled', value: stats.cancelled },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center">
            <p className="text-lg font-black text-slate-900">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search matches, rounds, teams..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all" />
        </div>
        {tournaments.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-red">
              <option value="all">All Tournaments</option>
              {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => {
          const Icon = tab.icon;
          const count = counts[tab.id] || 0;
          return (
            <button key={tab.id} onClick={() => setStatusTab(tab.id)}
              className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                statusTab === tab.id
                  ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                statusTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Match list */}
      {filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center">
          <Gamepad2 className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="font-black text-xl text-slate-600 mb-1">No Matches Found</h3>
          <p className="text-sm text-slate-400 max-w-xs font-medium">
            {search || statusTab !== 'all' || tournamentFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No matches have been created yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paged.map(m => (
              <MatchCard key={m.id} match={m} onClick={() => onSelectMatch(m.id, m.tournamentId)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
