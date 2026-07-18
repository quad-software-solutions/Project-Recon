import { http } from '@/shared/api/http';
import { computeEventState, type Tournament, type Workshop, type MatchResult, type EventStoredStatus, type RegistrationMode } from '@/shared/types';
import * as eventsApi from './eventsApi';
import { mapBackendMatchToDetail, type MatchDetail } from './matchMappers';
import { unwrapList } from '@/shared/api/pagination';

/* ═══ TOURNAMENT INDEX (event UUID → tournament record) ═══ */

let tournamentByEventId: Map<string, eventsApi.BackendTournament> | null = null;

async function getTournamentIndex(): Promise<Map<string, eventsApi.BackendTournament>> {
  if (tournamentByEventId) return tournamentByEventId;
  const raw = await eventsApi.getPublicTournaments();
  const list = unwrapList(raw as eventsApi.BackendTournament[]);
  tournamentByEventId = new Map(list.map(t => [t.event, t]));
  return tournamentByEventId;
}

/** Clear cached tournament index (call after admin creates tournaments). */
export function clearTournamentCache(): void {
  tournamentByEventId = null;
}

export async function resolveTournamentIdForEvent(eventId: string): Promise<string | null> {
  const index = await getTournamentIndex();
  return index.get(eventId)?.id ?? null;
}

/* ═══ HELPERS ═══ */

function mapBackendEventToTournament(
  e: eventsApi.BackendEvent,
  tournament?: eventsApi.BackendTournament | null,
): Tournament {
  const t = tournament ?? e.tournament;
  return {
    id: e.id,
    tournamentId: t?.id,
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
    category: t?.category_name || e.title,
    maxTeams: t?.max_teams || 0,
    prizePool: t?.prize_pool || '0 Birr',
    isClosed: t?.is_closed ?? false,
    youtubeLiveUrl: e.youtube_live_url || null,
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
    instructor: e.workshop?.instructor_name || 'To be announced',
    level: (e.workshop?.level || 'BEGINNER') as Workshop['level'],
    duration: e.workshop?.duration_minutes || 0,
    price: parseFloat(e.workshop?.price || '0'),
  };
}

function mapBackendMatchToResult(m: eventsApi.BackendMatch): MatchResult {
  const sideA = m.sides?.find(s => s.side === 'SIDE_A');
  const sideB = m.sides?.find(s => s.side === 'SIDE_B');
  const teamA = sideA?.participants?.[0]?.team_name || '—';
  const teamB = sideB?.participants?.[0]?.team_name || '—';
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
    const [events, index] = await Promise.all([
      eventsApi.getPublicEvents(params),
      getTournamentIndex(),
    ]);
    return events.map(e => {
      if (e.event_type === 'TOURNAMENT') return mapBackendEventToTournament(e, index.get(e.id));
      if (e.event_type === 'WORKSHOP') return mapBackendEventToWorkshop(e);
      return mapBackendEventToTournament(e, index.get(e.id));
    });
  } catch (err) {
    console.error('getEvents failed:', err);
    return [];
  }
}

export async function getTournaments(params?: Record<string, string>): Promise<Tournament[]> {
  try {
    const [events, index] = await Promise.all([
      eventsApi.getPublicEvents({ ...params, event_type: 'TOURNAMENT' }),
      getTournamentIndex(),
    ]);
    return events.map(e => mapBackendEventToTournament(e, index.get(e.id)));
  } catch (err) {
    console.error('getTournaments failed:', err);
    return [];
  }
}

export async function getTournamentById(eventId: string): Promise<Tournament | null> {
  try {
    const [event, index] = await Promise.all([
      eventsApi.getPublicEventDetail(eventId),
      getTournamentIndex(),
    ]);
    return mapBackendEventToTournament(event, index.get(eventId));
  } catch {
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

export async function getMatches(eventId: string): Promise<MatchResult[]> {
  if (!eventId) return [];
  try {
    const tournamentId = await resolveTournamentIdForEvent(eventId);
    if (!tournamentId) return [];
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
  public_full_name?: string;
  public_email?: string;
  public_phone?: string;
  public_organization?: string;
  payment?: {
    amount: string;
    payment_method: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE';
    transaction_reference?: string;
    bank_name?: string;
  };
}

export async function registerForEvent(eventId: string, data: PublicRegistrationData = {}) {
  return eventsApi.registerForEvent(eventId, data);
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

export async function getTournamentStandings(eventId: string): Promise<StandingEntry[]> {
  try {
    const tournamentId = await resolveTournamentIdForEvent(eventId);
    if (!tournamentId) return [];
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
  matchesPlayed: number;
  totalScore: number;
  rank?: number;
  coachName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function getPublicTeams(): Promise<PublicTeamEntry[]> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    const list = Array.isArray(tournaments) ? tournaments : [];
    const results = await Promise.allSettled(
      list.map(t => eventsApi.getPublicTournamentStandings(t.id))
    );
    const allTeams: PublicTeamEntry[] = [];
    for (let i = 0; i < results.length; i++) {
      const t = list[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        const standings = Array.isArray(result.value) ? result.value : [];
        for (const s of standings) {
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
            matchesPlayed: s.wins + s.losses + s.draws,
            totalScore: s.totalScore ?? 0,
            rank: s.rank,
          });
        }
      }
    }
    return allTeams;
  } catch {
    return [];
  }
}

export async function getPublicTeamById(id: string): Promise<PublicTeamEntry | null> {
  try {
    const tournaments = await eventsApi.getPublicTournaments();
    const list = Array.isArray(tournaments) ? tournaments : [];
    const results = await Promise.allSettled(
      list.map(t => eventsApi.getPublicTournamentStandings(t.id))
    );
    for (let i = 0; i < results.length; i++) {
      const t = list[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        const standings = Array.isArray(result.value) ? result.value : [];
        const found = standings.find(s => s.team_id === id);
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
            matchesPlayed: found.wins + found.losses + found.draws,
            totalScore: found.totalScore ?? 0,
            rank: found.rank,
          };
        }
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
    const list = Array.isArray(tournaments) ? tournaments : [];
    const results = await Promise.allSettled(
      list.map(t => eventsApi.getPublicTournamentMatches(t.id))
    );
    const allMatches: MatchResult[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const matches = Array.isArray(result.value) ? result.value : [];
        const related = matches.filter(m =>
          m.sides?.some(s => s.participants?.some(p => p.tournament_team === teamId))
        );
        allMatches.push(...related.map(mapBackendMatchToResult));
      }
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

export { type MatchDetail } from './matchMappers';
import { getMatchDetail, fetchAllMatches } from './matchApi';

export async function getPublicMatchById(
  id: string,
  options?: { tournamentId?: string },
): Promise<MatchDetail | null> {
  try {
    return getMatchDetail(id, options?.tournamentId);
  } catch {
    return null;
  }
}

export async function getAllPublicMatches(): Promise<MatchDetail[]> {
  try {
    return fetchAllMatches();
  } catch {
    return [];
  }
}

export async function getTournamentMatchDetails(eventId: string): Promise<MatchDetail[]> {
  if (!eventId) return [];
  try {
    const tournamentId = await resolveTournamentIdForEvent(eventId);
    if (!tournamentId) return [];
    const matches = await eventsApi.getPublicTournamentMatches(tournamentId);
    return (Array.isArray(matches) ? matches : []).map(mapBackendMatchToDetail);
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
