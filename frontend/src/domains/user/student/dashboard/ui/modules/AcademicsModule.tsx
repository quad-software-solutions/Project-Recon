import React from 'react';
import { GraduationCap } from 'lucide-react';
import PageHeader from '../../../shared/ui/PageHeader';
import LearningResources from '../LearningResources';
import type { UserProfile } from '@/shared/types';

interface Props {
  studentId: string;
  currentUser: UserProfile;
}

export default function AcademicsModule({ studentId, currentUser }: Props) {
  return (
    <div>
      <PageHeader
        title="Academics"
        subtitle="Courses, attendance, progress, and learning resources"
        icon={GraduationCap}
      />
      <LearningResources studentId={studentId} />
    </div>
  );
}
