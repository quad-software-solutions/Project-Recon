import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Edit3, BarChart3, Activity, ClipboardList, BookOpen, StickyNote, LogOut, Settings, User, CheckCircle2, DollarSign, RefreshCw, Loader2 } from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import AccountSettings from '@/src/shared/ui/AccountSettings';
import ProfileOverview from '@/src/domains/user/student/dashboard/ui/ProfileOverview';
import { fetchEnrollmentsApi, fetchStudentsApi, fetchAttendanceSessionsApi, fetchStudentProgressApi, fetchClassesApi } from '@/src/domains/learning/academics/api/academicApi';

import ClassManagement from './ClassManagement';
import ProgressSubmissions from './ProgressSubmissions';
import PerformanceMetrics from './PerformanceMetrics';
import ActivityFeed from './ActivityFeed';
import LessonPlanner from './LessonPlanner';
import GradeBook from './GradeBook';
import StudentNotes from './StudentNotes';

interface TeacherDashboardProps { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'class' | 'progress' | 'lessons' | 'gradebook' | 'metrics' | 'notes' | 'activity' | 'profile' | 'settings';

const NAV_ITEMS: NavItem[] = [
  { id: 'class', label: 'Class Management', icon: Users, group: 'main' },
  { id: 'lessons', label: 'Lesson Planner', icon: ClipboardList, group: 'main' },
  { id: 'notes', label: 'Student Notes', icon: StickyNote, group: 'main' },
  { id: 'progress', label: 'Progress', icon: Edit3, group: 'main' },
  { id: 'gradebook', label: 'Grade Book', icon: BookOpen, group: 'main' },
  { id: 'metrics', label: 'Performance', icon: BarChart3, group: 'main' },
  { id: 'activity', label: 'Activity', icon: Activity, group: 'main' },
  { id: 'profile', label: 'My Profile', icon: User, group: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'system' },
];

export default function TeacherDashboard({ currentUser, onLogout }: TeacherDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('class');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetchEnrollmentsApi(),
      fetchStudentsApi(),
      fetchClassesApi(),
    ]).then(([enr, stu]) => {
      setEnrollments(Array.isArray(enr) ? enr : []);
      setStudents(Array.isArray(stu) ? stu : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refreshData(); }, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');

  const renderPage = () => {
    switch (activeSection) {
      case 'class':
        return <ClassManagement students={students} enrollments={activeEnrollments} />;
      case 'progress':
        return <ProgressSubmissions students={students} enrollments={activeEnrollments} />;
      case 'lessons':   return <LessonPlanner />;
      case 'gradebook': return <GradeBook students={students} />;
      case 'metrics':   return <PerformanceMetrics students={students} enrollments={enrollments} />;
      case 'notes':     return <StudentNotes />;
      case 'activity':  return <ActivityFeed />;
      case 'profile':   return <ProfileOverview currentUser={currentUser} />;
      case 'settings':  return <AccountSettings />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Teacher Dashboard',
        icon: BookOpen,
        userName: currentUser.name,
        userRole: 'Instructor',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Teacher Dashboard',
        actions: (
          <button onClick={refreshData} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ),
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Instructor Command Center"
        subtitle="Class attendance, grading, lesson planning, and student follow-up."
        signals={[
          { label: 'Total Students', value: String(students.length), detail: 'enrolled', icon: Users, tone: 'blue' },
          { label: 'Active Enrollments', value: String(activeEnrollments.length), detail: 'current classes', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Pending', value: String(pendingEnrollments.length), detail: 'awaiting payment', icon: DollarSign, tone: 'amber' },
          { label: 'Lessons', value: String(activeEnrollments.length), detail: 'active tracks', icon: BookOpen, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}
