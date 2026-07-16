import React from 'react';
import EventManager from '@/domains/competition/admin/EventManager';

interface EventsManagementProps {
  onNavigate?: (section: string) => void;
}

export default function EventsManagement({ onNavigate }: EventsManagementProps) {
  return <EventManager onNavigate={onNavigate} />;
}
