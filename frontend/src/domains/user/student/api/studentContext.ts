import { fetchStudentCertificatesApi } from '@/src/domains/learning/academics/api/academicApi';
import { getMyRegistrations } from '@/src/domains/competition/api/eventsApi';

/** Resolve academic student UUID for the logged-in student (existing API only). */
export async function resolveStudentId(email: string, cachedId?: string): Promise<string | null> {
  if (cachedId) return cachedId;

  const storedKey = `studentId_${email}`;
  const stored = localStorage.getItem(storedKey);
  if (stored) return stored;

  try {
    const certs = await fetchStudentCertificatesApi();
    if (certs.length > 0 && certs[0].student) {
      localStorage.setItem(storedKey, certs[0].student);
      return certs[0].student;
    }
  } catch {
    /* no certificates yet */
  }

  try {
    const regs = await getMyRegistrations();
    if (regs.length > 0) {
      // Confirms student account exists; student UUID is cached after first event registration.
      return localStorage.getItem(storedKey);
    }
  } catch {
    /* not a student account or not authenticated */
  }

  return null;
}

/** Cache student UUID after a successful student registration or profile load. */
export function cacheStudentId(email: string, studentId: string): void {
  localStorage.setItem(`studentId_${email}`, studentId);
}
