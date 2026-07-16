import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Award, Calendar, ChevronRight, Clock, Loader2, FileText, Download, Trophy
} from 'lucide-react';
import { UserProfile } from '@/shared/types';
import { getUpcomingEvents } from '@/domains/competition/api/eventsApi';
import {
  fetchLearningMaterialsApi,
  downloadEnrollmentReportPdf,
  downloadProgressReportPdf,
  downloadAttendanceReportPdf,
} from '@/domains/learning/academics/api/academicApi';

type SectionId = 'overview' | 'account' | 'attendance' | 'progress' | 'events' | 'resources' | 'certificates' | 'leaderboard' | 'registrations' | 'feedback';

interface Props {
  currentUser: UserProfile;
  studentId: string | null;
  certCount: number;
  onNavigate: (s: SectionId) => void;
}

export default function StudentOverview({ currentUser, studentId, certCount, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<{ title: string; date: string; location: string }[]>([]);
  const [materialCount, setMaterialCount] = useState(0);

  useEffect(() => {
    Promise.all([
      getUpcomingEvents().then(list =>
        setEvents(list.slice(0, 3).map(e => ({
          title: e.title,
          date: new Date(e.start_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          location: e.location,
        })))
      ).catch(() => {}),
      fetchLearningMaterialsApi().then(m => setMaterialCount(m.length)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const firstName = currentUser.name.split(' ')[0];

  return (
    <div className="pb-8 space-y-6">
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <p className="text-xs font-black text-brand-red uppercase tracking-widest mb-1">Welcome back</p>
        <h2 className="font-black text-2xl text-slate-900">{firstName}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {certCount} certificate{certCount !== 1 ? 's' : ''} · {materialCount} learning resource{materialCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Certificates', value: String(certCount), icon: Award, action: () => onNavigate('certificates') },
          { label: 'Materials', value: String(materialCount), icon: BookOpen, action: () => onNavigate('resources') },
          { label: 'Events', value: String(events.length), icon: Calendar, action: () => onNavigate('events') },
          { label: 'Leaderboard', value: 'View', icon: Trophy, action: () => onNavigate('leaderboard') },
        ].map((stat, i) => (
          <button key={stat.label} onClick={stat.action}
            className="bg-white border border-brand-border rounded-xl p-4 text-left hover:border-brand-red/30 transition-colors">
            <stat.icon className="w-5 h-5 text-brand-red mb-2" />
            <p className="font-black text-xl text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </button>
        ))}
      </div>

      {studentId && (
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h3 className="font-black text-lg text-slate-900 mb-3">Academic Reports (PDF)</h3>
          <p className="text-xs text-slate-500 mb-4">Download your official records from the academic system.</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Enrollments', fn: () => downloadEnrollmentReportPdf(studentId) },
              { label: 'Progress', fn: () => downloadProgressReportPdf(studentId) },
              { label: 'Attendance', fn: () => downloadAttendanceReportPdf(studentId) },
            ].map(item => (
              <button key={item.label} onClick={item.fn}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-red text-white px-3 py-2 rounded-lg hover:bg-brand-red-dark">
                <Download className="w-3.5 h-3.5" /> {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg text-slate-900">Upcoming Events</h3>
            <button onClick={() => onNavigate('events')} className="text-sm font-black text-brand-red flex items-center gap-1">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-slate-50 border border-brand-border">
                  <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {ev.date} · {ev.location}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming events</p>
          )}
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg text-slate-900">Quick Links</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'My Certificates', icon: FileText, id: 'certificates' as SectionId },
              { label: 'Learning Resources', icon: BookOpen, id: 'resources' as SectionId },
              { label: 'Event Registrations', icon: Calendar, id: 'registrations' as SectionId },
              { label: 'Progress Reports', icon: Award, id: 'progress' as SectionId },
            ].map(link => (
              <button key={link.id} onClick={() => onNavigate(link.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors">
                <link.icon className="w-4 h-4 text-brand-red" />
                <span className="text-sm font-semibold text-slate-800">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
