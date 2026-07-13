import type { BackendMatch, MatchStatus, SideType } from './eventsApi';

export interface MatchDetail {
  id: string;
  tournamentId: string;
  tournamentName: string;
  round: string;
  status: MatchStatus;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  winningSide: string | null;
  sides: {
    side: SideType;
    score: number;
    teams: string[];
  }[];
}

export function mapBackendMatchToDetail(m: BackendMatch): MatchDetail {
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
      teams: s.participants?.map(p => p.team_name || p.tournament_team_name || '').filter(Boolean) || [],
    })),
  };
}
