import React, { useState, useEffect } from 'react';
import {
  User, CalendarDays, Target, Calendar, BookOpen,
  TrendingUp, Award, BarChart3,
  ChevronRight, MessageCircle, Trophy, FileText,
  ClipboardList, Loader2, CheckCircle2
} from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import { fetchStudentCertificatesApi } from '@/src/domains/learning/academics/api/academicApi';
import { resolveStudentId } from '@/src/domains/user/student/api/studentContext';

import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';

import Account from './Account';
import AttendanceTracker from './AttendanceTracker';
import ProgressMilestones from './ProgressMilestones';
import UpcomingEvents from './UpcomingEvents';
import MyRegistrations from './MyRegistrations';
import LearningResources from './LearningResources';
import ParentFeedback from './ParentFeedback';
import CertificateGenerator from './CertificateGenerator';
import Leaderboard from './Leaderboard';
import StudentOverview from './StudentOverview';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

type SectionId =
  | 'overview'
  | 'account'
  | 'attendance'
  | 'progress'
  | 'events'
  | 'resources'
  | 'certificates'
  | 'leaderboard'
  | 'registrations'
  | 'feedback';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, group: 'main' },
  { id: 'account', label: 'Account', icon: User, group: 'main' },
  { id: 'progress', label: 'Progress', icon: Target, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: FileText, group: 'main' },
  { id: 'resources', label: 'Learning Resources', icon: BookOpen, group: 'main' },
  { id: 'attendance', label: 'Attendance', icon: CalendarDays, group: 'main' },
  { id: 'registrations', label: 'Event Registrations', icon: ClipboardList, group: 'main' },
  { id: 'events', label: 'Upcoming Events', icon: Calendar, group: 'main' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, group: 'main' },
  { id: 'feedback', label: 'Parent Feedback', icon: MessageCircle, group: 'main' },
];

export default function StudentDashboard({ currentUser, onLogout }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [studentId, setStudentId] = useState<string | null>(currentUser.studentId ?? null);
  const [studentLoading, setStudentLoading] = useState(!currentUser.studentId);
  const [certCount, setCertCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const id = await resolveStudentId(currentUser.email, currentUser.studentId);
      if (!cancelled) setStudentId(id);
      try {
        const certs = await fetchStudentCertificatesApi(id ?? undefined);
        if (!cancelled) {
          setCertCount(certs.length);
          if (!id && certs[0]?.student) setStudentId(certs[0].student);
        }
      } catch { /* optional */ }
      if (!cancelled) setStudentLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [currentUser.email, currentUser.studentId]);

  const renderPage = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <StudentOverview
            currentUser={currentUser}
            studentId={studentId}
            certCount={certCount}
            onNavigate={setActiveSection}
          />
        );
      case 'account':
        return <Account currentUser={currentUser} studentId={studentId} />;
      case 'attendance':
        return <AttendanceTracker studentId={studentId} />;
      case 'progress':
        return <ProgressMilestones studentId={studentId} />;
      case 'events':
        return <UpcomingEvents />;
      case 'resources':
        return <LearningResources />;
      case 'feedback':
        return <ParentFeedback />;
      case 'certificates':
        return <CertificateGenerator studentId={studentId} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'registrations':
        return <MyRegistrations />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
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
      <DashboardCommandCenter
        title="Learning Command Center"
        subtitle="Certificates, materials, events, and academic reports."
        signals={[
          { label: 'Certificates', value: String(certCount), detail: 'earned', icon: Award, tone: certCount ? 'emerald' : 'amber' },
          { label: 'Profile', value: studentId ? 'Linked' : 'Pending', detail: 'academic record', icon: TrendingUp, tone: studentId ? 'emerald' : 'amber' },
          { label: 'Events', value: 'Live', detail: 'competition hub', icon: Calendar, tone: 'blue' },
          { label: 'Resources', value: 'Open', detail: 'learning materials', icon: BookOpen, tone: 'blue' },
        ]}
      />
      {studentLoading && activeSection !== 'overview' && activeSection !== 'account' && activeSection !== 'events' && activeSection !== 'resources' && activeSection !== 'leaderboard' && activeSection !== 'registrations' && activeSection !== 'feedback' ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : renderPage()}
    </AppLayout>
  );
}
