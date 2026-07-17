import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  User, Home, GraduationCap, Briefcase, Calendar, Megaphone,
  MessageCircle, FileText, ShoppingBag, Loader2,
} from 'lucide-react';
import { UserProfile } from '@/shared/types';
import {
  fetchStudentCertificatesApi,
} from '@/domains/learning/academics/api/academicApi';
import { getMyRegistrations } from '@/domains/competition/api/competitionApi';
import { cacheStudentId } from '@/domains/user/student/api/studentContext';
import { getCachedStudentId } from '@/shared/utils/storage';
import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';
import DashboardCommandCenter from '@/shared/ui/DashboardCommandCenter';
import StudentAccount from './Account';
import AdminAccount from '@/domains/user/shared/ui/AdminAccount';
import {
  getSectionCommandCenter,
  type StudentSectionId,
  type StudentHubStats,
} from '../studentCommandCenter';

import DashboardHome, { type HomeNavigateTarget } from './DashboardHome';
import CareerCenterModule from './modules/CareerCenterModule';
import EventsModule from './modules/EventsModule';
import AnnouncementsPage from './modules/AnnouncementsPage';
import MessagingModule from './modules/MessagingModule';
import CertificateGenerator from './CertificateGenerator';
import StoreModule from './modules/StoreModule';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onUserUpdate?: (user: UserProfile) => void;
}

function buildNavItems(): NavItem[] {
  return [
    { id: 'home', label: 'Dashboard', icon: Home, group: 'main' },
    { id: 'store', label: 'Store', icon: ShoppingBag, group: 'main' },
    { id: 'certificates', label: 'Certificates', icon: FileText, group: 'academic' },
    { id: 'career', label: 'Career Center', icon: Briefcase, group: 'career' },
    { id: 'events', label: 'Events', icon: Calendar, group: 'competition' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'communication' },
    { id: 'messaging', label: 'Support', icon: MessageCircle, group: 'communication' },
    { id: 'account', label: 'My Account', icon: User, group: 'system' },
  ];
}

export default function StudentDashboard({ currentUser, onLogout, onUserUpdate }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<StudentSectionId>('home');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;

    async function resolveStudent() {
      const finish = () => { if (!cancelled) setStudentLoading(false); };

      const tryLoadForId = async (sid: string) => {
        if (!cancelled) setStudentId(sid);
        cacheStudentId(currentUser.email, sid);
        await loadSupplementaryStats(sid);
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
  }, [currentUser.id, currentUser.email, currentUser.studentId, loadSupplementaryStats]);

  const hubStats: StudentHubStats = useMemo(() => ({
    certificateCount,
    eventRegCount,
    announcementCount,
    loading: studentLoading,
  }), [certificateCount, eventRegCount, announcementCount, studentLoading]);

  const commandCenter = getSectionCommandCenter(activeSection, hubStats);

  const handleHomeNavigate = (section: HomeNavigateTarget) => {
    setActiveSection(section);
  };

  const renderPage = () => {
    if (activeSection === 'account') {
      return studentId
        ? <StudentAccount currentUser={currentUser} studentId={studentId} onUserUpdate={onUserUpdate} />
        : <AdminAccount currentUser={currentUser} onUserUpdate={onUserUpdate} />;
    }

    const needsStudent = ['home', 'store', 'career', 'certificates'].includes(activeSection);

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
                You can still browse events, announcements, and the store. Contact administration to link your academic profile.
              </p>
            </div>
          )}
        </div>
      );
    }

    switch (activeSection) {
      case 'home':
        return <DashboardHome currentUser={currentUser} studentId={studentId!} onNavigate={handleHomeNavigate} />;
      case 'store':
        return <StoreModule currentUser={currentUser} />;
      case 'career':
        return <CareerCenterModule studentId={studentId!} currentUser={currentUser} />;
      case 'events':
        return <EventsModule currentUser={currentUser} />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'messaging':
        return <MessagingModule currentUser={currentUser} />;
      case 'certificates':
        return <CertificateGenerator studentId={studentId!} />;
      case 'account':
        return <AdminAccount currentUser={currentUser} onUserUpdate={onUserUpdate} />;
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
      }}
      onLogout={onLogout}
    >
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
