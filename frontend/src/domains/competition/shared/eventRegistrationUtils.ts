import type { Tournament, Workshop, UserProfile } from '@/shared/types';

export const REGISTRATION_MODE_LABELS: Record<string, string> = {
  NONE: 'Not available',
  PUBLIC: 'Open to everyone',
  STUDENT: 'Students only',
  SUBPROGRAM_STUDENT: 'Enrolled students only',
};

type EventLike = Tournament | Workshop;

export function isRegistrationDeadlinePassed(event: EventLike): boolean {
  if (!event.registrationDeadline) return false;
  return new Date() > new Date(event.registrationDeadline);
}

export function isEventAtCapacity(event: EventLike): boolean {
  if (!event.capacity || event.capacity <= 0) return false;
  return event.enrolledCount >= event.capacity;
}

export function isTournamentClosed(event: EventLike): boolean {
  return event.eventType === 'TOURNAMENT' && (event as Tournament).isClosed;
}

export type RegistrationEligibility =
  | { canRegister: true; mode: 'student' | 'public' }
  | { canRegister: false; reason: string; action?: 'login' | 'none' };

export function getRegistrationEligibility(
  event: EventLike,
  currentUser: UserProfile | null | undefined,
  isRegistered: boolean,
): RegistrationEligibility {
  if (isRegistered) {
    return { canRegister: false, reason: 'Already registered' };
  }

  if (isTournamentClosed(event)) {
    return { canRegister: false, reason: 'Tournament closed' };
  }

  if (!event.registrationEnabled || event.storedStatus !== 'PUBLISHED') {
    return { canRegister: false, reason: 'Registration closed' };
  }

  if (event.registrationMode === 'NONE') {
    return { canRegister: false, reason: 'No registration' };
  }

  if (isRegistrationDeadlinePassed(event)) {
    return { canRegister: false, reason: 'Deadline passed' };
  }

  if (isEventAtCapacity(event)) {
    return { canRegister: false, reason: 'Event full' };
  }

  if (event.visibility === 'PRIVATE' && !currentUser) {
    return { canRegister: false, reason: 'Sign in required', action: 'login' };
  }

  const isStudent = currentUser?.role === 'Student';

  if (event.registrationMode === 'STUDENT' || event.registrationMode === 'SUBPROGRAM_STUDENT') {
    if (!currentUser) {
      return { canRegister: false, reason: 'Students only', action: 'login' };
    }
    if (!isStudent) {
      return { canRegister: false, reason: 'Students only' };
    }
    return { canRegister: true, mode: 'student' };
  }

  if (event.registrationMode === 'PUBLIC') {
    // Backend routes authenticated students to student registration, which fails for PUBLIC events.
    if (isStudent) {
      return {
        canRegister: false,
        reason: 'Use a non-student account or sign out to register publicly',
      };
    }
    return { canRegister: true, mode: 'public' };
  }

  return { canRegister: false, reason: 'Registration unavailable' };
}

export function formatRegistrationDeadline(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  return new Date(deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
