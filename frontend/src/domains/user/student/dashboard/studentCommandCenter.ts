import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  BookOpen, GraduationCap, Bell, Zap, Award, Calendar, ClipboardList,
  Trophy, FileText, Megaphone, MessageCircle,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

export type StudentSectionId =
  | 'home' | 'account' | 'academics' | 'career' | 'events'
  | 'notifications' | 'announcements' | 'messaging' | 'certificates';

export interface StudentHubStats {
  activeCount: number;
  enrolledCount: number;
  completedCount: number;
  pendingCount: number;
  unreadCount: number;
  xpPoints: number;
  badgeCount: number;
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
    unreadCount, xpPoints, badgeCount, certificateCount, eventRegCount,
    loading = false,
  } = stats;

  if (loading) {
    return {
      title: section === 'home' ? 'Student Hub' : 'Loading',
      subtitle: 'Fetching your dashboard data…',
      signals: [
        { label: 'Courses', value: '—', detail: 'loading…', icon: BookOpen, tone: 'slate' },
        { label: 'Enrolled', value: '—', detail: 'loading…', icon: GraduationCap, tone: 'slate' },
        { label: 'Alerts', value: '—', detail: 'loading…', icon: Bell, tone: 'slate' },
        { label: 'XP', value: '—', detail: 'loading…', icon: Zap, tone: 'slate' },
      ],
    };
  }

  switch (section) {
    case 'home':
      return {
        title: 'Student Hub',
        subtitle: 'Your learning, events, and career at a glance.',
        signals: [
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: activeCount ? 'blue' : 'amber' },
          { label: 'Enrolled', value: String(enrolledCount), detail: 'total programs', icon: GraduationCap, tone: enrolledCount ? 'emerald' : 'slate' },
          { label: 'Alerts', value: String(unreadCount), detail: 'unread notifications', icon: Bell, tone: unreadCount ? 'amber' : 'slate' },
          { label: 'XP', value: xpPoints.toLocaleString(), detail: 'experience points', icon: Zap, tone: 'purple' },
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
          { label: 'Badges', value: String(badgeCount), detail: 'achievements earned', icon: Award, tone: badgeCount ? 'purple' : 'slate' },
        ],
      };

    case 'career':
      return {
        title: 'Career Center',
        subtitle: 'Workshops, guidance, and professional certificates.',
        signals: [
          { label: 'Certificates', value: String(certificateCount), detail: 'earned credentials', icon: FileText, tone: certificateCount ? 'emerald' : 'slate' },
          { label: 'Events', value: String(eventRegCount), detail: 'event registrations', icon: Calendar, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'XP', value: xpPoints.toLocaleString(), detail: 'experience points', icon: Zap, tone: 'purple' },
          { label: 'Alerts', value: String(unreadCount), detail: 'career notifications', icon: Bell, tone: unreadCount ? 'amber' : 'slate' },
        ],
      };

    case 'events':
      return {
        title: 'Events & Tournaments',
        subtitle: 'Browse, register, and track your participation.',
        signals: [
          { label: 'Registered', value: String(eventRegCount), detail: 'your registrations', icon: ClipboardList, tone: eventRegCount ? 'blue' : 'slate' },
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: activeCount ? 'emerald' : 'slate' },
          { label: 'Alerts', value: String(unreadCount), detail: 'event notifications', icon: Bell, tone: unreadCount ? 'amber' : 'slate' },
          { label: 'XP', value: xpPoints.toLocaleString(), detail: 'competition points', icon: Trophy, tone: 'purple' },
        ],
      };

    case 'notifications':
      return {
        title: 'Notifications',
        subtitle: 'Academic, event, and system updates.',
        signals: [
          { label: 'Unread', value: String(unreadCount), detail: 'need attention', icon: Bell, tone: unreadCount ? 'amber' : 'emerald' },
          { label: 'Courses', value: String(activeCount), detail: 'active enrollments', icon: BookOpen, tone: 'blue' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: 'slate' },
          { label: 'Certs', value: String(certificateCount), detail: 'certificates', icon: Award, tone: 'slate' },
        ],
      };

    case 'announcements':
      return {
        title: 'Announcements',
        subtitle: 'Official news and updates from the institution.',
        signals: [
          { label: 'News', value: String(stats.announcementCount), detail: 'published items', icon: Megaphone, tone: stats.announcementCount ? 'blue' : 'slate' },
          { label: 'Alerts', value: String(unreadCount), detail: 'unread notifications', icon: Bell, tone: unreadCount ? 'amber' : 'slate' },
          { label: 'Courses', value: String(activeCount), detail: 'your programs', icon: GraduationCap, tone: 'blue' },
          { label: 'Events', value: String(eventRegCount), detail: 'registrations', icon: Calendar, tone: 'slate' },
        ],
      };

    case 'messaging':
      return {
        title: 'Messages',
        subtitle: 'Announcements and support communication.',
        signals: [
          { label: 'Alerts', value: String(unreadCount), detail: 'unread messages', icon: MessageCircle, tone: unreadCount ? 'amber' : 'slate' },
          { label: 'Courses', value: String(activeCount), detail: 'enrolled programs', icon: BookOpen, tone: 'blue' },
          { label: 'Events', value: String(eventRegCount), detail: 'event activity', icon: Calendar, tone: 'slate' },
          { label: 'Support', value: 'Open', detail: 'contact form available', icon: Megaphone, tone: 'emerald' },
        ],
      };

    case 'certificates':
      return {
        title: 'Certificates',
        subtitle: 'View, download, and verify your achievements.',
        signals: [
          { label: 'Earned', value: String(certificateCount), detail: 'certificates issued', icon: FileText, tone: certificateCount ? 'emerald' : 'amber' },
          { label: 'Completed', value: String(completedCount), detail: 'programs finished', icon: CheckCircle2, tone: completedCount ? 'blue' : 'slate' },
          { label: 'Active', value: String(activeCount), detail: 'in progress', icon: BookOpen, tone: 'slate' },
          { label: 'Badges', value: String(badgeCount), detail: 'achievements', icon: Award, tone: badgeCount ? 'purple' : 'slate' },
        ],
      };

  case 'account':
      return {
        title: 'My Account',
        subtitle: 'Profile, security, and account preferences.',
        signals: [
          { label: 'XP', value: xpPoints.toLocaleString(), detail: 'experience points', icon: Zap, tone: 'purple' },
          { label: 'Badges', value: String(badgeCount), detail: 'earned badges', icon: Award, tone: badgeCount ? 'emerald' : 'slate' },
          { label: 'Courses', value: String(enrolledCount), detail: 'total enrollments', icon: GraduationCap, tone: 'blue' },
          { label: 'Alerts', value: String(unreadCount), detail: 'notifications', icon: Bell, tone: unreadCount ? 'amber' : 'slate' },
        ],
      };

    default:
      return null;
  }
}
