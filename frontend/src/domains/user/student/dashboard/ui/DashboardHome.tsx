import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Calendar, BookOpen, Bell, Award, ClipboardList, ChevronRight,
  Zap, CheckCircle2, Clock, AlertCircle, GraduationCap, Target, FileText,
  CalendarDays, TrendingUp, Loader2,
} from 'lucide-react';
import type { UserProfile, Enrollment, StudentCertificate } from '@/shared/types';
import { fetchStudentCertificatesApi } from '@/domains/learning/academics/api/academicApi';
import { getUpcomingEvents } from '@/domains/competition/api/eventsApi';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import { getNotifications, getUnreadCount } from '@/domains/notification/model/notificationApi';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';
import EmptyState from '../../shared/ui/EmptyState';
import { GridSkeleton } from '../../shared/ui/LoadingSkeleton';

export type HomeNavigateTarget =
  | 'account' | 'academics' | 'events' | 'notifications' | 'announcements'
  | 'certificates' | 'career' | 'messaging';

interface Props {
  currentUser: UserProfile;
  studentId: string;
  enrollments: Enrollment[];
  onNavigate: (section: HomeNavigateTarget) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardHome({ currentUser, studentId, enrollments, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<{ title: string; date: string }[]>([]);
  const [announcements, setAnnouncements] = useState<{ title: string; date: string }[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingSessions] = useState<{ topic: string; date: string; className: string }[]>([]);

  const firstName = currentUser.name.split(' ')[0];
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Skip attendance sessions — students receive 403 (staff-only endpoint)
        const [newsRes, eventsRes, certs, unread, notifs] = await Promise.all([
          cmsPublicApi.getNews({ limit: '3' }).catch(() => ({ results: [] })),
          getUpcomingEvents().catch(() => []),
          fetchStudentCertificatesApi(studentId).catch(() => []),
          getUnreadCount().catch(() => 0),
          getNotifications().catch(() => []),
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
        setUnreadCount(unread || notifs.filter(n => !n.read).length);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  const quickActions = [
    { label: 'My Courses', icon: BookOpen, section: 'academics' as const },
    { label: 'Events', icon: Calendar, section: 'events' as const },
    { label: 'Certificates', icon: Award, section: 'certificates' as const },
    { label: 'Messages', icon: Bell, section: 'messaging' as const },
  ];

  const pendingTasks = [
    ...pendingEnrollments.map(e => ({
      id: e.id,
      label: `Complete payment for ${e.program_name || e.class_name || 'enrollment'}`,
      type: 'payment' as const,
    })),
    ...(unreadCount > 0 ? [{ id: 'notif', label: `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`, type: 'notification' as const }] : []),
  ];

  return (
    <div className="pb-8 space-y-6">
      {/* Welcome + Profile */}
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/8 via-brand-blue/5 to-white px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
            <img src={currentUser.profile_picture || profileImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-0.5">{getGreeting()}</p>
            <h2 className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight">Welcome back, {firstName}!</h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeEnrollments.length} active course{activeEnrollments.length !== 1 ? 's' : ''}
              {certificates.length > 0 && ` · ${certificates.length} certificate${certificates.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => onNavigate('account')}
            className="shrink-0 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5"
          >
            <User className="w-4 h-4" /> View Profile
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-border">
          {[
            { label: 'Active Courses', value: activeEnrollments.length, icon: BookOpen },
            { label: 'Completed', value: completedEnrollments.length, icon: CheckCircle2 },
            { label: 'XP Points', value: currentUser.xpPoints.toLocaleString(), icon: Zap },
            { label: 'Badges', value: currentUser.badges.length, icon: Award },
          ].map(stat => (
            <div key={stat.label} className="bg-white px-4 py-3 text-center">
              <p className="font-black text-xl text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
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
          {/* Left column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Semester / Active Courses */}
            <section className="bg-white border border-brand-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-lg text-slate-900">Current Semester</h3>
                </div>
                <button onClick={() => onNavigate('academics')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {activeEnrollments.length > 0 ? activeEnrollments.slice(0, 3).map((enr, i) => (
                  <motion.div
                    key={enr.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-brand-border"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{enr.program_name || enr.sub_program_name || 'Program'}</h4>
                      <p className="text-xs text-slate-500">{enr.class_name} · {enr.branch_name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                  </motion.div>
                )) : (
                  <EmptyState icon={BookOpen} title="No active enrollments" description="Enroll in a program to start learning." />
                )}
              </div>
            </section>

            {/* Upcoming Classes */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-lg text-slate-900">Upcoming Classes</h3>
                </div>
                <button onClick={() => onNavigate('academics')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  Timetable <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-2">
                  {upcomingSessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-brand-border">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{s.topic}</p>
                        <p className="text-xs text-slate-500">{s.className} · {s.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CalendarDays} title="No upcoming classes scheduled" description="Check back later or view your timetable." />
              )}
            </section>

            {/* Academic Progress */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-lg text-slate-900">Academic Progress</h3>
                </div>
                <button onClick={() => onNavigate('academics')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="font-black text-2xl text-emerald-700">{activeEnrollments.length}</p>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase">In Progress</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="font-black text-2xl text-blue-700">{completedEnrollments.length}</p>
                  <p className="text-[10px] font-medium text-blue-600 uppercase">Completed</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="font-black text-2xl text-amber-700">{pendingEnrollments.length}</p>
                  <p className="text-[10px] font-medium text-amber-600 uppercase">Pending</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            {/* Notification Summary */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-base text-slate-900">Notifications</h3>
                </div>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <button
                onClick={() => onNavigate('notifications')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 border border-brand-border hover:border-blue-200 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">View notification center</p>
              </button>
            </section>

            {/* Pending Tasks */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-slate-900">Pending Tasks</h3>
              </div>
              {pendingTasks.length > 0 ? (
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => onNavigate(task.type === 'notification' ? 'notifications' : 'academics')}
                      className="w-full flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-left hover:bg-amber-100/50 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-slate-700">{task.label}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckCircle2} title="No pending tasks" description="You're all caught up!" />
              )}
            </section>

            {/* Certificate Status */}
            <section className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-base text-slate-900">Certificates</h3>
                </div>
                <button onClick={() => onNavigate('certificates')} className="text-xs font-semibold text-blue-600 hover:underline">
                  View all
                </button>
              </div>
              {certificates.length > 0 ? (
                <div className="space-y-2">
                  {certificates.slice(0, 2).map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                      <Award className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="text-xs font-medium text-slate-700 truncate">{c.certificate_title || c.sub_program_name || 'Certificate'}</p>
                    </div>
                  ))}
                  {certificates.length > 2 && (
                    <p className="text-[10px] text-slate-500 text-center">+{certificates.length - 2} more</p>
                  )}
                </div>
              ) : (
                <EmptyState icon={Award} title="No certificates yet" description="Complete programs to earn certificates." />
              )}
            </section>

            {/* Upcoming Events */}
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

            {/* Recent Announcements */}
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
                <EmptyState icon={Target} title="No announcements" />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
