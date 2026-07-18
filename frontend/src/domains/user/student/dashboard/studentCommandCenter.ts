import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  BookOpen, Calendar, ClipboardList,
  Trophy, FileText, Megaphone, ShoppingBag, GraduationCap,
  Target, DollarSign,
} from 'lucide-react';

export type StudentSectionId =
  | 'home' | 'account' | 'store' | 'career' | 'events'
  | 'announcements' | 'messaging' | 'certificates'
  | 'academics' | 'progress' | 'attendance' | 'materials' | 'payments';

export interface StudentHubStats {
  certificateCount: number;
  eventRegCount: number;
  announcementCount: number;
  loading?: boolean;
}

export interface CommandCenterConfig {
  title: string;
  subtitle: string;
  signals: DashboardSignal[];
}

export function getSectionCommandCenter(
  section: StudentSectionId,
  stats: StudentHubStats,
): CommandCenterConfig | null {
  const {
    certificateCount, eventRegCount, announcementCount,
    loading = false,
  } = stats;

  if (loading) {
    return {
      title: section === 'home' ? 'Student Hub' : 'Loading',
      subtitle: 'Fetching your dashboard data…',
      signals: [
        { label: 'Certificates', value: '—', detail: 'loading…', icon: FileText, tone: 'slate' },
        { label: 'Events', value: '—', detail: 'loading…', icon: Calendar, tone: 'slate' },
        { label: 'News', value: '—', detail: 'loading…', icon: Megaphone, tone: 'slate' },
      ],
    };
  }

  switch (section) {
    case 'home':
      return {
        title: 'Student Hub',
        subtitle: 'Your achievements, events, and store at a glance.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned credentials', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'event registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'Announcements', value: String(announcementCount), detail: 'published news', icon: Megaphone, tone: announcementCount ? 'amber' : 'slate' },
        ],
      };

    case 'store':
      return {
        title: 'Store',
        subtitle: 'Browse products and manage your orders.',
        signals: [
          { label: 'Products', value: '—', detail: 'browse catalog', icon: ShoppingBag, tone: 'blue' },
          { label: 'Cart', value: '—', detail: 'view your cart', icon: ShoppingBag, tone: 'emerald' },
          { label: 'Orders', value: '—', detail: 'order history', icon: ClipboardList, tone: 'slate' },
        ],
      };

    case 'career':
      return {
        title: 'Career Center',
        subtitle: 'Workshops, guidance, and professional certificates.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned credentials', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'event registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
        ],
      };

    case 'events':
      return {
        title: 'Events & Tournaments',
        subtitle: 'Browse, register, and track your participation.',
        signals: [
          { label: 'Registered', value: String(eventRegCount), detail: 'your registrations', icon: ClipboardList, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
        ],
      };

    case 'announcements':
      return {
        title: 'Announcements',
        subtitle: 'Official news and updates from the institution.',
        signals: [
          { label: 'News', value: String(announcementCount), detail: 'published items', icon: Megaphone, tone: announcementCount ? 'blue' : 'slate' },
        ],
      };

    case 'messaging':
      return {
        title: 'Messages & Support',
        subtitle: 'Announcements and contact support.',
        signals: [
          { label: 'Support', value: 'Open', detail: 'contact form available', icon: Megaphone, tone: 'emerald' },
        ],
      };

    case 'certificates':
      return {
        title: 'Certificates',
        subtitle: 'Your issued academic and event certificates.',
        signals: [
          { label: 'Earned', value: String(certificateCount), detail: 'certificates issued', icon: FileText, tone: certificateCount ? 'emerald' : 'amber' },
        ],
      };

    case 'account':
      return {
        title: 'My Account',
        subtitle: 'Profile, security, and account preferences.',
        signals: [
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: 'blue' },
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
        ],
      };

    case 'academics':
      return {
        title: 'My Programs',
        subtitle: 'Your enrollments, classes, and academic journey.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
        ],
      };

    case 'progress':
      return {
        title: 'Learning Progress',
        subtitle: 'Milestones, achievements, and progress tracking.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
        ],
      };

    case 'attendance':
      return {
        title: 'Attendance',
        subtitle: 'Your attendance records and history.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
        ],
      };

    case 'materials':
      return {
        title: 'Learning Materials',
        subtitle: 'Course resources, documents, and media.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
        ],
      };

    case 'payments':
      return {
        title: 'Payments',
        subtitle: 'Payment history and transaction details.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
        ],
      };

    default:
      return null;
  }
}
