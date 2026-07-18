import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, Users, Shield, FileText, BookOpen, GraduationCap, Award,
  Calendar, Trophy, Swords, UserPlus, ClipboardList, LayoutDashboard, GitBranch, RefreshCw, ShoppingCart,
  Bell, MessageSquare, ArrowRightLeft, ShoppingBag, Building2,
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
import type { UserProfile } from '@/shared/types';
import {
  fetchEnrollmentsPaginatedApi, fetchPaymentsApi, fetchProgramsApi, fetchClassesApi,
} from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import {
  fetchAllUsersApi, branchesApi, resolveRole,
} from '../api/adminApi';
import UserManagementPanel from './UserManagementPanel';
import AdminAccount from './AdminAccount';
import SystemLogs from './SystemLogs';
import AdminOverviewDashboard from './AdminOverviewDashboard';
import RolesPermissionsPanel from './RolesPermissionsPanel';
import EnrollmentsPanel from '@/domains/user/secretary/dashboard/ui/EnrollmentsPanel';
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

interface Props { currentUser: UserProfile; onLogout: () => void; }

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3, group: 'core' },
  { id: 'users', label: 'Accounts & Users', icon: Users, group: 'users' },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield, group: 'users' },
  { id: 'staff-attendance', label: 'Staff Attendance', icon: Calendar, group: 'users' },
  { id: 'academics', label: 'Academic Catalog', icon: GraduationCap, group: 'academic' },
  { id: 'classes', label: 'Classes', icon: BookOpen, group: 'academic' },
  { id: 'registrations', label: 'Enrollments', icon: ClipboardList, group: 'academic' },
  { id: 'transfers', label: 'Branch Transfers', icon: ArrowRightLeft, group: 'academic' },
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
  { id: 'audit', label: 'System Logs', icon: FileText, group: 'system' },
  { id: 'account', label: 'My Account', icon: Shield, group: 'system' },
];

const pageTitle: Record<string, string> = {
  overview: 'Dashboard', users: 'User Management', roles: 'Roles & Permissions',
  academics: 'Academic Catalog', classes: 'Class Management',
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

export default function AdminDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<AdminSectionId>(() =>
    resolveAdminSection(currentUser, 'overview'),
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hubStats, setHubStats] = useState<AdminHubStats>({
    totalUsers: 0,
    activeUsers: 0,
    students: 0,
    activeEnrollments: 0,
    pendingEnrollments: 0,
    paidPayments: 0,
    programs: 0,
    classes: 0,
    branches: 0,
    loading: true,
  });

  const refreshSignals = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setHubStats(prev => ({ ...prev, loading: true }));
    Promise.allSettled([
      fetchAllUsersApi(),
      branchesApi.list(),
      fetchProgramsApi(),
      fetchClassesApi(),
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p)),
      fetchPaymentsApi(),
    ]).then(([usersRes, branchesRes, programsRes, classesRes, enrollmentsRes, paymentsRes]) => {
      const summary = summarizeSettled([usersRes, branchesRes, programsRes, classesRes, enrollmentsRes, paymentsRes]);
      if (summary.allFailed) {
        setLoadError('Unable to load dashboard data. Check your connection and try again.');
      } else if (summary.anyFailed) {
        setLoadError('Some dashboard data could not be loaded. Figures may be incomplete.');
      }

      const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
      const branches = branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value) ? branchesRes.value : [];
      const programs = programsRes.status === 'fulfilled' && Array.isArray(programsRes.value) ? programsRes.value : [];
      const classes = classesRes.status === 'fulfilled' && Array.isArray(classesRes.value) ? classesRes.value : [];
      const enrollments = enrollmentsRes.status === 'fulfilled' && Array.isArray(enrollmentsRes.value) ? enrollmentsRes.value : [];
      const payments = paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value) ? paymentsRes.value : [];

      const students = users.filter(u => resolveRole(u.assignments || []) === 'Student').length;
      const activeUsers = users.filter(u => u.is_active !== false).length;

      setHubStats({
        totalUsers: users.length,
        activeUsers,
        students,
        activeEnrollments: enrollments.filter(e => e.status === 'ACTIVE').length,
        pendingEnrollments: enrollments.filter(e => e.status === 'PENDING_VERIFICATION').length,
        paidPayments: payments.filter(p => p.status === 'PAID').length,
        programs: programs.length,
        classes: classes.length,
        branches: branches.length,
        loading: false,
      });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refreshSignals(); }, [refreshSignals]);

  const navItems = useMemo(
    () => filterAdminNavItems(currentUser, ALL_NAV_ITEMS),
    [currentUser],
  );

  const handleSectionChange = useCallback((id: string) => {
    setActiveSection(resolveAdminSection(currentUser, id as AdminSectionId));
  }, [currentUser]);

  const commandCenter = useMemo(
    () => getAdminCommandCenter(activeSection, hubStats),
    [activeSection, hubStats],
  );

  const renderPage = () => {
    if (!canAccessAdminSection(currentUser, activeSection)) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
          You do not have access to this section.
        </div>
      );
    }

    switch (activeSection) {
      case 'overview': return (
        <AdminOverviewDashboard onNavigate={handleSectionChange} />
      );
      case 'users': return <UserManagementPanel title="User Management" currentUser={currentUser} />;
      case 'roles': return <RolesPermissionsPanel currentUser={currentUser} />;
      case 'academics': return <AcademicCatalogManager role="Admin" />;
      case 'classes': return <ClassManagerPanel />;
      case 'staff-attendance': return <StaffAttendanceManager currentUser={currentUser} />;
      case 'branches': return <BranchSectionShell currentUser={currentUser} />;
      case 'audit': return <SystemLogs currentUser={currentUser} />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
      case 'registrations': return <EnrollmentsPanel currentUser={currentUser} />;
      case 'transfers': return <TransferRequestsPanel />;
      case 'bank-accounts': return <BankAccountsPanel canManage />;
      case 'events': return <EventManager currentUser={currentUser} onNavigate={(section) => handleSectionChange(section)} />;
      case 'tournaments': return <TournamentManager />;
      case 'tournament-teams': return <TeamManager />;
      case 'matches': return <MatchManager />;
      case 'workshops': return <WorkshopManager />;
      case 'event-registrations': return <RegistrationManager />;
      case 'certificates': return <CertificateManager currentUser={currentUser} />;
      case 'store': return <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm"><StoreDashboard currentUser={currentUser} /></div>;
      case 'cms': return <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm"><CmsDashboard currentUser={currentUser} /></div>;
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
        actions: (
          <button onClick={refreshSignals} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ),
      }}
      onLogout={onLogout}
    >
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
    </AppLayout>
  );
}
