import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy, Users, Gamepad2, Calendar, Activity, CheckCircle2, Loader2,
  GraduationCap, TrendingUp, Clock, AlertCircle,
} from 'lucide-react';
import { getEvents, getLiveEvents, getUpcomingEvents, getPastEvents, adminGetRegistrations } from '../../api/competitionApi';
import { type Tournament, type Workshop } from '@/src/shared/types';

export default function EventDashboard() {
  const [events, setEvents] = useState<(Tournament | Workshop)[]>([]);
  const [liveEvents, setLiveEvents] = useState<(Tournament | Workshop)[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<(Tournament | Workshop)[]>([]);
  const [pastEvents, setPastEvents] = useState<(Tournament | Workshop)[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEvents(),
      getLiveEvents(),
      getUpcomingEvents(),
      getPastEvents(),
      adminGetRegistrations().catch(() => []),
    ]).then(([all, live, upcoming, past, regs]) => {
      setEvents(all);
      setLiveEvents(live);
      setUpcomingEvents(upcoming);
      setPastEvents(past);
      setRegistrations(Array.isArray(regs) ? regs : []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
    </div>
  );

  const tournaments = events.filter(e => e.eventType === 'TOURNAMENT');
  const workshops = events.filter(e => e.eventType === 'WORKSHOP');

  const stats = [
    { label: 'Total Events', value: events.length, icon: Trophy, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Upcoming', value: upcomingEvents.length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Live Now', value: liveEvents.length, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Completed', value: pastEvents.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tournaments', value: tournaments.length, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Workshops', value: workshops.length, icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Registrations', value: registrations.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Regs', value: registrations.filter((r: any) => r.registration_status === 'PENDING').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <SIcon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {liveEvents.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Events ({liveEvents.length})
            </h3>
            <div className="flex flex-col gap-2">
              {liveEvents.map(e => (
                <div key={e.id} className="bg-red-50 rounded-xl px-4 py-3 border border-red-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{e.title}</p>
                    <p className="text-[10px] text-slate-500">{e.eventType} · {e.location}</p>
                  </div>
                  <span className="text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">LIVE</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brand-red" />
              Upcoming Events
            </h3>
            <div className="flex flex-col gap-2">
              {upcomingEvents.slice(0, 5).map(e => (
                <div key={e.id} className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{e.title}</p>
                    <p className="text-[10px] text-slate-500">{new Date(e.startDateTime).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[9px] font-bold text-amber-600">{e.eventType}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-red" />
          Registration Activity
        </h3>
        {registrations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No registrations yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {registrations.slice(-5).reverse().map((r: any) => (
              <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">{r.public_full_name || r.public_email || 'Unknown'}</span>
                  <span className="text-[10px] text-slate-500">{r.event_title || ''}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  r.registration_status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  r.registration_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-500'
                }`}>{r.registration_status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
