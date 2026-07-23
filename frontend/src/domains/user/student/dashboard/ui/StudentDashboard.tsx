import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Home, GraduationCap, Briefcase, Calendar, Megaphone,
  MessageCircle, FileText, ShoppingBag, Loader2, Target, BookOpen, DollarSign,
  Clock, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import type { Enrollment, UserProfile } from '@/shared/types';
import {
  fetchStudentCertificatesApi,
  fetchMyEnrollmentsApi,
} from '@/domains/learning/academics/api/academicApi';
import { getMyRegistrations } from '@/domains/competition/api/competitionApi';
import { cacheStudentId, resolveStudentId } from '@/domains/user/student/api/studentContext';
import { getCachedStudentId } from '@/shared/utils/storage';
import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';
import StudentAccount from './Account';
import AdminAccount from '@/domains/user/shared/ui/AdminAccount';
import type { StudentSectionId } from '../studentCommandCenter';

import DashboardHome, { type HomeNavigateTarget } from './DashboardHome';
import EventsModule from './modules/EventsModule';
import AnnouncementsPage from './modules/AnnouncementsPage';
import CertificateGenerator from './CertificateGenerator';
import StoreModule from './modules/StoreModule';
import MyRegistrations from './MyRegistrations';
import ProgressMilestones from './ProgressMilestones';
import AttendanceTracker from './AttendanceTracker';
import LearningResources from './LearningResources';
import PaymentHistory from './PaymentHistory';
import ParentFeedback from './ParentFeedback';


interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onUserUpdate?: (user: UserProfile) => void;
}

function buildNavItems(): NavItem[] {
  return [
    { id: 'home', label: 'Dashboard', icon: Home, group: 'main' },
    { id: 'academics', label: 'My Programs', icon: GraduationCap, group: 'academic' },
    { id: 'progress', label: 'Progress', icon: Target, group: 'academic' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, group: 'academic' },
    { id: 'materials', label: 'Learning Materials', icon: BookOpen, group: 'academic' },
    { id: 'payments', label: 'Payments', icon: DollarSign, group: 'academic' },
    { id: 'certificates', label: 'Certificates', icon: FileText, group: 'academic' },
    { id: 'store', label: 'Store', icon: ShoppingBag, group: 'main' },
    { id: 'events', label: 'Events', icon: Calendar, group: 'competition' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'communication' },
    { id: 'feedback', label: 'Support & Feedback', icon: MessageCircle, group: 'communication' },
    { id: 'account', label: 'My Account', icon: User, group: 'system' },
  ];
}

function prettyStatus(status?: string) {
  return status ? status.replace(/_/g, ' ') : 'Pending verification';
}

function EnrollmentGatePage({
  enrollment,
  loading,
  error,
  onRetry,
  onLogout,
}: {
  enrollment?: Enrollment;
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  onLogout: () => void;
}) {
  const isRejected = enrollment?.status === 'REJECTED';
  const isUnavailable = !loading && !enrollment;
  const isPending = enrollment?.status === 'PENDING_VERIFICATION';
  const Icon = loading ? Loader2 : isRejected || isUnavailable ? AlertCircle : Clock;
  const title = loading
    ? 'Checking enrollment status'
    : isRejected
      ? 'Enrollment Not Approved'
      : isUnavailable
        ? 'No Active Enrollment Found'
        : isPending
          ? 'Pending Verification'
          : 'Portal Access Unavailable';
  const message = loading
    ? 'Please wait while we confirm whether your portal is ready.'
    : isRejected
      ? 'Your enrollment was not approved. Please contact the administration for more information.'
      : isUnavailable
        ? 'We could not find an active enrollment for your account yet.'
        : isPending
          ? 'Your submission is being reviewed. You will get access to the student portal once your enrollment is approved.'
          : 'This enrollment status does not currently grant portal access. Please contact administration.';

  return (
    <div className="min-h-screen bg-brand-paper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 bg-brand-blue" />
        <div className="p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
            isRejected || isUnavailable ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <Icon className={`w-8 h-8 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-blue mb-2">
            Student Portal
          </p>
          <h1 className="font-black text-2xl text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 leading-relaxed mt-3 max-w-md mx-auto">{message}</p>

          {enrollment && (
            <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100 text-left">
              <div className="flex justify-between gap-4 px-4 py-3">
                <span className="text-xs text-slate-500">Reference</span>
                <span className="text-xs font-mono font-bold text-brand-blue text-right">{enrollment.pending_code || enrollment.enrollment_number || '-'}</span>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <span className="text-xs text-slate-500">Program</span>
                <span className="text-xs font-bold text-slate-900 text-right">{enrollment.program_name || enrollment.sub_program_name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <span className="text-xs text-slate-500">Status</span>
                <span className="text-xs font-bold text-slate-900 text-right">{prettyStatus(enrollment.status)}</span>
              </div>
              {enrollment.rejection_reason && (
                <div className="px-4 py-3">
                  <span className="text-xs text-slate-500 block mb-1">Reason</span>
                  <span className="text-xs font-medium text-slate-800">{enrollment.rejection_reason}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 text-xs font-medium text-red-600">{error}</p>
          )}

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue-dark transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh Status
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {!loading && !isRejected && !isUnavailable && (
            <p className="mt-5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Your account is ready. Portal access starts after approval.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard({ currentUser, onLogout, onUserUpdate }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<StudentSectionId>('home');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentGateLoading, setEnrollmentGateLoading] = useState(true);
  const [enrollmentGateError, setEnrollmentGateError] = useState('');
  const [certificateCount, setCertificateCount] = useState(0);
  const [eventRegCount, setEventRegCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);

  const loadSupplementaryStats = useCallback(async (sid?: string) => {
    const [certs, regs, news] = await Promise.all([
      fetchStudentCertificatesApi(sid).catch(() => []),
      getMyRegistrations().catch(() => []),
      import('@/domains/cms/public/api/cmsPublicApi')
        .then(m => m.cmsPublicApi.getNews({ limit: '50' }))
        .catch(() => ({ results: [] as { id: string }[] })),
    ]);
    setCertificateCount(certs.length);
    setEventRegCount(regs.filter(r => r.registration_status !== 'CANCELLED').length);
    setAnnouncementCount(news?.results?.length ?? 0);
  }, []);

  const loadMyEnrollments = useCallback(async () => {
    setEnrollmentGateLoading(true);
    setEnrollmentGateError('');
    try {
      const rows = await fetchMyEnrollmentsApi();
      setMyEnrollments(rows);
      const sid = rows.find(e => e.student)?.student;
      if (sid) {
        setStudentId(sid);
        cacheStudentId(currentUser.email, sid);
      }
      return rows;
    } catch (err) {
      setMyEnrollments([]);
      setEnrollmentGateError(err instanceof Error ? err.message : 'Could not load enrollment status.');
      return [];
    } finally {
      setEnrollmentGateLoading(false);
    }
  }, [currentUser.email]);
  useEffect(() => {
    let cancelled = false;

    async function resolveStudent() {
      const finish = () => { if (!cancelled) setStudentLoading(false); };

      const tryLoadForId = async (sid: string) => {
        if (!cancelled) setStudentId(sid);
        cacheStudentId(currentUser.email, sid);
        finish();
      };

      const ownEnrollments = await loadMyEnrollments();
      if (cancelled) return;
      const ownStudentId = ownEnrollments.find(e => e.student)?.student;
      if (ownStudentId) {
        await tryLoadForId(ownStudentId);
        return;
      }

      if (currentUser.studentId) {
        await tryLoadForId(currentUser.studentId);
        return;
      }

      const storedId = getCachedStudentId(currentUser.email);
      if (storedId) {
        await tryLoadForId(storedId);
        return;
      }

      const resolved = await resolveStudentId(currentUser.email, currentUser.id);
      if (resolved) {
        await tryLoadForId(resolved);
        return;
      }

      finish();
    }

    resolveStudent();
    return () => { cancelled = true; };
  }, [currentUser.id, currentUser.email, currentUser.studentId, loadMyEnrollments, loadSupplementaryStats]);

  const handleHomeNavigate = (section: HomeNavigateTarget) => {
    setActiveSection(section);
  };

  const renderPage = () => {
    if (activeSection === 'account') {
      return studentId
        ? <StudentAccount currentUser={currentUser} studentId={studentId} onUserUpdate={onUserUpdate} />
        : <AdminAccount currentUser={currentUser} onUserUpdate={onUserUpdate} />;
    }

    const needsStudent = ['certificates', 'academics', 'progress', 'attendance', 'payments'].includes(activeSection);

    if (!studentId && needsStudent) {
      return (
        <div className="flex items-center justify-center py-16">
          {studentLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          ) : (
            <div className="max-w-sm mx-auto px-4 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <User className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-base font-black text-slate-900">Profile not linked</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Your account is active, but no academic enrollment is linked to it yet.
                Academic features (certificates, progress, attendance, payments, materials)
                will become available once an admin links your profile.
              </p>
              <div className="mt-5 flex flex-col items-center gap-2">
                <span className="rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-semibold text-slate-600">
                  Contact administration to get linked
                </span>
                <p className="text-[10px] text-slate-400">
                  You can still browse <strong>Events</strong>, <strong>Announcements</strong>, and the <strong>Store</strong> in the sidebar.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (activeSection) {
      case 'home':
        return <DashboardHome currentUser={currentUser} studentId={studentId} onNavigate={handleHomeNavigate} />;
      case 'academics':
        return <MyRegistrations studentId={studentId!} />;
      case 'progress':
        return <ProgressMilestones studentId={studentId!} />;
      case 'attendance':
        return <AttendanceTracker studentId={studentId!} />;
      case 'materials':
        return <LearningResources studentId={studentId!} />;
      case 'payments':
        return <PaymentHistory studentId={studentId!} />;
      case 'store':
        return <StoreModule currentUser={currentUser} />;
      case 'events':
        return <EventsModule currentUser={currentUser} />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'feedback':
        return <div className="p-6 max-w-4xl mx-auto"><ParentFeedback currentUser={currentUser} /></div>;
      case 'certificates':
        return <CertificateGenerator studentId={studentId!} />;
    }
  };

  const navItems = buildNavItems();
  const activeLabel = navItems.find(n => n.id === activeSection)?.label ?? '';
  const hasPortalEnrollment = myEnrollments.some(e => e.status === 'ACTIVE' || e.status === 'COMPLETED');
  const blockingEnrollment =
    myEnrollments.find(e => e.status === 'PENDING_VERIFICATION')
    || myEnrollments.find(e => e.status === 'REJECTED')
    || myEnrollments[0];

  if (enrollmentGateLoading || !hasPortalEnrollment) {
    return (
      <EnrollmentGatePage
        enrollment={blockingEnrollment}
        loading={enrollmentGateLoading}
        error={enrollmentGateError}
        onRetry={loadMyEnrollments}
        onLogout={onLogout}
      />
    );
  }

  return (
    <AppLayout
      sidebar={{
        items: navItems,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as StudentSectionId),
        title: 'Student Dashboard',
        icon: User,
        userName: currentUser.name,
        userRole: 'Student',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Student Dashboard',
      }}
      onLogout={onLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}
