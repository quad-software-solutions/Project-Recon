import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image, FileText, Handshake, ShoppingBag, MessageSquare, DollarSign,
  Calendar, Bell, UserPlus, BarChart3, Users, Zap, Award,
  Clock, CheckCircle, CheckCircle2, Activity, Trophy, Building, Download,
  BookOpen, RefreshCw, Monitor, Target, AlertCircle, X,
  User, Loader2, GraduationCap, TrendingUp, UserCheck, ClipboardList, CreditCard, ClipboardCheck, Receipt, LayoutDashboard, ArrowRightLeft
} from 'lucide-react';
import { UserProfile, Enrollment, EnrollmentPayment, StudentProfile, Program, AcademicClass } from '@/shared/types';
import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';
import DashboardCommandCenter from '@/shared/ui/DashboardCommandCenter';
import InlineAlert from '@/shared/ui/InlineAlert';
import PermissionDenied from '@/shared/ui/PermissionDenied';
import {
  getManagerCommandCenter,
  type ManagerSectionId,
  type ManagerHubStats,
} from '../managerCommandCenter';
import { summarizeSettled } from '@/shared/utils/storage';
import {
  filterManagerNavItems,
  resolveManagerSection,
  canAccessManagerSection,
} from '@/shared/auth/dashboardAccess';
import SponsorManagement from './SponsorManagement';
import CommunicationsCenter from './CommunicationsCenter';
import PaymentTracker from './PaymentTracker';
import EventsManagement from './EventsManagement';
import AnnouncementsManager from './AnnouncementsManager';
import WalkInRegistration from './WalkInRegistration';
import EnrollmentPeriodsPanel from '../../../secretary/dashboard/ui/EnrollmentPeriodsPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import SchoolManagement from './SchoolManagement';
import AcademicCatalogManager from '@/domains/learning/academics/ui/AcademicCatalogManager';
import ClassManagerPanel from '@/domains/user/shared/ui/ClassManagerPanel';
import StaffAttendanceManager from '@/domains/user/shared/ui/StaffAttendanceManager';
import AdminAccount from '@/domains/user/shared/ui/AdminAccount';
import TransferRequestsPanel from '@/domains/user/shared/ui/TransferRequestsPanel';
import EnrollmentsPanel from '@/domains/user/secretary/dashboard/ui/EnrollmentsPanel';
import StudentDetailPanel from '@/domains/user/secretary/dashboard/ui/StudentDetailPanel';
import TournamentManager from '@/domains/competition/admin/TournamentManager';
import WorkshopManager from '@/domains/competition/admin/WorkshopManager';
import RegistrationManager from '@/domains/competition/admin/RegistrationManager';
import MatchManager from '@/domains/competition/admin/MatchManager';
import TeamManager from '@/domains/competition/admin/TeamManager';
import CertificateManager from '@/domains/user/shared/ui/CertificateManager';
import StoreDashboard from '@/domains/store/admin/ui/StoreDashboard';
import LearningMaterialsPanel from '@/domains/user/secretary/dashboard/ui/LearningMaterialsPanel';
import LearningMilestonesManager from '@/domains/user/secretary/dashboard/ui/LearningMilestonesManager';
import { fetchEnrollmentsPaginatedApi, fetchPaymentsApi, fetchStudentsApi, fetchProgramsApi, fetchSubProgramsApi, fetchClassesApi, downloadStudentReportPdf, downloadEnrollmentReportPdf, downloadAttendanceReportPdf, downloadProgressReportPdf, downloadCertificateReportPdf, downloadClassReportPdf, downloadSubProgramReportPdf, downloadProgramReportPdf } from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import { formatApiError } from '@/shared/utils/formatApiError';

interface Props {
  currentUser: UserProfile;
  onLogout: () => void;
}

type SectionId = ManagerSectionId;

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'main' },
  { id: 'academic-catalog', label: 'Academic Catalog', icon: BookOpen, group: 'academic' },
  { id: 'classes', label: 'Classes', icon: BookOpen, group: 'academic' },
  { id: 'enrollments', label: 'Academic Enrollments', icon: UserPlus, group: 'academic' },
  { id: 'students', label: 'Students', icon: Users, group: 'academic' },
  { id: 'periods', label: 'Enrollment Periods', icon: Calendar, group: 'academic' },
  { id: 'transfers', label: 'Branch Transfers', icon: ArrowRightLeft, group: 'academic' },
  { id: 'staff-attendance', label: 'Staff Attendance', icon: Calendar, group: 'academic' },
  { id: 'materials', label: 'Learning Materials', icon: BookOpen, group: 'academic' },
  { id: 'milestones', label: 'Milestones', icon: Target, group: 'academic' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'academic' },
  { id: 'schools', label: 'Branches', icon: Building, group: 'branches' },
  { id: 'payments', label: 'Payments & Sales', icon: DollarSign, group: 'finances' },
  { id: 'store', label: 'Store Inventory', icon: ShoppingBag, group: 'finances' },
  { id: 'events', label: 'Events', icon: Calendar, group: 'competition' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, group: 'competition' },
  { id: 'tournament-teams', label: 'Teams', icon: Users, group: 'competition' },
  { id: 'matches', label: 'Matches', icon: Trophy, group: 'competition' },
  { id: 'workshops', label: 'Workshops', icon: Building, group: 'competition' },
  { id: 'event-registrations', label: 'Event Registrations', icon: UserPlus, group: 'competition' },
  { id: 'announcements', label: 'Announcements', icon: Bell, group: 'communication' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, group: 'communication' },
  { id: 'sponsors', label: 'Sponsors & Partners', icon: Handshake, group: 'partners' },
  { id: 'reports', label: 'Reports & Data', icon: BarChart3, group: 'reports' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'reports' },
  { id: 'walkin', label: 'Walk-In Registration', icon: ClipboardList, group: 'operations' },
  { id: 'account', label: 'My Account', icon: User, group: 'system' },
];

export default function ManagerDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>(() =>
    resolveManagerSection(currentUser, 'overview'),
  );
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.allSettled([
      fetchStudentsApi(),
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p)),
      fetchPaymentsApi(),
      fetchProgramsApi(),
    ]).then(([stu, enr, pay, pro]) => {
      const summary = summarizeSettled([stu, enr, pay, pro]);
      if (summary.allFailed) {
        setLoadError('Unable to load dashboard data. Check your connection and try again.');
      } else if (summary.anyFailed) {
        setLoadError('Some dashboard data could not be loaded. Figures may be incomplete.');
      }

      setStudents(stu.status === 'fulfilled' && Array.isArray(stu.value) ? stu.value : []);
      setEnrollments(enr.status === 'fulfilled' && Array.isArray(enr.value) ? enr.value : []);
      setPayments(pay.status === 'fulfilled' && Array.isArray(pay.value) ? pay.value : []);
      setPrograms(pro.status === 'fulfilled' && Array.isArray(pro.value) ? pro.value : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingPayments = enrollments.filter(e => e.status === 'PENDING_VERIFICATION');
  const paidPayments = payments.filter(p => p.status === 'PAID');

  const hubStats: ManagerHubStats = useMemo(() => ({
    students: students.length,
    activeEnrollments: activeEnrollments.length,
    pendingPayments: pendingPayments.length,
    paidPayments: paidPayments.length,
    programs: programs.length,
    loading,
  }), [students.length, activeEnrollments.length, pendingPayments.length, paidPayments.length, programs.length, loading]);

  const commandCenter = useMemo(
    () => getManagerCommandCenter(activeSection, hubStats),
    [activeSection, hubStats],
  );

  const navItems = useMemo(
    () => filterManagerNavItems(currentUser, NAV_ITEMS),
    [currentUser],
  );

  const handleSectionChange = useCallback((id: SectionId) => {
    setActiveSection(resolveManagerSection(currentUser, id));
  }, [currentUser]);

  const renderPage = () => {
    if (!canAccessManagerSection(currentUser, activeSection)) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
          You do not have access to this section.
        </div>
      );
    }

    switch (activeSection) {
      case 'overview': return (
        <OverviewPage
          currentUser={currentUser}
          onNavigate={handleSectionChange}
          students={students}
          enrollments={enrollments}
          payments={payments}
          programs={programs}
        />
      );
      case 'analytics': return <AnalyticsDashboard />;
      case 'academic-catalog': return <AcademicCatalogManager />;
      case 'classes': return <ClassManagerPanel />;
      case 'staff-attendance': return <StaffAttendanceManager currentUser={currentUser} />;
      case 'sponsors': return <SponsorManagement currentUser={currentUser} />;
      case 'schools': return <SchoolManagement currentUser={currentUser} />;
      case 'enrollments': return <EnrollmentsPanel />;
      case 'periods': return <EnrollmentPeriodsPanel currentUser={currentUser} />;
      case 'students': return <StudentDetailPanel />;
      case 'transfers': return <TransferRequestsPanel />;
      case 'event-registrations': return <RegistrationManager />;
      case 'store': return <StoreDashboard currentUser={currentUser} />;
      case 'materials': return <LearningMaterialsPanel currentUser={currentUser} />;
      case 'milestones': return <LearningMilestonesManager currentUser={currentUser} />;
      case 'events': return <EventsManagement currentUser={currentUser} onNavigate={(id: string) => handleSectionChange(id as SectionId)} />;
      case 'tournaments': return <TournamentManager />;
      case 'tournament-teams': return <TeamManager />;
      case 'matches': return <MatchManager />;
      case 'workshops': return <WorkshopManager />;
      case 'announcements': return <AnnouncementsManager />;
      case 'communications': return <CommunicationsCenter currentUser={currentUser} />;
      case 'payments': return <PaymentTracker />;
      case 'walkin': return <WalkInRegistration currentUser={currentUser} />;
      case 'reports': return <ReportsSection />;
      case 'certificates': return <CertificateManager currentUser={currentUser} />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
      default: return <PermissionDenied title="Section not found" message="This manager section does not exist or is no longer available." />;
    }
  };

  const activeLabel = navItems.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: navItems,
        activeSection,
        onSectionChange: (id) => handleSectionChange(id as SectionId),
        title: 'Manager Dashboard',
        icon: BarChart3,
        userName: currentUser.name,
        userRole: currentUser.role,
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Manager Dashboard',
        actions: (
          <button onClick={refreshData} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ),
      }}
      onLogout={onLogout}
    >
      {loadError && (
        <InlineAlert tone="warning" message={loadError} onRetry={refreshData} onDismiss={() => setLoadError(null)} />
      )}

      {commandCenter && (
        <DashboardCommandCenter
          title={commandCenter.title}
          subtitle={commandCenter.subtitle}
          signals={commandCenter.signals}
          loading={hubStats.loading}
        />
      )}
      {renderPage()}
    </AppLayout>
  );
}

function OverviewPage({ currentUser, onNavigate, students, enrollments, payments, programs }: {
  currentUser: UserProfile;
  onNavigate: (id: SectionId) => void;
  students: StudentProfile[];
  enrollments: Enrollment[];
  payments: EnrollmentPayment[];
  programs: Program[];
}) {
  const allQuickActions: { id: SectionId; label: string; desc: string; icon: React.ElementType; color: string }[] = [
    { id: 'academic-catalog', label: 'Academic Catalog', desc: 'Programs & classes', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'enrollments', label: 'Academic Enrollments', desc: 'View student enrollments', icon: UserPlus, color: 'from-emerald-500 to-emerald-600' },
    { id: 'event-registrations', label: 'Event Registrations', desc: 'Manage event registrations', icon: ClipboardCheck, color: 'from-purple-500 to-purple-600' },
    { id: 'payments', label: 'Payment Reports', desc: 'Track transactions', icon: CreditCard, color: 'from-cyan-500 to-cyan-600' },
    { id: 'reports', label: 'Download Reports', desc: 'PDF reports & data', icon: FileText, color: 'from-rose-500 to-rose-600' },
    { id: 'events', label: 'Events Calendar', desc: 'Manage all events', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { id: 'tournaments', label: 'Tournaments', desc: 'Manage competitions', icon: Trophy, color: 'from-rose-500 to-rose-600' },
    { id: 'workshops', label: 'Workshops', desc: 'Schedule workshops', icon: Monitor, color: 'from-emerald-500 to-emerald-600' },
    { id: 'store', label: 'Store Inventory', desc: 'Manage products & stock', icon: ShoppingBag, color: 'from-amber-500 to-amber-600' },
    { id: 'analytics', label: 'View Analytics', desc: 'Business performance metrics', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'schools', label: 'Branches', desc: 'Manage branches', icon: Building, color: 'from-sky-500 to-blue-600' },
    { id: 'sponsors', label: 'Sponsors', desc: 'Manage partners', icon: Handshake, color: 'from-indigo-500 to-purple-600' },
    { id: 'announcements', label: 'Announcements', desc: 'View published updates', icon: Bell, color: 'from-rose-500 to-pink-600' },
  ];

  const quickActions = allQuickActions.filter(a => canAccessManagerSection(currentUser, a.id));

  const managementTools = [
    { label: 'Academic Catalog', desc: 'Programs & classes', id: 'academic-catalog' as SectionId, icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { label: 'Academic Enrollments', desc: 'Student enrollments', id: 'enrollments' as SectionId, icon: UserPlus, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Branches', desc: 'Branch management', id: 'schools' as SectionId, icon: Building, color: 'from-sky-500 to-cyan-600' },
    { label: 'Sponsors', desc: 'Partner management', id: 'sponsors' as SectionId, icon: Handshake, color: 'from-indigo-500 to-purple-600' },
    { label: 'Announcements', desc: 'View published updates', id: 'announcements' as SectionId, icon: Bell, color: 'from-rose-500 to-pink-600' },
  ].filter(t => canAccessManagerSection(currentUser, t.id));

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
          { label: 'Students', value: String(students.length), icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Revenue', value: payments.reduce((s, p) => s + (p.status === 'PAID' ? Number(p.amount) : 0), 0).toLocaleString() + ' Birr', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Active Enrollments', value: String(enrollments.filter(e => e.status === 'ACTIVE').length), icon: UserCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Pending Payments', value: String(enrollments.filter(e => e.status === 'PENDING_VERIFICATION').length), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                  <motion.button key={action.id}
                    onClick={() => onNavigate(action.id)}
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
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pending enrollments
              </h4>
              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {enrollments.filter(e => e.status === 'PENDING_VERIFICATION').length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {enrollments.filter(e => e.status === 'PENDING_VERIFICATION').length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No pending enrollments</p>
              ) : enrollments.filter(e => e.status === 'PENDING_VERIFICATION').slice(0, 6).map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2 p-2 rounded-lg text-sm bg-brand-blue/[0.04] border border-brand-blue/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{e.student_name || e.student_email || 'Student'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{e.class_name || e.sub_program_name || 'Enrollment'}</p>
                    {(e.pending_code || e.enrollment_number) && (
                      <p className="text-[10px] font-mono text-brand-blue mt-0.5">{e.pending_code || e.enrollment_number}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Management Tools
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {managementTools.map((tool) => {
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
    </div>
  );
}

function ReportsSection() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedSubProgramId, setSelectedSubProgramId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetchStudentsApi().catch(() => []),
      fetchClassesApi().catch(() => []),
      fetchProgramsApi().catch(() => []),
      fetchSubProgramsApi().catch(() => []),
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p)).catch(() => []),
    ]).then(([stu, cls, pro, sp, enr]) => {
      setStudents(Array.isArray(stu) ? stu : []);
      setClasses(Array.isArray(cls) ? cls : []);
      setPrograms(Array.isArray(pro) ? pro : []);
      setSubPrograms(Array.isArray(sp) ? sp : []);
      setEnrollments(Array.isArray(enr) ? enr : []);
    });
  }, []);

  const doDownload = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    setDownloadError(null);
    try {
      await fn();
    } catch (e) {
      setDownloadError(formatApiError(e));
    } finally {
      setDownloading(null);
    }
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
    { key: 'program-report', title: 'Program Report', desc: 'Complete program overview with sub-programs and totals', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-600/5', requires: 'program' as const, download: () => selectedProgramId && doDownload('program-report', () => downloadProgramReportPdf(selectedProgramId)) },
  ];

  return (
    <div className="space-y-4">
      {downloadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{downloadError}</span>
          <button type="button" onClick={() => setDownloadError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Students', value: students.length, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Classes', value: classes.length, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Active Enrollments', value: activeEnrollments.length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
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
              <option key={s.id} value={s.id}>{`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email}</option>
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
            {subPrograms.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
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
                className="w-full text-[11px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1.5 rounded-lg hover:bg-blue-600/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
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
