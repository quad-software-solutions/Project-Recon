import { http } from '@/src/shared/api/http';
import { ROBOTICS_PROGRAMS } from '@/src/shared/constants/mock-data';
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

function pickMockProgram(p: any, index = 0) {
  const slug = String(p.slug || p.name || p.title || '').toLowerCase();
  return (
    ROBOTICS_PROGRAMS.find(program => slug.includes(program.id.replace('prog-', ''))) ||
    ROBOTICS_PROGRAMS[index % ROBOTICS_PROGRAMS.length] ||
    ROBOTICS_PROGRAMS[0]
  );
}

function toProgramDisplay(p: any, index = 0): ProgramDisplay {
  const mockProgram = pickMockProgram(p, index);
  const defaults = PRESENTATION_DEFAULTS[index % PRESENTATION_DEFAULTS.length];
  const title = p.title || p.name || mockProgram?.title || 'Academic Program';
  const slug = p.slug || String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return {
    id: p.id || slug,
    name: p.name || slug,
    slug,
    description: p.description || mockProgram?.description || 'A practical robotics learning track designed around hands-on labs, guided projects, and measurable student progress.',
    supports_group: p.supports_group ?? true,
    supports_individual: p.supports_individual ?? true,
    is_active: p.is_active ?? true,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    title,
    category: p.category || mockProgram?.category || defaults.category,
    detailedDescription: p.detailedDescription || mockProgram?.detailedDescription || p.description || '',
    level: p.level || mockProgram?.level || defaults.level,
    ageGroup: p.ageGroup || mockProgram?.ageGroup || defaults.ageGroup,
    duration: p.duration || mockProgram?.duration || defaults.duration,
    syllabus: p.syllabus || mockProgram?.syllabus || defaults.syllabus,
    skillsGained: p.skillsGained || mockProgram?.skillsGained || defaults.skillsGained,
    image: p.image || mockProgram?.image || '',
  };
}

export async function getPrograms(): Promise<ProgramDisplay[]> {
  try {
    const res = await http.get<ProgramListResponse>(`${BASE}/`);
    const programs = Array.isArray(res) ? res : res.results;
    return programs.filter(program => program.is_active !== false).map(toProgramDisplay);
  } catch {
    return ROBOTICS_PROGRAMS.map(toProgramDisplay);
  }
}

export async function getProgramById(id: string): Promise<ProgramDisplay | undefined> {
  try {
    const program = await http.get<ProgramDisplay>(`${BASE}/${id}/`);
    return toProgramDisplay(program);
  } catch {
    const found = ROBOTICS_PROGRAMS.find(p => p.id === id);
    return found ? toProgramDisplay(found) : undefined;
  }
}
