import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  LayoutDashboard, UserPlus, Users, DollarSign, Award, Calendar,
  FileText, Search, Shield,
} from 'lucide-react';

export type SecretarySectionId =
  | 'overview' | 'admissions' | 'enrollments' | 'payments' | 'certificates'
  | 'templates' | 'reports' | 'periods' | 'announcements'
  | 'students' | 'event-registrations' | 'account';

export interface SecretaryHubStats {
  pendingPayments: number;
  activeEnrollments: number;
  todayPayments: number;
  certificatesIssued: number;
  templates: number;
  periods: number;
  loading: boolean;
}

export interface CommandCenterConfig {
  title: string;
  subtitle: string;
  signals: DashboardSignal[];
}

const loading = (label: string, icon: DashboardSignal['icon']): DashboardSignal => ({
  label, value: '—', detail: 'loading...', icon, tone: 'slate',
});

export function getSecretaryCommandCenter(
  section: SecretarySectionId,
  stats: SecretaryHubStats,
): CommandCenterConfig | null {
  if (section === 'account') return null;

  const {
    pendingPayments, activeEnrollments, todayPayments, certificatesIssued,
    templates, periods, loading: isLoading,
  } = stats;

  if (isLoading) {
    return {
      title: 'Secretary Hub',
      subtitle: 'Loading operational data...',
      signals: [
        loading('Pending', UserPlus),
        loading('Active', Users),
        loading('Payments', DollarSign),
        loading('Certificates', Award),
      ],
    };
  }

  switch (section) {
    case 'overview':
      return {
        title: 'Secretary Hub',
        subtitle: 'Admissions, enrollments, payments, and certificates at a glance.',
        signals: [
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: UserPlus, tone: pendingPayments ? 'amber' : 'slate' },
          { label: 'Active', value: String(activeEnrollments), detail: 'current enrollments', icon: Users, tone: 'emerald' },
          { label: 'Today', value: String(todayPayments), detail: 'payments recorded', icon: DollarSign, tone: 'blue' },
          { label: 'Certificates', value: String(certificatesIssued), detail: 'total issued', icon: Award, tone: 'emerald' },
        ],
      };

    case 'admissions':
      return {
        title: 'Admissions',
        subtitle: 'New student intake and enrollment requests.',
        signals: [
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: UserPlus, tone: 'amber' },
          { label: 'Active', value: String(activeEnrollments), detail: 'enrolled students', icon: Users, tone: 'emerald' },
          { label: 'Periods', value: String(periods), detail: 'enrollment windows', icon: Calendar, tone: 'blue' },
          { label: 'Today', value: String(todayPayments), detail: 'payments today', icon: DollarSign, tone: 'slate' },
        ],
      };

    case 'enrollments':
      return {
        title: 'Enrollments',
        subtitle: 'Manage student program enrollments and status.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'in progress', icon: Users, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'payment due', icon: DollarSign, tone: pendingPayments ? 'amber' : 'slate' },
          { label: 'Periods', value: String(periods), detail: 'open periods', icon: Calendar, tone: 'blue' },
          { label: 'Certificates', value: String(certificatesIssued), detail: 'issued', icon: Award, tone: 'slate' },
        ],
      };

    case 'transfers':
      return {
        title: 'Branch Transfers',
        subtitle: 'Review and approve student branch transfer requests.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollments', icon: Users, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'payment due', icon: DollarSign, tone: pendingPayments ? 'amber' : 'slate' },
          { label: 'Periods', value: String(periods), detail: 'open periods', icon: Calendar, tone: 'blue' },
          { label: 'Today', value: String(todayPayments), detail: 'payments today', icon: DollarSign, tone: 'slate' },
        ],
      };

    case 'payments':
      return {
        title: 'Payments',
        subtitle: 'Track and record student payments.',
        signals: [
          { label: 'Today', value: String(todayPayments), detail: 'recorded today', icon: DollarSign, tone: 'blue' },
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: UserPlus, tone: pendingPayments ? 'amber' : 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'paid enrollments', icon: Users, tone: 'emerald' },
          { label: 'Certificates', value: String(certificatesIssued), detail: 'linked certs', icon: Award, tone: 'slate' },
        ],
      };

    case 'certificates':
      return {
        title: 'Certificates',
        subtitle: 'Issue and manage student certificates.',
        signals: [
          { label: 'Issued', value: String(certificatesIssued), detail: 'total certificates', icon: Award, tone: 'emerald' },
          { label: 'Templates', value: String(templates), detail: 'available templates', icon: FileText, tone: 'blue' },
          { label: 'Completed', value: String(activeEnrollments), detail: 'active students', icon: Users, tone: 'slate' },
          { label: 'Periods', value: String(periods), detail: 'enrollment periods', icon: Calendar, tone: 'purple' },
        ],
      };

    case 'templates':
      return {
        title: 'Certificate Templates',
        subtitle: 'Design and manage certificate layouts.',
        signals: [
          { label: 'Templates', value: String(templates), detail: 'configured', icon: FileText, tone: 'blue' },
          { label: 'Issued', value: String(certificatesIssued), detail: 'certificates issued', icon: Award, tone: 'emerald' },
          { label: 'Active', value: String(activeEnrollments), detail: 'eligible students', icon: Users, tone: 'slate' },
          { label: 'Periods', value: String(periods), detail: 'enrollment windows', icon: Calendar, tone: 'purple' },
        ],
      };

    case 'periods':
      return {
        title: 'Enrollment Periods',
        subtitle: 'Configure enrollment windows and deadlines.',
        signals: [
          { label: 'Periods', value: String(periods), detail: 'configured', icon: Calendar, tone: 'blue' },
          { label: 'Active', value: String(activeEnrollments), detail: 'current enrollments', icon: Users, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: DollarSign, tone: 'amber' },
          { label: 'Today', value: String(todayPayments), detail: 'payments today', icon: DollarSign, tone: 'slate' },
        ],
      };

    case 'students':
      return {
        title: 'Student Details',
        subtitle: 'Search and view individual student records.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'enrolled students', icon: Users, tone: 'emerald' },
          { label: 'Certificates', value: String(certificatesIssued), detail: 'issued', icon: Award, tone: 'blue' },
          { label: 'Pending', value: String(pendingPayments), detail: 'payment due', icon: DollarSign, tone: 'amber' },
          { label: 'Templates', value: String(templates), detail: 'cert templates', icon: FileText, tone: 'slate' },
        ],
      };

    case 'event-registrations':
      return {
        title: 'Event Registrations',
        subtitle: 'Manage competition and event sign-ups.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'academic enrollments', icon: Users, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'payment queue', icon: DollarSign, tone: 'amber' },
          { label: 'Today', value: String(todayPayments), detail: 'payments today', icon: DollarSign, tone: 'blue' },
          { label: 'Certificates', value: String(certificatesIssued), detail: 'event certs', icon: Award, tone: 'slate' },
        ],
      };

    case 'reports':
      return {
        title: 'Reports',
        subtitle: 'Generate PDF reports for students and programs.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'enrollment reports', icon: Users, tone: 'blue' },
          { label: 'Certificates', value: String(certificatesIssued), detail: 'certificate reports', icon: Award, tone: 'emerald' },
          { label: 'Today', value: String(todayPayments), detail: 'payment reports', icon: DollarSign, tone: 'slate' },
          { label: 'Templates', value: String(templates), detail: 'template count', icon: FileText, tone: 'purple' },
        ],
      };

    case 'announcements':
      return {
        title: 'Announcements',
        subtitle: 'Official news, updates, and institutional announcements.',
        signals: [
          { label: 'Active', value: String(activeEnrollments), detail: 'current enrollments', icon: Users, tone: 'emerald' },
          { label: 'Pending', value: String(pendingPayments), detail: 'awaiting payment', icon: DollarSign, tone: pendingPayments ? 'amber' : 'slate' },
          { label: 'Today', value: String(todayPayments), detail: 'payments today', icon: DollarSign, tone: 'blue' },
          { label: 'Templates', value: String(templates), detail: 'cert templates', icon: FileText, tone: 'slate' },
        ],
      };

    default:
      return null;
  }
}
