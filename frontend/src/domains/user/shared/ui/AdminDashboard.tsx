import React, { useState, useEffect, useMemo } from 'react';
import { fetchAuditLogsApi } from '../api/adminApi';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3, Users, Shield, Settings, FileText, Bell, Activity,
  Plus, RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle,
  BookOpen, MessageSquare, GraduationCap, Award, DollarSign, Building,
  Handshake, UserCog, Swords, Medal, Wrench, ClipboardList, Cpu, Star, Target,
  Edit3, Trash2, Eye, EyeOff, Search, Filter, Download, ChevronDown, Save, X,
  UserPlus, UserCheck, UserX, Lock, Globe, Zap, TrendingUp, TrendingDown,
  Mail, Phone, MapPin, Camera, Sparkles, Send, Loader2, Archive, LayoutDashboard, GitBranch, BellOff, CheckCircle2, Calendar, UserCheck as UserCheckIcon, Trophy
} from 'lucide-react';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import CmsDashboard from '@/src/domains/cms/admin/ui/CmsDashboard';
import { NavItem } from '@/src/shared/ui/Sidebar';
import { BranchSectionShell } from '@/src/domains/branches/ui/BranchSectionShell';
import AcademicCatalogManager from '@/src/domains/learning/academics/ui/AcademicCatalogManager';
import ClassManagerPanel from './ClassManagerPanel';
import StaffAttendanceManager from './StaffAttendanceManager';
import EventManager from '@/src/domains/competition/admin/EventManager';
import TournamentManager from '@/src/domains/competition/admin/TournamentManager';
import TeamManager from '@/src/domains/competition/admin/TeamManager';
import MatchManager from '@/src/domains/competition/admin/MatchManager';
import WorkshopManager from '@/src/domains/competition/admin/WorkshopManager';
import RegistrationManager from '@/src/domains/competition/admin/RegistrationManager';
import CertificateManager from '@/src/domains/user/shared/ui/CertificateManager';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import type { UserProfile, AppNotification, Enrollment, EnrollmentPayment } from '@/src/shared/types';
import { fetchEnrollmentsApi, fetchPaymentsApi } from '@/src/domains/learning/academics/api/academicApi';
import {
  fetchUsersApi,
  toggleUserStatusApi,
  archiveUserApi,
  createStaffApi,
  createBranchManagerApi,
  updateUserApi,
  resolveRole,
  formatRelativeTime,
  formatJoinDate,
  branchesApi,
  assignmentsApi,
  type AdminUserResponse,
  type PaginatedResponse,
  type BranchResponse,
  type AssignmentResponse,
} from '../api/adminApi';
import { getNotifications } from '@/src/domains/notification/model/notificationApi';
import { getAnalytics } from '@/src/domains/analytics/model/analyticsApi';
import UserManagementPanel from './UserManagementPanel';
import AdminAccount from './AdminAccount';
import SystemLogs from './SystemLogs';
import AdminOverviewDashboard from './AdminOverviewDashboard';
import RolesPermissionsPanel from './RolesPermissionsPanel';
import AdminRegistrationsPanel from './AdminRegistrationsPanel';

interface Props { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'overview' | 'users' | 'roles' | 'academics' | 'classes' | 'staff-attendance' | 'account' | 'audit' | 'branches' | 'registrations' | 'cms' | 'events' | 'tournaments' | 'tournament-teams' | 'matches' | 'workshops' | 'event-registrations' | 'certificates';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3, group: 'core' },
  { id: 'users', label: 'Accounts & Users', icon: Users, group: 'users' },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield, group: 'users' },
  { id: 'staff-attendance', label: 'Staff Attendance', icon: Calendar, group: 'users' },
  { id: 'academics', label: 'Academic Catalog', icon: GraduationCap, group: 'academic' },
  { id: 'classes', label: 'Classes', icon: BookOpen, group: 'academic' },
  { id: 'registrations', label: 'Enrollments', icon: ClipboardList, group: 'academic' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'academic' },
  { id: 'events', label: 'Events', icon: Calendar, group: 'competition' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, group: 'competition' },
  { id: 'tournament-teams', label: 'Teams', icon: Users, group: 'competition' },
  { id: 'matches', label: 'Matches', icon: Swords, group: 'competition' },
  { id: 'workshops', label: 'Workshops', icon: GraduationCap, group: 'competition' },
  { id: 'event-registrations', label: 'Event Registrations', icon: UserPlus, group: 'competition' },
  { id: 'cms', label: 'Content Manager', icon: LayoutDashboard, group: 'content' },
  { id: 'branches', label: 'Branches', icon: GitBranch, group: 'content' },
  { id: 'audit', label: 'System Logs', icon: FileText, group: 'system' },
  { id: 'account', label: 'My Account', icon: Shield, group: 'system' },
];

const pageTitle: Record<string, string> = {
  overview: 'Dashboard', users: 'User Management', roles: 'Roles & Permissions',
  academics: 'Academic Catalog', classes: 'Class Management',
  'staff-attendance': 'Staff Attendance',
  branches: 'Branch Management', registrations: 'Registration Management',
  events: 'Events Management', tournaments: 'Tournament Management',
  'tournament-teams': 'Team Management', matches: 'VEX Match Control',
  workshops: 'Workshop Management', 'event-registrations': 'Event Registrations',
  certificates: 'Certificate Management',
  audit: 'Audit Logs',
  cms: 'Content Management', account: 'My Account',
}

/* ─── MAIN ─── */
export default function AdminDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverviewDashboard />;
      case 'users': return <UserManagementPanel title="User Management" />;
      case 'roles': return <RolesPermissionsPanel />;
      case 'academics': return <AcademicCatalogManager role="Admin" />;
      case 'classes': return <ClassManagerPanel />;
      case 'staff-attendance': return <StaffAttendanceManager />;
      case 'branches': return <BranchSectionShell />;
      case 'audit': return <SystemLogs />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
      case 'registrations': return <AdminRegistrationsPanel />;
      case 'events': return <EventManager onNavigate={(section) => setActiveSection(section as SectionId)} />;
      case 'tournaments': return <TournamentManager />;
      case 'tournament-teams': return <TeamManager />;
      case 'matches': return <MatchManager />;
      case 'workshops': return <WorkshopManager />;
      case 'event-registrations': return <RegistrationManager />;
      case 'certificates': return <CertificateManager currentUserRole={currentUser.role} />;
      case 'cms': return <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm"><CmsDashboard /></div>;
      default: return <UserManagementPanel title="User Management" />;
    }
  };

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Admin Panel',
        icon: Shield,
        accentColor: 'blue',
        userName: currentUser.name,
        userRole: currentUser.role,
      }}
      topNavbar={{
        title: pageTitle[activeSection],
        subtitle: 'Admin Dashboard',
      }}
      onLogout={onLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}
