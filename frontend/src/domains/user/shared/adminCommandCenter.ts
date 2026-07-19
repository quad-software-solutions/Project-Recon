import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  BarChart3, Users, Shield, FileText, BookOpen, GraduationCap, Award,
  Calendar, Trophy, Swords, UserPlus, ClipboardList, LayoutDashboard, GitBranch,
  Bell, MessageSquare,
} from 'lucide-react';

export type AdminSectionId =
  | 'overview' | 'users' | 'roles' | 'pending-users' | 'academics' | 'classes' | 'staff-attendance'
  | 'account' | 'audit' | 'branches' | 'registrations' | 'cms' | 'events'
  | 'tournaments' | 'tournament-teams' | 'matches' | 'workshops'
  | 'event-registrations' | 'certificates' | 'store'
  | 'transfers' | 'bank-accounts'
  | 'announcements' | 'communications' | 'reports';

export interface AdminHubStats {
  totalUsers: number;
  activeUsers: number;
  students: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  paidPayments: number;
  programs: number;
  classes: number;
  branches: number;
  loading: boolean;
}

export interface CommandCenterConfig {
  title: string;
  subtitle: string;
  signals: DashboardSignal[];
}

export function getAdminCommandCenter(
  section: AdminSectionId,
  stats: AdminHubStats,
): CommandCenterConfig | null {
  if (section === 'account') return null;

  const {
    totalUsers, activeUsers, students, activeEnrollments, pendingEnrollments,
    paidPayments, programs, classes, branches, loading,
  } = stats;

  if (loading) {
    return {
      title: 'Admin Hub',
      subtitle: 'Loading system data...',
      signals: [
        { label: 'Users', value: '—', detail: 'loading...', icon: Users, tone: 'slate' },
        { label: 'Students', value: '—', detail: 'loading...', icon: GraduationCap, tone: 'slate' },
        { label: 'Active', value: '—', detail: 'loading...', icon: ClipboardList, tone: 'slate' },
        { label: 'Payments', value: '—', detail: 'loading...', icon: Award, tone: 'slate' },
      ],
    };
  }

  switch (section) {
    case 'overview':
      return {
        title: 'Admin Hub',
        subtitle: 'System-wide overview — users, academics, and operations.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'total accounts', icon: Users, tone: 'blue' },
          { label: 'Students', value: String(students), detail: 'registered', icon: GraduationCap, tone: 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: ClipboardList, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'academic offers', icon: BookOpen, tone: 'amber' },
        ],
      };

    case 'users':
      return {
        title: 'User Management',
        subtitle: 'Accounts, staff, and user administration.',
        signals: [
          { label: 'Total', value: String(totalUsers), detail: 'all accounts', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeUsers), detail: 'active users', icon: Shield, tone: 'emerald' },
          { label: 'Students', value: String(students), detail: 'student accounts', icon: GraduationCap, tone: 'slate' },
          { label: 'Branches', value: String(branches), detail: 'locations', icon: GitBranch, tone: 'purple' },
        ],
      };

    case 'roles':
      return {
        title: 'Roles & Permissions',
        subtitle: 'Access control and role assignments.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'managed accounts', icon: Shield, tone: 'blue' },
          { label: 'Active', value: String(activeUsers), detail: 'active accounts', icon: Users, tone: 'emerald' },
          { label: 'Students', value: String(students), detail: 'student role', icon: GraduationCap, tone: 'slate' },
          { label: 'Branches', value: String(branches), detail: 'branch access', icon: GitBranch, tone: 'purple' },
        ],
      };

    case 'reports':
      return {
        title: 'Reports Center',
        subtitle: 'Export and analyze platform data.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'reportable accounts', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeUsers), detail: 'active users', icon: Shield, tone: 'emerald' },
          { label: 'Students', value: String(students), detail: 'student records', icon: GraduationCap, tone: 'slate' },
          { label: 'Branches', value: String(branches), detail: 'branch data', icon: GitBranch, tone: 'purple' },
        ],
      };

    case 'pending-users':
      return {
        title: 'Pending Users',
        subtitle: 'Users awaiting role assignment.',
        signals: [
          { label: 'Total', value: String(totalUsers), detail: 'all accounts', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeUsers), detail: 'active users', icon: Shield, tone: 'emerald' },
          { label: 'Students', value: String(students), detail: 'student accounts', icon: GraduationCap, tone: 'slate' },
          { label: 'Branches', value: String(branches), detail: 'locations', icon: GitBranch, tone: 'purple' },
        ],
      };

    case 'academics':
    case 'classes':
      return {
        title: section === 'academics' ? 'Academic Catalog' : 'Class Management',
        subtitle: section === 'academics' ? 'Programs, sub-programs, and curriculum.' : 'Classes, instructors, and schedules.',
        signals: [
          { label: 'Programs', value: String(programs), detail: 'configured', icon: BookOpen, tone: 'blue' },
          { label: 'Classes', value: String(classes), detail: 'active classes', icon: GraduationCap, tone: 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: ClipboardList, tone: 'slate' },
          { label: 'Students', value: String(students), detail: 'enrolled', icon: Users, tone: 'amber' },
        ],
      };

    case 'registrations':
      return {
        title: 'Enrollments',
        subtitle: 'Student enrollment management and status.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'in progress', icon: ClipboardList, tone: 'emerald' },
          { label: 'Pending', value: String(pendingEnrollments), detail: 'awaiting payment', icon: UserPlus, tone: pendingEnrollments ? 'amber' : 'slate' },
          { label: 'Students', value: String(students), detail: 'registered', icon: Users, tone: 'blue' },
          { label: 'Paid', value: String(paidPayments), detail: 'completed payments', icon: Award, tone: 'slate' },
        ],
      };

    case 'certificates':
      return {
        title: 'Certificates',
        subtitle: 'Certificate templates and issuance.',
        signals: [
          { label: 'Students', value: String(students), detail: 'eligible', icon: GraduationCap, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'in progress', icon: ClipboardList, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'programs', icon: BookOpen, tone: 'slate' },
          { label: 'Paid', value: String(paidPayments), detail: 'completed', icon: Award, tone: 'purple' },
        ],
      };

    case 'events':
    case 'tournaments':
    case 'tournament-teams':
    case 'matches':
    case 'workshops':
    case 'event-registrations':
      return {
        title: 'Competitions & Events',
        subtitle: 'Events, tournaments, teams, matches, and registrations.',
        signals: [
          { label: 'Students', value: String(students), detail: 'participants', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrolled', icon: Trophy, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'linked programs', icon: BookOpen, tone: 'slate' },
          { label: 'Branches', value: String(branches), detail: 'event locations', icon: Calendar, tone: 'amber' },
        ],
      };

    case 'cms':
    case 'branches':
      return {
        title: section === 'cms' ? 'Content Manager' : 'Branch Management',
        subtitle: section === 'cms' ? 'CMS pages, news, and public content.' : 'Branch locations and configuration.',
        signals: [
          { label: 'Branches', value: String(branches), detail: 'locations', icon: GitBranch, tone: 'blue' },
          { label: 'Users', value: String(totalUsers), detail: 'content editors', icon: Users, tone: 'slate' },
          { label: 'Students', value: String(students), detail: 'audience', icon: GraduationCap, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'to showcase', icon: LayoutDashboard, tone: 'purple' },
        ],
      };

    case 'staff-attendance':
      return {
        title: 'Staff Attendance',
        subtitle: 'Instructor and staff attendance tracking.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'staff accounts', icon: Users, tone: 'blue' },
          { label: 'Classes', value: String(classes), detail: 'classes', icon: BookOpen, tone: 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'sessions', icon: Calendar, tone: 'slate' },
          { label: 'Branches', value: String(branches), detail: 'locations', icon: GitBranch, tone: 'purple' },
        ],
      };

    case 'audit':
      return {
        title: 'System Logs',
        subtitle: 'Audit trail and system activity.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'tracked accounts', icon: FileText, tone: 'blue' },
          { label: 'Active', value: String(activeUsers), detail: 'active users', icon: Users, tone: 'emerald' },
          { label: 'Enrollments', value: String(activeEnrollments), detail: 'recent changes', icon: ClipboardList, tone: 'slate' },
          { label: 'Payments', value: String(paidPayments), detail: 'transactions', icon: Award, tone: 'amber' },
        ],
      };

    case 'announcements':
      return {
        title: 'Announcements',
        subtitle: 'Internal announcements and institutional updates.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'audience', icon: Users, tone: 'blue' },
          { label: 'Students', value: String(students), detail: 'recipients', icon: GraduationCap, tone: 'emerald' },
          { label: 'Branches', value: String(branches), detail: 'locations', icon: GitBranch, tone: 'purple' },
          { label: 'Programs', value: String(programs), detail: 'linked', icon: BookOpen, tone: 'amber' },
        ],
      };

    case 'communications':
      return {
        title: 'Communications',
        subtitle: 'Contact requests and inbound messages.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'staff', icon: Users, tone: 'blue' },
          { label: 'Branches', value: String(branches), detail: 'locations', icon: GitBranch, tone: 'purple' },
          { label: 'Active', value: String(activeUsers), detail: 'responders', icon: Shield, tone: 'emerald' },
          { label: 'Pending', value: String(pendingEnrollments), detail: 'enrollments', icon: MessageSquare, tone: 'amber' },
        ],
      };

    default:
      return {
        title: 'Admin Hub',
        subtitle: 'Platform administration and configuration.',
        signals: [
          { label: 'Users', value: String(totalUsers), detail: 'accounts', icon: Users, tone: 'blue' },
          { label: 'Students', value: String(students), detail: 'registered', icon: GraduationCap, tone: 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: ClipboardList, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'programs', icon: BookOpen, tone: 'amber' },
        ],
      };
  }
}
