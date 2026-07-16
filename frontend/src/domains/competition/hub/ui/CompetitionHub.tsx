import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, MapPin, Users, Calendar, Search, Loader2, AlertCircle,
  Clock, DollarSign, Lock, ExternalLink, GraduationCap,
  EyeOff, X, Shield, CheckCircle2, Activity, Zap, Gamepad2, Sparkles,
  Medal, Swords, ChevronRight, Tv, RotateCcw,
  Maximize2, Minimize2, RefreshCw,
} from 'lucide-react';
import { UserProfile, type Tournament, type Workshop } from '@/shared/types';
import {
  getTournaments, getWorkshops,
  getMyRegistrations,
  getPublicTeams, getAllPublicMatches,
  type PublicTeamEntry, type MatchDetail,
} from '../../api/competitionApi';

import VexRulesPanel from '../../shared/VexRulesPanel';
import MatchCard from '../../matches/ui/MatchCard';
import EventRegistrationModal from '../../shared/EventRegistrationModal';
import EventRegisterButton from '../../shared/EventRegisterButton';
import { REGISTRATION_MODE_LABELS } from '../../shared/eventRegistrationUtils';
import HubSkeleton from './components/HubSkeleton';
import EventDetailModal from './components/EventDetailModal';
import MatchViewOverlay from './components/MatchViewOverlay';
import { statusBadge } from '@/shared/utils/status';

interface CompetitionHubProps {
  currentUser?: UserProfile | null;
  onViewTournament?: (id: string) => void;
  onSelectMatch?: (id: string, tournamentId?: string) => void;
  onNavigateLogin?: () => void;
}

type EventFilter = 'tournaments' | 'workshops' | 'all';
type TimeFilter = 'all' | 'upcoming' | 'live' | 'past';



/* ───── Skeleton ───── */



/* ───── Main Component ───── */

export default function CompetitionHub({ currentUser, onViewTournament, onSelectMatch, onNavigateLogin }: CompetitionHubProps) {
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showClosed, setShowClosed] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [teams, setTeams] = useState<PublicTeamEntry[]>([]);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [liveMatchCount, setLiveMatchCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [regTarget, setRegTarget] = useState<Tournament | Workshop | null>(null);
  const [detailEvent, setDetailEvent] = useState<Tournament | Workshop | null>(null);
  const [showMatchView, setShowMatchView] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTournaments(),
      getWorkshops(),
      getPublicTeams(),
      getAllPublicMatches(),
    ]).then(([ts, ws, tms, matchList]) => {
      setTournaments(ts);
      setWorkshops(ws);
      setTeams(tms);
      setMatches(matchList);
      setLiveMatchCount(matchList.filter(m => m.status === 'LIVE').length);
      setLastRefresh(new Date());
    }).catch(err => {
      /* console.error */(err);
      setError('Failed to load events');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (currentUser) {
      getMyRegistrations().then(regs => {
        setRegisteredIds(regs.filter((r: any) =>
          r.registration_status === 'PENDING' || r.registration_status === 'APPROVED'
        ).map((r: any) => r.event));
      }).catch(() => {});
    }
  }, [currentUser]);

  /* Live auto-refresh every 15s for matches & leaderboard */
  useEffect(() => {
    const poll = async () => {
      try {
        const [freshTeams, freshMatches] = await Promise.all([
          getPublicTeams(),
          getAllPublicMatches(),
        ]);
        setTeams(freshTeams);
        setMatches(freshMatches);
        setLiveMatchCount(freshMatches.filter(m => m.status === 'LIVE').length);
        setLastRefresh(new Date());
      } catch { /* silent */ }
    };
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  /* Derived data */
  const allEvents = useMemo(() => [...tournaments, ...workshops], [tournaments, workshops]);
  const liveEvents = useMemo(() => allEvents.filter(e => e.computedState === 'LIVE'), [allEvents]);
  const upcomingEvents = useMemo(() => allEvents.filter(e => e.computedState === 'FUTURE'), [allEvents]);
  const pastEvents = useMemo(() => allEvents.filter(e => e.computedState === 'PAST'), [allEvents]);
  const featured = useMemo(() => {
    return upcomingEvents[0] || liveEvents[0] || tournaments[0] || null;
  }, [upcomingEvents, liveEvents, tournaments]);

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'LIVE'), [matches]);
  const upcomingMatches = useMemo(() => matches.filter(m => m.status === 'SCHEDULED').slice(0, 6), [matches]);

  const events = eventFilter === 'tournaments' ? tournaments : eventFilter === 'workshops' ? workshops : allEvents;
  const filtered = events.filter(e => {
    if (timeFilter === 'upcoming' && e.computedState !== 'FUTURE') return false;
    if (timeFilter === 'live' && e.computedState !== 'LIVE') return false;
    if (timeFilter === 'past' && e.computedState !== 'PAST') return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (!showClosed && e.eventType === 'TOURNAMENT' && (e as Tournament).isClosed) return false;
    return true;
  });

  const computedCounts = {
    all: events.length,
    upcoming: events.filter(e => e.computedState === 'FUTURE').length,
    live: events.filter(e => e.computedState === 'LIVE').length,
    past: events.filter(e => e.computedState === 'PAST').length,
  };

  /* Registration handlers */
  const openRegModal = (event: Tournament | Workshop) => {
    setRegTarget(event);
  };

  const handleRegistrationSuccess = (eventId: string) => {
    setRegisteredIds(prev => [...prev, eventId]);
  };

  const isRegistered = (id: string) => registeredIds.includes(id);

  const totalTournaments = tournaments.length;
  const totalTeams = teams.length;
  const totalParticipants = [...new Set(teams.map(t => t.teamName))].length;

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (diff < 0) return null;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const FILTERS: { id: TimeFilter; label: string; icon: typeof Calendar }[] = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'live', label: 'Live', icon: Zap },
    { id: 'past', label: 'Past', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      {/* ════════════════════════════════════════ */}
      {/* HERO */}
      {/* ════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/60 p-6 md:p-10"
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        {/* Animated gradient orbs */}
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
              <Trophy className="w-3.5 h-3.5" /> EthioRobotics
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
              <Sparkles className="w-3 h-3" /> 2026 Season
            </span>
            {upcomingEvents.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                <Calendar className="w-3 h-3" /> Next: {new Date(upcomingEvents[0].startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                VEX Competition Center
              </h1>
              <p className="mt-3 text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Live matches, alliance scores, and rankings — all in one view. RED vs BLUE alliances, 2 teams per side.
              </p>
            </div>
            {featured && daysUntil(featured.startDateTime) && (
              <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next Event</p>
                <p className="text-xl font-black text-white mt-0.5">{daysUntil(featured.startDateTime)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{featured.title}</p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Tournaments', value: totalTournaments, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { label: 'Teams', value: totalTeams, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: 'Participants', value: totalParticipants, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Live Matches', value: liveMatchCount, icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            ].map(s => (
              <motion.div key={s.label} whileHover={{ scale: 1.02 }}
                className={`${s.bg} ${s.border} border rounded-2xl p-4 backdrop-blur-sm transition-shadow hover:shadow-lg hover:shadow-white/5`}>
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{s.label}</span>
                </div>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════ */}
      {/* FEATURED TOURNAMENT */}
      {/* ════════════════════════════════════════ */}
      {featured && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-amber-50 rounded-3xl border border-indigo-100 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/30 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200/30 rounded-full blur-2xl" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Featured Tournament
                </span>
                {featured.computedState === 'LIVE' && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              <h3 className="font-black text-xl md:text-2xl text-slate-900 truncate">{featured.title}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(featured.startDateTime).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {featured.location}</span>
                {featured.eventType === 'TOURNAMENT' && (
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {(featured as Tournament).enrolledCount} / {(featured as Tournament).maxTeams || '∞'} teams</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0 w-full md:w-auto">
              <button onClick={() => onViewTournament?.(featured.id)}
                className="flex-1 md:flex-none bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Swords className="w-4 h-4" /> View Tournament
              </button>
              <EventRegisterButton
                event={featured}
                currentUser={currentUser}
                isRegistered={isRegistered(featured.id)}
                onRegister={() => openRegModal(featured)}
                onNavigateLogin={onNavigateLogin}
                className="flex-1 md:flex-none px-5 py-3 !text-xs"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* LIVE MATCHES BAR */}
      {/* ════════════════════════════════════════ */}
      <AnimatePresence>
              {liveEvents.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-red-500 via-red-600 to-red-500 rounded-2xl p-4 shadow-lg shadow-red-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-wider">
                    {liveEvents.length} Event{liveEvents.length > 1 ? 's' : ''} Live Now
                  </p>
                  <p className="text-[11px] text-red-200">Watch live and follow the action</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveEvents.filter(e => e.eventType === 'TOURNAMENT').length > 0 && (
                  <button onClick={() => setShowMatchView(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" /> Large Screen View
                  </button>
                )}
                {(() => {
                  const liveTournament = liveEvents.find(e => e.eventType === 'TOURNAMENT') as Tournament | undefined;
                  const liveUrl = liveTournament?.youtubeLiveUrl;
                  return liveUrl ? (
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5" /> Watch
                    </a>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {liveEvents.map(ev => (
                <button key={ev.id} onClick={() => {
                  if (ev.eventType === 'TOURNAMENT' && onViewTournament) onViewTournament(ev.id);
                  else setDetailEvent(ev);
                }}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {ev.title}
                  {ev.eventType === 'TOURNAMENT' && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════ */}
      {/* LIVE MATCHES — full width (leaderboard in sidebar) */}
      {/* ════════════════════════════════════════ */}
      {!loading && (
        <div id="live-matches" className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-500" />
              <h2 className="font-black text-base text-slate-900 uppercase tracking-wider">Live Alliance Matches</h2>
              {liveMatchCount > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {liveMatchCount} LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 hidden sm:inline">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
              <button onClick={() => setShowMatchView(true)}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1.5">
                <Maximize2 className="w-3 h-3" /> Full Screen
              </button>
            </div>
          </div>

          {liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map(m => (
                <MatchCard key={m.id} match={m} onClick={() => onSelectMatch?.(m.id, m.tournamentId)} />
              ))}
            </div>
          ) : upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">No live matches — upcoming alliances next:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatches.slice(0, 4).map(m => (
                  <MatchCard key={m.id} match={m} onClick={() => onSelectMatch?.(m.id, m.tournamentId)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No matches scheduled yet</p>
              <p className="text-xs text-slate-400 mt-1">RED vs BLUE alliance matches (2 teams per side) will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* ALL EVENTS SECTION */}
      {/* ════════════════════════════════════════ */}
      <div id="events" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 scroll-mt-24">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-red" />
          <h2 className="font-black text-base text-slate-900 uppercase tracking-wider">All Events</h2>
        </div>
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
          {([
            { id: 'all' as EventFilter, label: 'All', icon: Activity },
            { id: 'tournaments' as EventFilter, label: 'Tournaments', icon: Trophy },
            { id: 'workshops' as EventFilter, label: 'Workshops', icon: GraduationCap },
          ]).map(tab => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setEventFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  eventFilter === tab.id
                    ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-md shadow-brand-red/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => {
              const FIcon = f.icon;
              return (
                <button key={f.id} onClick={() => setTimeFilter(f.id)}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    timeFilter === f.id
                      ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-md shadow-brand-red/20'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <FIcon className="w-3 h-3" />
                  {f.label}
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    timeFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{computedCounts[f.id]}</span>
                </button>
              );
            })}
            <button onClick={() => setShowClosed(p => !p)}
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                showClosed ? 'bg-slate-700 text-white border border-slate-600' : 'bg-white text-slate-400 border border-slate-200'
              }`}>
              <Lock className="w-3 h-3" />{showClosed ? 'Hide Closed' : 'Show Closed'}
            </button>
        </div>
      </div>

      {/* Search + Events grid */}
      <>
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all" />
          </div>

          {loading ? (
            <HubSkeleton />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-base font-bold text-red-700">{error}</p>
              <button onClick={fetchAll}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center">
              <Trophy className="w-14 h-14 text-slate-300 mb-4" />
              <h3 className="font-black text-xl text-slate-600 mb-1">No Events Found</h3>
              <p className="text-sm text-slate-400 max-w-xs">
                {search || timeFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : `No published events are available right now.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(event => {
                const isTournament = event.eventType === 'TOURNAMENT';
                const isLive = event.computedState === 'LIVE';
                const tEvent = event as Tournament;
                return (
                  <motion.div key={event.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isTournament && tEvent.isClosed
                        ? 'border-slate-200 opacity-70 hover:opacity-80'
                        : 'border-slate-200 hover:shadow-xl hover:border-brand-red/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top accent */}
                    <div className={`h-1.5 ${isTournament && tEvent.isClosed ? 'bg-slate-300' : isLive ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-brand-red/60 to-brand-blue/60'}`} />

                    {/* Header */}
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isTournament
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {isTournament
                            ? <Trophy className="w-5 h-5" />
                            : <GraduationCap className="w-5 h-5" />
                          }
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{event.eventType}</span>
                          {isTournament && (event as any).category && (
                            <span className="ml-1 text-[10px] text-slate-400">· {(event as any).category}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(event.storedStatus)}`}>
                          {event.storedStatus}
                        </span>
                        {event.visibility === 'PRIVATE' && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                            <EyeOff className="w-2.5 h-2.5 inline-block mr-0.5" />PRIVATE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-5 pb-4">
                      <h3 className="font-black text-base text-slate-900 mb-1 leading-snug line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{event.description}</p>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(event.startDateTime).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 max-w-[140px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                        {isTournament && tEvent.maxTeams > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <Users className="w-3 h-3 text-slate-400" />
                            {tEvent.enrolledCount}/{tEvent.maxTeams}
                          </span>
                        )}
                        {isTournament && tEvent.isClosed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Lock className="w-3 h-3" /> Closed
                          </span>
                        )}
                        {event.computedState === 'LIVE' && !(isTournament && tEvent.isClosed) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            LIVE
                          </span>
                        )}
                        {daysUntil(event.startDateTime) && event.computedState !== 'PAST' && !(isTournament && tEvent.isClosed) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                            <Calendar className="w-3 h-3" />
                            {daysUntil(event.startDateTime)}
                          </span>
                        )}
                      </div>

                      {/* Capacity bar */}
                      {isTournament && tEvent.maxTeams > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
                            <span>Capacity</span>
                            <span>{Math.min(100, Math.round((tEvent.enrolledCount / tEvent.maxTeams) * 100))}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (tEvent.enrolledCount / tEvent.maxTeams) * 100)}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-brand-red to-brand-red-dark rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Registration / Fee info */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                        {event.registrationMode !== 'NONE' && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {REGISTRATION_MODE_LABELS[event.registrationMode]}
                          </span>
                        )}
                        {event.paymentRequired && event.registrationFee && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <DollarSign className="w-3 h-3" />
                            {event.registrationFee} Birr
                          </span>
                        )}
                        {event.registrationDeadline && (
                          <span className="text-slate-400">· until {new Date(event.registrationDeadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-5 flex gap-2">
                      <button onClick={() => {
                        if (isTournament && onViewTournament) {
                          onViewTournament(event.id);
                        } else {
                          setDetailEvent(event);
                        }
                      }}
                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border border-slate-200 hover:bg-brand-blue/10 hover:text-brand-blue hover:border-brand-blue/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" /> Details
                      </button>
                      {isTournament && tEvent.isClosed ? (
                        <div className="flex-1 bg-slate-200 text-slate-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Tournament Closed
                        </div>
                      ) : (
                        <EventRegisterButton
                          event={event}
                          currentUser={currentUser}
                          isRegistered={isRegistered(event.id)}
                          onRegister={() => openRegModal(event)}
                          onNavigateLogin={onNavigateLogin}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
      </>

      {/* ════════════════════════════════════════ */}
      {/* VEX RULES — hidden by default, toggleable */}
      {/* ════════════════════════════════════════ */}
      <div id="rules" className="scroll-mt-24">
        <button onClick={() => setShowRules(p => !p)}
          className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:bg-slate-50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">VEX Robotics Competition Rules</p>
              <p className="text-[10px] text-slate-500">Alliance format, scoring, and match regulations</p>
            </div>
          </div>
          <motion.div animate={{ rotate: showRules ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showRules && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl p-6 md:p-8">
                <VexRulesPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* REGISTRATION MODAL */}
      {/* ════════════════════════════════════════ */}
      {regTarget && (
        <EventRegistrationModal
          event={regTarget}
          currentUser={currentUser}
          isRegistered={isRegistered(regTarget.id)}
          onClose={() => setRegTarget(null)}
          onSuccess={handleRegistrationSuccess}
          onNavigateLogin={onNavigateLogin}
        />
      )}

      {/* ════════════════════════════════════════ */}
      {/* EVENT DETAIL MODAL */}
      {/* ════════════════════════════════════════ */}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          currentUser={currentUser}
          isRegistered={isRegistered(detailEvent.id)}
          onRegister={() => {
            setDetailEvent(null);
            openRegModal(detailEvent);
          }}
          onNavigateLogin={onNavigateLogin}
          onViewFull={detailEvent.eventType === 'TOURNAMENT' && onViewTournament ? () => {
            setDetailEvent(null);
            onViewTournament(detailEvent.id);
          } : undefined}
        />
      )}

      {/* ════════════════════════════════════════ */}
      {/* LARGE SCREEN MATCH VIEW */}
      {/* ════════════════════════════════════════ */}
      {showMatchView && (
        <MatchViewOverlay
          teams={teams}
          onClose={() => setShowMatchView(false)}
          onViewTournament={onViewTournament}
        />
      )}
    </div>
  );
}


