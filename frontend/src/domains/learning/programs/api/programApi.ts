import { http } from '@/src/shared/api/http';
import type { ProgramDisplay } from '@/src/shared/types';

const BASE = '/academic/programs';

type ProgramListResponse = ProgramDisplay[] | { results: ProgramDisplay[] };

function toProgramDisplay(p: any): ProgramDisplay {
  const title = p.title || p.name || 'Academic Program';
  const slug = p.slug || String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return {
    id: p.id || slug,
    name: p.name || slug,
    slug,
    description: p.description || '',
    supports_group: p.supports_group ?? true,
    supports_individual: p.supports_individual ?? true,
    is_active: p.is_active ?? true,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    title,
    category: p.category || '',
    detailedDescription: p.detailedDescription || p.description || '',
    level: p.level || '',
    ageGroup: p.ageGroup || '',
    duration: p.duration || '',
    syllabus: p.syllabus || [],
    skillsGained: p.skillsGained || [],
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
