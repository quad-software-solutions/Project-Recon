import React, { useState, useEffect, useCallback } from 'react';
import { Users, Edit3, BarChart3, Activity, BookOpen, Calendar, FileText, CheckCircle2, DollarSign, RefreshCw, Loader2, AlertCircle, User } from 'lucide-react';
import { UserProfile, Enrollment, StudentProfile } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import AdminAccount from '@/src/domains/user/shared/ui/AdminAccount';
import {
  loadTeacherDashboardData,
  loadClassRoster,
  type TeacherClassOption,
} from '@/src/domains/user/teacher/api/teacherData';

import ClassManagement from './ClassManagement';
import ProgressSubmissions from './ProgressSubmissions';
import PerformanceMetrics from './PerformanceMetrics';
import ActivityFeed from './ActivityFeed';
import AttendanceHistory from './AttendanceHistory';
import Reports from './Reports';

interface TeacherDashboardProps { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'class' | 'progress' | 'metrics' | 'attendance' | 'activity' | 'reports' | 'account';

const NAV_ITEMS: NavItem[] = [
  { id: 'class', label: 'Class Management', icon: Users, group: 'main' },
  { id: 'attendance', label: 'Attendance', icon: Calendar, group: 'main' },
  { id: 'progress', label: 'Progress', icon: Edit3, group: 'main' },
  { id: 'metrics', label: 'Performance', icon: BarChart3, group: 'main' },
  { id: 'activity', label: 'Activity', icon: Activity, group: 'main' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'main' },
  { id: 'account', label: 'Account', icon: User, group: 'system' },
];

export default function TeacherDashboard({ currentUser, onLogout }: TeacherDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('class');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'staff' | 'instructor'>('instructor');
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<TeacherClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classEnrollments, setClassEnrollments] = useState<Enrollment[]>([]);
  const [classStudents, setClassStudents] = useState<StudentProfile[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await loadTeacherDashboardData();
      setMode(data.mode);
      setAllEnrollments(data.enrollments);
      setAllStudents(data.students);
      setClasses(data.classes);
      const classId = data.selectedClassId;
      setSelectedClassId(classId);
      const roster = await loadClassRoster(data.mode, classId, data.enrollments, data.students);
      setClassEnrollments(roster.enrollments);
      setClassStudents(roster.students);
    } catch {
      setLoadError('Unable to load dashboard data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, []);

  useEffect(() => {
    if (!selectedClassId || loading) return;
    let cancelled = false;
    loadClassRoster(mode, selectedClassId, allEnrollments, allStudents).then(roster => {
      if (!cancelled) {
        setClassEnrollments(roster.enrollments);
        setClassStudents(roster.students);
      }
    });
    return () => { cancelled = true; };
  }, [selectedClassId, mode, allEnrollments, allStudents, loading]);

  const activeEnrollments = allEnrollments.filter(e => e.status === 'ACTIVE');
  const pendingEnrollments = allEnrollments.filter(e => e.status === 'PENDING_PAYMENT');

  const renderPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      );
    }

    switch (activeSection) {
      case 'class':
        return (
          <ClassManagement
            students={classStudents}
            enrollments={classEnrollments}
            classes={classes}
            selectedClassId={selectedClassId}
            onClassChange={setSelectedClassId}
            mode={mode}
          />
        );
      case 'progress':
        return <ProgressSubmissions students={classStudents} enrollments={classEnrollments} />;
      case 'metrics':
        return <PerformanceMetrics students={classStudents} enrollments={classEnrollments.length ? classEnrollments : allEnrollments} />;
      case 'attendance':
        return <AttendanceHistory classId={selectedClassId} />;
      case 'activity':
        return <ActivityFeed mode={mode} classId={selectedClassId} />;
      case 'reports':
        return (
          <Reports
            classId={selectedClassId}
            sampleStudentId={
              mode === 'staff' && classEnrollments[0]?.student
                ? classEnrollments[0].student
                : undefined
            }
            staffMode={mode === 'staff'}
          />
        );
      case 'account':
        return <AdminAccount currentUser={currentUser} />;
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
        subtitle: mode === 'staff' ? 'Teacher Dashboard' : 'Instructor Dashboard',
        actions: (
          <button onClick={refreshData} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ),
      }}
      onLogout={onLogout}
    >
      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {loadError}
        </div>
      )}

      {mode === 'instructor' && !loading && classes.length === 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Record attendance for a class first, or ask an administrator to assign you as class instructor.
        </div>
      )}

      <DashboardCommandCenter
        title="Instructor Command Center"
        subtitle="Attendance, progress tracking, and PDF reports via the academic API."
        signals={[
          { label: 'Class Students', value: String(classStudents.length), detail: 'selected class', icon: Users, tone: 'blue' },
          { label: 'Active Enrollments', value: String(activeEnrollments.length || classEnrollments.length), detail: 'current', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Pending', value: String(pendingEnrollments.length), detail: 'awaiting payment', icon: DollarSign, tone: 'amber' },
          { label: 'Classes', value: String(classes.length), detail: mode === 'staff' ? 'catalog' : 'from attendance', icon: BookOpen, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}
