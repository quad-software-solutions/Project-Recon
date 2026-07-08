import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Edit3, BarChart3, Activity, ClipboardList, BookOpen, StickyNote, LogOut, Settings, User } from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import AccountSettings from '@/src/shared/ui/AccountSettings';
import ProfileOverview from '@/src/domains/user/student/dashboard/ui/ProfileOverview';

import ClassManagement from './ClassManagement';
import ProgressSubmissions from './ProgressSubmissions';
import PerformanceMetrics from './PerformanceMetrics';
import ActivityFeed from './ActivityFeed';
import LessonPlanner from './LessonPlanner';
import GradeBook from './GradeBook';
import StudentNotes from './StudentNotes';

interface TeacherDashboardProps { currentUser: UserProfile; onLogout: () => void; }

const INITIAL_STUDENTS = [
  { id: 1, name: 'Abebe B.', course: 'VEX', status: 'Good', attended: false },
  { id: 2, name: 'Abebe L.', course: 'VEX', status: 'New',  attended: false },
  { id: 3, name: 'Radiom J.', course: 'VEX', status: 'Good', attended: false },
  { id: 4, name: 'Skelos K.', course: 'VEX', status: 'New',  attended: false },
  { id: 5, name: 'Dr. Elias T.', course: 'STEM', status: 'Good', attended: false },
];

const INITIAL_ASSIGNMENTS = [
  { id: 1, student: 'Student 1', assign: 'A11', confirmed: false },
  { id: 2, student: 'Student 2', assign: 'A12', confirmed: false },
  { id: 3, student: 'Student 3', assign: 'A13', confirmed: false },
];

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
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [progressSearch, setProgressSearch] = useState('');
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);

  const [activeSection, setActiveSection] = useState<SectionId>('class');

  const toggleAttendance = (id: number) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, attended: !s.attended } : s));
  const confirmAssignment = (id: number) =>
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, confirmed: true } : a));

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredForProgress = students.filter(s => s.name.toLowerCase().includes(progressSearch.toLowerCase()));

  const renderPage = () => {
    switch (activeSection) {
      case 'class':
        return (<ClassManagement students={students} searchQuery={searchQuery} onSearchChange={setSearchQuery} filteredStudents={filteredStudents} onToggleAttendance={toggleAttendance} totalCount={students.length} attendedCount={students.filter(s => s.attended).length} />);
      case 'progress':
        return (<ProgressSubmissions progressSearch={progressSearch} onProgressSearchChange={setProgressSearch} filteredForProgress={filteredForProgress} assignments={assignments} onConfirmAssignment={confirmAssignment} />);
      case 'lessons':   return <LessonPlanner />;
      case 'gradebook': return <GradeBook />;
      case 'metrics':   return <PerformanceMetrics />;
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
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Instructor Command Center"
        subtitle="Class attendance, grading, lesson planning, and student follow-up."
        signals={[
          { label: 'Attendance', value: `${students.filter(s => s.attended).length}/${students.length}`, detail: 'checked in today', icon: Users, tone: students.some(s => s.attended) ? 'emerald' : 'amber' },
          { label: 'Assignments', value: String(assignments.filter(a => !a.confirmed).length), detail: 'awaiting confirmation', icon: ClipboardList, tone: 'amber' },
          { label: 'Gradebook', value: 'Open', detail: 'assessment tools ready', icon: BookOpen, tone: 'blue' },
          { label: 'Activity', value: 'Live', detail: 'student feed available', icon: Activity, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}
