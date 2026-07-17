import * as eventsApi from './eventsApi';
import type { BackendMatch, BackendStanding, SideType } from './eventsApi';
import { isAuthenticated } from '@/shared/utils/auth';
import { mapBackendMatchToDetail, type MatchDetail } from './matchMappers';

type ListResponse<T> = T[] | { results: T[]; count?: number };

export function unwrapMatchList<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.results ?? [];
}

export type MatchListParams = {
  tournament?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type MatchStats = {
  total: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
};

export function computeMatchStats(matches: BackendMatch[]): MatchStats {
  return {
    total: matches.length,
    scheduled: matches.filter(m => m.status === 'SCHEDULED').length,
    live: matches.filter(m => m.status === 'LIVE').length,
    completed: matches.filter(m => m.status === 'COMPLETED').length,
    cancelled: matches.filter(m => m.status === 'CANCELLED').length,
  };
}

function filterMatches(matches: BackendMatch[], params?: MatchListParams): BackendMatch[] {
  let list = [...matches];
  if (params?.tournament) list = list.filter(m => m.tournament === params.tournament);
  if (params?.status) list = list.filter(m => m.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(m => {
      const sideA = m.sides?.find(s => s.side === 'SIDE_A')?.participants?.map(p => p.team_name || '').join(' ') || '';
      const sideB = m.sides?.find(s => s.side === 'SIDE_B')?.participants?.map(p => p.team_name || '').join(' ') || '';
      return (
        m.round?.toLowerCase().includes(q) ||
        m.tournament_title?.toLowerCase().includes(q) ||
        sideA.toLowerCase().includes(q) ||
        sideB.toLowerCase().includes(q)
      );
    });
  }
  return list.sort((a, b) => String(b.scheduled_at || '').localeCompare(String(a.scheduled_at || '')));
}

export async function listAdminMatches(params?: MatchListParams): Promise<BackendMatch[]> {
  const query: Record<string, string> = {};
  if (params?.tournament) query.tournament = params.tournament;
  const raw = await eventsApi.adminGetMatches(Object.keys(query).length ? query : undefined);
  return filterMatches(unwrapMatchList(raw as ListResponse<BackendMatch>), params);
}

export async function getAdminMatch(id: string): Promise<BackendMatch> {
  return eventsApi.adminGetMatch(id);
}

export async function createAdminMatch(payload: {
  tournament: string;
  round: string;
  scheduled_at: string;
}): Promise<BackendMatch> {
  return eventsApi.adminCreateMatch(payload);
}

export async function patchAdminMatch(id: string, payload: Partial<BackendMatch>): Promise<BackendMatch> {
  return eventsApi.adminPatchMatch(id, payload);
}

export async function deleteAdminMatch(id: string): Promise<void> {
  await eventsApi.adminDeleteMatch(id);
}

export async function assignTeamToMatch(
  matchId: string,
  side: SideType,
  tournamentTeam: string,
): Promise<void> {
  await eventsApi.adminAssignTeamToMatch(matchId, { side, tournament_team: tournamentTeam });
}

export async function removeTeamFromMatch(
  matchId: string,
  side: SideType,
  tournamentTeam: string,
): Promise<void> {
  await eventsApi.adminRemoveTeamFromMatch(matchId, { side, tournament_team: tournamentTeam });
}

export async function recordMatchScores(
  matchId: string,
  side_a_score: number,
  side_b_score: number,
): Promise<BackendMatch> {
  return eventsApi.adminRecordMatchScores(matchId, { side_a_score, side_b_score });
}

export async function completeMatch(matchId: string): Promise<BackendMatch> {
  return eventsApi.adminCompleteMatch(matchId);
}

/**
 * Attempt to mark a match LIVE. Backend serializer marks `status` read-only,
 * so we patch `started_at` and verify — callers should handle StartMatchResult.
 */
export type StartMatchResult =
  | { ok: true; match: BackendMatch }
  | { ok: false; reason: 'status_readonly' | 'error'; message: string };

export async function startMatch(matchId: string): Promise<StartMatchResult> {
  const startedAt = new Date().toISOString();
  try {
    const updated = await patchAdminMatch(matchId, {
      status: 'LIVE',
      started_at: startedAt,
    } as Partial<BackendMatch>);
    if (updated.status === 'LIVE') {
      return { ok: true, match: updated };
    }
    const refreshed = await getAdminMatch(matchId);
    if (refreshed.status === 'LIVE') {
      return { ok: true, match: refreshed };
    }
    return {
      ok: false,
      reason: 'status_readonly',
      message:
        'The server did not accept a LIVE status (status is read-only on the API). Record scores on this scheduled match, then use Complete Match.',
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Failed to start match',
    };
  }
}

/** Public matches for one tournament — single backend call. */
export async function listPublicMatchesForTournament(tournamentId: string): Promise<MatchDetail[]> {
  const raw = await eventsApi.getPublicTournamentMatches(tournamentId);
  return unwrapMatchList(raw as ListResponse<BackendMatch>).map(mapBackendMatchToDetail);
}

/** Aggregate public matches across tournaments (multiple real API calls; no global public list exists). */
async function listPublicMatchesAcrossTournaments(): Promise<MatchDetail[]> {
  const tournaments = unwrapMatchList(await eventsApi.getPublicTournaments() as ListResponse<eventsApi.BackendTournament>);
  const results = await Promise.allSettled(
    tournaments.map(t => eventsApi.getPublicTournamentMatches(t.id)),
  );
  const all: MatchDetail[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...unwrapMatchList(result.value as ListResponse<BackendMatch>).map(mapBackendMatchToDetail));
    }
  }
  return all.sort((a, b) => String(b.scheduledAt || '').localeCompare(String(a.scheduledAt || '')));
}

/**
 * Load all matches from the backend.
 * Staff: one call to GET /admin/matches/ (http client attaches auth automatically).
 * Public: per-tournament public endpoints.
 */
export async function fetchAllMatches(): Promise<MatchDetail[]> {
  try {
    const admin = await listAdminMatches();
    return admin.map(mapBackendMatchToDetail);
  } catch {
    return listPublicMatchesAcrossTournaments();
  }
}

/** @deprecated Use fetchAllMatches — kept as alias for existing imports */
export async function listAllPublicMatches(): Promise<MatchDetail[]> {
  return fetchAllMatches();
}

/**
 * Fetch a single match from the backend.
 * Tries GET /admin/matches/{id}/ first (when authenticated as staff).
 * Falls back to GET /events/tournaments/{tournamentId}/matches/ when tournamentId is known.
 */
export async function getMatchDetail(id: string, tournamentId?: string): Promise<MatchDetail | null> {
  try {
    const m = await getAdminMatch(id);
    return mapBackendMatchToDetail(m);
  } catch {
    /* not staff or not found via admin endpoint */
  }
  if (tournamentId) {
    const matches = await listPublicMatchesForTournament(tournamentId);
    return matches.find(m => m.id === id) ?? null;
  }
  return null;
}

export async function fetchTournamentStandings(tournamentId: string): Promise<BackendStanding[]> {
  if (!tournamentId) return [];
  if (isAuthenticated()) {
    try {
      const admin = await eventsApi.adminGetTournamentStandings(tournamentId);
      return unwrapMatchList(admin as ListResponse<BackendStanding>);
    } catch {
      // fall through to public
    }
  }
  const pub = await eventsApi.getPublicTournamentStandings(tournamentId);
  return unwrapMatchList(pub as ListResponse<BackendStanding>);
}

export function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), totalPages };
}
