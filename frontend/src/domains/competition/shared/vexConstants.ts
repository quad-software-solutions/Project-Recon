/** VEX competition rules aligned with backend Events application design */

export const VEX_CATEGORIES = ['VEX IQ', 'VEX V5', 'Enjoy AI'] as const;

export const VEX_SCORING_RULES = {
  winPoints: 2,
  drawPoints: 1,
  lossPoints: 0,
  tieBreakers: ['Ranking Points (RP)', 'Wins', 'Total Alliance Score'],
} as const;

export const VEX_MATCH_ROUNDS = [
  'Qualification',
  'Quarter Final',
  'Semi Final',
  'Final',
] as const;

export const VEX_ALLIANCE_CONFIG = {
  teamsPerAlliance: 2,
  redLabel: 'RED ALLIANCE',
  blueLabel: 'BLUE ALLIANCE',
} as const;

export const VEX_COMPETITION_PATHWAY = [
  { label: 'Friendly Scrimmage', desc: 'Practice & team building' },
  { label: 'Local Qualifier', desc: 'Branch-level competition' },
  { label: 'National Championship', desc: 'Country-wide finals' },
  { label: 'African Championship', desc: 'Continental qualifier' },
  { label: 'VEX Worlds', desc: 'International finals' },
] as const;

export const VEX_ELIMINATION_RULES = [
  'Top-ranked teams after Qualification advance to elimination rounds.',
  'Elimination uses alliance format: 2 teams per RED or BLUE alliance.',
  'Quarter-Finals → Semi-Finals → Finals progression.',
  'Alliance with higher score wins the match.',
  'Tournament Champion is the winning alliance in the Final.',
] as const;

export const VEX_REGISTRATION_MODES = [
  { mode: 'NONE', label: 'No Registration', desc: 'Staff-managed teams only' },
  { mode: 'PUBLIC', label: 'Public', desc: 'Anyone may register' },
  { mode: 'STUDENT', label: 'Students Only', desc: 'Authenticated students' },
  { mode: 'SUBPROGRAM_STUDENT', label: 'Sub-Program', desc: 'Enrolled sub-program students' },
] as const;
