import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Award, Calendar, Gamepad2, Loader2, MapPin, Medal, RotateCcw,
  ShieldAlert, Trophy, Users,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import type { BackendEvent, BackendStanding, BackendTournament, BackendMatch } from '@/domains/competition/api/eventsApi';
import * as eventsApi from '@/domains/competition/api/eventsApi';
import { resolveTournamentIdForEvent } from '@/domains/competition/api/competitionApi';

type PageState = 'loading' | 'ready' | 'error';
type TabId = 'overview' | 'teams' | 'schedule' | 'results' | 'brackets';

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isPermissionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('403') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden');
}

interface PublicTournamentPageProps {
  eventId: string; // event UUID (tournament event)
  currentUser: UserProfile | null;
  onNavigateLogin?: () => void;
  onBack: () => void;
  onOpenMatch: (matchId: string, tournamentId?: string | null) => void;
  onOpenEvent: (eventId: string) => void;
}

export default function PublicTournamentPage({ eventId, onBack, onOpenMatch }: PublicTournamentPageProps) {
  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [tab, setTab] = useState<TabId>('overview');

  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [tournament, setTournament] = useState<BackendTournament | null>(null);
  const [standings, setStandings] = useState<BackendStanding[]>([]);
  const [winner, setWinner] = useState<BackendStanding | null>(null);
  const [matches, setMatches] = useState<BackendMatch[]>([]);

  const load = () => {
    setState('loading');
    setError(null);
    setPermissionDenied(false);

    eventsApi.getPublicEventDetail(eventId)
      .then(async (e) => {
        setEvent(e);
        const tid = await resolveTournamentIdForEvent(eventId);
        setTournamentId(tid);
        if (!tid) {
          setTournament(null);
          setStandings([]);
          setWinner(null);
          setMatches([]);
          setState('ready');
          return;
        }

        const [t, s, w, m] = await Promise.all([
          eventsApi.getPublicTournamentDetail(tid).catch(() => null),
          eventsApi.getPublicTournamentStandings(tid).catch(() => []),
          eventsApi.getPublicTournamentWinner(tid).catch(() => null),
          eventsApi.getPublicTournamentMatches(tid).catch(() => []),
        ]);
        setTournament(t as any);
        setStandings(Array.isArray(s) ? s : []);
        setWinner((w as any) || null);
        setMatches(Array.isArray(m) ? m : []);
        setState('ready');
      })
      .catch((err) => {
        if (isPermissionError(err)) {
          setPermissionDenied(true);
          setError('You don’t have permission to view this tournament.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load tournament');
        }
        setState('error');
      });
  };

  useEffect(() => { load(); }, [eventId]);

  const sortedStandings = useMemo(() => {
    const list = [...standings];
    list.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    return list;
  }, [standings]);

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'LIVE'), [matches]);
  const scheduledMatches = useMemo(() => matches.filter(m => m.status === 'SCHEDULED'), [matches]);
  const completedMatches = useMemo(() => matches.filter(m => m.status === 'COMPLETED'), [matches]);

  if (state === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (state === 'error' || !event) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-red">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className={`${permissionDenied ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-3xl p-10 text-center`}>
          <ShieldAlert className={`w-10 h-10 mx-auto mb-3 ${permissionDenied ? 'text-amber-500' : 'text-red-400'}`} />
          <p className={`text-base font-bold ${permissionDenied ? 'text-amber-800' : 'text-red-700'}`}>{error || 'Not found'}</p>
          <button
            onClick={() => load()}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl ${
              permissionDenied ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'teams', label: 'Teams & Rankings', icon: Medal },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'brackets', label: 'Brackets', icon: Gamepad2 },
  ];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-red">
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </button>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white border border-slate-700/60">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-red/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-blue/10 blur-3xl" />

        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Trophy className="w-3.5 h-3.5" />
                  Tournament
                </span>
                {liveMatches.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-200 px-3 py-1.5 rounded-full border border-red-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    {liveMatches.length} Live
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-black tracking-tight" style={{ fontSize: 'clamp(22px, 4vw, 40px)' }}>
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(event.start_datetime)} → {formatDateTime(event.end_datetime)}
                </span>
                <span className="w-3 h-px bg-white/15 shrink-0 hidden sm:block" />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.location || '—'}
                </span>
              </div>
            </div>
          </div>

          {winner?.team_name && (
            <div className="mt-5 inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Winner</p>
                <p className="text-base font-black text-white">{winner.team_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats strip — spans full width below */}
        <div className="border-t border-white/10 px-6 md:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Teams', value: sortedStandings.length, icon: Users },
              { label: 'Matches', value: matches.length, icon: Gamepad2 },
              { label: 'Completed', value: completedMatches.length, icon: Award },
              { label: 'Prize pool', value: tournament?.prize_pool || '—', icon: Trophy },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{s.label}</p>
                  <p className="text-base font-black text-white tabular-nums leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
              tab === t.id
                ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-md shadow-brand-red/20 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-4">About</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
          </div>
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-4">Next matches</h2>
              {scheduledMatches.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No scheduled matches yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {scheduledMatches.slice(0, 5).map(m => (
                    <button
                      key={m.id}
                      onClick={() => onOpenMatch(m.id, tournamentId)}
                      className="w-full text-left bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{m.round || 'Match'}</p>
                          <p className="mt-1 text-sm font-black text-slate-900">{formatDateTime(m.scheduled_at)}</p>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-slate-200/60 group-hover:bg-brand-red/10 flex items-center justify-center shrink-0 transition-colors">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-red" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'teams' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {sortedStandings.length === 0 ? (
            <div className="p-14 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-700">No teams yet</p>
              <p className="text-xs text-slate-400 mt-1">Rankings will appear once teams are registered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-16">Rank</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Team</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-14">W</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-14">L</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-14">D</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-14">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStandings.map((s, idx) => {
                    const rank = s.rank ?? idx + 1;
                    const isTop3 = rank <= 3;
                    return (
                      <tr key={`${s.team_id}-${idx}`} className={`hover:bg-slate-50/80 transition-colors ${isTop3 ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {isTop3 ? (
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                rank === 1 ? 'bg-amber-400 text-white' : rank === 2 ? 'bg-slate-400 text-white' : 'bg-amber-700 text-white'
                              }`}>{rank}</span>
                            ) : (
                              <span className="w-6 text-sm font-bold text-slate-500 text-center">{rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{s.team_name}</div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm font-black text-emerald-600">{s.wins}</td>
                        <td className="px-5 py-3.5 text-center text-sm font-black text-red-500">{s.losses}</td>
                        <td className="px-5 py-3.5 text-center text-sm font-bold text-slate-500">{s.draws}</td>
                        <td className="px-5 py-3.5 text-center text-sm font-black text-slate-900">{s.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-5">
          {liveMatches.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-3xl p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-widest text-red-700">Live matches</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveMatches.map(m => (
                  <button key={m.id} onClick={() => onOpenMatch(m.id, tournamentId)} className="bg-white border border-red-200 rounded-2xl p-4 text-left hover:border-red-300 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{m.round || 'Match'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <p className="font-black text-sm text-red-600 uppercase tracking-wider">Live</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">{formatDateTime(m.started_at || m.scheduled_at)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-4">Upcoming schedule</h2>
            {scheduledMatches.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No scheduled matches yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduledMatches.map(m => (
                  <button key={m.id} onClick={() => onOpenMatch(m.id, tournamentId)} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all group">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{m.round || 'Match'}</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{formatDateTime(m.scheduled_at)}</p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-slate-200/60 group-hover:bg-brand-red/10 flex items-center justify-center shrink-0 transition-colors">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-red" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-4">Match results</h2>
          {completedMatches.length === 0 ? (
            <div className="text-center py-6">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No completed matches yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedMatches.map(m => (
                <button key={m.id} onClick={() => onOpenMatch(m.id, tournamentId)} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all group">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{m.round || 'Match'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Award className="w-3 h-3 text-emerald-500" />
                        <p className="font-black text-sm text-emerald-600 uppercase tracking-wider">Completed</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{formatDateTime(m.completed_at || m.scheduled_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'brackets' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-700">Brackets</p>
          <p className="text-xs text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            The current backend exposes matches and standings. When bracket metadata is available from the API, this section will render it automatically.
            For now, use the Schedule and Results tabs.
          </p>
        </motion.div>
      )}
    </div>
  );
}

