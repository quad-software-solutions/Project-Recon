import React, { useState, useEffect, useCallback } from 'react';
import { Users, Edit3, BarChart3, Activity, BookOpen, Calendar, FileText, CheckCircle2, DollarSign, RefreshCw, Loader2, AlertCircle, User, GraduationCap, Clock } from 'lucide-react';
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
import { adminGetWorkshops } from '@/src/domains/competition/api/eventsApi';
import type { BackendWorkshop } from '@/src/domains/competition/api/eventsApi';

interface TeacherDashboardProps { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'class' | 'workshops' | 'progress' | 'metrics' | 'attendance' | 'activity' | 'reports' | 'account';

const NAV_ITEMS: NavItem[] = [
  { id: 'class', label: 'Class Management', icon: Users, group: 'main' },
  { id: 'workshops', label: 'My Workshops', icon: GraduationCap, group: 'main' },
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
  const [myWorkshops, setMyWorkshops] = useState<BackendWorkshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await loadTeacherDashboardData(currentUser.role);
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

  const fetchMyWorkshops = useCallback(async () => {
    setWorkshopsLoading(true);
    try {
      const data = await adminGetWorkshops();
      setMyWorkshops(Array.isArray(data) ? data : []);
    } catch {
      setMyWorkshops([]);
    } finally {
      setWorkshopsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'workshops') fetchMyWorkshops();
  }, [activeSection, fetchMyWorkshops]);

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
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No workshops assigned yet</p>
                <p className="text-xs text-slate-400 mt-1">When an admin or manager assigns you as instructor, your workshops will appear here.</p>
              </div>
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
