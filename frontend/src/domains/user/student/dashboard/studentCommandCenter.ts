import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  BookOpen, GraduationCap, Award, Calendar, ClipboardList,
  Trophy, FileText, Megaphone, MessageCircle,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

export type StudentSectionId =
  | 'home' | 'account' | 'academics' | 'career' | 'events'
  | 'announcements' | 'messaging' | 'certificates' | 'settings';

export interface StudentHubStats {
  activeCount: number;
  enrolledCount: number;
  completedCount: number;
  pendingCount: number;
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

/** Section-specific command center — avoids showing the same "Student Hub" on every page. */
export function getSectionCommandCenter(
  section: StudentSectionId,
  stats: StudentHubStats,
): CommandCenterConfig | null {
  const {
    activeCount, enrolledCount, completedCount, pendingCount,
    certificateCount, eventRegCount, announcementCount,
    loading = false,
  } = stats;

  if (loading && section !== 'settings') {
    return {
      title: section === 'home' ? 'Student Hub' : 'Loading',
      subtitle: 'Fetching your dashboard data…',
      signals: [
        { label: 'Courses', value: '—', detail: 'loading…', icon: BookOpen, tone: 'slate' },
        { label: 'Enrolled', value: '—', detail: 'loading…', icon: GraduationCap, tone: 'slate' },
        { label: 'Events', value: '—', detail: 'loading…', icon: Calendar, tone: 'slate' },
        { label: 'Certs', value: '—', detail: 'loading…', icon: Award, tone: 'slate' },
      ],
    };
  }

  switch (section) {
    case 'home':
      return {
        title: 'Student Hub',
        subtitle: 'Your learning and events at a glance.',
        signals: [
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: activeCount ? 'blue' : 'amber' },
          { label: 'Enrolled', value: String(enrolledCount), detail: 'total programs', icon: GraduationCap, tone: enrolledCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'Certs', value: String(certificateCount), detail: 'certificates', icon: Award, tone: certificateCount ? 'emerald' : 'slate' },
        ],
      };

    case 'academics':
      return {
        title: 'Academics',
        subtitle: 'Courses, attendance, progress, and learning resources.',
        signals: [
          { label: 'Active', value: String(activeCount), detail: 'current courses', icon: BookOpen, tone: activeCount ? 'blue' : 'slate' },
          { label: 'Completed', value: String(completedCount), detail: 'finished programs', icon: CheckCircle2, tone: completedCount ? 'emerald' : 'slate' },
          { label: 'Pending', value: String(pendingCount), detail: 'awaiting payment', icon: AlertCircle, tone: pendingCount ? 'amber' : 'slate' },
          { label: 'Certs', value: String(certificateCount), detail: 'earned credentials', icon: Award, tone: certificateCount ? 'emerald' : 'slate' },
        ],
      };

    case 'career':
      return {
        title: 'Career Center',
        subtitle: 'Workshops, guidance, and professional certificates.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned credentials', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'event registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'Active', value: String(activeCount), detail: 'current courses', icon: BookOpen, tone: activeCount ? 'blue' : 'slate' },
          { label: 'Completed', value: String(completedCount), detail: 'finished', icon: CheckCircle2, tone: completedCount ? 'emerald' : 'slate' },
        ],
      };

    case 'events':
      return {
        title: 'Events & Tournaments',
        subtitle: 'Browse, register, and track your participation.',
        signals: [
          { label: 'Registered', value: String(eventRegCount), detail: 'your registrations', icon: ClipboardList, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: activeCount ? 'emerald' : 'slate' },
          { label: 'Certs', value: String(certificateCount), detail: 'certificates', icon: Award, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Pending', value: String(pendingCount), detail: 'awaiting payment', icon: AlertCircle, tone: pendingCount ? 'amber' : 'slate' },
        ],
      };

    case 'announcements':
      return {
        title: 'Announcements',
        subtitle: 'Official news and updates from the institution.',
        signals: [
          { label: 'News', value: String(announcementCount), detail: 'published items', icon: Megaphone, tone: announcementCount ? 'blue' : 'slate' },
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: 'slate' },
          { label: 'Certs', value: String(certificateCount), detail: 'certificates', icon: Award, tone: 'slate' },
        ],
      };

    case 'messaging':
      return {
        title: 'Messages & Support',
        subtitle: 'Announcements and contact support.',
        signals: [
          { label: 'News', value: String(announcementCount), detail: 'announcements', icon: Megaphone, tone: announcementCount ? 'blue' : 'slate' },
          { label: 'Support', value: '—', detail: 'via contact form', icon: MessageCircle, tone: 'slate' },
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Trophy, tone: 'slate' },
        ],
      };

    case 'certificates':
      return {
        title: 'Certificates',
        subtitle: 'Your issued academic and event certificates.',
        signals: [
          { label: 'Issued', value: String(certificateCount), detail: 'certificates', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Active', value: String(activeCount), detail: 'current courses', icon: BookOpen, tone: 'blue' },
          { label: 'Completed', value: String(completedCount), detail: 'finished programs', icon: CheckCircle2, tone: 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: 'slate' },
        ],
      };

    case 'account':
    case 'settings':
      return null;

    default:
      return null;
  }
}
