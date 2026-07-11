import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, CalendarDays, Target, Calendar, BookOpen, Medal,
  Zap, TrendingUp, Clock, Award, BarChart3,
  ChevronRight, MessageCircle, Trophy, Video, Gift, FileText,
  Cpu, Swords, ClipboardList, Users, Loader2, CheckCircle2
} from 'lucide-react';
import { UserProfile, Enrollment } from '@/src/shared/types';
import { fetchStudentsApi, fetchEnrollmentsApi, fetchStudentCertificatesApi, fetchProgramsApi } from '@/src/domains/learning/academics/api/academicApi';
import { cmsPublicApi } from '@/src/domains/cms/public/api/cmsPublicApi';

import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';

import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';

import Account from './Account';
import AttendanceTracker from './AttendanceTracker';
import ProgressMilestones from './ProgressMilestones';
import UpcomingEvents from './UpcomingEvents';
import MyRegistrations from './MyRegistrations';
import LearningResources from './LearningResources';
import Achievements from './Achievements';
import ParentFeedback from './ParentFeedback';
import CertificateGenerator from './CertificateGenerator';
import Leaderboard from './Leaderboard';
import VideoLibrary from './VideoLibrary';
import ReferralProgram from './ReferralProgram';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

type SectionId = 'overview' | 'account' | 'attendance' | 'progress' | 'events' | 'resources' | 'achievements' | 'feedback' | 'certificates' | 'leaderboard' | 'videos' | 'referrals' | 'registrations';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, group: 'main' },
  { id: 'account', label: 'Account', icon: User, group: 'main' },
  { id: 'progress', label: 'Milestones', icon: Target, group: 'main' },
  { id: 'achievements', label: 'Achievements', icon: Medal, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: FileText, group: 'main' },
  { id: 'resources', label: 'Learning Resources', icon: BookOpen, group: 'main' },
  { id: 'videos', label: 'Video Library', icon: Video, group: 'main' },
  { id: 'attendance', label: 'Attendance', icon: CalendarDays, group: 'main' },
  { id: 'registrations', label: 'My Registrations', icon: ClipboardList, group: 'main' },
  { id: 'events', label: 'Upcoming Events', icon: Calendar, group: 'main' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, group: 'main' },
  { id: 'referrals', label: 'Referral Program', icon: Gift, group: 'main' },
  { id: 'feedback', label: 'Parent Feedback', icon: MessageCircle, group: 'main' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function StudentDashboard({ currentUser, onLogout }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function resolveStudent() {
      // Strategy 1: Use studentId already discovered during login
      if (currentUser.studentId) {
        if (!cancelled) setStudentId(currentUser.studentId!);
        try {
          const e = await fetchEnrollmentsApi(currentUser.studentId!);
          if (!cancelled) {
            setEnrollments(e);
            setEnrolledCount(e.length);
            setActiveCount(e.filter(en => en.status === 'ACTIVE').length);
          }
        } catch { /* permission denied — expected for students */ }
        if (!cancelled) setStudentLoading(false);
        return;
      }
      // Strategy 2: Fetch from students list (staff users)
      const students = await fetchStudentsApi().catch(() => [] as import('@/src/shared/types').StudentProfile[]);
      const s = students.find(st => st.user === currentUser.id || st.email === currentUser.email);
      if (s) {
        if (!cancelled) setStudentId(s.id);
        try {
          const e = await fetchEnrollmentsApi(s.id);
          if (!cancelled) {
            setEnrollments(e);
            setEnrolledCount(e.length);
            setActiveCount(e.filter(en => en.status === 'ACTIVE').length);
          }
        } catch { /* permission denied */ }
        if (!cancelled) setStudentLoading(false);
        return;
      }
      // Strategy 3: Try certificates endpoint (works for students without IsAcademicStaff)
      try {
        const certs = await fetchStudentCertificatesApi();
        if (certs.length > 0 && certs[0].student) {
          const sid = certs[0].student;
          if (!cancelled) setStudentId(sid);
          // Cache for next login
          localStorage.setItem(`studentId_${currentUser.email}`, sid);
          try {
            const e = await fetchEnrollmentsApi(sid);
            if (!cancelled) {
              setEnrollments(e);
              setEnrolledCount(e.length);
              setActiveCount(e.filter(en => en.status === 'ACTIVE').length);
            }
          } catch { /* permission denied */ }
          if (!cancelled) setStudentLoading(false);
          return;
        }
      } catch { /* no certificates or no student profile */ }
      // Strategy 4: Check localStorage fallback
      const storedKey = `studentId_${currentUser.email}`;
      const storedId = localStorage.getItem(storedKey);
      if (storedId) {
        if (!cancelled) setStudentId(storedId);
        if (!cancelled) setStudentLoading(false);
        return;
      }
      if (!cancelled) setStudentLoading(false);
    }
    resolveStudent();
    return () => { cancelled = true; };
  }, [currentUser.id, currentUser.email]);

  const renderPage = () => {
    if (!studentId) {
      return (
        <div className="flex items-center justify-center py-20">
          {studentLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          ) : (
            <div className="text-center text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Student profile not found. Contact the administration.</p>
            </div>
          )}
        </div>
      );
    }
    switch (activeSection) {
      case 'overview':
        return <OverviewPage currentUser={currentUser} studentId={studentId} onNavigate={setActiveSection} enrollments={enrollments} />;
      case 'account':    return <Account currentUser={currentUser} studentId={studentId} />;
      case 'attendance': return <AttendanceTracker studentId={studentId} />;
      case 'progress':   return <ProgressMilestones studentId={studentId} />;
      case 'events':     return <UpcomingEvents />;
      case 'resources':  return <LearningResources studentId={studentId} />;
      case 'achievements': return <Achievements currentUser={currentUser} />;
      case 'feedback':   return <ParentFeedback />;
      case 'certificates': return <CertificateGenerator studentId={studentId} />;
      case 'leaderboard': return <Leaderboard />;
      case 'videos':     return <VideoLibrary />;
      case 'referrals':  return <ReferralProgram currentUser={currentUser} />;
      case 'registrations': return <MyRegistrations studentId={studentId} />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Student Dashboard',
        icon: User,
        userName: currentUser.name,
        userRole: 'Student',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Student Dashboard',
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Learning Command Center"
        subtitle="Progress, events, certificates."
        signals={[
          { label: 'XP', value: currentUser.xpPoints.toLocaleString(), detail: 'current points', icon: Zap, tone: 'amber' },
          { label: 'Active', value: String(activeCount), detail: 'active enrollments', icon: TrendingUp, tone: 'emerald' },
          { label: 'Programs', value: String(enrolledCount), detail: 'currently enrolled', icon: BookOpen, tone: enrolledCount ? 'blue' : 'amber' },
          { label: 'Badges', value: String(currentUser.badges.length), detail: 'earned', icon: Award, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}

/* ─── OVERVIEW PAGE ─── */

interface OverviewProps {
  currentUser: UserProfile;
  studentId: string;
  onNavigate: (s: SectionId) => void;
  enrollments: Enrollment[];
}

function OverviewPage({ currentUser, studentId, onNavigate, enrollments }: OverviewProps) {
  const [loading, setLoading] = useState(true);
  const [newsEvents, setNewsEvents] = useState<{ title: string; date: string }[]>([]);
  useEffect(() => {
    cmsPublicApi.getNews({ limit: '3' }).then(news => {
      const items = news?.results || [];
      setNewsEvents(items.map(n => ({
        title: n.title,
        date: new Date(n.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const firstName = currentUser.name.split(' ')[0];
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

  const completedProjects = completedEnrollments.length;

  const quickStats = [
    { label: 'XP Points', value: currentUser.xpPoints.toLocaleString(), icon: Zap, color: 'text-amber-400' },
    { label: 'Badges', value: `${currentUser.badges.length}`, icon: Award, color: 'text-purple-400' },
    { label: 'Completed', value: `${completedProjects}`, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Enrollments', value: `${enrollments.length}`, icon: BookOpen, color: 'text-brand-blue' },
  ];

  return (
    <div className="pb-8">
      {/* Welcome + Profile Card */}
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-brand-red/5 via-brand-blue/5 to-white px-5 py-4 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 border-brand-border shadow-sm shrink-0">
            <img src={profileImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-red uppercase tracking-widest mb-0.5">{getGreeting()}</p>
            <h2 className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight">Welcome back, {firstName}!</h2>
            <p className="text-sm text-slate-500 mt-0.5">{activeEnrollments.length} active enrollment{activeEnrollments.length !== 1 ? 's' : ''} · {currentUser.badges.length} badge{currentUser.badges.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="hidden sm:flex gap-2 shrink-0">
            {currentUser.badges.slice(0, 3).map((badge, i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-slate-100 border border-brand-border flex items-center justify-center text-lg" title={badge}>
                {['🏆', '🛡️', '⭐'][i] || '🎖️'}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-px bg-brand-border">
          {quickStats.map((stat, i) => (
            <div key={stat.label} className="bg-white px-4 py-3 text-center">
              <p className="font-black text-2xl text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Tracks + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900">Your Active Tracks</h3>
            <button onClick={() => onNavigate('progress')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 uppercase tracking-wider">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
            ) : activeEnrollments.length > 0 ? activeEnrollments.map((enr, i) => (
              <motion.div
                key={enr.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-brand-border hover:border-brand-red/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{enr.program_name || enr.sub_program_name || enr.class_name || 'Program'}</h4>
                  <p className="text-xs text-slate-500">{enr.class_name} · {enr.branch_name}</p>
                  <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completedProjects > 0 ? Math.min(100, Math.round((completedProjects / (activeEnrollments.length + completedProjects)) * 100)) : 0}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.2 }}
                      className="h-full bg-gradient-to-r from-brand-red to-brand-red-dark rounded-full"
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 shrink-0">{enr.enrolled_at?.slice(0, 10)}</span>
              </motion.div>
            )) : (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No active enrollments yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col">
          <h3 className="font-black text-lg text-slate-900 mb-1">Quick Stats</h3>
          <p className="text-sm text-slate-500 mb-6">Your learning at a glance</p>
          <div className="flex-1 space-y-4">
            {[
              { label: 'Active Enrollments', value: activeEnrollments.length, icon: BookOpen, color: 'text-brand-red' },
              { label: 'Completed', value: completedProjects, icon: CheckCircle2, color: 'text-emerald-500' },
              { label: 'XP Points', value: currentUser.xpPoints.toLocaleString(), icon: Zap, color: 'text-amber-500' },
              { label: 'Badges Earned', value: currentUser.badges.length, icon: Award, color: 'text-purple-500' },
            ].map((s, i) => {
              const SIcon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <SIcon className={`w-5 h-5 ${s.color}`} />
                  <div><p className="font-bold text-sm text-slate-900">{s.value}</p><p className="text-[10px] text-slate-500">{s.label}</p></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events + Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-lg text-slate-900">Upcoming Events</h3>
            <button onClick={() => onNavigate('events')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 uppercase tracking-wider">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
            ) : newsEvents.length > 0 ? newsEvents.map((ev, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-brand-border hover:border-brand-red/20 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${['bg-brand-blue', 'bg-brand-red', 'bg-emerald-500'][i % 3]} shrink-0`} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{ev.date}</p>
                </div>
                <Clock className="w-4 h-4 text-slate-400" />
              </motion.div>
            )) : (
              <div className="text-center py-6 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No upcoming events</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-lg text-slate-900">Recent Badges</h3>
            <button onClick={() => onNavigate('achievements')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 uppercase tracking-wider">
              All Badges <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {currentUser.badges.slice(0, 6).map((badge, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-brand-border hover:-translate-y-0.5 hover:border-brand-red/20 transition-all"
              >
                <span className="text-2xl mb-2">{['🏆', '🛡️', '⭐', '🎖️', '🏅', '🔰'][i] || '🎖️'}</span>
                <span className="font-bold text-xs text-slate-600 text-center leading-tight">{badge}</span>
              </motion.div>
            ))}
            {currentUser.badges.length === 0 && (
              <div className="col-span-3 text-center py-8 text-slate-400">
                <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Complete challenges to earn badges!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VEX Competition Summary — disabled (no backend) */}
    </div>
  );
}
