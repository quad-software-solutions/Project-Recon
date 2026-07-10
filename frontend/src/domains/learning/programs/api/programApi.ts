import { http } from '@/src/shared/api/http';
import type { ProgramDisplay } from '@/src/shared/types';

const BASE = '/academic/programs';

type ProgramListResponse = ProgramDisplay[] | { results: ProgramDisplay[] };

const PRESENTATION_DEFAULTS = [
  {
    category: 'Robotics',
    level: 'Beginner',
    ageGroup: 'Ages 8 - 14',
    duration: '12 Weeks',
    syllabus: ['Mechanical design foundations', 'Sensors and control logic', 'Team challenge build'],
    skillsGained: ['Problem Solving', 'Mechanical Assembly', 'Teamwork'],
  },
  {
    category: 'Engineering',
    level: 'Intermediate',
    ageGroup: 'Ages 12 - 18',
    duration: '16 Weeks',
    syllabus: ['Programming fundamentals', 'Robot motion planning', 'Applied project sprint'],
    skillsGained: ['Coding', 'Systems Thinking', 'Debugging'],
  },
  {
    category: 'Competition',
    level: 'Advanced',
    ageGroup: 'Ages 14 - 19',
    duration: '24 Weeks',
    syllabus: ['Competition robot design', 'Autonomous control', 'Engineering notebook practice'],
    skillsGained: ['PID Control', 'Technical Writing', 'Competitive Strategy'],
  },
];

function toProgramDisplay(p: any, index = 0): ProgramDisplay {
  const defaults = PRESENTATION_DEFAULTS[index % PRESENTATION_DEFAULTS.length];
  const title = p.title || p.name || 'Academic Program';
  const slug = p.slug || String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return {
    id: p.id || slug,
    name: p.name || slug,
    slug,
    description: p.description || 'A practical learning track designed around hands-on labs, guided projects, and measurable student progress.',
    supports_group: p.supports_group ?? true,
    supports_individual: p.supports_individual ?? true,
    is_active: p.is_active ?? true,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    title,
    category: p.category || defaults.category,
    detailedDescription: p.detailedDescription || p.description || '',
    level: p.level || defaults.level,
    ageGroup: p.ageGroup || defaults.ageGroup,
    duration: p.duration || defaults.duration,
    syllabus: p.syllabus || defaults.syllabus,
    skillsGained: p.skillsGained || defaults.skillsGained,
    image: p.image || '',
  };
}

export async function getPrograms(signal?: AbortSignal): Promise<ProgramDisplay[]> {
  try {
    const res = await http.get<ProgramListResponse>(`${BASE}/`, { signal });
    const programs = Array.isArray(res) ? res : res.results;
    return programs.filter(program => program.is_active !== false).map(toProgramDisplay);
  } catch {
    return [];
  }
}

export async function getProgramById(id: string): Promise<ProgramDisplay | undefined> {
  try {
    const program = await http.get<ProgramDisplay>(`${BASE}/${id}/`);
    return toProgramDisplay(program);
  } catch {
    return undefined;
  }
}
