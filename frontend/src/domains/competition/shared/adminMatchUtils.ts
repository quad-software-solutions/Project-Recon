import type { BackendMatch } from '../api/eventsApi';
import type { AllianceSide } from './VexAllianceDisplay';
import { getSideTeamNames } from './vexAllianceUtils';

export function backendMatchToArena(match: BackendMatch) {
  const sideAData = match.sides?.find(s => s.side === 'SIDE_A');
  const sideBData = match.sides?.find(s => s.side === 'SIDE_B');
  const sideA: AllianceSide = {
    side: 'SIDE_A',
    score: sideAData?.score ?? null,
    teams: getSideTeamNames(sideAData?.participants),
  };
  const sideB: AllianceSide = {
    side: 'SIDE_B',
    score: sideBData?.score ?? null,
    teams: getSideTeamNames(sideBData?.participants),
  };
  return { sideA, sideB };
}

export function formatMatchDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export type MatchFlowStep = 'assign' | 'ready' | 'live' | 'score' | 'done';

export function getMatchFlowStep(match: BackendMatch): MatchFlowStep {
  if (match.status === 'COMPLETED' || match.status === 'CANCELLED') return 'done';
  const red = match.sides?.find(s => s.side === 'SIDE_A')?.participants?.length || 0;
  const blue = match.sides?.find(s => s.side === 'SIDE_B')?.participants?.length || 0;
  const hasTeams = red >= 1 && blue >= 1;
  if (match.status === 'LIVE') {
    const scoreA = match.sides?.find(s => s.side === 'SIDE_A')?.score ?? 0;
    const scoreB = match.sides?.find(s => s.side === 'SIDE_B')?.score ?? 0;
    return scoreA > 0 || scoreB > 0 ? 'score' : 'live';
  }
  if (!hasTeams) return 'assign';
  return 'ready';
}

export const FLOW_STEPS: { id: MatchFlowStep; label: string }[] = [
  { id: 'assign', label: 'Assign' },
  { id: 'ready', label: 'Start' },
  { id: 'live', label: 'Live' },
  { id: 'score', label: 'Score' },
  { id: 'done', label: 'Done' },
];

export function flowStepIndex(step: MatchFlowStep) {
  return FLOW_STEPS.findIndex(s => s.id === step);
}
