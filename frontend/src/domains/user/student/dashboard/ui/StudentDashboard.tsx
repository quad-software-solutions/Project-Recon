import React, { useState, useEffect } from 'react';
import {
  User, Home, GraduationCap, Calendar, Megaphone,
  FileText, ShoppingBag, Loader2, Target, BookOpen, DollarSign,
} from 'lucide-react';
import { UserProfile } from '@/shared/types';
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
    { id: 'account', label: 'My Account', icon: User, group: 'system' },
  ];
}

export default function StudentDashboard({ currentUser, onLogout, onUserUpdate }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<StudentSectionId>('home');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;

    async function resolveStudent() {
      const finish = () => { if (!cancelled) setStudentLoading(false); };

      const tryLoadForId = async (sid: string) => {
        if (!cancelled) setStudentId(sid);
        cacheStudentId(currentUser.email, sid);
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

      const resolved = await resolveStudentId(currentUser.email, currentUser.id);
      if (resolved) {
        await tryLoadForId(resolved);
        return;
      }

      finish();
    }

    resolveStudent();
    return () => { cancelled = true; };
  }, [currentUser.id, currentUser.email, currentUser.studentId]);

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
      }}
      onLogout={onLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}
