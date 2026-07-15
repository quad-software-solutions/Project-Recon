import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  Activity, UserPlus, Award, BookOpen, Calendar, Building, DollarSign,
  BarChart3, ShoppingBag, Handshake, Trophy, Users, Bell, MessageSquare,
  Edit3,
} from 'lucide-react';

export type ManagerSectionId =
  | 'overview' | 'analytics' | 'academic-catalog' | 'classes' | 'staff-attendance'
  | 'sponsors' | 'store' | 'materials' | 'milestones'
  | 'events' | 'tournaments' | 'tournament-teams'
  | 'matches' | 'workshops' | 'announcements' | 'communications'
  | 'payments' | 'walkin' | 'reports' | 'schools' | 'enrollments'
  | 'event-registrations' | 'certificates' | 'account';

export interface ManagerHubStats {
  students: number;
  activeEnrollments: number;
  pendingPayments: number;
  paidPayments: number;
  programs: number;
  loading: boolean;
}

export interface CommandCenterConfig {
  title: string;
  subtitle: string;
  signals: DashboardSignal[];
}

export function getManagerCommandCenter(
  section: ManagerSectionId,
  stats: ManagerHubStats,
): CommandCenterConfig | null {
  if (section === 'account') return null;

  const { students, activeEnrollments, pendingPayments, paidPayments, programs, loading } = stats;

  if (loading) {
    return {
      title: 'Operations Hub',
      subtitle: 'Loading platform data...',
      signals: [
        { label: 'Students', value: '—', detail: 'loading...', icon: Users, tone: 'slate' },
        { label: 'Active', value: '—', detail: 'loading...', icon: UserPlus, tone: 'slate' },
        { label: 'Payments', value: '—', detail: 'loading...', icon: DollarSign, tone: 'slate' },
        { label: 'Programs', value: '—', detail: 'loading...', icon: BookOpen, tone: 'slate' },
      ],
    };
  }

  switch (section) {
    case 'overview':
      return {
        title: 'Operations Hub',
        subtitle: 'Branch activity, enrollments, payments, and events.',
        signals: [
          { label: 'Students', value: String(students), detail: 'registered', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: UserPlus, tone: 'emerald' },
          { label: 'Payments', value: String(paidPayments), detail: 'completed', icon: DollarSign, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'active offers', icon: BookOpen, tone: 'amber' },
        ],
      };

    case 'enrollments':
      return {
        title: 'Academic Enrollments',
        subtitle: 'Manage student program enrollments.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'in progress', icon: UserPlus, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: DollarSign, tone: pendingPayments ? 'amber' : 'slate' },
          { label: 'Students', value: String(students), detail: 'registered', icon: Users, tone: 'blue' },
          { label: 'Programs', value: String(programs), detail: 'available', icon: BookOpen, tone: 'slate' },
        ],
      };

    case 'payments':
      return {
        title: 'Payments & Sales',
        subtitle: 'Track transactions and revenue.',
        signals: [
          { label: 'Paid', value: String(paidPayments), detail: 'completed payments', icon: DollarSign, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: DollarSign, tone: pendingPayments ? 'amber' : 'slate' },
          { label: 'Active', value: String(activeEnrollments), detail: 'paid enrollments', icon: UserPlus, tone: 'blue' },
          { label: 'Students', value: String(students), detail: 'total students', icon: Users, tone: 'slate' },
        ],
      };

    case 'events':
    case 'tournaments':
    case 'tournament-teams':
    case 'matches':
    case 'workshops':
    case 'event-registrations':
      return {
        title: 'Events & Competitions',
        subtitle: 'Tournaments, workshops, teams, and registrations.',
        signals: [
          { label: 'Students', value: String(students), detail: 'eligible participants', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrolled students', icon: UserPlus, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'academic programs', icon: BookOpen, tone: 'slate' },
          { label: 'Pending', value: String(pendingPayments), detail: 'payment queue', icon: DollarSign, tone: 'amber' },
        ],
      };

    case 'academic-catalog':
    case 'classes':
      return {
        title: 'Academic Catalog',
        subtitle: 'Programs, sub-programs, and class management.',
        signals: [
          { label: 'Programs', value: String(programs), detail: 'configured', icon: BookOpen, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: UserPlus, tone: 'emerald' },
          { label: 'Students', value: String(students), detail: 'enrolled', icon: Users, tone: 'slate' },
          { label: 'Pending', value: String(pendingPayments), detail: 'unpaid', icon: DollarSign, tone: 'amber' },
        ],
      };

    case 'certificates':
      return {
        title: 'Certificates',
        subtitle: 'Issue and manage student certificates.',
        signals: [
          { label: 'Students', value: String(students), detail: 'eligible', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'in progress', icon: UserPlus, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'programs', icon: Award, tone: 'purple' },
          { label: 'Paid', value: String(paidPayments), detail: 'completed payments', icon: DollarSign, tone: 'slate' },
        ],
      };

    case 'reports':
    case 'analytics':
      return {
        title: section === 'analytics' ? 'Analytics' : 'Reports & Data',
        subtitle: 'Business performance and downloadable reports.',
        signals: [
          { label: 'Students', value: String(students), detail: 'in reports', icon: BarChart3, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollment data', icon: UserPlus, tone: 'emerald' },
          { label: 'Paid', value: String(paidPayments), detail: 'revenue', icon: DollarSign, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'catalog', icon: BookOpen, tone: 'amber' },
        ],
      };

    case 'announcements':
    case 'communications':
      return {
        title: section === 'announcements' ? 'Announcements' : 'Communications',
        subtitle: 'Publish news and manage contact requests.',
        signals: [
          { label: 'Students', value: String(students), detail: 'audience reach', icon: Bell, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrolled users', icon: Users, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'programs to promote', icon: BookOpen, tone: 'slate' },
          { label: 'Pending', value: String(pendingPayments), detail: 'follow-ups', icon: MessageSquare, tone: 'amber' },
        ],
      };

    case 'store':
      return {
        title: 'Store Inventory',
        subtitle: 'Branch inventory management (backend-scoped for managers).',
        signals: [
          { label: 'Students', value: String(students), detail: 'potential customers', icon: ShoppingBag, tone: 'blue' },
          { label: 'Paid', value: String(paidPayments), detail: 'sales signal', icon: DollarSign, tone: 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: UserPlus, tone: 'slate' },
          { label: 'Programs', value: String(programs), detail: 'related offers', icon: BookOpen, tone: 'amber' },
        ],
      };

    case 'materials':
    case 'milestones':
      return {
        title: section === 'materials' ? 'Learning Materials' : 'Learning Milestones',
        subtitle: section === 'materials'
          ? 'Upload and manage course learning resources.'
          : 'Define and manage learning milestones for programs.',
        signals: [
          { label: 'Programs', value: String(programs), detail: 'catalog', icon: BookOpen, tone: 'blue' },
          { label: 'Students', value: String(students), detail: 'learners', icon: Users, tone: 'slate' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: UserPlus, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'queue', icon: DollarSign, tone: 'amber' },
        ],
      };

    case 'sponsors':
    case 'schools':
      return {
        title: section === 'sponsors' ? 'Sponsors & Partners' : 'Branches',
        subtitle: section === 'sponsors' ? 'Partner and sponsor management.' : 'Branch locations and settings.',
        signals: [
          { label: 'Students', value: String(students), detail: 'across branches', icon: Building, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: UserPlus, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'offerings', icon: BookOpen, tone: 'slate' },
          { label: 'Paid', value: String(paidPayments), detail: 'revenue', icon: DollarSign, tone: 'emerald' },
        ],
      };

    case 'staff-attendance':
      return {
        title: 'Staff Attendance',
        subtitle: 'Track instructor and staff attendance.',
        signals: [
          { label: 'Students', value: String(students), detail: 'student body', icon: Users, tone: 'blue' },
          { label: 'Programs', value: String(programs), detail: 'programs', icon: BookOpen, tone: 'slate' },
          { label: 'Active', value: String(activeEnrollments), detail: 'classes running', icon: Calendar, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'admin queue', icon: DollarSign, tone: 'amber' },
        ],
      };

    case 'walkin':
      return {
        title: 'Walk-In Registration',
        subtitle: 'On-site student registration and enrollment.',
        signals: [
          { label: 'Students', value: String(students), detail: 'registered', icon: Edit3, tone: 'blue' },
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: DollarSign, tone: 'amber' },
          { label: 'Active', value: String(activeEnrollments), detail: 'new enrollments', icon: UserPlus, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'to enroll in', icon: BookOpen, tone: 'slate' },
        ],
      };

    default:
      return {
        title: 'Operations Hub',
        subtitle: 'Platform management and administration.',
        signals: [
          { label: 'Students', value: String(students), detail: 'registered', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: UserPlus, tone: 'emerald' },
          { label: 'Payments', value: String(paidPayments), detail: 'completed', icon: DollarSign, tone: 'emerald' },
          { label: 'Programs', value: String(programs), detail: 'programs', icon: BookOpen, tone: 'amber' },
        ],
      };
  }
}
