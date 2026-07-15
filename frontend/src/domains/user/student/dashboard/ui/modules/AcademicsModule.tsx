import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import PageHeader from '../../../shared/ui/PageHeader';
import TabBar from '../../../shared/ui/TabBar';
import MyRegistrations from '../MyRegistrations';
import AttendanceTracker from '../AttendanceTracker';
import ProgressMilestones from '../ProgressMilestones';
import LearningResources from '../LearningResources';
import Achievements from '../Achievements';
import type { UserProfile } from '@/shared/types';

interface Props {
  studentId: string;
  currentUser: UserProfile;
}

const TABS = [
  { id: 'courses', label: 'My Courses' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'progress', label: 'Progress' },
  { id: 'resources', label: 'Resources' },
  { id: 'achievements', label: 'Achievements' },
];

export default function AcademicsModule({ studentId, currentUser }: Props) {
  const [tab, setTab] = useState('courses');

  return (
    <div>
      <PageHeader
        title="Academics"
        subtitle="Courses, attendance, progress, and learning resources"
        icon={GraduationCap}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'courses' && <MyRegistrations studentId={studentId} />}
      {tab === 'attendance' && <AttendanceTracker studentId={studentId} />}
      {tab === 'progress' && <ProgressMilestones studentId={studentId} />}
      {tab === 'resources' && <LearningResources studentId={studentId} />}
      {tab === 'achievements' && <Achievements currentUser={currentUser} />}
    </div>
  );
}
