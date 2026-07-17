import { VEX_ALLIANCE_CONFIG } from './vexConstants';

export const TEAMS_PER_ALLIANCE = VEX_ALLIANCE_CONFIG.teamsPerAlliance;

export interface AllianceMatchPlan {
  round: string;
  redTeams: string[];
  blueTeams: string[];
}

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pad team list to multiple of 4 for alliance matches */
function padToMultipleOf4(teamIds: string[]): string[] {
  const padded = [...teamIds];
  while (padded.length % 4 !== 0) padded.push('BYE');
  return padded;
}

/** Split a group of 4 into RED (2) and BLUE (2) alliances */
function groupToAlliances(group: string[]): { red: string[]; blue: string[] } | null {
  const valid = group.filter(t => t !== 'BYE');
  if (valid.length < 2) return null;
  const red = group.slice(0, 2).filter(t => t !== 'BYE');
  const blue = group.slice(2, 4).filter(t => t !== 'BYE');
  if (!red.length || !blue.length) return null;
  return { red, blue };
}

/**
 * VEX Alliance Qualification — groups teams into RED vs BLUE matches (2 teams per alliance).
 * Creates multiple qualification rounds with rotated pairings.
 */
export function generateVexAllianceQualification(
  teamIds: string[],
  numRounds?: number,
): AllianceMatchPlan[] {
  if (teamIds.length < 4) return [];
  const rounds = numRounds ?? Math.max(1, Math.min(5, teamIds.length - 1));
  const plans: AllianceMatchPlan[] = [];

  for (let r = 0; r < rounds; r++) {
    const rotated = [...teamIds];
    // Rotate teams each round for variety
    if (r > 0) {
      const shift = r % (rotated.length - 1) + 1;
      rotated.push(...rotated.splice(0, shift));
    }
    const padded = padToMultipleOf4(shuffle(rotated));

    for (let g = 0; g < padded.length; g += 4) {
      const alliances = groupToAlliances(padded.slice(g, g + 4));
      if (!alliances) continue;
      plans.push({
        round: `Qualification ${r + 1}${padded.length > 4 ? ` · Field ${Math.floor(g / 4) + 1}` : ''}`,
        redTeams: alliances.red,
        blueTeams: alliances.blue,
      });
    }
  }
  return plans;
}

/**
 * VEX Alliance Elimination — seeds top teams into bracket matches (2 per alliance).
 */
export function generateVexAllianceElimination(
  seededTeamIds: string[],
): AllianceMatchPlan[] {
  const n = seededTeamIds.length;
  if (n < 4) return [];

  const padded = padToMultipleOf4(seededTeamIds);
  const plans: AllianceMatchPlan[] = [];

  // Quarter-finals: groups of 4
  const qfGroups: AllianceMatchPlan[] = [];
  for (let g = 0; g < padded.length; g += 4) {
    const alliances = groupToAlliances(padded.slice(g, g + 4));
    if (!alliances) continue;
    qfGroups.push({
      round: `Quarter Final ${Math.floor(g / 4) + 1}`,
      redTeams: alliances.red,
      blueTeams: alliances.blue,
    });
  }
  plans.push(...qfGroups);

  // Semi-finals placeholder (winners TBD — staff assigns after QF)
  if (qfGroups.length >= 2) {
    plans.push({ round: 'Semi Final 1', redTeams: [], blueTeams: [] });
    if (qfGroups.length >= 4) plans.push({ round: 'Semi Final 2', redTeams: [], blueTeams: [] });
  }
  plans.push({ round: 'Final', redTeams: [], blueTeams: [] });

  return plans;
}

/** Get team names from backend match side */
export function getSideTeamNames(
  participants: { team_name?: string; tournament_team_name?: string }[] | undefined,
): string[] {
  return (participants || [])
    .map(p => p.team_name || p.tournament_team_name || '')
    .filter(Boolean);
}

export function sideLabel(side: 'SIDE_A' | 'SIDE_B'): string {
  return side === 'SIDE_A' ? VEX_ALLIANCE_CONFIG.redLabel : VEX_ALLIANCE_CONFIG.blueLabel;
}

export function canAddTeamToSide(currentCount: number): boolean {
  return currentCount < TEAMS_PER_ALLIANCE;
}
