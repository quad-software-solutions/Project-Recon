import { http } from '@/src/shared/api/http';
import { computeEventState, type Tournament, type Workshop, type MatchResult, type EventStoredStatus, type RegistrationMode } from '@/src/shared/types';
import * as eventsApi from './eventsApi';

/* ═══ HELPERS ═══ */

function mapBackendEventToTournament(e: eventsApi.BackendEvent): Tournament {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    startDateTime: e.start_datetime,
    endDateTime: e.end_datetime,
    location: e.location,
    eventType: 'TOURNAMENT',
    storedStatus: e.status as EventStoredStatus,
    computedState: computeEventState(e.start_datetime, e.end_datetime),
    visibility: e.visibility,
    registrationEnabled: e.registration_enabled,
    registrationMode: (e.registration_mode || 'NONE') as RegistrationMode,
    registrationDeadline: e.registration_deadline || null,
    paymentRequired: e.payment_required,
    registrationFee: e.registration_fee || null,
    capacity: e.capacity || 0,
    enrolledCount: e.enrolled_count,
    category: e.tournament?.category_name || e.title,
    maxTeams: e.tournament?.max_teams || 0,
    prizePool: e.tournament?.prize_pool || '0 ETB',
  };
}

function mapBackendEventToWorkshop(e: eventsApi.BackendEvent): Workshop {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    startDateTime: e.start_datetime,
    endDateTime: e.end_datetime,
    location: e.location,
    eventType: 'WORKSHOP',
    storedStatus: e.status as EventStoredStatus,
    computedState: computeEventState(e.start_datetime, e.end_datetime),
    visibility: e.visibility,
    registrationEnabled: e.registration_enabled,
    registrationMode: (e.registration_mode || 'NONE') as RegistrationMode,
    registrationDeadline: e.registration_deadline || null,
    paymentRequired: e.payment_required,
    registrationFee: e.registration_fee || null,
    capacity: e.capacity || 0,
    enrolledCount: e.enrolled_count,
    instructor: e.workshop?.instructor_name || 'TBD',
    level: (e.workshop?.level || 'BEGINNER') as Workshop['level'],
    duration: e.workshop?.duration_minutes || 0,
    price: parseFloat(e.workshop?.price || '0'),
  };
}

function mapBackendMatchToResult(m: eventsApi.BackendMatch): MatchResult {
  const sideA = m.sides?.find(s => s.side === 'SIDE_A');
  const sideB = m.sides?.find(s => s.side === 'SIDE_B');
  const teamA = sideA?.participants?.[0]?.tournament_team_name || 'TBD';
  const teamB = sideB?.participants?.[0]?.tournament_team_name || 'TBD';
  const status: 'scheduled' | 'live' | 'completed' = m.status === 'LIVE' ? 'live' : m.status === 'COMPLETED' ? 'completed' : 'scheduled';
  return {
    id: m.id,
    tournamentId: m.tournament,
    round: m.round,
    team1: teamA,
    team2: teamB,
    score1: sideA?.score || 0,
    score2: sideB?.score || 0,
    status,
    time: m.scheduled_at,
  };
}

/* ═══ PUBLIC EVENTS ═══ */

export async function getEvents(params?: Record<string, string>): Promise<(Tournament | Workshop)[]> {
  try {
    const events = await eventsApi.getPublicEvents(params);
    return events.map(e => {
      if (e.event_type === 'TOURNAMENT') return mapBackendEventToTournament(e);
      if (e.event_type === 'WORKSHOP') return mapBackendEventToWorkshop(e);
      return mapBackendEventToTournament(e);
    });
  } catch (err) {
    console.error('getEvents failed:', err);
    return [];
  }
}

export async function getTournaments(params?: Record<string, string>): Promise<Tournament[]> {
  try {
    const events = await eventsApi.getPublicEvents({ ...params, event_type: 'TOURNAMENT' });
    return events.map(mapBackendEventToTournament);
  } catch (err) {
    console.error('getTournaments failed:', err);
    return [];
  }
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  try {
    const event = await eventsApi.getPublicEventDetail(id);
    return mapBackendEventToTournament(event);
  } catch (err) {
    console.error('getTournamentById failed:', err);
    return null;
  }
}

export async function getWorkshops(params?: Record<string, string>): Promise<Workshop[]> {
  try {
    const events = await eventsApi.getPublicEvents({ ...params, event_type: 'WORKSHOP' });
    return events.map(mapBackendEventToWorkshop);
  } catch (err) {
    console.error('getWorkshops failed:', err);
    return [];
  }
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  try {
    const event = await eventsApi.getPublicEventDetail(id);
    return mapBackendEventToWorkshop(event);
  } catch (err) {
    console.error('getWorkshopById failed:', err);
    return null;
  }
}

export async function getMatches(tournamentId: string): Promise<MatchResult[]> {
  if (!tournamentId) return [];
  try {
    const matches = await eventsApi.getPublicTournamentMatches(tournamentId);
    return (Array.isArray(matches) ? matches : []).map(mapBackendMatchToResult);
  } catch (err) {
    console.error('getMatches failed:', err);
    return [];
  }
}

export async function getLiveEvents(): Promise<(Tournament | Workshop)[]> {
  try {
    const events = await eventsApi.getLiveEvents();
    return events.map(e => {
      if (e.event_type === 'TOURNAMENT') return mapBackendEventToTournament(e);
      if (e.event_type === 'WORKSHOP') return mapBackendEventToWorkshop(e);
      return mapBackendEventToTournament(e);
    });
  } catch {
    return [];
  }
}

export async function getUpcomingEvents(): Promise<(Tournament | Workshop)[]> {
  try {
    const events = await eventsApi.getUpcomingEvents();
    return events.map(e => {
      if (e.event_type === 'TOURNAMENT') return mapBackendEventToTournament(e);
      if (e.event_type === 'WORKSHOP') return mapBackendEventToWorkshop(e);
      return mapBackendEventToTournament(e);
    });
  } catch {
    return [];
  }
}

export async function getPastEvents(): Promise<(Tournament | Workshop)[]> {
  try {
    const events = await eventsApi.getPastEvents();
    return events.map(e => {
      if (e.event_type === 'TOURNAMENT') return mapBackendEventToTournament(e);
      if (e.event_type === 'WORKSHOP') return mapBackendEventToWorkshop(e);
      return mapBackendEventToTournament(e);
    });
  } catch {
    return [];
  }
}

/* ═══ REGISTRATION ═══ */

export interface PublicRegistrationData {
  public_full_name: string;
  public_email: string;
  public_phone?: string;
  public_organization?: string;
}

export async function registerForEvent(eventId: string, data: PublicRegistrationData): Promise<void> {
  try {
    await eventsApi.registerForEvent(eventId, data);
  } catch (err) {
    console.error('registerForEvent failed:', err);
    throw new Error('Registration failed');
  }
}

export async function getMyRegistrations() {
  try {
    return await eventsApi.getMyRegistrations();
  } catch (err) {
    console.error('getMyRegistrations failed:', err);
    return [];
  }
}

/* ═══ ADMIN - REGISTRATIONS ═══ */

export async function adminGetRegistrations(params?: Record<string, string>) {
  try {
    return await eventsApi.adminGetRegistrations(params);
  } catch {
    return [];
  }
}

export async function adminApproveRegistration(id: string) {
  return eventsApi.adminApproveRegistration(id);
}

export async function adminRejectRegistration(id: string) {
  return eventsApi.adminRejectRegistration(id);
}

export async function adminCancelRegistration(id: string) {
  return eventsApi.adminCancelRegistration(id);
}

/* ═══ STANDINGS ═══ */

export interface StandingEntry {
  rank: number;
  teamName: string;
  organization: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

export async function getTournamentStandings(tournamentId: string): Promise<StandingEntry[]> {
  try {
    const standings = await eventsApi.getPublicTournamentStandings(tournamentId);
    const list = Array.isArray(standings) ? standings : [];
    return list.map(s => ({
      rank: s.rank || 0,
      teamName: s.team_name,
      organization: '',
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      points: s.points,
    }));
  } catch {
    return [];
  }
}

/* ═══ PUBLIC TEAMS ═══ */

export interface PublicTeamEntry {
  id: string;
  teamName: string;
  organization: string;
  tournamentId: string;
  tournamentName: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank?: number;
  coachName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function getPublicTeams(): Promise<PublicTeamEntry[]> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    const allTeams: PublicTeamEntry[] = [];
    for (const t of Array.isArray(tournaments) ? tournaments : []) {
      const standings = await eventsApi.getPublicTournamentStandings(t.id).catch(() => [] as eventsApi.BackendStanding[]);
      for (const s of Array.isArray(standings) ? standings : []) {
        allTeams.push({
          id: s.team_id,
          teamName: s.team_name,
          organization: '',
          tournamentId: t.id,
          tournamentName: t.event_title || '',
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          points: s.points,
          rank: s.rank,
        });
      }
    }
    return allTeams;
  } catch (err) {
    console.error('getPublicTeams failed:', err);
    return [];
  }
}

export async function getPublicTeamById(id: string): Promise<PublicTeamEntry | null> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    for (const t of Array.isArray(tournaments) ? tournaments : []) {
      const standings = await eventsApi.getPublicTournamentStandings(t.id).catch(() => [] as eventsApi.BackendStanding[]);
      const found = Array.isArray(standings) ? standings.find(s => s.team_id === id) : null;
      if (found) {
        return {
          id: found.team_id,
          teamName: found.team_name,
          organization: '',
          tournamentId: t.id,
          tournamentName: t.event_title || '',
          wins: found.wins,
          losses: found.losses,
          draws: found.draws,
          points: found.points,
          rank: found.rank,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getTeamMatches(teamId: string): Promise<MatchResult[]> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    const allMatches: MatchResult[] = [];
    for (const t of Array.isArray(tournaments) ? tournaments : []) {
      const matches = await eventsApi.getPublicTournamentMatches(t.id).catch(() => [] as eventsApi.BackendMatch[]);
      const related = (Array.isArray(matches) ? matches : []).filter(m =>
        m.sides?.some(s => s.participants?.some(p => p.tournament_team === teamId))
      );
      allMatches.push(...related.map(mapBackendMatchToResult));
    }
    return allMatches;
  } catch {
    return [];
  }
}

export async function getTeamUpcomingMatches(teamId: string): Promise<MatchResult[]> {
  try {
    const all = await getTeamMatches(teamId);
    return all.filter(m => m.status === 'scheduled');
  } catch {
    return [];
  }
}

/* ═══ PUBLIC MATCHES ═══ */

export interface MatchDetail {
  id: string;
  tournamentId: string;
  tournamentName: string;
  matchNumber?: number;
  round: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  field?: string;
  streamUrl?: string;
  winningSide: string | null;
  sides: {
    side: 'SIDE_A' | 'SIDE_B';
    score: number;
    teams: string[];
  }[];
}

function mapBackendMatchToDetail(m: eventsApi.BackendMatch): MatchDetail {
  return {
    id: m.id,
    tournamentId: m.tournament,
    tournamentName: m.tournament_title || '',
    round: m.round,
    status: m.status,
    scheduledAt: m.scheduled_at,
    startedAt: m.started_at || null,
    completedAt: m.completed_at || null,
    winningSide: m.winning_side_label || m.winning_side || null,
    sides: (m.sides || []).map(s => ({
      side: s.side,
      score: s.score,
      teams: s.participants?.map(p => p.tournament_team_name || '') || [],
    })),
  };
}

export async function getPublicMatchById(id: string): Promise<MatchDetail | null> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    for (const t of Array.isArray(tournaments) ? tournaments : []) {
      const matches = await eventsApi.getPublicTournamentMatches(t.id).catch(() => [] as eventsApi.BackendMatch[]);
      const found = Array.isArray(matches) ? matches.find(m => m.id === id) : null;
      if (found) return mapBackendMatchToDetail(found);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAllPublicMatches(): Promise<MatchDetail[]> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    const all: MatchDetail[] = [];
    for (const t of Array.isArray(tournaments) ? tournaments : []) {
      const matches = await eventsApi.getPublicTournamentMatches(t.id).catch(() => [] as eventsApi.BackendMatch[]);
      all.push(...(Array.isArray(matches) ? matches : []).map(mapBackendMatchToDetail));
    }
    return all;
  } catch {
    return [];
  }
}

export async function getLiveMatchCount(): Promise<number> {
  try {
    const all = await getAllPublicMatches();
    return all.filter(m => m.status === 'LIVE').length;
  } catch {
    return 0;
  }
}

export async function getCompletedMatchCount(): Promise<number> {
  try {
    const all = await getAllPublicMatches();
    return all.filter(m => m.status === 'COMPLETED').length;
  } catch {
    return 0;
  }
}
