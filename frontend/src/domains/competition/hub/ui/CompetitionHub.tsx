import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy, MapPin, Users, Calendar, ChevronRight, Search, Loader2, AlertCircle,
  Clock, DollarSign, Lock, User, ExternalLink, GraduationCap,
  EyeOff, X, Shield, CheckCircle2, Activity, Zap, Gamepad2, Sparkles, Flame,
} from 'lucide-react';
import { UserProfile, type Tournament, type Workshop } from '@/src/shared/types';
import {
  getTournaments, getWorkshops,
  registerForEvent, getMyRegistrations, type PublicRegistrationData,
} from '../../api/competitionApi';

interface CompetitionHubProps {
  currentUser?: UserProfile | null;
  onViewTournament?: (id: string) => void;
}

type ViewTab = 'tournaments' | 'workshops';
type TimeFilter = 'all' | 'upcoming' | 'live' | 'past';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const COMPUTED_STATE_STYLE: Record<string, string> = {
  FUTURE: 'bg-amber-100 text-amber-700',
  LIVE: 'bg-red-100 text-red-700 animate-pulse',
  PAST: 'bg-slate-100 text-slate-500',
};

export default function CompetitionHub({ currentUser, onViewTournament }: CompetitionHubProps) {
  const [viewTab, setViewTab] = useState<ViewTab>('tournaments');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regTarget, setRegTarget] = useState<{ id: string; title: string } | null>(null);
  const [regForm, setRegForm] = useState<PublicRegistrationData>({ public_full_name: '', public_email: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTournaments(),
      getWorkshops(),
    ]).then(([ts, ws]) => {
      setTournaments(ts);
      setWorkshops(ws);
    }).catch(err => {
      console.error(err);
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

  const events = viewTab === 'tournaments' ? tournaments : workshops;

  const filtered = events.filter(e => {
    if (timeFilter === 'upcoming' && e.computedState !== 'FUTURE') return false;
    if (timeFilter === 'live' && e.computedState !== 'LIVE') return false;
    if (timeFilter === 'past' && e.computedState !== 'PAST') return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const computedCounts = {
    all: events.length,
    upcoming: events.filter(e => e.computedState === 'FUTURE').length,
    live: events.filter(e => e.computedState === 'LIVE').length,
    past: events.filter(e => e.computedState === 'PAST').length,
  };

  const openRegModal = (id: string, title: string) => {
    setRegTarget({ id, title });
    setRegForm({
      public_full_name: currentUser?.name || '',
      public_email: currentUser?.email || '',
      public_phone: currentUser?.phone_number || '',
      public_organization: '',
    });
    setRegError(null);
    setShowRegModal(true);
  };

  const submitRegistration = async () => {
    if (!regTarget) return;
    if (!regForm.public_full_name.trim()) { setRegError('Full name is required.'); return; }
    const email = regForm.public_email.trim();
    if (!email) { setRegError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setRegError('Enter a valid email.'); return; }

    setRegSubmitting(true);
    setRegError(null);
    try {
      await registerForEvent(regTarget.id, regForm);
      setRegisteredIds(prev => [...prev, regTarget.id]);
      setShowRegModal(false);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegSubmitting(false);
    }
  };

  const isRegistered = (id: string) => registeredIds.includes(id);

  const FILTERS: { id: TimeFilter; label: string; icon: typeof Calendar }[] = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'live', label: 'Live', icon: Zap },
    { id: 'past', label: 'Past', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/60 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
              <Trophy className="w-3.5 h-3.5" />
              EthioRobotics
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
              <Sparkles className="w-3 h-3" /> 2025 Season
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Competitions & Events
          </h1>
          <p className="mt-2 text-base text-slate-300">
            Browse upcoming tournaments, workshops, and events. Register to participate and showcase your skills.
          </p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 border border-slate-200 rounded-2xl w-fit">
        {([
          { id: 'tournaments' as ViewTab, label: 'Tournaments', icon: Trophy },
          { id: 'workshops' as ViewTab, label: 'Workshops', icon: GraduationCap },
        ]).map(tab => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
                viewTab === tab.id
                  ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${viewTab}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => {
            const FIcon = f.icon;
            return (
              <button key={f.id} onClick={() => setTimeFilter(f.id)}
                className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  timeFilter === f.id
                    ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <FIcon className="w-3.5 h-3.5" />
                {f.label}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  timeFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                }`}>{computedCounts[f.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button onClick={fetchAll} className="mt-3 text-xs font-bold text-red-600 underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center">
          <Trophy className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="font-black text-xl text-slate-600 mb-1">No {viewTab} Found</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            {search || timeFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : `No published ${viewTab} are available right now.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(event => {
            const isTournament = event.eventType === 'TOURNAMENT';
            return (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-red/20 transition-all group"
              >
                {/* Card header */}
                <div className={`px-5 py-3 flex items-center justify-between ${
                  event.computedState === 'LIVE' ? 'bg-red-50' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isTournament
                        ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/10'
                        : 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10'
                    }`}>
                      {isTournament
                        ? <Trophy className="w-5 h-5 text-amber-600" />
                        : <GraduationCap className="w-5 h-5 text-emerald-600" />
                      }
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{event.eventType}</span>
                      {isTournament && event.category && (
                        <span className="ml-1 text-[9px] font-bold text-slate-400">· {event.category}</span>
                      )}
                    </div>
                  </div>
                  {event.computedState === 'LIVE' && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-red-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 className="font-black text-base text-slate-900 mb-1 leading-tight">{event.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{event.description}</p>

                  {/* Badge row */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[event.storedStatus] || 'bg-slate-100 text-slate-600'}`}>
                      {event.storedStatus}
                    </span>
                    {event.computedState === 'LIVE' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        LIVE
                      </span>
                    )}
                    {event.visibility === 'PRIVATE' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                        <EyeOff className="w-2.5 h-2.5 inline-block mr-0.5" />PRIVATE
                      </span>
                    )}
                  </div>

                  {/* Team capacity bar */}
                  {isTournament && 'maxTeams' in event && event.maxTeams > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                      <Users className="w-3 h-3" />
                      <span>{event.enrolledCount} / {event.maxTeams} teams</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-red rounded-full" style={{ width: `${Math.min(100, (event.enrolledCount / event.maxTeams) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {new Date(event.startDateTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.registrationMode !== 'NONE' && (
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 shrink-0" />
                        Reg: {event.registrationMode}
                        {event.registrationDeadline && (
                          <span className="text-slate-400">(until {new Date(event.registrationDeadline).toLocaleDateString()})</span>
                        )}
                      </div>
                    )}
                    {event.paymentRequired && event.registrationFee && (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <DollarSign className="w-3 h-3 shrink-0" />
                        Fee: {event.registrationFee} ETB
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex gap-2">
                  {isTournament && onViewTournament && (
                    <button onClick={() => onViewTournament(event.id)}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-200 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />Details
                    </button>
                  )}
                  {isRegistered(event.id) ? (
                    <div className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />Registered
                    </div>
                  ) : !event.registrationEnabled ? (
                    <div className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />Closed
                    </div>
                  ) : event.storedStatus !== 'PUBLISHED' ? (
                    <div className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />Not Available
                    </div>
                  ) : event.visibility === 'PRIVATE' && !currentUser ? (
                    <a href="/login"
                      className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-[0.98] transition-all"
                    >
                      <User className="w-4 h-4" />Sign In
                    </a>
                  ) : event.registrationMode === 'STUDENT' && !currentUser ? (
                    <a href="/login"
                      className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />Sign In
                    </a>
                  ) : event.registrationMode === 'STUDENT' && currentUser?.role !== 'Student' ? (
                    <div className="flex-1 bg-amber-50 text-amber-600 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />Students Only
                    </div>
                  ) : event.registrationMode === 'NONE' ? (
                    <div className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />No Registration
                    </div>
                  ) : (
                    <button onClick={() => openRegModal(event.id, event.title)}
                      className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-[0.98] transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      {event.registrationMode === 'PUBLIC' ? 'Register Now' : 'Register'}
                      {event.paymentRequired && event.registrationFee && ` · ${event.registrationFee} ETB`}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowRegModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">Register</h3>
                <p className="text-xs text-slate-500">{regTarget?.title}</p>
              </div>
              <button onClick={() => setShowRegModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {regTarget && (() => {
                const ev = [...tournaments, ...workshops].find(e => e.id === regTarget.id);
                if (ev?.paymentRequired && ev.registrationFee) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[11px] font-bold text-amber-700">Fee: {ev.registrationFee} ETB</p>
                    </div>
                  );
                }
                return null;
              })()}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
                <input value={regForm.public_full_name} onChange={e => setRegForm(p => ({ ...p, public_full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Email *</label>
                <input type="email" value={regForm.public_email} onChange={e => setRegForm(p => ({ ...p, public_email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                <input type="tel" value={regForm.public_phone || ''} onChange={e => setRegForm(p => ({ ...p, public_phone: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Organization</label>
                <input value={regForm.public_organization || ''} onChange={e => setRegForm(p => ({ ...p, public_organization: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              {regError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />{regError}
                </div>
              )}
            </div>
            <div className="p-6 pt-0">
              <button onClick={submitRegistration} disabled={regSubmitting}
                className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl disabled:opacity-50 transition-all"
              >
                {regSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Shield className="w-4 h-4" />Confirm Registration</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
