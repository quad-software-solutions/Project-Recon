import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  User, Home, GraduationCap, Briefcase, Calendar, Bell, Megaphone,
  MessageCircle, FileText, Loader2,
} from 'lucide-react';
import { UserProfile, Enrollment } from '@/shared/types';
import {
  fetchEnrollmentsApi, fetchStudentCertificatesApi,
} from '@/domains/learning/academics/api/academicApi';
import { getMyRegistrations } from '@/domains/competition/api/competitionApi';
import { getUnreadCount } from '@/domains/notification/model/notificationApi';
import { cacheStudentId } from '@/domains/user/student/api/studentContext';
import { getCachedStudentId } from '@/shared/utils/storage';
import { isForbiddenError } from '@/shared/api/http';
import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';
import DashboardCommandCenter from '@/shared/ui/DashboardCommandCenter';
import InlineAlert from '@/shared/ui/InlineAlert';
import StudentAccount from './Account';
import AdminAccount from '@/domains/user/shared/ui/AdminAccount';
import {
  getSectionCommandCenter,
  type StudentSectionId,
  type StudentHubStats,
} from '../studentCommandCenter';

import DashboardHome, { type HomeNavigateTarget } from './DashboardHome';
import AcademicsModule from './modules/AcademicsModule';
import CareerCenterModule from './modules/CareerCenterModule';
import EventsModule from './modules/EventsModule';
import NotificationsPage from './modules/NotificationsPage';
import AnnouncementsPage from './modules/AnnouncementsPage';
import MessagingModule from './modules/MessagingModule';
import CertificateGenerator from './CertificateGenerator';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onUserUpdate?: (user: UserProfile) => void;
}

function buildNavItems(): NavItem[] {
  return [
    { id: 'home', label: 'Dashboard', icon: Home, group: 'main' },
    { id: 'academics', label: 'Academics', icon: GraduationCap, group: 'academic' },
    { id: 'certificates', label: 'Certificates', icon: FileText, group: 'academic' },
    { id: 'career', label: 'Career Center', icon: Briefcase, group: 'career' },
    { id: 'events', label: 'Events', icon: Calendar, group: 'competition' },
    { id: 'notifications', label: 'Notifications', icon: Bell, group: 'communication' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'communication' },
    { id: 'messaging', label: 'Messages', icon: MessageCircle, group: 'communication' },
    { id: 'account', label: 'My Account', icon: User, group: 'system' },
  ];
}

async function applyEnrollments(
  list: Enrollment[],
  setters: {
    setEnrollments: (e: Enrollment[]) => void;
    setEnrolledCount: (n: number) => void;
    setActiveCount: (n: number) => void;
    setCompletedCount: (n: number) => void;
    setPendingCount: (n: number) => void;
  },
) {
  setters.setEnrollments(list);
  setters.setEnrolledCount(list.length);
  setters.setActiveCount(list.filter(e => e.status === 'ACTIVE').length);
  setters.setCompletedCount(list.filter(e => e.status === 'COMPLETED').length);
  setters.setPendingCount(list.filter(e => e.status === 'PENDING_PAYMENT').length);
}

export default function StudentDashboard({ currentUser, onLogout, onUserUpdate }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<StudentSectionId>('home');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [certificateCount, setCertificateCount] = useState(0);
  const [eventRegCount, setEventRegCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const enrollmentSetters = useMemo(() => ({
    setEnrollments, setEnrolledCount, setActiveCount, setCompletedCount, setPendingCount,
  }), []);

  const loadEnrollmentsFor = useCallback(async (sid: string) => {
    try {
      const e = await fetchEnrollmentsApi(sid);
      await applyEnrollments(e, enrollmentSetters);
    } catch (e) {
      // Student enrollments are staff-only on the backend — do not treat as app crash
      await applyEnrollments([], enrollmentSetters);
      if (!isForbiddenError(e)) {
        setLoadError(e instanceof Error ? e.message : 'Could not load enrollments.');
      }
    }
  }, [enrollmentSetters]);

  const loadSupplementaryStats = useCallback(async (sid?: string) => {
    const [certs, regs, unread, news] = await Promise.all([
      fetchStudentCertificatesApi(sid).catch(() => []),
      getMyRegistrations().catch(() => []),
      getUnreadCount().catch(() => 0),
      import('@/domains/cms/public/api/cmsPublicApi')
        .then(m => m.cmsPublicApi.getNews({ limit: '50' }))
        .catch(() => ({ results: [] as { id: string }[] })),
    ]);
    setCertificateCount(certs.length);
    setEventRegCount(regs.filter(r => r.registration_status !== 'CANCELLED').length);
    setUnreadCount(unread);
    setAnnouncementCount(news?.results?.length ?? 0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveStudent() {
      setLoadError(null);
      const finish = () => { if (!cancelled) setStudentLoading(false); };

      const tryLoadForId = async (sid: string) => {
        if (!cancelled) setStudentId(sid);
        cacheStudentId(currentUser.email, sid);
        await Promise.all([loadEnrollmentsFor(sid), loadSupplementaryStats(sid)]);
        finish();
      };

      if (currentUser.studentId) {
        await tryLoadForId(currentUser.studentId);
        return;
      }

      const storedId = getCachedStudentId(currentUser.email);
      if (storedId) {
        await tryLoadForId(storedId);
        return;
      }

      // Do NOT call /academic/students/ — students get 403. Discover via certificates only.
      try {
        const certs = await fetchStudentCertificatesApi();
        if (certs.length > 0 && certs[0].student) {
          await tryLoadForId(certs[0].student);
          return;
        }
      } catch { /* no certificates */ }

      await loadSupplementaryStats();
      finish();
    }

    resolveStudent();
    return () => { cancelled = true; };
  }, [currentUser.id, currentUser.email, currentUser.studentId, loadEnrollmentsFor, loadSupplementaryStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const hubStats: StudentHubStats = useMemo(() => ({
    activeCount,
    enrolledCount,
    completedCount,
    pendingCount,
    unreadCount,
    xpPoints: currentUser.xpPoints,
    badgeCount: currentUser.badges.length,
    certificateCount,
    eventRegCount,
    announcementCount,
    loading: studentLoading,
  }), [activeCount, enrolledCount, completedCount, pendingCount, unreadCount, currentUser, certificateCount, eventRegCount, announcementCount, studentLoading]);

  const commandCenter = getSectionCommandCenter(activeSection, hubStats);

  const handleHomeNavigate = (section: HomeNavigateTarget) => {
    setActiveSection(section);
  };

  const renderPage = () => {
    if (activeSection === 'account') {
      return studentId
        ? (
          <StudentAccount
            currentUser={currentUser}
            studentId={studentId}
            onUserUpdate={onUserUpdate}
          />
        )
        : <AdminAccount currentUser={currentUser} onUserUpdate={onUserUpdate} />;
    }

    const needsStudent = ['home', 'academics', 'career', 'certificates'].includes(activeSection);

    if (!studentId && needsStudent) {
      return (
        <div className="flex items-center justify-center py-20">
          {studentLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          ) : (
            <div className="text-center text-slate-400 max-w-sm mx-auto px-4">
              <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Student profile not found.</p>
              <p className="text-xs mt-2 text-slate-500">
                You can still browse events, announcements, and notifications. Contact administration to link your academic profile.
              </p>
            </div>
          )}
        </div>
      );
    }

    switch (activeSection) {
      case 'home':
        return (
          <DashboardHome
            currentUser={currentUser}
            studentId={studentId!}
            enrollments={enrollments}
            onNavigate={handleHomeNavigate}
          />
        );
      case 'academics':
        return <AcademicsModule studentId={studentId!} currentUser={currentUser} />;
      case 'career':
        return <CareerCenterModule studentId={studentId!} currentUser={currentUser} />;
      case 'events':
        return <EventsModule currentUser={currentUser} />;
      case 'notifications':
        return <NotificationsPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'messaging':
        return <MessagingModule currentUser={currentUser} />;
      case 'certificates':
        return <CertificateGenerator studentId={studentId!} />;
    }
  };

  const navItems = buildNavItems();
  const activeLabel = navItems.find(n => n.id === activeSection)?.label ?? '';

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
        actions: unreadCount > 0 ? (
          <button
            onClick={() => setActiveSection('notifications')}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </button>
        ) : undefined,
      }}
      onLogout={onLogout}
    >
      {loadError && (
        <InlineAlert tone="warning" message={loadError} onDismiss={() => setLoadError(null)} />
      )}

      {commandCenter && (
        <DashboardCommandCenter
          title={commandCenter.title}
          subtitle={commandCenter.subtitle}
          signals={commandCenter.signals}
          loading={studentLoading}
        />
      )}
      {renderPage()}
    </AppLayout>
  );
}
