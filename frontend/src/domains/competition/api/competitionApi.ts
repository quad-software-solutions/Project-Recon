import { http } from '@/src/shared/api/http';
import { MOCK_TOURNAMENTS, MOCK_MATCHES, MOCK_WORKSHOPS } from '@/src/shared/constants/mock-data';
import type { Tournament, MatchResult, Workshop } from '@/src/shared/types';

const BASE = '/competitions';

export async function getTournaments(params?: Record<string, string>): Promise<Tournament[]> {
  try {
    const res = await http.get<{ results: Tournament[] }>(`${BASE}/tournaments/`, { params });
    return res.results;
  } catch {
    let list = [...MOCK_TOURNAMENTS];
    if (params?.status) list = list.filter(t => t.status === params.status);
    return list;
  }
}

export async function getTournamentById(id: string): Promise<Tournament | undefined> {
  try {
    return await http.get<Tournament>(`${BASE}/tournaments/${id}/`);
  } catch {
    return MOCK_TOURNAMENTS.find(t => t.id === id);
  }
}

export async function getMatches(tournamentId?: string): Promise<MatchResult[]> {
  try {
    const params = tournamentId ? { tournament_id: tournamentId } : undefined;
    const res = await http.get<{ results: MatchResult[] }>(`${BASE}/matches/`, { params });
    return res.results;
  } catch {
    if (tournamentId) return MOCK_MATCHES.filter(m => m.tournamentId === tournamentId);
    return MOCK_MATCHES;
  }
}

export async function getWorkshops(params?: Record<string, string>): Promise<Workshop[]> {
  try {
    const res = await http.get<{ results: Workshop[] }>(`${BASE}/workshops/`, { params });
    return res.results;
  } catch {
    let list = [...MOCK_WORKSHOPS];
    if (params?.status) list = list.filter(w => w.status === params.status);
    return list;
  }
}

export async function getWorkshopById(id: string): Promise<Workshop | undefined> {
  try {
    return await http.get<Workshop>(`${BASE}/workshops/${id}/`);
  } catch {
    return MOCK_WORKSHOPS.find(w => w.id === id);
  }
}

export async function registerForTournament(tournamentId: string): Promise<void> {
  try {
    await http.post(`${BASE}/tournaments/${tournamentId}/register/`, {});
  } catch {
    // silent fallback
  }
}

export async function enrollInWorkshop(workshopId: string): Promise<void> {
  try {
    await http.post(`${BASE}/workshops/${workshopId}/enroll/`, {});
  } catch {
    // silent fallback
  }
}
