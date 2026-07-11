import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image, FileText, Handshake, ShoppingBag, MessageSquare, DollarSign,
  Calendar, Bell, UserPlus, BarChart3, Users, Zap, Award,
  Clock, CheckCircle, CheckCircle2, Activity, Trophy, Building, Sparkles, Download,
  BookOpen, RefreshCw, Monitor, Globe,
  Edit3, User, Loader2
} from 'lucide-react';
import { UserProfile, AppNotification, Enrollment, EnrollmentPayment } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import SponsorManagement from './SponsorManagement';
import OnlineStoreHub from './OnlineStoreHub';
import CommunicationsCenter from './CommunicationsCenter';
import PaymentTracker from './PaymentTracker';
import EventsManagement from './EventsManagement';
import AnnouncementsManager from './AnnouncementsManager';
import WalkInRegistration from './WalkInRegistration';
import AnalyticsDashboard from './AnalyticsDashboard';
import SchoolManagement from './SchoolManagement';
import AcademicCatalogManager from '@/src/domains/learning/academics/ui/AcademicCatalogManager';
import ClassManagerPanel from '@/src/domains/user/shared/ui/ClassManagerPanel';
import StaffAttendanceManager from '@/src/domains/user/shared/ui/StaffAttendanceManager';
import AdminAccount from '@/src/domains/user/shared/ui/AdminAccount';
import TournamentManager from '@/src/domains/competition/admin/TournamentManager';
import WorkshopManager from '@/src/domains/competition/admin/WorkshopManager';
import RegistrationManager from '@/src/domains/competition/admin/RegistrationManager';
import MatchManager from '@/src/domains/competition/admin/MatchManager';
import TeamManager from '@/src/domains/competition/admin/TeamManager';
import CertificateManager from '@/src/domains/user/shared/ui/CertificateManager';
import { fetchEnrollmentsApi, fetchPaymentsApi, fetchStudentsApi, fetchProgramsApi, fetchClassesApi, downloadStudentReportPdf, downloadEnrollmentReportPdf, downloadAttendanceReportPdf, downloadProgressReportPdf, downloadCertificateReportPdf, downloadClassReportPdf, downloadSubProgramReportPdf, downloadProgramReportPdf } from '@/src/domains/learning/academics/api/academicApi';

interface Props {
  currentUser: UserProfile;
  onLogout: () => void;
}

type SectionId = 'overview' | 'analytics' | 'academic-catalog' | 'classes' | 'staff-attendance' | 'sponsors' | 'store' | 'events' | 'tournaments' | 'tournament-teams' | 'matches' | 'workshops' | 'participants' | 'announcements' | 'communications' | 'payments' | 'walkin' | 'reports' | 'schools' | 'enrollments' | 'event-registrations' | 'certificates' | 'account';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Activity, group: 'main' },
  { id: 'enrollments', label: 'Academic Enrollments', icon: UserPlus, group: 'main' },
  { id: 'event-registrations', label: 'Event Registrations', icon: UserPlus, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'main' },
  { id: 'academic-catalog', label: 'Academic Catalog', icon: BookOpen, group: 'main' },
  { id: 'classes', label: 'Classes', icon: BookOpen, group: 'main' },
  { id: 'staff-attendance', label: 'Staff Attendance', icon: Calendar, group: 'main' },
  { id: 'schools', label: 'Branches', icon: Building, group: 'main' },
  { id: 'payments', label: 'Payments & Sales', icon: DollarSign, group: 'main' },
  { id: 'reports', label: 'Reports & Data', icon: BarChart3, group: 'main' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'main' },
  { id: 'store', label: 'Store & Inventory', icon: ShoppingBag, group: 'main' },
  { id: 'sponsors', label: 'Sponsors & Partners', icon: Handshake, group: 'main' },
  { id: 'events', label: 'Events', icon: Calendar, group: 'main' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, group: 'main' },
  { id: 'tournament-teams', label: 'Teams', icon: Users, group: 'main' },
  { id: 'matches', label: 'Matches', icon: Trophy, group: 'main' },
  { id: 'workshops', label: 'Workshops', icon: Building, group: 'main' },
  { id: 'announcements', label: 'Announcements', icon: Bell, group: 'main' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, group: 'main' },
  { id: 'walkin', label: 'Walk-In Registration', icon: Edit3, group: 'main' },
  { id: 'account', label: 'My Account', icon: User, group: 'system' },
];

export default function ManagerDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetchStudentsApi(),
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchProgramsApi(),
    ]).then(([stu, enr, pay, pro]) => {
      setStudents(Array.isArray(stu) ? stu : []);
      setEnrollments(Array.isArray(enr) ? enr : []);
      setPayments(Array.isArray(pay) ? pay : []);
      setPrograms(Array.isArray(pro) ? pro : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refreshData(); }, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingPayments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
  const paidPayments = payments.filter(p => p.status === 'PAID');

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <OverviewPage currentUser={currentUser} onNavigate={setActiveSection} students={students} enrollments={enrollments} payments={payments} programs={programs} />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'academic-catalog': return <AcademicCatalogManager />;
      case 'classes': return <ClassManagerPanel />;
      case 'staff-attendance': return <StaffAttendanceManager />;
      case 'sponsors': return <SponsorManagement />;
      case 'schools': return <SchoolManagement />;
      case 'enrollments': return <RegistrationSection />;
      case 'event-registrations': return <RegistrationManager />;
      case 'store': return <OnlineStoreHub />;
      case 'events': return <EventsManagement onNavigate={setActiveSection} />;
      case 'tournaments': return <TournamentManager />;
      case 'tournament-teams': return <TeamManager />;
      case 'matches': return <MatchManager />;
      case 'workshops': return <WorkshopManager />;
      case 'announcements': return <AnnouncementsManager />;
      case 'communications': return <CommunicationsCenter />;
      case 'payments': return <PaymentTracker />;
      case 'walkin': return <WalkInRegistration />;
      case 'reports': return <ReportsSection />;
      case 'certificates': return <CertificateManager currentUserRole={currentUser.role} />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Manager Dashboard',
        icon: BarChart3,
        userName: currentUser.name,
        userRole: 'Manager',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Manager Dashboard',
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Operations Command Center"
        subtitle="Branch activity, CMS work, payments, events, and registration queues."
        signals={[
          { label: 'Students', value: String(students.length), detail: 'registered', icon: Users, tone: 'blue' },
          { label: 'Active Enrollments', value: String(activeEnrollments.length), detail: 'in progress', icon: UserPlus, tone: 'emerald' },
          { label: 'Payments', value: String(paidPayments.length), detail: 'completed', icon: DollarSign, tone: 'emerald' },
          { label: 'Programs', value: String(programs.length), detail: 'active offers', icon: BookOpen, tone: 'amber' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}

function OverviewPage({ currentUser, onNavigate, students, enrollments, payments, programs }: {
  currentUser: UserProfile;
  onNavigate: (id: SectionId) => void;
  students: any[];
  enrollments: any[];
  payments: any[];
  programs: any[];
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  useEffect(() => {
    import('@/src/domains/notification/model/notificationApi').then(m =>
      m.getNotifications().then(setNotifications)
    );
  }, []);
  const unreadNotifications = notifications.filter(n => !n.read);

  const quickActions: { id: SectionId; label: string; desc: string; icon: React.ElementType; color: string }[] = [
    { id: 'academic-catalog', label: 'Academic Catalog', desc: 'Programs & classes', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'enrollments', label: 'Academic Enrollments', desc: 'View student enrollments', icon: UserPlus, color: 'from-emerald-500 to-emerald-600' },
    { id: 'event-registrations', label: 'Event Registrations', desc: 'Manage event registrations', icon: UserPlus, color: 'from-purple-500 to-purple-600' },
    { id: 'payments', label: 'Payment Reports', desc: 'Track transactions', icon: DollarSign, color: 'from-cyan-500 to-cyan-600' },
    { id: 'reports', label: 'Download Reports', desc: 'PDF reports & data', icon: FileText, color: 'from-rose-500 to-rose-600' },
    { id: 'events', label: 'Events Calendar', desc: 'Manage all events', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { id: 'tournaments', label: 'Tournaments', desc: 'Manage competitions', icon: Trophy, color: 'from-rose-500 to-rose-600' },
    { id: 'workshops', label: 'Workshops', desc: 'Schedule workshops', icon: Building, color: 'from-emerald-500 to-emerald-600' },
    { id: 'store', label: 'Store Inventory', desc: 'Manage products & stock', icon: ShoppingBag, color: 'from-amber-500 to-amber-600' },
    { id: 'analytics', label: 'View Analytics', desc: 'Business performance metrics', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'schools', label: 'Branches', desc: 'Manage branches', icon: Building, color: 'from-sky-500 to-blue-600' },
    { id: 'sponsors', label: 'Sponsors', desc: 'Manage partners', icon: Handshake, color: 'from-indigo-500 to-purple-600' },
    { id: 'announcements', label: 'Announcements', desc: 'Create & publish', icon: Bell, color: 'from-rose-500 to-pink-600' },
    { id: 'communications', label: 'Communications', desc: 'View messages', icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/70 mb-0.5">Welcome back,</p>
          <h2 className="font-black text-2xl">{currentUser.name}</h2>
          <p className="text-sm text-white/80 mt-0.5 max-w-xl">Full platform management — business, events, and operations all in one place.</p>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
          <BarChart3 className="w-full h-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Students', value: String(students.length), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Programs', value: String(programs.length), icon: Award, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Revenue', value: payments.reduce((s, p) => s + (p.status === 'PAID' ? Number(p.amount) : 0), 0).toLocaleString() + ' ETB', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Active Enrollments', value: String(enrollments.filter(e => e.status === 'ACTIVE').length), icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((m, i) => {
          const MIcon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
            >
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-1.5`}>
                <MIcon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
              <p className="font-display font-extrabold text-2xl text-slate-900">{m.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'System', value: 'Online', icon: Monitor, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Uptime', value: '99.97%', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'API', value: '12ms', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Backup', value: 'Today 3AM', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5 hover:shadow-sm transition-all"
            >
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <SIcon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                <p className={`text-sm font-bold ${s.color.replace('500', '700')}`}>{s.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickActions.map((action, i) => {
                const ActionIcon = action.icon;
                return (
                  <motion.button key={action.id} onClick={() => onNavigate(action.id)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="rounded-xl p-3 text-left border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                      <ActionIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-sm text-slate-900">{action.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{action.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Notifications
              </h4>
              {unreadNotifications.length > 0 && (
                <span className="text-[10px] font-black bg-brand-red text-white px-1.5 py-0.5 rounded-full">{unreadNotifications.length} new</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {notifications.slice(0, 4).map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-2 p-2 rounded-lg text-sm transition-all ${n.read ? 'text-slate-500' : 'bg-brand-red/5 border border-brand-red/10 text-slate-900'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-100' : 'bg-brand-red/10'}`}>
                    <span className="text-sm">{n.icon || '🔔'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`font-bold text-sm ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</p>
                      {!n.read && <div className="w-1 h-1 rounded-full bg-brand-red shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Stats
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Active', value: String(enrollments.filter(e => e.status === 'ACTIVE').length), color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Pending', value: String(enrollments.filter(e => e.status === 'PENDING_PAYMENT').length), color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Total', value: String(enrollments.length), color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Students', value: String(students.length), color: 'text-purple-700', bg: 'bg-purple-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-lg p-2 text-center`}>
                  <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
                  <p className={`text-[10px] font-medium ${s.color}/70`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4">
          <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5 text-brand-red" />
            Management Tools
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Academic Catalog', desc: 'Programs & classes', id: 'academic-catalog' as SectionId, icon: BookOpen, color: 'from-blue-500 to-blue-600' },
              { label: 'Academic Enrollments', desc: 'Student enrollments', id: 'enrollments' as SectionId, icon: UserPlus, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Branches', desc: 'Branch management', id: 'schools' as SectionId, icon: Building, color: 'from-sky-500 to-cyan-600' },
              { label: 'Sponsors', desc: 'Partner management', id: 'sponsors' as SectionId, icon: Handshake, color: 'from-indigo-500 to-purple-600' },
              { label: 'Announcements', desc: 'Create & publish', id: 'announcements' as SectionId, icon: Bell, color: 'from-rose-500 to-pink-600' },
              { label: 'Communications', desc: 'Message center', id: 'communications' as SectionId, icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
            ].map((tool, i) => {
              const TIcon = tool.icon;
              return (
                <button key={tool.id} onClick={() => onNavigate(tool.id)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}>
                    <TIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{tool.label}</p>
                    <p className="text-[10px] text-slate-500">{tool.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-brand-red" />
              Platform Summary
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Students', value: students.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Programs', value: programs.length, icon: Award, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Enrollments', value: enrollments.length, icon: Building, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Payments', value: payments.length, icon: Handshake, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map((stat, i) => {
                const StatIcon = stat.icon;
                return (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className={`w-6 h-6 rounded-lg ${stat.bg} flex items-center justify-center mb-1`}>
                      <StatIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-3 text-white">
            <p className="text-[10px] font-medium text-white/70 mb-0.5">All tools are connected</p>
            <p className="text-sm font-bold">Backend-ready sections are live</p>
            <p className="text-[11px] text-white/70 mt-1">Other sections will be enabled when APIs are ready.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsSection() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedSubProgramId, setSelectedSubProgramId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetchStudentsApi(),
      fetchClassesApi(),
      fetchProgramsApi(),
      fetchEnrollmentsApi(),
    ]).then(([stu, cls, pro, enr]) => {
      setStudents(Array.isArray(stu) ? stu : []);
      setClasses(Array.isArray(cls) ? cls : []);
      setPrograms(Array.isArray(pro) ? pro : []);
      setEnrollments(Array.isArray(enr) ? enr : []);
    }).catch(() => {});
  }, []);

  const doDownload = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    try { await fn(); } catch {}
    setTimeout(() => setDownloading(null), 1000);
  };

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');

  const reports = [
    { key: 'student-report', title: 'Student Academic Report', desc: 'Full academic profile, enrollments, attendance, progress & certificates', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', requires: 'student' as const, download: () => selectedStudentId && doDownload('student-report', () => downloadStudentReportPdf(selectedStudentId)) },
    { key: 'enrollment-report', title: 'Enrollment Report', desc: 'Enrollment history across all branches and programs', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50', requires: 'student' as const, download: () => selectedStudentId && doDownload('enrollment-report', () => downloadEnrollmentReportPdf(selectedStudentId)) },
    { key: 'attendance-report', title: 'Attendance Report', desc: 'Attendance summary per student with present/absent counts', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', requires: 'student' as const, download: () => selectedStudentId && doDownload('attendance-report', () => downloadAttendanceReportPdf(selectedStudentId)) },
    { key: 'progress-report', title: 'Progress Report', desc: 'Learning milestone progress per student', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', requires: 'student' as const, download: () => selectedStudentId && doDownload('progress-report', () => downloadProgressReportPdf(selectedStudentId)) },
    { key: 'certificate-report', title: 'Certificate Report', desc: 'All issued certificates with numbers and dates', icon: Trophy, color: 'text-rose-500', bg: 'bg-rose-50', requires: 'student' as const, download: () => selectedStudentId && doDownload('certificate-report', () => downloadCertificateReportPdf(selectedStudentId)) },
    { key: 'class-report', title: 'Class Report', desc: 'Class details with enrolled students and attendance sessions', icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-50', requires: 'class' as const, download: () => selectedClassId && doDownload('class-report', () => downloadClassReportPdf(selectedClassId)) },
    { key: 'subprogram-report', title: 'Sub-Program Report', desc: 'Sub-program info with class list and enrollment counts', icon: Building, color: 'text-indigo-500', bg: 'bg-indigo-50', requires: 'subprogram' as const, download: () => selectedSubProgramId && doDownload('subprogram-report', () => downloadSubProgramReportPdf(selectedSubProgramId)) },
    { key: 'program-report', title: 'Program Report', desc: 'Complete program overview with sub-programs and totals', icon: Activity, color: 'text-brand-red', bg: 'bg-brand-red/5', requires: 'program' as const, download: () => selectedProgramId && doDownload('program-report', () => downloadProgramReportPdf(selectedProgramId)) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Students', value: students.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Classes', value: classes.length, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Active Enrollments', value: activeEnrollments.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Programs', value: programs.length, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-3"
            >
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}>
                <SIcon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="font-bold text-xl text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500">Student</label>
          <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400"
          >
            <option value="">Select a student...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.full_name || s.first_name || s.email}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500">Class</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400"
          >
            <option value="">Select a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500">Program</label>
          <select value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400"
          >
            <option value="">Select a program...</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500">Sub-Program</label>
          <select value={selectedSubProgramId} onChange={e => setSelectedSubProgramId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400"
          >
            <option value="">Select a sub-program...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.sub_program_name || c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((r, i) => {
          const ReportIcon = r.icon;
          const isDl = downloading === r.key;
          const hasRequired = r.requires === 'student' ? selectedStudentId :
            r.requires === 'class' ? selectedClassId :
            r.requires === 'subprogram' ? selectedSubProgramId :
            r.requires === 'program' ? selectedProgramId : true;
          return (
            <motion.div key={r.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all ${!hasRequired ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center`}>
                  <ReportIcon className={`w-4 h-4 ${r.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900">{r.title}</p>
                  <p className="text-[11px] text-slate-500">{r.desc}</p>
                </div>
              </div>
              <button onClick={r.download} disabled={isDl || !hasRequired}
                className="w-full text-[11px] font-bold text-brand-red bg-brand-red/10 px-2 py-1.5 rounded-lg hover:bg-brand-red/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Download className={`w-3 h-3 ${isDl ? 'animate-bounce' : ''}`} />
                {isDl ? 'Generating PDF...' : !hasRequired ? 'Select required field above' : 'Download PDF'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RegistrationSection() {
  const [registrations, setRegistrations] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    Promise.all([fetchEnrollmentsApi(), fetchPaymentsApi()])
      .then(([enrollmentData, paymentData]) => {
        setRegistrations(enrollmentData);
        setPayments(paymentData);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load registrations'))
      .finally(() => setLoading(false));
  }, []);

  const paymentByEnrollment = payments.reduce<Record<string, EnrollmentPayment>>((map, payment) => {
    map[payment.enrollment] = payment;
    return map;
  }, {});

  const filtered = registrations.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const payment = paymentByEnrollment[r.id];
    const paymentStatus = payment?.status || r.payment_status || 'PENDING';
    const matchesPayment = paymentFilter === 'all' || paymentStatus === paymentFilter;
    return matchesStatus && matchesPayment;
  });

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const confirmedCount = registrations.filter(r => r.status === 'ACTIVE' || r.status === 'COMPLETED').length;
  const pendingCount = registrations.filter(r => r.status === 'PENDING_PAYMENT').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Registrations', value: registrations.length, icon: UserPlus, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Confirmed', value: confirmedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Revenue', value: `${(totalRevenue / 1000).toFixed(1)}K ETB`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900">All Registrations</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red"
            >
              <option value="all">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Student', 'Program', 'Branch', 'Amount', 'Date', 'Payment', 'Status'].map(h => (
                  <th key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {error && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-red-500">{error}</td></tr>
              )}
              {filtered.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.student_name || r.student_email || 'Student'}</p>
                      <p className="text-[11px] text-slate-400">{r.student_email || r.student}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{r.class_name || r.sub_program_name || 'Class'}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-500">{r.branch_name || '—'}</td>
                  <td className="px-3 py-2.5 text-sm font-bold text-slate-700">{paymentByEnrollment[r.id] ? `${Number(paymentByEnrollment[r.id].amount).toLocaleString()} ETB` : '—'}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-500">{r.enrolled_at?.slice(0, 10) || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${paymentByEnrollment[r.id]?.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {paymentByEnrollment[r.id]?.status || r.payment_status || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`flex items-center gap-1 text-[11px] font-bold ${
                      r.status === 'ACTIVE' || r.status === 'COMPLETED' ? 'text-emerald-600' :
                      r.status === 'PENDING_PAYMENT' ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        r.status === 'ACTIVE' || r.status === 'COMPLETED' ? 'bg-emerald-500' :
                        r.status === 'PENDING_PAYMENT' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No registrations match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
