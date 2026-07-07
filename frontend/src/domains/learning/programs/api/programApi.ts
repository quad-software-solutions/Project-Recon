import { http } from '@/src/shared/api/http';
import { ROBOTICS_PROGRAMS } from '@/src/shared/constants/mock-data';
import type { ProgramDisplay } from '@/src/shared/types';

const BASE = '/academics/programs';

function toProgramDisplay(p: any): ProgramDisplay {
  return {
    id: p.id,
    name: p.slug || p.title?.toLowerCase().replace(/\s+/g, '-') || '',
    slug: p.slug || p.title?.toLowerCase().replace(/\s+/g, '-') || '',
    description: p.description || '',
    supports_group: true,
    supports_individual: false,
    is_active: true,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    title: p.title || p.name || '',
    category: p.category || '',
    detailedDescription: p.detailedDescription || '',
    level: p.level || '',
    ageGroup: p.ageGroup || '',
    duration: p.duration || '',
    syllabus: p.syllabus || [],
    skillsGained: p.skillsGained || [],
    image: p.image || '',
  };
}

export async function getPrograms(): Promise<ProgramDisplay[]> {
  try {
    const res = await http.get<{ results: ProgramDisplay[] }>(`${BASE}/`);
    return res.results;
  } catch {
    return ROBOTICS_PROGRAMS.map(toProgramDisplay);
  }
}

export async function getProgramById(id: string): Promise<ProgramDisplay | undefined> {
  try {
    return await http.get<ProgramDisplay>(`${BASE}/${id}/`);
  } catch {
    const found = ROBOTICS_PROGRAMS.find(p => p.id === id);
    return found ? toProgramDisplay(found) : undefined;
  }
}
