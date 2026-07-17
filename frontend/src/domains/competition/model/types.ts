export type EventStoredStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type EventComputedState = 'FUTURE' | 'LIVE' | 'PAST';
export type EventVisibility = 'PUBLIC' | 'PRIVATE';
export type RegistrationMode = 'NONE' | 'PUBLIC' | 'STUDENT' | 'SUBPROGRAM_STUDENT';
export type EventType = 'TOURNAMENT' | 'WORKSHOP' | 'GENERAL';
export type WorkshopLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export function computeEventState(start: string, end: string): EventComputedState {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (now < startDate) return 'FUTURE';
  if (now >= startDate && now <= endDate) return 'LIVE';
  return 'PAST';
}

export interface Tournament {
  /** Event UUID — used for registration and event detail routes */
  id: string;
  /** Tournament UUID — required for matches, standings, and teams API */
  tournamentId?: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  eventType: EventType;
  storedStatus: EventStoredStatus;
  computedState: EventComputedState;
  visibility: EventVisibility;
  registrationEnabled: boolean;
  registrationMode: RegistrationMode;
  registrationDeadline: string | null;
  paymentRequired: boolean;
  registrationFee: string | null;
  capacity: number;
  enrolledCount: number;
  category: string;
  maxTeams: number;
  prizePool: string;
  isClosed: boolean;
  youtubeLiveUrl?: string | null;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  eventType: EventType;
  storedStatus: EventStoredStatus;
  computedState: EventComputedState;
  visibility: EventVisibility;
  registrationEnabled: boolean;
  registrationMode: RegistrationMode;
  registrationDeadline: string | null;
  paymentRequired: boolean;
  registrationFee: string | null;
  capacity: number;
  enrolledCount: number;
  instructor: string;
  level: WorkshopLevel;
  duration: number;
  price: number;
}

export interface TournamentTeam {
  id: string;
  teamName: string;
  organization: string;
  coachName: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank?: number;
}

export interface MatchResult {
  id: string;
  tournamentId: string;
  round: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: 'scheduled' | 'live' | 'completed';
  time: string;
}

export interface VexTeam {
  id: string;
  name: string;
  number: string;
  school: string;
  location: string;
  members: string[];
  coach: string;
  bio: string;
  established: string;
  avatar: string;
  color: string;
}

export interface VexRobot {
  id: string;
  name: string;
  competition: string;
  season: string;
  image: string;
  description: string;
  specs: string[];
  achievements: string[];
  status: 'active' | 'retired' | 'development';
  drivetrain: string;
  brain: string;
  weight: string;
}

export interface VexAward {
  id: string;
  name: string;
  event: string;
  date: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  upcoming?: boolean;
}

export interface VexNotebookEntry {
  id: string;
  title: string;
  date: string;
  author: string;
  content: string;
  drawings: string[];
  tags: string[];
}

export interface VexMatchRecord {
  id: string;
  event: string;
  date: string;
  round: string;
  opponent: string;
  score: string;
  result: 'win' | 'loss' | 'upcoming';
  notes: string;
}

export type VexCompetitionRole =
  | 'referee' | 'head-referee' | 'scout' | 'pit-manager' | 'field-manager'
  | 'queue-manager' | 'judge' | 'volunteer' | 'technical-inspector'
  | 'scorekeeper' | 'announcer' | 'photographer';

export interface VexRoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: VexCompetitionRole;
  eventName: string;
  eventDate: string;
  assignedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  notes: string;
}
