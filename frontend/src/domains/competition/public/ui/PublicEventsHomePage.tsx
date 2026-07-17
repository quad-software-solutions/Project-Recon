import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, Calendar, MapPin, Search, Sparkles, Trophy, Video, Zap,
  AlertCircle, RotateCcw, Layers3, Users, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import * as eventsApi from '@/domains/competition/api/eventsApi';
import { cmsPublicApi, type MapNodeResponse } from '@/domains/cms/public/api/cmsPublicApi';

type LoadState = 'loading' | 'ready' | 'error';

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function clampText(text: string, fallback = '—'): string {
  const t = (text || '').trim();
  return t.length ? t : fallback;
}

function computedState(e: eventsApi.BackendEvent): 'live' | 'upcoming' | 'ended' {
  const start = new Date(e.start_datetime).getTime();
  const end = e.end_datetime ? new Date(e.end_datetime).getTime() : NaN;
  const now = Date.now();
  const isValidStart = Number.isFinite(start);
  const isValidEnd = Number.isFinite(end);
  if (e.status === 'CANCELLED' || e.status === 'COMPLETED') return 'ended';
  if (isValidStart && isValidEnd && now >= start && now <= end) return 'live';
  if (isValidStart && now < start) return 'upcoming';
  return 'ended';
}

function EventBadge({ e, state: st }: { e: eventsApi.BackendEvent; state: ReturnType<typeof computedState> }) {
  if (e.status === 'CANCELLED') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200"><XCircle className="w-3 h-3" /> Cancelled</span>;
  }
  if (st === 'ended' || e.status === 'COMPLETED') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Ended</span>;
  }
  if (st === 'live') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2.5 py-1 rounded-full shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live</span>;
  }
  if (st === 'upcoming') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200"><Clock className="w-3 h-3" /> Upcoming</span>;
  }
  return null;
}

function EventCard({
  e,
  onOpen,
}: {
  e: eventsApi.BackendEvent;
  onOpen: () => void;
}) {
  const state = useMemo(() => computedState(e), [e]);

  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative">
        <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
          {e.banner ? (
            <img
              src={e.banner}
              alt={e.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-100" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/90 text-slate-900 px-2.5 py-1 rounded-full border border-white/60">
            {e.event_type}
          </span>
          <EventBadge e={e} state={state} />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-black text-base leading-snug line-clamp-2 drop-shadow">{clampText(e.title)}</h3>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{clampText(e.description, 'No description provided yet.')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(e.start_datetime)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl max-w-[220px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{clampText(e.location)}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10">
        <div className="h-5 w-40 bg-slate-100 rounded mb-4" />
        <div className="h-10 w-3/4 bg-slate-100 rounded mb-3" />
        <div className="h-4 w-2/3 bg-slate-100 rounded mb-6" />
        <div className="h-12 w-full bg-slate-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="aspect-[16/9] bg-slate-100" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-28 bg-slate-100 rounded-xl" />
                <div className="h-8 w-40 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PublicEventsHomePageProps {
  currentUser: UserProfile | null;
  onNavigateLogin?: () => void;
  onExplore: () => void;
  onSearch: (query: string) => void;
  onOpenEvent: (eventId: string) => void;
  onOpenTournament: (eventId: string) => void;
  onOpenMatch: (matchId: string, tournamentId?: string | null) => void;
}

export default function PublicEventsHomePage({
  onExplore,
  onSearch,
  onOpenEvent,
}: PublicEventsHomePageProps) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  const [featured, setFeatured] = useState<eventsApi.BackendEvent[]>([]);
  const [upcoming, setUpcoming] = useState<eventsApi.BackendEvent[]>([]);
  const [live, setLive] = useState<eventsApi.BackendEvent[]>([]);
  const [recent, setRecent] = useState<eventsApi.BackendEvent[]>([]);
  const [mapNodes, setMapNodes] = useState<MapNodeResponse[]>([]);

  useEffect(() => {
    cmsPublicApi.getMapNodes().then(data => setMapNodes(
      (Array.isArray(data) ? data : []).filter(n => n.is_active)
    )).catch(() => {});
  }, []);

  const load = () => {
    const abort = new AbortController();
    setState('loading');
    setError(null);

    Promise.all([
      eventsApi.getPublicEvents({ status: 'PUBLISHED' }),
      eventsApi.getUpcomingEvents(),
      eventsApi.getLiveEvents(),
      eventsApi.getPastEvents(),
    ])
      .then(([all, upcomingEvents, liveEvents, pastEvents]) => {
        const published = (all || []).filter(e => e.status === 'PUBLISHED' && e.visibility === 'PUBLIC');
        setFeatured(published.slice(0, 8));
        setUpcoming((upcomingEvents || []).slice(0, 9));
        setLive((liveEvents || []).slice(0, 6));
        setRecent((pastEvents || []).slice(0, 6));
        setState('ready');
      })
      .catch(err => {
        if (abort.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setState('error');
      });

    return () => abort.abort();
  };

  useEffect(() => load(), []);

  const stats = useMemo(() => {
    const total = featured.length;
    const liveCount = live.length;
    const upcomingCount = upcoming.length;
    const recentCount = recent.length;
    return [
      { label: 'Events', value: total, icon: Layers3 },
      { label: 'Upcoming', value: upcomingCount, icon: Calendar },
      { label: 'Live', value: liveCount, icon: Zap },
      { label: 'Recent', value: recentCount, icon: Trophy },
    ];
  }, [featured.length, live.length, upcoming.length, recent.length]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.35) 1px, transparent 0)',
          backgroundSize: '38px 38px',
        }} />
        <div className="absolute -top-28 -right-20 w-[520px] h-[520px] rounded-full bg-brand-red/[0.06] blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[520px] h-[520px] rounded-full bg-brand-blue/[0.06] blur-3xl" />

        <div className="relative p-6 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  Public Events
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
                  <Users className="w-3.5 h-3.5 text-brand-red" />
                  Discover · Register · Watch Live
                </span>
              </div>

              <h1 className="mt-4 font-display font-semibold tracking-tight text-slate-900" style={{ fontSize: 'clamp(28px, 4.5vw, 52px)' }}>
                Find what’s happening — tournaments, workshops, and community events.
              </h1>
              <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
                Explore upcoming events, join in seconds, and follow live matches when available. Built to match the existing backend exactly — with modern UX.
              </p>

              {/* Search */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSearch(query.trim());
                    }}
                    placeholder="Search events by title, location, or type…"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all"
                    aria-label="Search public events"
                  />
                </div>
                <button
                  onClick={() => onSearch(query.trim())}
                  className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-red/20 hover:shadow-xl active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
                >
                  Search
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onExplore}
                  className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
                >
                  Explore all
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:w-[360px]">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-red/5 flex items-center justify-center mb-2">
                    <s.icon className="w-4 h-4 text-brand-red" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {state === 'loading' && <HomeSkeleton />}

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-base font-bold text-red-700">Couldn’t load public events</p>
          <p className="text-xs text-red-600/80 mt-1">{error}</p>
          <button
            onClick={() => load()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {state === 'ready' && (
        <>
          {/* Featured carousel */}
          {featured.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-base md:text-lg text-slate-900 tracking-tight">Featured events</h2>
                  <p className="text-xs text-slate-500">Hand-picked from what’s currently available.</p>
                </div>
                <button onClick={onExplore} className="text-xs font-black uppercase tracking-wider text-brand-red hover:text-brand-red-dark">
                  View all
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {featured.map(e => (
                  <div key={e.id} className="min-w-[320px] max-w-[320px] snap-start">
                    <EventCard e={e} onOpen={() => onOpenEvent(e.id)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          <section id="events" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-red" />
                <h2 className="font-black text-base md:text-lg text-slate-900 tracking-tight">Upcoming</h2>
              </div>
              <button onClick={onExplore} className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900">
                Browse
              </button>
            </div>
            {upcoming.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <p className="text-sm font-bold text-slate-600">No upcoming events yet</p>
                <p className="text-xs text-slate-400 mt-1">When events are scheduled, they’ll appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {upcoming.map(e => (
                  <EventCard key={e.id} e={e} onOpen={() => onOpenEvent(e.id)} />
                ))}
              </div>
            )}
          </section>

          {/* Live */}
          <section id="live-matches" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-500" />
                <h2 className="font-black text-base md:text-lg text-slate-900 tracking-tight">Live now</h2>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {live.length} live
              </div>
            </div>
            {live.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/60 p-10 text-center">
                <Video className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-200">No live events right now</p>
                <p className="text-xs text-slate-400 mt-1">Live streams and match updates appear here when available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {live.map(e => (
                  <EventCard key={e.id} e={e} onOpen={() => onOpenEvent(e.id)} />
                ))}
              </div>
            )}
          </section>

          {/* Recent */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h2 className="font-black text-base md:text-lg text-slate-900 tracking-tight">Recent</h2>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Updated {formatDateTime(new Date().toISOString())}
              </div>
            </div>
            {recent.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <p className="text-sm font-bold text-slate-600">No recent events to show</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {recent.map(e => (
                  <EventCard key={e.id} e={e} onOpen={() => onOpenEvent(e.id)} />
                ))}
              </div>
            )}
          </section>

          {/* Venues */}
          <section id="venues" className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-red" />
              <h2 className="font-black text-base text-slate-900 uppercase tracking-wider">Our Venues</h2>
            </div>
            {mapNodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mapNodes.map(node => (
                  <div key={node.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center mb-3">
                      <MapPin className="w-5 h-5 text-brand-red" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{node.title}</p>
                    <p className="text-xs text-slate-500">{node.city}, {node.country}</p>
                    {node.achievement && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-red mt-2">{node.achievement}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Venue information coming soon</p>
                <p className="text-xs text-slate-400 mt-1">Lab locations will appear here once published</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

