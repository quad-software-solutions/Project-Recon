import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  User, Calendar, BookOpen, Award, ChevronRight, GraduationCap, FileText,
  Target, CreditCard, ArrowUpRight, AlertCircle,
} from 'lucide-react';
import type { UserProfile, StudentCertificate, Enrollment, StudentProgress } from '@/shared/types';
import {
  fetchMyEnrollmentsApi, fetchStudentCertificatesApi, fetchStudentProgressApi,
} from '@/domains/learning/academics/api/academicApi';
import { getUpcomingEvents } from '@/domains/competition/api/eventsApi';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import EmptyState from '@/shared/ui/EmptyState';
import { GridSkeleton } from '../../shared/ui/LoadingSkeleton';

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=25338d&color=fff&bold=true`;
}

export type HomeNavigateTarget = 'account' | 'store' | 'events' | 'announcements' | 'certificates';

interface Props {
  currentUser: UserProfile;
  studentId: string | null;
  onNavigate: (section: HomeNavigateTarget) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', options).format(date);
}

function statusLabel(value?: string | null) {
  return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'Not available';
}

export default function DashboardHome({ currentUser, studentId, onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<{ id?: string; title: string; date: string }[]>([]);
  const [announcements, setAnnouncements] = useState<{ id?: string; title: string; date: string }[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);

  const firstName = currentUser.name?.split(' ')[0] || 'Student';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [newsRes, eventsRes, certs, enrollmentData] = await Promise.all([
        cmsPublicApi.getNews({ limit: '3' }).catch(() => ({ results: [] })),
        getUpcomingEvents().catch(() => []),
        studentId ? fetchStudentCertificatesApi(studentId).catch(() => []) : Promise.resolve([]),
        studentId ? fetchMyEnrollmentsApi().catch(() => []) : Promise.resolve([]),
      ]);
      if (cancelled) return;
      setAnnouncements((newsRes?.results || []).map(n => ({
        id: n.id, title: n.title, date: formatDate(n.created_at, { month: 'short', day: 'numeric' }),
      })));
      setEvents(eventsRes.slice(0, 3).map(e => ({
        id: e.id, title: e.title, date: formatDate(e.start_datetime, { weekday: 'short', month: 'short', day: 'numeric' }),
      })));
      setCertificates(certs);
      setEnrollments(enrollmentData);
      const active = enrollmentData.filter(e => e.status === 'ACTIVE');
      const histories = await Promise.all(active.map(e => fetchStudentProgressApi(e.id).catch(() => [])));
      if (!cancelled) setProgress(histories.flat());
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const paymentAttention = enrollments.filter(e => ['PENDING', 'UNPAID', 'PARTIALLY_PAID'].includes(String(e.payment_status))).length;
  const completion = useMemo(() => {
    if (!progress.length) return 0;
    return Math.round(progress.filter(p => p.status === 'COMPLETED').length / progress.length * 100);
  }, [progress]);

  const quickActions = [
    { label: 'Browse store', icon: BookOpen, section: 'store' as const },
    { label: 'Find events', icon: Calendar, section: 'events' as const },
    { label: 'Certificates', icon: Award, section: 'certificates' as const },
    { label: 'My account', icon: User, section: 'account' as const },
  ];

  return (
    <div className="pb-8 space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-blue px-6 py-7 text-white shadow-premium-blue sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-cyan/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <img src={currentUser.profile_picture || avatarUrl(currentUser.name)} alt="" className="h-16 w-16 rounded-2xl border-2 border-white/30 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow !text-brand-cyan">{getGreeting()}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Welcome back, {firstName}.</h2>
            <p className="mt-1 text-sm text-white/70">Stay on top of your learning journey.</p>
          </div>
          <button onClick={() => onNavigate('account')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20">
            View profile <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {!studentId && (
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-900">Student profile not linked</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700">
                Your account is active, but no academic enrollment is linked yet. You can still browse events, announcements, and the store.
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-800">
                Contact administration to link your profile and access academic records.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Active programs', value: studentId ? activeEnrollments.length : '—', icon: GraduationCap, tone: 'text-blue-600 bg-blue-50' },
          { label: 'Learning progress', value: studentId ? `${completion}%` : '—', icon: Target, tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Certificates', value: studentId ? certificates.length : '—', icon: Award, tone: 'text-violet-600 bg-violet-50' },
          { label: 'Payment attention', value: studentId ? paymentAttention : '—', icon: CreditCard, tone: 'text-amber-600 bg-amber-50' },
        ].map(card => (
          <div key={card.label} className="surface-card rounded-2xl p-4 interactive-lift">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}><card.icon className="h-4 w-4" /></div>
            <p className="text-2xl font-black text-slate-900">{card.value}</p><p className="mt-1 text-xs font-medium text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map(action => <button key={action.label} onClick={() => onNavigate(action.section)} className="group flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-premium-sm"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"><action.icon className="h-4 w-4" /></span><span className="text-xs font-bold text-slate-700">{action.label}</span></button>)}
      </div>

      {loading ? <GridSkeleton count={3} /> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="surface-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Academic overview</p><h3 className="mt-1 text-lg font-black text-slate-900">Your programs</h3></div><GraduationCap className="h-5 w-5 text-brand-blue" /></div>
            {activeEnrollments.length ? <div className="space-y-3">{activeEnrollments.slice(0, 3).map(e => <div key={e.id} className="rounded-xl border border-brand-border bg-slate-50/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{e.program_name || e.sub_program_name || 'Program'}</p><p className="mt-1 text-xs text-slate-500">{e.class_name || e.branch_name || 'Class details not available'}</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{statusLabel(e.status)}</span></div><div className="mt-4"><div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500"><span>Progress</span><span>{completion}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} /></div></div></div>)}</div> : <EmptyState icon={GraduationCap} title="No active programs" description={studentId ? 'Your active enrollments will appear here.' : 'Link your student profile to see your academic overview.'} />}
          </section>
          <section className="surface-card rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><h3 className="font-black text-lg text-slate-900">Recent certificates</h3></div><button onClick={() => onNavigate('certificates')} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">View all <ChevronRight className="h-3.5 w-3.5" /></button></div>{certificates.length ? <div className="grid gap-3 sm:grid-cols-2">{certificates.slice(0, 4).map((c, i) => <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Award className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{c.certificate_title || c.sub_program_name || 'Certificate'}</p><p className="mt-1 text-xs text-slate-500">Issued {formatDate(c.issued_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p></div></motion.div>)}</div> : <EmptyState icon={Award} title="No certificates yet" description="Completed certificates will appear here." />}</section>
        </div>
        <div className="space-y-6">
          <section className="surface-card rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-black text-base text-slate-900">Upcoming events</h3><button onClick={() => onNavigate('events')} className="text-xs font-bold text-blue-600">See all</button></div>{events.length ? <div className="space-y-2">{events.map(e => <div key={e.id || e.title} className="rounded-xl border border-brand-border bg-slate-50 p-3"><p className="truncate text-xs font-bold text-slate-900">{e.title}</p><p className="mt-1 text-[10px] text-slate-500">{e.date}</p></div>)}</div> : <EmptyState icon={Calendar} title="No upcoming events" />}</section>
          <section className="surface-card rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-black text-base text-slate-900">Announcements</h3><button onClick={() => onNavigate('announcements')} className="text-xs font-bold text-blue-600">View all</button></div>{announcements.length ? <div className="space-y-2">{announcements.map(a => <div key={a.id || a.title} className="rounded-xl border border-brand-border bg-slate-50 p-3"><p className="line-clamp-2 text-xs font-bold text-slate-900">{a.title}</p><p className="mt-1 text-[10px] text-slate-500">{a.date}</p></div>)}</div> : <EmptyState icon={BookOpen} title="No announcements" />}</section>
        </div>
      </div>}
    </div>
  );
}
