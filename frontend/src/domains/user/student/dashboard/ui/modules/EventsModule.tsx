import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Calendar, Trophy, ClipboardList, Search, Loader2, MapPin, Clock,
  XCircle, RefreshCw, Eye,
} from 'lucide-react';
import type { UserProfile, Tournament, Workshop } from '@/shared/types';
import {
  getUpcomingEvents, getLiveEvents, getPastEvents, getTournaments, getMyRegistrations,
} from '@/domains/competition/api/competitionApi';
import { cancelMyRegistration, type BackendEventRegistration } from '@/domains/competition/api/eventsApi';
import EventRegistrationModal from '@/domains/competition/shared/EventRegistrationModal';
import PageHeader from '../../../shared/ui/PageHeader';
import TabBar from '../../../shared/ui/TabBar';
import EmptyState from '../../../shared/ui/EmptyState';
import { GridSkeleton } from '../../../shared/ui/LoadingSkeleton';
import Leaderboard from '../Leaderboard';

interface Props {
  currentUser: UserProfile;
}

const REG_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

export default function EventsModule({ currentUser }: Props) {
  const [tab, setTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<(Tournament | Workshop)[]>([]);
  const [liveEvents, setLiveEvents] = useState<(Tournament | Workshop)[]>([]);
  const [pastEvents, setPastEvents] = useState<(Tournament | Workshop)[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<BackendEventRegistration[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [regTarget, setRegTarget] = useState<Tournament | Workshop | null>(null);
  const [detailTarget, setDetailTarget] = useState<Tournament | Workshop | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [evts, live, past, tourns, regs] = await Promise.all([
        getUpcomingEvents(),
        getLiveEvents(),
        getPastEvents(),
        getTournaments(),
        getMyRegistrations(),
      ]);
      setEvents(evts);
      setLiveEvents(live);
      setPastEvents(past);
      setTournaments(tourns);
      setRegistrations(regs);
      setRegisteredIds(new Set(regs.filter(r => r.registration_status !== 'CANCELLED').map(r => r.event)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter(e => !q || e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q));
  }, [events, search]);

  const filteredTournaments = useMemo(() => {
    const q = search.toLowerCase();
    return tournaments.filter(t => !q || t.title.toLowerCase().includes(q));
  }, [tournaments, search]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    setError(null);
    try {
      await cancelMyRegistration(id);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, registration_status: 'CANCELLED' as const } : r));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel registration.');
    } finally {
      setCancelling(null);
    }
  };

  const tabs = [
    { id: 'browse', label: 'Upcoming' },
    { id: 'live', label: 'Live', count: liveEvents.length },
    { id: 'past', label: 'Past' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'registrations', label: 'My Registrations', count: registrations.filter(r => r.registration_status !== 'CANCELLED').length },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <div>
      <PageHeader
        title="Events & Tournaments"
        subtitle="Browse, register, and track your event participation"
        icon={Calendar}
        actions={
          <button onClick={load} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events and tournaments..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:border-blue-400"
        />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <GridSkeleton count={3} />
      ) : (
        <>
          {tab === 'browse' && renderEventList({ list: filteredEvents, type: 'upcoming', onDetail: setDetailTarget, onRegister: setRegTarget })}
          {tab === 'live' && renderEventList({ list: liveEvents, type: 'live', onDetail: setDetailTarget, onRegister: setRegTarget })}
          {tab === 'past' && renderEventList({ list: pastEvents, type: 'past', onDetail: setDetailTarget, onRegister: setRegTarget })}
          {tab === 'tournaments' && (
            <div className="space-y-4">
              {filteredTournaments.length > 0 ? filteredTournaments.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white border border-brand-border rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900">{t.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{t.category}</p>
                      {t.prizePool && <p className="text-xs text-emerald-600 font-medium mt-1">Prize: {t.prizePool}</p>}
                      {t.isClosed && <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Closed</span>}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="bg-white border border-brand-border rounded-2xl">
                  <EmptyState icon={Trophy} title="No tournaments available" />
                </div>
              )}
            </div>
          )}
          {tab === 'registrations' && (
            <div className="space-y-4">
              {registrations.length > 0 ? registrations.map(reg => (
                <div key={reg.id} className="bg-white border border-brand-border rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900">{reg.event_title || 'Event'}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${REG_STATUS_STYLES[reg.registration_status] || 'bg-slate-100 text-slate-600'}`}>
                          {reg.registration_status}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(reg.registered_at).toLocaleDateString()}
                        </span>
                      </div>
                      {reg.event_location && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{reg.event_location}</p>}
                    </div>
                    {(reg.registration_status === 'PENDING' || reg.registration_status === 'APPROVED') && (
                      <button
                        onClick={() => handleCancel(reg.id)}
                        disabled={cancelling === reg.id}
                        className="shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
                      >
                        {cancelling === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="bg-white border border-brand-border rounded-2xl">
                  <EmptyState icon={ClipboardList} title="No event registrations" description="Browse events and register to participate." />
                </div>
              )}
            </div>
          )}
          {tab === 'leaderboard' && <Leaderboard />}
        </>
      )}

      {regTarget && (
        <EventRegistrationModal
          event={regTarget}
          currentUser={currentUser}
          isRegistered={registeredIds.has(regTarget.id)}
          onClose={() => setRegTarget(null)}
          onSuccess={() => {
            load();
            setRegTarget(null);
          }}
          onNavigateLogin={() => { /* handled by auth */ }}
        />
      )}

      {detailTarget && (
        <EventDetailModal event={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: Tournament | Workshop; onClose: () => void }) {
  const isTournament = event.eventType === 'TOURNAMENT';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-brand-border max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-brand-border/50 flex items-center justify-between p-4 rounded-t-2xl">
          <h3 className="font-bold text-brand-ink">{event.title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-surface transition-colors">
            <XCircle className="w-5 h-5 text-brand-muted" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isTournament ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {event.eventType}
          </span>
          <p className="text-brand-muted leading-relaxed">{event.description}</p>
          <div className="space-y-2 text-xs text-brand-muted">
            <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(event.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            {event.location && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {event.location}</p>}
            {isTournament && (event as Tournament).prizePool && <p className="flex items-center gap-2 text-emerald-600 font-medium">Prize: {(event as Tournament).prizePool}</p>}
            {event.capacity > 0 && <p className="flex items-center gap-2">Capacity: {event.enrolledCount}/{event.capacity}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderEventList({ list, type, onDetail, onRegister }: {
  list: (Tournament | Workshop)[];
  type: 'upcoming' | 'live' | 'past';
  onDetail: (e: Tournament | Workshop) => void;
  onRegister: (e: Tournament | Workshop) => void;
}) {
  if (list.length === 0) {
    const titles: Record<string, string> = { upcoming: 'No upcoming events', live: 'No live events', past: 'No past events' };
    const descs: Record<string, string> = { upcoming: 'Check back later for new events.', live: 'No events are currently live.', past: 'No completed events yet.' };
    return <div className="bg-white border border-brand-border rounded-2xl">
      <EmptyState icon={Calendar} title={titles[type]} description={descs[type]} />
    </div>;
  }
  return <div className="space-y-4">
    {list.map((ev, i) => (
      <motion.div
        key={ev.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className="bg-white border border-brand-border rounded-2xl p-5 hover:border-blue-200 transition-colors"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-bold text-slate-900">{ev.title}</h4>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{ev.eventType}</span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                {new Date(ev.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onDetail(ev)} className="p-2 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-colors" title="View details">
              <Eye className="w-4 h-4" />
            </button>
            {type !== 'past' && ev.registrationEnabled && (
              <button onClick={() => onRegister(ev)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Register
              </button>
            )}
          </div>
        </div>
      </motion.div>
    ))}
  </div>;
}
