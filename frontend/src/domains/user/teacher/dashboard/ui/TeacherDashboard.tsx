import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Edit3, BarChart3, Activity, BookOpen, Calendar, FileText, DollarSign, RefreshCw, Loader2, User, GraduationCap, Clock, Target, Megaphone, Shield } from 'lucide-react';
import { UserProfile, Enrollment, StudentProfile } from '@/shared/types';
import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';
import DashboardCommandCenter from '@/shared/ui/DashboardCommandCenter';
import InlineAlert from '@/shared/ui/InlineAlert';
import PageSpinner from '@/shared/ui/PageSpinner';
import EmptyState from '@/shared/ui/EmptyState';
import { getTeacherCommandCenter, type TeacherSectionId } from '../teacherCommandCenter';
import AdminAccount from '@/domains/user/shared/ui/AdminAccount';
import AnnouncementsPage from '@/domains/user/student/dashboard/ui/modules/AnnouncementsPage';
import {
  canAccessTeacherSection,
  filterTeacherNavItems,
  resolveTeacherSection,
} from '@/shared/auth/dashboardAccess';
import {
  loadTeacherDashboardData,
  loadClassRoster,
  type TeacherClassOption,
} from '@/domains/user/teacher/api/teacherData';

import ClassManagement from './ClassManagement';
import ProgressSubmissions from './ProgressSubmissions';
import PerformanceMetrics from './PerformanceMetrics';
import ActivityFeed from './ActivityFeed';
import AttendanceHistory from './AttendanceHistory';
import Reports from './Reports';
import LearningMaterialsPanel from '@/domains/user/secretary/dashboard/ui/LearningMaterialsPanel';
import LearningMilestonesManager from '@/domains/user/secretary/dashboard/ui/LearningMilestonesManager';
import { adminGetWorkshops } from '@/domains/competition/api/eventsApi';
import type { BackendWorkshop } from '@/domains/competition/api/eventsApi';

interface TeacherDashboardProps { currentUser: UserProfile; onLogout: () => void; }

type SectionId = TeacherSectionId;

const NAV_ITEMS: NavItem[] = [
  { id: 'class', label: 'Class Management', icon: Users, group: 'main' },
  { id: 'workshops', label: 'My Workshops', icon: GraduationCap, group: 'main' },
  { id: 'attendance', label: 'Attendance', icon: Calendar, group: 'teaching' },
  { id: 'progress', label: 'Progress', icon: Edit3, group: 'teaching' },
  { id: 'milestones', label: 'Milestones', icon: Target, group: 'teaching' },
  { id: 'materials', label: 'Materials', icon: BookOpen, group: 'teaching' },
  { id: 'metrics', label: 'Performance', icon: BarChart3, group: 'teaching' },
  { id: 'activity', label: 'Activity', icon: Activity, group: 'teaching' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'reports' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'reports' },
  { id: 'account', label: 'Account', icon: User, group: 'system' },
];

export default function TeacherDashboard({ currentUser, onLogout }: TeacherDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>(
    () => resolveTeacherSection(currentUser, 'class')
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'staff' | 'instructor'>('instructor');
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<TeacherClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classEnrollments, setClassEnrollments] = useState<Enrollment[]>([]);
  const [classStudents, setClassStudents] = useState<StudentProfile[]>([]);
  const [myWorkshops, setMyWorkshops] = useState<BackendWorkshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await loadTeacherDashboardData(currentUser.role, currentUser.id);
      setMode(data.mode);
      setAllEnrollments(data.enrollments);
      setAllStudents(data.students);
      setClasses(data.classes);
      const classId = data.selectedClassId;
      setSelectedClassId(classId);
      const roster = await loadClassRoster(data.mode, classId, data.enrollments, data.students, currentUser.id);
      setClassEnrollments(roster.enrollments);
      setClassStudents(roster.students);
    } catch {
      setLoadError('Unable to load dashboard data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.role, currentUser.id]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const fetchMyWorkshops = useCallback(async () => {
    setWorkshopsLoading(true);
    try {
      const data = await adminGetWorkshops();
      const all = Array.isArray(data) ? data : [];
      const mine = all.filter(w => w.instructor === currentUser.id);
      setMyWorkshops(mine);
    } catch {
      setMyWorkshops([]);
    } finally {
      setWorkshopsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (activeSection === 'workshops') fetchMyWorkshops();
  }, [activeSection, fetchMyWorkshops]);

  useEffect(() => {
    if (!selectedClassId || loading) return;
    let cancelled = false;
    loadClassRoster(mode, selectedClassId, allEnrollments, allStudents, currentUser.id).then(roster => {
      if (!cancelled) {
        setClassEnrollments(roster.enrollments);
        setClassStudents(roster.students);
      }
    });
    return () => { cancelled = true; };
  }, [selectedClassId, mode, allEnrollments, allStudents, loading, currentUser.id]);

  const filteredNav = useMemo(
    () => filterTeacherNavItems(currentUser, NAV_ITEMS),
    [currentUser],
  );

  const handleSectionChange = useCallback((id: string) => {
    const sectionId = id as SectionId;
    if (canAccessTeacherSection(currentUser, sectionId)) {
      setActiveSection(sectionId);
    }
  }, [currentUser]);

  const classActive = classEnrollments.filter(e => e.status === 'ACTIVE').length;
  const classPending = classEnrollments.filter(e => e.status === 'PENDING_PAYMENT').length;

  const commandCenter = useMemo(() => getTeacherCommandCenter(activeSection, {
    classStudents: classStudents.length,
    classActive,
    classPending,
    classesCount: classes.length,
    workshopsCount: myWorkshops.length,
    mode,
    loading,
  }), [activeSection, classStudents.length, classActive, classPending, classes.length, myWorkshops.length, mode, loading]);

  const renderPage = () => {
    if (!canAccessTeacherSection(currentUser, activeSection)) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Restricted</p>
              <p className="mt-1 text-amber-700">You do not have permission to access this section.</p>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return <PageSpinner label="Loading class data" />;
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
      case 'workshops':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">My Workshops</h3>
              <button onClick={fetchMyWorkshops} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${workshopsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {workshopsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-red" /></div>
            ) : myWorkshops.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No workshops assigned yet"
                description="When an admin or manager assigns you as instructor, your workshops will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myWorkshops.map(w => (
                  <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{w.event_title || w.event}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          w.level === 'BEGINNER' ? 'bg-emerald-100 text-emerald-700' :
                          w.level === 'INTERMEDIATE' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{w.level}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{w.duration_minutes} min</span>
                      </div>
                      {w.price && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />
                          <span>{w.price} Birr</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'progress':
        return <ProgressSubmissions students={classStudents} enrollments={classEnrollments} />;
      case 'milestones':
        return <LearningMilestonesManager currentUser={currentUser} />;
      case 'materials':
        return <LearningMaterialsPanel currentUser={currentUser} />;
      case 'metrics':
        return <PerformanceMetrics students={classStudents} enrollments={classEnrollments.length ? classEnrollments : allEnrollments} />;
      case 'attendance':
        return <AttendanceHistory classId={selectedClassId} />;
      case 'activity':
        return <ActivityFeed mode={mode} classId={selectedClassId} />;
      case 'reports':
        return <Reports classId={selectedClassId} />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'account':
        return <AdminAccount currentUser={currentUser} />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: filteredNav,
        activeSection,
        onSectionChange: handleSectionChange,
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
        <InlineAlert tone="error" message={loadError} onRetry={refreshData} onDismiss={() => setLoadError(null)} />
      )}

      {mode === 'instructor' && !loading && classes.length === 0 && (
        <InlineAlert
          tone="info"
          message="Record attendance for a class first, or ask an administrator to assign you as class instructor."
        />
      )}

      {commandCenter && (
        <DashboardCommandCenter
          title={commandCenter.title}
          subtitle={commandCenter.subtitle}
          signals={commandCenter.signals}
          loading={loading}
        />
      )}
      {renderPage()}
    </AppLayout>
  );
}
