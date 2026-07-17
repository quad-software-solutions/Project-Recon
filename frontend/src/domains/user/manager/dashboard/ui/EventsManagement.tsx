import React from 'react';
import EventManager from '@/domains/competition/admin/EventManager';
import type { UserProfile } from '@/shared/types';

interface EventsManagementProps {
  currentUser: UserProfile;
  onNavigate?: (section: string) => void;
}

export default function EventsManagement({ currentUser, onNavigate }: EventsManagementProps) {
  return <EventManager currentUser={currentUser} onNavigate={onNavigate} />;
}
