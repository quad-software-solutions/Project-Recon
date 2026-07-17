import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Calendar, ExternalLink, Image as ImageIcon, Loader2, MapPin, RotateCcw,
  ShieldAlert, Sparkles, Ticket, Trophy, Users, Video, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import * as eventsApi from '@/domains/competition/api/eventsApi';
import {
  getMyRegistrations,
  getTournamentById,
  getWorkshopById,
  resolveTournamentIdForEvent,
} from '@/domains/competition/api/competitionApi';
import { listPublicMatchesForTournament } from '@/domains/competition/api/matchApi';
import { fetchTournamentStandings } from '@/domains/competition/api/matchApi';
import type { Tournament, Workshop } from '@/shared/types';
import EventRegisterButton from '@/domains/competition/shared/EventRegisterButton';
import EventRegistrationModal from '@/domains/competition/shared/EventRegistrationModal';

type DetailState = 'loading' | 'ready' | 'error';

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(ms: number): string {
  const total = Math.max(0, ms);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function isPermissionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('403') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden');
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon ? <Icon className="w-4 h-4 text-brand-red" /> : null}
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status, derived }: { status: string; derived: { isLive: boolean; isUpcoming: boolean; isPast: boolean } | null }) {
  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-3 py-1.5 rounded-full border border-red-200">
        <XCircle className="w-3 h-3" />
        Cancelled
      </span>
    );
  }
  if (status === 'COMPLETED' || derived?.isPast) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full border border-slate-300">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    );
  }
  if (derived?.isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg shadow-red-600/20">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Live
      </span>
    );
  }
  if (derived?.isUpcoming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
        <Clock className="w-3 h-3" />
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/15">
      {status}
    </span>
  );
}

function Countdown({ target, label }: { target: number; label: string }) {
  const [delta, setDelta] = useState(() => target - Date.now());

  useEffect(() => {
    setDelta(target - Date.now());
    const id = setInterval(() => setDelta(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (delta <= 0) return null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white tabular-nums tracking-tight">{formatDuration(delta)}</p>
    </div>
  );
}

interface PublicEventDetailsPageProps {
  currentUser: UserProfile | null;
  onNavigateLogin?: () => void;
  eventId: string;
  onBack: () => void;
  onOpenTournament: (eventId: string) => void;
  onOpenMatch: (matchId: string, tournamentId?: string | null) => void;
  onOpenEvent: (eventId: string) => void;
}

export default function PublicEventDetailsPage({
  currentUser,
  onNavigateLogin,
  eventId,
  onBack,
  onOpenTournament,
  onOpenMatch,
  onOpenEvent,
}: PublicEventDetailsPageProps) {
  const [state, setState] = useState<DetailState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [event, setEvent] = useState<eventsApi.BackendEvent | null>(null);

  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [standings, setStandings] = useState<eventsApi.BackendStanding[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const [related, setRelated] = useState<eventsApi.BackendEvent[]>([]);

  const [eventModel, setEventModel] = useState<Tournament | Workshop | null>(null);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [regTarget, setRegTarget] = useState<Tournament | Workshop | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(() => {
    setState('loading');
    setError(null);
    setPermissionDenied(false);
    setEventModel(null);

    eventsApi.getPublicEventDetail(eventId)
      .then(async (e) => {
        setEvent(e);
        setState('ready');

        try {
          const rel = await eventsApi.getPublicEvents({ event_type: e.event_type, status: 'PUBLISHED' });
          setRelated((rel || []).filter(x => x.id !== e.id).slice(0, 6));
        } catch {
          setRelated([]);
        }

        if (e.event_type === 'TOURNAMENT') {
          try {
            const tid = await resolveTournamentIdForEvent(e.id);
            setTournamentId(tid);
            const model = await getTournamentById(e.id);
            setEventModel(model);
            if (tid) {
              const [s, m] = await Promise.all([
                fetchTournamentStandings(tid).catch(() => []),
                listPublicMatchesForTournament(tid).catch(() => []),
              ]);
              setStandings(s || []);
              setMatches(m || []);
            }
          } catch {
            setTournamentId(null);
          }
        } else if (e.event_type === 'WORKSHOP') {
          try {
            const model = await getWorkshopById(e.id);
            setEventModel(model);
          } catch {
            setEventModel(null);
          }
        } else {
          setTournamentId(null);
          setStandings([]);
          setMatches([]);
        }
      })
      .catch((err) => {
        if (isPermissionError(err)) {
          setPermissionDenied(true);
          setError('You don\'t have permission to view this event.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load event');
        }
        setState('error');
      });
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!currentUser) { setRegisteredIds([]); return; }
    getMyRegistrations()
      .then(regs => {
        setRegisteredIds(
          regs
            .filter((r: any) => r.registration_status === 'PENDING' || r.registration_status === 'APPROVED')
            .map((r: any) => r.event),
        );
      })
      .catch(() => setRegisteredIds([]));
  }, [currentUser, eventId]);

  const derived = useMemo(() => {
    if (!event) return null;
    const start = new Date(event.start_datetime).getTime();
    const endStr = event.end_datetime;
    const end = endStr ? new Date(endStr).getTime() : NaN;
    const isValidStart = Number.isFinite(start);
    const isValidEnd = Number.isFinite(end);
    const isLive = isValidStart && isValidEnd && now >= start && now <= end;
    const isUpcoming = isValidStart && now < start;
    const isPast = (isValidEnd && now > end) || (isValidStart && !isValidEnd && now > start);
    return { isLive, isUpcoming, isPast, start, end: isValidEnd ? end : null };
  }, [event, now]);

  const countdownTarget = useMemo(() => {
    if (!derived || !event) return null;
    if (derived.isUpcoming && derived.start) return { target: derived.start, label: 'Starts in' };
    if (derived.isLive && derived.end) return { target: derived.end, label: 'Ends in' };
    return null;
  }, [derived, event]);

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

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-red">
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="aspect-[21/9] bg-slate-100 overflow-hidden">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-slate-300" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/90 text-slate-900 px-3 py-1.5 rounded-full border border-white/60">
                  <Sparkles className="w-3.5 h-3.5 text-brand-red" />
                  {event.event_type}
                </span>
                <StatusBadge status={event.status} derived={derived} />
              </div>
              <h1 className="text-white font-black tracking-tight" style={{ fontSize: 'clamp(22px, 4vw, 40px)' }}>
                {event.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.start_datetime)} · {formatDateTime(event.start_datetime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.location || '—'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {event.youtube_live_url ? (
                <a
                  href={event.youtube_live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/15"
                >
                  <Video className="w-4 h-4" />
                  Watch
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {event.event_type === 'TOURNAMENT' && (
                <button
                  onClick={() => onOpenTournament(event.id)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-red/20"
                >
                  <Trophy className="w-4 h-4" />
                  Tournament
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="space-y-6">
          <Section title="About" icon={Sparkles}>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </p>
          </Section>

          {(event.branch_name || event.branch || event.registration_deadline || event.capacity || event.registration_mode || event.registration_fee) && (
            <Section title="Event information" icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {event.branch_name || event.branch ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Branch</p>
                    <p className="mt-1 font-bold text-slate-800">{event.branch_name || event.branch}</p>
                  </div>
                ) : null}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date range</p>
                  <p className="mt-1 font-bold text-slate-800">{formatDate(event.start_datetime)} → {formatDate(event.end_datetime)}</p>
                </div>
                {event.registration_deadline ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registration deadline</p>
                    <p className="mt-1 font-bold text-slate-800">{formatDateTime(event.registration_deadline)}</p>
                  </div>
                ) : null}
                {event.capacity ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capacity</p>
                    <p className="mt-1 font-bold text-slate-800">{event.enrolled_count} / {event.capacity}</p>
                  </div>
                ) : null}
              </div>
            </Section>
          )}

          {/* Tournament preview */}
          {event.event_type === 'TOURNAMENT' && (
            <Section title="Tournament snapshot" icon={Trophy}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{standings.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teams</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{matches.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Matches</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{matches.filter(m => m.status === 'LIVE').length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{matches.filter(m => m.status === 'COMPLETED').length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Completed</p>
                </div>
              </div>

              {tournamentId && matches.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matches.slice(0, 4).map(m => (
                    <button
                      key={m.id}
                      onClick={() => onOpenMatch(m.id, tournamentId)}
                      className="bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-brand-red/20 hover:shadow-premium-sm transition-all"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.round}</p>
                      <p className="mt-1 text-sm font-black text-slate-900">{m.status}</p>
                      <p className="mt-2 text-xs text-slate-600">{formatDateTime(m.scheduledAt || m.scheduled_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Related events */}
          {related.length > 0 && (
            <Section title="Related events" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {related.map(r => (
                  <button
                    key={r.id}
                    onClick={() => onOpenEvent(r.id)}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left hover:bg-white hover:border-slate-200 transition-all"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{r.event_type}</p>
                    <p className="mt-1 font-black text-sm text-slate-900 line-clamp-1">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-1">{formatDate(r.start_datetime)} · {r.location || '—'}</p>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Registration / CTA column */}
        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sticky top-24">
            {countdownTarget && (
              <div className="mb-4">
                <Countdown target={countdownTarget.target} label={countdownTarget.label} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-brand-red" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-700">Registration</p>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Enabled</span>
                <span className={`font-black ${event.registration_enabled ? 'text-emerald-600' : 'text-slate-500'}`}>{event.registration_enabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mode</span>
                <span className="font-black text-slate-800">{event.registration_mode || 'NONE'}</span>
              </div>
              {event.payment_required && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment</span>
                  <span className="font-black text-amber-700">{event.registration_fee ? `${event.registration_fee} Birr` : 'Required'}</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              {eventModel ? (
                <div className="flex flex-col gap-2">
                  <EventRegisterButton
                    event={eventModel}
                    currentUser={currentUser}
                    isRegistered={registeredIds.includes(eventModel.id)}
                    onRegister={() => setRegTarget(eventModel)}
                    onNavigateLogin={() => {
                      onBack();
                      onNavigateLogin?.();
                    }}
                    className="!py-3.5 !rounded-2xl !text-xs w-full"
                  />
                  {event.event_type === 'TOURNAMENT' && (
                    <button
                      onClick={() => onOpenTournament(event.id)}
                      className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      View tournament
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onOpenTournament(event.id)}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Open event
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {regTarget && (
        <EventRegistrationModal
          event={regTarget}
          currentUser={currentUser}
          isRegistered={registeredIds.includes(regTarget.id)}
          onClose={() => setRegTarget(null)}
          onSuccess={(id) => setRegisteredIds(prev => (prev.includes(id) ? prev : [...prev, id]))}
          onNavigateLogin={onNavigateLogin}
        />
      )}
    </div>
  );
}
