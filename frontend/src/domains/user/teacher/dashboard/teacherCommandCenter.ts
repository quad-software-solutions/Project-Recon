import type { DashboardSignal } from '@/shared/ui/DashboardCommandCenter';
import {
  Users, Edit3, BarChart3, Activity, BookOpen, Calendar, FileText,
  GraduationCap, CheckCircle2, DollarSign, Clock,
} from 'lucide-react';

export type TeacherSectionId =
  | 'class' | 'workshops' | 'attendance' | 'progress' | 'milestones'
  | 'materials' | 'metrics' | 'activity' | 'reports' | 'announcements' | 'account';

export interface TeacherHubStats {
  classStudents: number;
  classActive: number;
  classPending: number;
  classesCount: number;
  workshopsCount: number;
  mode: 'staff' | 'instructor';
  loading: boolean;
}

export interface CommandCenterConfig {
  title: string;
  subtitle: string;
  signals: DashboardSignal[];
}

export function getTeacherCommandCenter(
  section: TeacherSectionId,
  stats: TeacherHubStats,
): CommandCenterConfig | null {
  if (section === 'account') return null;

  const { classStudents, classActive, classPending, classesCount, workshopsCount, mode, loading } = stats;

  if (loading) {
    return {
      title: 'Instructor Hub',
      subtitle: 'Loading class data...',
      signals: [
        { label: 'Students', value: '—', detail: 'loading...', icon: Users, tone: 'slate' },
        { label: 'Active', value: '—', detail: 'loading...', icon: CheckCircle2, tone: 'slate' },
        { label: 'Pending', value: '—', detail: 'loading...', icon: DollarSign, tone: 'slate' },
        { label: 'Classes', value: '—', detail: 'loading...', icon: BookOpen, tone: 'slate' },
      ],
    };
  }

  const modeLabel = mode === 'staff' ? 'staff view' : 'instructor view';

  switch (section) {
    case 'class':
      return {
        title: 'Class Management',
        subtitle: `Manage your class roster and enrollments — ${modeLabel}.`,
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'in selected class', icon: Users, tone: classStudents ? 'blue' : 'slate' },
          { label: 'Active', value: String(classActive), detail: 'active enrollments', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Pending', value: String(classPending), detail: 'awaiting payment', icon: DollarSign, tone: classPending ? 'amber' : 'slate' },
          { label: 'Classes', value: String(classesCount), detail: mode === 'staff' ? 'catalog' : 'assigned', icon: BookOpen, tone: 'emerald' },
        ],
      };

    case 'workshops':
      return {
        title: 'My Workshops',
        subtitle: 'Workshops you are assigned to instruct.',
        signals: [
          { label: 'Workshops', value: String(workshopsCount), detail: 'assigned to you', icon: GraduationCap, tone: workshopsCount ? 'blue' : 'amber' },
          { label: 'Students', value: String(classStudents), detail: 'class students', icon: Users, tone: 'slate' },
          { label: 'Classes', value: String(classesCount), detail: 'your classes', icon: BookOpen, tone: 'emerald' },
          { label: 'Active', value: String(classActive), detail: 'enrollments', icon: CheckCircle2, tone: 'slate' },
        ],
      };

    case 'attendance':
      return {
        title: 'Attendance',
        subtitle: 'Record and review class attendance sessions.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'to track', icon: Users, tone: 'blue' },
          { label: 'Classes', value: String(classesCount), detail: 'available', icon: Calendar, tone: 'emerald' },
          { label: 'Active', value: String(classActive), detail: 'enrolled', icon: CheckCircle2, tone: 'slate' },
          { label: 'Pending', value: String(classPending), detail: 'not yet paid', icon: Clock, tone: classPending ? 'amber' : 'slate' },
        ],
      };

    case 'progress':
      return {
        title: 'Progress Tracking',
        subtitle: 'Review and update student milestone progress.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'in class', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'tracking progress', icon: Edit3, tone: 'emerald' },
          { label: 'Pending', value: String(classPending), detail: 'incomplete payment', icon: DollarSign, tone: 'amber' },
          { label: 'Classes', value: String(classesCount), detail: 'classes', icon: BookOpen, tone: 'slate' },
        ],
      };

    case 'milestones':
      return {
        title: 'Learning Milestones',
        subtitle: 'Create and manage curriculum milestones for your classes.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'in class', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'active enrollments', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Classes', value: String(classesCount), detail: 'your classes', icon: BookOpen, tone: 'slate' },
          { label: 'Pending', value: String(classPending), detail: 'incomplete', icon: DollarSign, tone: classPending ? 'amber' : 'slate' },
        ],
      };

    case 'materials':
      return {
        title: 'Learning Materials',
        subtitle: 'Upload and manage learning resources for your sub-programs.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'in class', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'active enrollments', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Classes', value: String(classesCount), detail: 'your classes', icon: BookOpen, tone: 'slate' },
          { label: 'Pending', value: String(classPending), detail: 'incomplete', icon: DollarSign, tone: classPending ? 'amber' : 'slate' },
        ],
      };

    case 'metrics':
      return {
        title: 'Performance Metrics',
        subtitle: 'Class performance and enrollment analytics.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'in scope', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'performing', icon: BarChart3, tone: 'emerald' },
          { label: 'Classes', value: String(classesCount), detail: 'compared', icon: BookOpen, tone: 'purple' },
          { label: 'Pending', value: String(classPending), detail: 'at risk', icon: DollarSign, tone: classPending ? 'amber' : 'slate' },
        ],
      };

    case 'activity':
      return {
        title: 'Activity Feed',
        subtitle: 'Recent class and student activity.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'monitored', icon: Activity, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'recent activity', icon: Users, tone: 'emerald' },
          { label: 'Classes', value: String(classesCount), detail: 'tracked', icon: BookOpen, tone: 'slate' },
          { label: 'Workshops', value: String(workshopsCount), detail: 'workshop events', icon: GraduationCap, tone: 'purple' },
        ],
      };

    case 'reports':
      return {
        title: 'Reports',
        subtitle: 'Download PDF reports for your class.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'report scope', icon: FileText, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'enrollment reports', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Classes', value: String(classesCount), detail: 'class reports', icon: BookOpen, tone: 'slate' },
          { label: 'Pending', value: String(classPending), detail: 'unpaid', icon: DollarSign, tone: 'amber' },
        ],
      };

    case 'announcements':
      return {
        title: 'Announcements',
        subtitle: 'Official updates, news, and institutional announcements.',
        signals: [
          { label: 'Students', value: String(classStudents), detail: 'your class size', icon: Users, tone: 'blue' },
          { label: 'Active', value: String(classActive), detail: 'active enrollments', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Classes', value: String(classesCount), detail: 'your classes', icon: BookOpen, tone: 'slate' },
          { label: 'Workshops', value: String(workshopsCount), detail: 'assigned', icon: GraduationCap, tone: 'purple' },
        ],
      };

    default:
      return null;
  }
}
