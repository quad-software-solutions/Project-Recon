import { http } from '@/src/shared/api/http';
import type { Tournament, MatchResult, Workshop } from '@/src/shared/types';
import * as eventsApi from './eventsApi';

const BASE = '/events';

function mapEventToTournament(e: eventsApi.BackendEvent): Tournament {
  const t = e.tournament;
  const start = new Date(e.start_datetime);
  const end = new Date(e.end_datetime);
  const now = new Date();
  const isLive = now >= start && now <= end;
  const isPast = now > end;
  const status: 'upcoming' | 'live' | 'completed' = isLive ? 'live' : isPast ? 'completed' : 'upcoming';
  const category = (t?.category_name || e.title) as Tournament['category'];
  return {
    id: e.id,
    name: e.title,
    date: e.start_datetime.slice(0, 10),
    location: e.location,
    status: e.status === 'PUBLISHED' ? status : 'upcoming',
    category: category.includes('VEX IQ') ? 'VEX IQ' : category.includes('VEX V5') ? 'VEX V5' : 'Enjoy AI',
    teams: [],
    maxTeams: t?.max_teams || 0,
    registrationDeadline: e.registration_deadline || e.start_datetime.slice(0, 10),
    prizePool: t?.prize_pool || '0 ETB',
    streamUrl: e.youtube_live_url || undefined,
    description: e.description,
  };
}

function mapMatchToResult(m: eventsApi.BackendMatch): MatchResult {
  const sideA = m.sides?.find(s => s.side === 'SIDE_A');
  const sideB = m.sides?.find(s => s.side === 'SIDE_B');
  const teamA = sideA?.participants?.[0]?.tournament_team_name || 'TBD';
  const teamB = sideB?.participants?.[0]?.tournament_team_name || 'TBD';
  const now = new Date();
  const sched = new Date(m.scheduled_at);
  const isLive = m.status === 'LIVE';
  const isPast = m.status === 'COMPLETED';
  const status: 'scheduled' | 'live' | 'completed' = isLive ? 'live' : isPast ? 'completed' : 'scheduled';
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

function mapEventToWorkshop(e: eventsApi.BackendEvent): Workshop {
  const w = e.workshop;
  const levelMap: Record<string, Workshop['level']> = {
    BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced',
  };
  const start = new Date(e.start_datetime);
  const end = new Date(e.end_datetime);
  const now = new Date();
  const isLive = now >= start && now <= end;
  const isPast = now > end;
  const status: 'upcoming' | 'ongoing' | 'completed' = isLive ? 'ongoing' : isPast ? 'completed' : 'upcoming';
  const catMap: Record<string, Workshop['category']> = {
    'VEX IQ': 'VEX IQ', 'VEX V5': 'VEX V5', 'Enjoy AI': 'Enjoy AI',
  };
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    detailedDescription: e.description,
    date: e.start_datetime.slice(0, 10),
    time: e.start_datetime.slice(11, 16),
    duration: w ? `${w.duration_minutes} min` : 'TBD',
    instructor: w?.instructor_name || 'TBD',
    instructorRole: 'Instructor',
    instructorImage: '',
    location: e.location,
    category: catMap[e.title] || 'STEM',
    level: levelMap[w?.level || 'BEGINNER'] || 'Beginner',
    capacity: e.capacity || 0,
    enrolled: e.enrolled_count || 0,
    price: parseFloat(w?.price || '0'),
    image: '',
    topics: [],
    requirements: [],
    status,
  };
}

export async function getTournaments(params?: Record<string, string>): Promise<Tournament[]> {
  try {
    const events = await eventsApi.getPublicEvents({ ...params, event_type: 'TOURNAMENT' });
    return events.map(mapEventToTournament);
  } catch {
    return [];
  }
}

export async function getTournamentById(id: string): Promise<Tournament | undefined> {
  try {
    const event = await eventsApi.getPublicEventDetail(id);
    return mapEventToTournament(event);
  } catch {
    return undefined;
  }
}

export async function getMatches(tournamentId?: string): Promise<MatchResult[]> {
  if (!tournamentId) return [];
  try {
    const matches = await eventsApi.getPublicTournamentMatches(tournamentId);
    return (Array.isArray(matches) ? matches : []).map(mapMatchToResult);
  } catch {
    return [];
  }
}

export async function getWorkshops(params?: Record<string, string>): Promise<Workshop[]> {
  try {
    const events = await eventsApi.getPublicEvents({ ...params, event_type: 'WORKSHOP' });
    return events.map(mapEventToWorkshop);
  } catch {
    return [];
  }
}

export async function getWorkshopById(id: string): Promise<Workshop | undefined> {
  try {
    const event = await eventsApi.getPublicEventDetail(id);
    return mapEventToWorkshop(event);
  } catch {
    return undefined;
  }
}

export async function getPastTournaments(): Promise<Tournament[]> {
  try {
    const events = await eventsApi.getPastEvents();
    return events.filter(e => e.event_type === 'TOURNAMENT').map(mapEventToTournament);
  } catch {
    return [];
  }
}

export async function getPastWorkshops(): Promise<Workshop[]> {
  try {
    const events = await eventsApi.getPastEvents();
    return events.filter(e => e.event_type === 'WORKSHOP').map(mapEventToWorkshop);
  } catch {
    return [];
  }
}

export async function registerForTournament(tournamentId: string): Promise<void> {
  try {
    await eventsApi.registerForEvent(tournamentId, {});
  } catch {
    throw new Error('Registration failed');
  }
}

export async function enrollInWorkshop(workshopId: string): Promise<void> {
  try {
    await eventsApi.registerForEvent(workshopId, {});
  } catch {
    throw new Error('Enrollment failed');
  }
}
