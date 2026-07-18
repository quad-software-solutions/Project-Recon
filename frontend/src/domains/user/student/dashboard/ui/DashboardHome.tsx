import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Calendar, BookOpen, Award, ChevronRight,
  GraduationCap, FileText, Loader2,
} from 'lucide-react';
import type { UserProfile, StudentCertificate } from '@/shared/types';
import { fetchStudentCertificatesApi } from '@/domains/learning/academics/api/academicApi';
import { getUpcomingEvents } from '@/domains/competition/api/eventsApi';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';
import EmptyState from '@/shared/ui/EmptyState';
import { GridSkeleton } from '../../shared/ui/LoadingSkeleton';

export type HomeNavigateTarget =
  | 'account' | 'store' | 'events' | 'announcements'
  | 'certificates' | 'career' | 'messaging';

interface Props {
  currentUser: UserProfile;
  studentId: string;
  onNavigate: (section: HomeNavigateTarget) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardHome({ currentUser, studentId, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<{ title: string; date: string }[]>([]);
  const [announcements, setAnnouncements] = useState<{ title: string; date: string }[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);

  const firstName = currentUser.name.split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [newsRes, eventsRes, certs] = await Promise.all([
          cmsPublicApi.getNews({ limit: '3' }).catch(() => ({ results: [] })),
          getUpcomingEvents().catch(() => []),
          fetchStudentCertificatesApi(studentId).catch(() => []),
        ]);
        if (cancelled) return;

        setAnnouncements((newsRes?.results || []).map(n => ({
          title: n.title,
          date: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })));
        setEvents(eventsRes.slice(0, 3).map(e => ({
          title: e.title,
          date: new Date(e.start_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        })));
        setCertificates(certs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  const quickActions = [
    { label: 'Store', icon: BookOpen, section: 'store' as const },
    { label: 'Events', icon: Calendar, section: 'events' as const },
    { label: 'Certificates', icon: Award, section: 'certificates' as const },
    { label: 'Messages', icon: User, section: 'messaging' as const },
  ];

  return (
    <div className="pb-8 space-y-6">
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/8 via-brand-blue/5 to-white px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
            <img src={currentUser.profile_picture || profileImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-0.5">{getGreeting()}</p>
            <h2 className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight">Welcome back, {firstName}!</h2>
            <p className="text-sm text-slate-500 mt-1">
              {certificates.length > 0 && `${certificates.length} certificate${certificates.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => onNavigate('account')}
            className="shrink-0 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5"
          >
            <User className="w-4 h-4" /> View Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.section}
              onClick={() => onNavigate(action.section)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-brand-border rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{action.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <GridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Certificates */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-lg text-slate-900">Certificates</h3>
                </div>
                <button onClick={() => onNavigate('certificates')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{c.certificate_title || c.sub_program_name || 'Certificate'}</h4>
                        <p className="text-xs text-slate-500">{c.issued_at?.slice(0, 10)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Award} title="No certificates yet" description="Complete programs to earn certificates." />
              )}
            </section>
          </div>

          <div className="space-y-6">
            {/* Events */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base text-slate-900">Upcoming Events</h3>
                <button onClick={() => onNavigate('events')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5">
                  See all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((ev, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-brand-border">
                      <p className="text-xs font-semibold text-slate-900 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ev.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Calendar} title="No upcoming events" />
              )}
            </section>

            {/* Announcements */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base text-slate-900">Announcements</h3>
                <button onClick={() => onNavigate('announcements')} className="text-xs font-semibold text-blue-600 hover:underline">
                  View all
                </button>
              </div>
              {announcements.length > 0 ? (
                <div className="space-y-2">
                  {announcements.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-brand-border">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2">{a.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{a.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} title="No announcements" />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
