import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart3, Users, Shield, FileText, BookOpen, GraduationCap, Award,
  Calendar, Trophy, Swords, UserPlus, ClipboardList, LayoutDashboard, GitBranch, RefreshCw,
  Bell, MessageSquare, ArrowRightLeft, ShoppingBag, Building2, Handshake, DollarSign, Target, Clock,
  CheckCircle2, X, ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/shared/ui/AppLayout';
import DashboardCommandCenter from '@/shared/ui/DashboardCommandCenter';
import InlineAlert from '@/shared/ui/InlineAlert';
import PermissionDenied from '@/shared/ui/PermissionDenied';
import CmsDashboard from '@/domains/cms/admin/ui/CmsDashboard';
import { NavItem } from '@/shared/ui/Sidebar';
import { BranchSectionShell } from '@/domains/branches/ui/BranchSectionShell';
import AcademicCatalogManager from '@/domains/learning/academics/ui/AcademicCatalogManager';
import ClassManagerPanel from './ClassManagerPanel';
import StaffAttendanceManager from './StaffAttendanceManager';
import EventManager from '@/domains/competition/admin/EventManager';
import TournamentManager from '@/domains/competition/admin/TournamentManager';
import TeamManager from '@/domains/competition/admin/TeamManager';
import MatchManager from '@/domains/competition/admin/MatchManager';
import WorkshopManager from '@/domains/competition/admin/WorkshopManager';
import RegistrationManager from '@/domains/competition/admin/RegistrationManager';
import CertificateManager from '@/domains/user/shared/ui/CertificateManager';
import AnnouncementsManager from '@/domains/user/manager/dashboard/ui/AnnouncementsManager';
import CommunicationsCenter from '@/domains/user/manager/dashboard/ui/CommunicationsCenter';
import SponsorManagement from '@/domains/user/manager/dashboard/ui/SponsorManagement';
import type { UserProfile } from '@/shared/types';
import {
  fetchEnrollmentsPaginatedApi, fetchPaymentsApi, fetchProgramsApi, fetchClassesApi,
} from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import {
  fetchAllUsersApi, branchesApi, resolveRole,
  type AdminUserResponse, type BranchResponse,
} from '../api/adminApi';
import UserManagementPanel from './UserManagementPanel';
import AdminAccount from './AdminAccount';
import SystemLogs from './SystemLogs';
import AdminOverviewDashboard, { type AdminOverviewHubData } from './AdminOverviewDashboard';
import RolesPermissionsPanel from './RolesPermissionsPanel';
import PendingUsersPanel from './PendingUsersPanel';
import ReportsHub from './ReportsHub';
import EnrollmentsPanel from '@/domains/user/secretary/dashboard/ui/EnrollmentsPanel';
import PaymentsPanel from '@/domains/user/secretary/dashboard/ui/PaymentsPanel';
import EnrollmentPeriodsPanel from '@/domains/user/secretary/dashboard/ui/EnrollmentPeriodsPanel';
import LearningMaterialsPanel from '@/domains/user/secretary/dashboard/ui/LearningMaterialsPanel';
import LearningMilestonesManager from '@/domains/user/secretary/dashboard/ui/LearningMilestonesManager';
import StudentDetailPanel from '@/domains/user/secretary/dashboard/ui/StudentDetailPanel';
import TransferRequestsPanel from './TransferRequestsPanel';
import BankAccountsPanel from './BankAccountsPanel';
import StoreDashboard from '@/domains/store/admin/ui/StoreDashboard';
import {
  getAdminCommandCenter,
  type AdminSectionId,
  type AdminHubStats,
} from '../adminCommandCenter';
import { summarizeSettled } from '@/shared/utils/storage';
import {
  filterAdminNavItems,
  resolveAdminSection,
  canAccessAdminSection,
} from '@/shared/auth/dashboardAccess';
import { AdminOfflineBanner } from './adminQueryState';

interface Props { currentUser: UserProfile; onLogout: () => void; }

const RECENT_KEY = 'admin.recentSections';
const RECENT_MAX = 6;

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3, group: 'core' },
  { id: 'users', label: 'Accounts & Users', icon: Users, group: 'users' },
  { id: 'roles', label: 'Role Assignments', icon: Shield, group: 'users' },
  { id: 'pending-users', label: 'Pending Users', icon: UserPlus, group: 'users' },
  { id: 'staff-attendance', label: 'Staff Attendance', icon: Calendar, group: 'users' },
  { id: 'academics', label: 'Academic Catalog', icon: GraduationCap, group: 'academic' },
  { id: 'classes', label: 'Classes', icon: BookOpen, group: 'academic' },
  { id: 'students', label: 'Students', icon: Users, group: 'academic' },
  { id: 'registrations', label: 'Enrollments', icon: ClipboardList, group: 'academic' },
  { id: 'periods', label: 'Enrollment Periods', icon: Clock, group: 'academic' },
  { id: 'payments', label: 'Payments', icon: DollarSign, group: 'academic' },
  { id: 'transfers', label: 'Branch Transfers', icon: ArrowRightLeft, group: 'academic' },
  { id: 'milestones', label: 'Milestones', icon: Target, group: 'academic' },
  { id: 'materials', label: 'Learning Materials', icon: BookOpen, group: 'academic' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'academic' },
  { id: 'events', label: 'Events', icon: Calendar, group: 'competition' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, group: 'competition' },
  { id: 'tournament-teams', label: 'Teams', icon: Users, group: 'competition' },
  { id: 'matches', label: 'Matches', icon: Swords, group: 'competition' },
  { id: 'workshops', label: 'Workshops', icon: GraduationCap, group: 'competition' },
  { id: 'event-registrations', label: 'Event Registrations', icon: UserPlus, group: 'competition' },
  { id: 'cms', label: 'Content Manager', icon: LayoutDashboard, group: 'content' },
  { id: 'announcements', label: 'Announcements', icon: Bell, group: 'communication' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, group: 'communication' },
  { id: 'branches', label: 'Branches', icon: GitBranch, group: 'content' },
  { id: 'store', label: 'Store & Inventory', icon: ShoppingBag, group: 'finances' },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: Building2, group: 'finances' },
  { id: 'reports', label: 'Reports', icon: BarChart3, group: 'system' },
  { id: 'audit', label: 'System Logs', icon: FileText, group: 'system' },
  { id: 'account', label: 'My Account', icon: Shield, group: 'system' },
];

const pageTitle: Record<string, string> = {
  overview: 'Dashboard', users: 'User Management', roles: 'Role Assignments',
  'pending-users': 'Pending Users',
  reports: 'Reports Center',
  academics: 'Academic Catalog', classes: 'Class Management',
  students: 'Students',
  periods: 'Enrollment Periods',
  payments: 'Payments',
  materials: 'Learning Materials',
  milestones: 'Learning Milestones',
  'staff-attendance': 'Staff Attendance',
  branches: 'Branch Management', registrations: 'Enrollment Management',
  transfers: 'Branch Transfers', 'bank-accounts': 'Bank Accounts',
  events: 'Events Management', tournaments: 'Tournament Management',
  'tournament-teams': 'Team Management', matches: 'VEX Match Control',
  workshops: 'Workshop Management', 'event-registrations': 'Event Registrations',
  certificates: 'Certificate Management',
  audit: 'Audit Logs',
  store: 'Store Management',
  cms: 'Content Management',
  announcements: 'Announcements',
  communications: 'Communications',
  account: 'My Account',
};

function readSectionFromUrl(currentUser: UserProfile): AdminSectionId {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('section');
    if (raw) return resolveAdminSection(currentUser, raw as AdminSectionId);
  } catch { /* ignore */ }
  return resolveAdminSection(currentUser, 'overview');
}

function writeSectionToUrl(section: AdminSectionId) {
  try {
    const url = new URL(window.location.href);
    if (section === 'overview') url.searchParams.delete('section');
    else url.searchParams.set('section', section);
    window.history.replaceState({}, '', url.toString());
  } catch { /* ignore */ }
}

function pushRecent(section: AdminSectionId) {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const prev: string[] = raw ? JSON.parse(raw) : [];
    const next = [section, ...prev.filter((s) => s !== section)].slice(0, RECENT_MAX);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

function readRecent(): AdminSectionId[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as AdminSectionId[]) : [];
  } catch {
    return [];
  }
}

let toastCounter = 0;

export default function AdminDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<AdminSectionId>(() =>
    readSectionFromUrl(currentUser),
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [navQuery, setNavQuery] = useState('');
  const [recentSections, setRecentSections] = useState<AdminSectionId[]>(() => readRecent());
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [hubStats, setHubStats] = useState<AdminHubStats>({
    totalUsers: 0,
    activeUsers: 0,
    students: 0,
    instructors: 0,
    secretaries: 0,
    managers: 0,
    activeEnrollments: 0,
    pendingEnrollments: 0,
    paidPayments: 0,
    revenue: 0,
    programs: 0,
    classes: 0,
    activeClasses: 0,
    branches: 0,
    apiHealthy: 0,
    apiTotal: 6,
    loading: true,
  });
  const [hubPayload, setHubPayload] = useState<AdminOverviewHubData | null>(null);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `admin-toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      toastTimers.current.delete(id);
    }, 4000);
    toastTimers.current.set(id, t);
  }, []);

  useEffect(() => () => {
    toastTimers.current.forEach(clearTimeout);
  }, []);

  const refreshSignals = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setHubStats((prev) => ({ ...prev, loading: true }));
    Promise.allSettled([
      fetchAllUsersApi(),
      branchesApi.list(),
      fetchProgramsApi(),
      fetchClassesApi(),
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p)),
      fetchPaymentsApi(),
    ]).then(([usersRes, branchesRes, programsRes, classesRes, enrollmentsRes, paymentsRes]) => {
      const settled = [usersRes, branchesRes, programsRes, classesRes, enrollmentsRes, paymentsRes];
      const summary = summarizeSettled(settled);
      if (summary.allFailed) {
        setLoadError('Unable to load dashboard data. Check your connection and try again.');
      } else if (summary.anyFailed) {
        setLoadError('Some dashboard data could not be loaded. Figures may be incomplete.');
      }

      const users: AdminUserResponse[] = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
      const branches: BranchResponse[] = branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value) ? branchesRes.value : [];
      const programs = programsRes.status === 'fulfilled' && Array.isArray(programsRes.value) ? programsRes.value : [];
      const classes = classesRes.status === 'fulfilled' && Array.isArray(classesRes.value) ? classesRes.value : [];
      const enrollments = enrollmentsRes.status === 'fulfilled' && Array.isArray(enrollmentsRes.value) ? enrollmentsRes.value : [];
      const payments = paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value) ? paymentsRes.value : [];

      const roleOf = (u: AdminUserResponse) => resolveRole(u.assignments || []);
      const students = users.filter((u) => roleOf(u) === 'Student').length;
      const instructors = users.filter((u) => roleOf(u) === 'Instructor').length;
      const secretaries = users.filter((u) => roleOf(u) === 'Secretary').length;
      const managers = users.filter((u) => roleOf(u) === 'Manager').length;
      const activeUsers = users.filter((u) => u.status !== 'Archived').length;
      const paid = payments.filter((p: { status?: string }) => p.status === 'PAID');
      const revenue = paid.reduce((s: number, p: { amount?: number | string }) => s + Number(p.amount || 0), 0);
      const healthy = settled.filter((r) => r.status === 'fulfilled').length;

      setHubPayload({
        users,
        branches,
        programs,
        classes,
        enrollments,
        payments,
        apiHealthy: healthy,
        apiTotal: settled.length,
      });

      setHubStats({
        totalUsers: users.length,
        activeUsers,
        students,
        instructors,
        secretaries,
        managers,
        activeEnrollments: enrollments.filter((e: { status?: string }) => e.status === 'ACTIVE').length,
        pendingEnrollments: enrollments.filter((e: { status?: string }) => e.status === 'PENDING_VERIFICATION').length,
        paidPayments: paid.length,
        revenue,
        programs: programs.length,
        classes: classes.length,
        activeClasses: classes.filter((c: { is_active?: boolean }) => c.is_active !== false).length,
        branches: branches.length,
        apiHealthy: healthy,
        apiTotal: settled.length,
        loading: false,
      });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refreshSignals(); }, [refreshSignals]);

  useEffect(() => {
    writeSectionToUrl(activeSection);
    pushRecent(activeSection);
    setRecentSections(readRecent());
  }, [activeSection]);

  const navItems = useMemo(() => {
    const base = filterAdminNavItems(currentUser, ALL_NAV_ITEMS);
    const q = navQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((item) => item.label.toLowerCase().includes(q) || item.id.includes(q));
  }, [currentUser, navQuery]);

  const handleSectionChange = useCallback((id: string) => {
    setActiveSection(resolveAdminSection(currentUser, id as AdminSectionId));
    setNavQuery('');
  }, [currentUser]);

  const commandCenter = useMemo(
    () => getAdminCommandCenter(activeSection, hubStats),
    [activeSection, hubStats],
  );

  const renderPage = () => {
    if (!canAccessAdminSection(currentUser, activeSection)) {
      return <PermissionDenied />;
    }

    switch (activeSection) {
      case 'overview': return (
        <AdminOverviewDashboard
          onNavigate={handleSectionChange}
          hubData={hubPayload}
          hubLoading={hubStats.loading}
          onRefreshHub={refreshSignals}
          recentSections={recentSections.filter((s) => s !== 'overview')}
        />
      );
      case 'users': return <UserManagementPanel title="User Management" currentUser={currentUser} />;
      case 'roles': return <RolesPermissionsPanel currentUser={currentUser} />;
      case 'pending-users': return <PendingUsersPanel currentUser={currentUser} />;
      case 'reports': return <ReportsHub currentUser={currentUser} />;
      case 'academics': return <AcademicCatalogManager role="Admin" />;
      case 'classes': return <ClassManagerPanel currentUser={currentUser} />;
      case 'students': return <StudentDetailPanel />;
      case 'staff-attendance': return <StaffAttendanceManager currentUser={currentUser} />;
      case 'branches': return <BranchSectionShell currentUser={currentUser} />;
      case 'audit': return <SystemLogs currentUser={currentUser} />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
      case 'registrations': return <EnrollmentsPanel currentUser={currentUser} />;
      case 'periods': return <EnrollmentPeriodsPanel currentUser={currentUser} />;
      case 'payments': return <PaymentsPanel />;
      case 'materials': return <LearningMaterialsPanel currentUser={currentUser} />;
      case 'milestones': return <LearningMilestonesManager currentUser={currentUser} />;
      case 'transfers': return <TransferRequestsPanel currentUser={currentUser} />;
      case 'bank-accounts': return <BankAccountsPanel canManage addToast={addToast} />;
      case 'events': return <EventManager currentUser={currentUser} onNavigate={(section) => handleSectionChange(section)} />;
      case 'tournaments': return <TournamentManager />;
      case 'tournament-teams': return <TeamManager />;
      case 'matches': return <MatchManager />;
      case 'workshops': return <WorkshopManager />;
      case 'event-registrations': return <RegistrationManager />;
      case 'certificates': return <CertificateManager currentUser={currentUser} />;
      case 'store': return <StoreDashboard currentUser={currentUser} />;
      case 'cms': return <CmsDashboard currentUser={currentUser} />;
      case 'announcements': return <AnnouncementsManager />;
      case 'communications': return <CommunicationsCenter currentUser={currentUser} />;
      default: return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
          Section not found.
        </div>
      );
    }
  };

  return (
    <AppLayout
      sidebar={{
        items: navItems,
        activeSection,
        onSectionChange: handleSectionChange,
        title: 'Admin Panel',
        icon: Shield,
        accentColor: 'blue',
        userName: currentUser.name,
        userRole: currentUser.role,
      }}
      topNavbar={{
        title: pageTitle[activeSection],
        subtitle: 'Admin Dashboard',
        onSearch: setNavQuery,
        searchValue: navQuery,
        actions: (
          <button onClick={refreshSignals} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ),
      }}
      onLogout={onLogout}
    >
      <div className="space-y-3 mb-3">
        <AdminOfflineBanner />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Admin</span>
          <ChevronRight className="w-3 h-3" aria-hidden />
          <span className="text-slate-900 font-medium">{pageTitle[activeSection]}</span>
        </nav>
      </div>

      {loadError && (
        <InlineAlert tone="warning" message={loadError} onRetry={refreshSignals} onDismiss={() => setLoadError(null)} />
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

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : null}
            <p className="flex-1 font-medium">{toast.message}</p>
            <button type="button" onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
