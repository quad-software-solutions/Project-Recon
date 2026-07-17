import { fetchStudentCertificatesApi } from '@/domains/learning/academics/api/academicApi';
import { getCachedStudentId, setCachedStudentId, studentIdKey } from '@/shared/utils/storage';

/** Resolve academic student UUID for the logged-in student (existing API only). */
export async function resolveStudentId(email: string, cachedId?: string): Promise<string | null> {
  if (cachedId) return cachedId;

  const stored = getCachedStudentId(email);
  if (stored) return stored;

  try {
    const certs = await fetchStudentCertificatesApi();
    if (certs.length > 0 && certs[0].student) {
      setCachedStudentId(email, certs[0].student);
      return certs[0].student;
    }
  } catch {
    /* no certificates yet */
  }

  return null;
}

/** Cache student UUID after a successful student registration or profile load. */
export function cacheStudentId(email: string, studentId: string): void {
  setCachedStudentId(email, studentId);
}

export { studentIdKey };
