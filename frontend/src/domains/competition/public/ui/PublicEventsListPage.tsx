import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, ArrowUpDown, Calendar, Filter, Loader2, MapPin, RotateCcw, Search, ShieldAlert, Tag, X,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import * as eventsApi from '@/domains/competition/api/eventsApi';

type SortId =
  | 'start_asc'
  | 'start_desc'
  | 'created_desc';

type ListState = 'loading' | 'ready' | 'error';

function safeLower(s: unknown): string {
  return String(s ?? '').toLowerCase();
}

function asDate(value: string | undefined | null): number {
  if (!value) return Number.NaN;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : Number.NaN;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function EventRow({ e, onOpen }: { e: eventsApi.BackendEvent; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-premium-sm hover:border-brand-red/20 transition-all"
    >
      <div className="flex gap-4 items-start">
        <div className="w-28 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
          {e.banner ? (
            <img
              src={e.banner}
              alt={e.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {e.event_type} · {e.status}
              </p>
              <h3 className="mt-1 font-black text-sm md:text-base text-slate-900 truncate">{e.title}</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-white">
              {e.visibility}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">{e.description || 'No description provided.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(e.start_datetime)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl max-w-[260px]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{e.location || '—'}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

interface PublicEventsListPageProps {
  currentUser: UserProfile | null;
  onNavigateLogin?: () => void;
  initialQuery?: string;
  onBack: () => void;
  onOpenEvent: (eventId: string) => void;
  onOpenTournament: (eventId: string) => void;
}

export default function PublicEventsListPage({
  initialQuery,
  onBack,
  onOpenEvent,
}: PublicEventsListPageProps) {
  const [state, setState] = useState<ListState>('loading');
  const [error, setError] = useState<string | null>(null);

  const [raw, setRaw] = useState<eventsApi.BackendEvent[]>([]);

  // Filters
  const [search, setSearch] = useState(initialQuery ?? '');
  const [eventType, setEventType] = useState<string>('all');
  const [branch, setBranch] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>(''); // yyyy-mm-dd
  const [sort, setSort] = useState<SortId>('start_asc');

  const load = () => {
    setState('loading');
    setError(null);
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    if (eventType !== 'all') params.event_type = eventType;
    if (branch !== 'all') params.branch = branch;
    if (location !== 'all') params.location = location;
    if (status !== 'all') params.status = status;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (sort === 'start_asc') params.ordering = 'start_datetime';
    if (sort === 'start_desc') params.ordering = '-start_datetime';
    if (sort === 'created_desc') params.ordering = '-created_at';

    eventsApi.getPublicEvents(Object.keys(params).length ? params : undefined)
      .then(list => {
        setRaw(Array.isArray(list) ? list : []);
        setState('ready');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setState('error');
      });
  };

  useEffect(() => { load(); }, []);

  const branchOptions = useMemo(() => {
    const set = new Set<string>();
    raw.forEach(e => { if (e.branch) set.add(String(e.branch)); });
    return Array.from(set).sort();
  }, [raw]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    raw.forEach(e => { if (e.location) set.add(e.location); });
    return Array.from(set).sort();
  }, [raw]);

  const statusOptions = useMemo(() => Array.from(new Set(raw.map(e => e.status))).sort(), [raw]);

  const filtered = useMemo(() => {
    // Client-side fallback filtering (backend may already filter; we mirror it for resilience)
    let list = [...raw];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(e =>
        safeLower(e.title).includes(q) ||
        safeLower(e.description).includes(q) ||
        safeLower(e.location).includes(q) ||
        safeLower(e.branch_name).includes(q) ||
        safeLower(e.event_type).includes(q),
      );
    }
    if (eventType !== 'all') list = list.filter(e => e.event_type === eventType);
    if (branch !== 'all') list = list.filter(e => String(e.branch ?? '') === branch);
    if (location !== 'all') list = list.filter(e => e.location === location);
    if (status !== 'all') list = list.filter(e => e.status === status);

    const startTs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : Number.NaN;
    const endTs = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Number.NaN;
    if (Number.isFinite(startTs)) list = list.filter(e => asDate(e.start_datetime) >= startTs);
    if (Number.isFinite(endTs)) list = list.filter(e => asDate(e.start_datetime) <= endTs);

    if (sort === 'start_asc') list.sort((a, b) => (asDate(a.start_datetime) - asDate(b.start_datetime)));
    if (sort === 'start_desc') list.sort((a, b) => (asDate(b.start_datetime) - asDate(a.start_datetime)));
    if (sort === 'created_desc') list.sort((a, b) => (asDate(b.created_at) - asDate(a.created_at)));
    return list;
  }, [raw, search, eventType, branch, location, status, startDate, endDate, sort]);

  const clearFilters = () => {
    setSearch('');
    setEventType('all');
    setBranch('all');
    setLocation('all');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setSort('start_asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="mt-2 font-black text-xl md:text-2xl text-slate-900 tracking-tight">Explore events</h1>
          <p className="text-xs text-slate-500 mt-1">Search and filter using the existing backend query parameters (with a safe client-side fallback).</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 hover:border-slate-300"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-red" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-700">Filters</p>
          <div className="flex-1" />
          <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            onClick={() => load()}
            className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-2 rounded-xl hover:bg-slate-800"
          >
            Apply
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="xl:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, location, type…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Type</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red">
                <option value="all">All</option>
                <option value="TOURNAMENT">Tournament</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red">
              <option value="all">All</option>
              {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red">
              <option value="all">All</option>
              {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red">
              <option value="all">All</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Date from</label>
            <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Date to</label>
            <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div className="xl:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Sort</label>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-brand-red">
                <option value="start_asc">Start date (soonest)</option>
                <option value="start_desc">Start date (latest)</option>
                <option value="created_desc">Newest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {state === 'loading' && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-bold">Loading events…</span>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-base font-bold text-red-700">Failed to load events</p>
          <p className="text-xs text-red-700/80 mt-1">{error}</p>
          <button onClick={() => load()} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-700">
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {state === 'ready' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-500">
              Showing <span className="font-black text-slate-700 tabular-nums">{filtered.length}</span> event{filtered.length === 1 ? '' : 's'}
            </p>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Filtered by date range when set
            </div>
          </div>

          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-dashed border-slate-200 rounded-3xl p-14 text-center">
              <p className="text-sm font-black text-slate-700">No events found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting filters or clearing the search.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map(e => (
                <EventRow key={e.id} e={e} onOpen={() => onOpenEvent(e.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

