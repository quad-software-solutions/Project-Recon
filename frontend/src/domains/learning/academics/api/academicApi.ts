import type { StudentProfile, Program, SubProgram, AcademicClass, Enrollment, EnrollmentPeriod, EnrollmentPayment, AttendanceSession, AttendanceRecord, LearningMilestone, StudentProgress, LearningMaterial, Certificate, StudentCertificate } from '@/src/shared/types';
import { http } from '@/src/shared/api/http';

const BASE = '/academic';

type ListResponse<T> = T[] | { results: T[] };

function unwrapList<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.results;
}

export type AcademicProgramPayload = {
  name: string;
  slug: string;
  description?: string;
  supports_group: boolean;
  supports_individual: boolean;
};

export type AcademicSubProgramPayload = {
  program: string;
  name: string;
  slug: string;
  description?: string;
  duration?: number | null;
  duration_unit?: string | null;
  fee: string;
};

export async function fetchStudentsApi(): Promise<StudentProfile[]> {
  try { return await http.get<StudentProfile[]>(`${BASE}/students/`); }
  catch { return []; }
}

export async function fetchProgramsApi(): Promise<Program[]> {
  try { return unwrapList(await http.get<ListResponse<Program>>(`${BASE}/programs/`)); }
  catch { return []; }
}

export async function fetchSubProgramsApi(programId?: string): Promise<SubProgram[]> {
  try { return unwrapList(await http.get<ListResponse<SubProgram>>(`${BASE}/sub-programs/` + (programId ? `?program=${programId}` : ''))); }
  catch { return []; }
}

export async function fetchClassesApi(subProgramId?: string): Promise<AcademicClass[]> {
  try { return await http.get<AcademicClass[]>(`${BASE}/classes/` + (subProgramId ? `?sub_program=${subProgramId}` : '')); }
  catch { return []; }
}

export async function fetchEnrollmentsApi(studentId?: string): Promise<Enrollment[]> {
  try { return await http.get<Enrollment[]>(`${BASE}/enrollments/` + (studentId ? `?student=${studentId}` : '')); }
  catch { return []; }
}

export async function fetchEnrollmentPeriodsApi(): Promise<EnrollmentPeriod[]> {
  try { return await http.get<EnrollmentPeriod[]>(`${BASE}/enrollment-periods/`); }
  catch { return []; }
}

export async function fetchEnrollmentPaymentsApi(enrollmentId: string): Promise<EnrollmentPayment | null> {
  try { return await http.get<EnrollmentPayment>(`${BASE}/enrollment-payments/${enrollmentId}/`); }
  catch { return null; }
}

export async function fetchAttendanceSessionsApi(classId: string): Promise<AttendanceSession[]> {
  try { return await http.get<AttendanceSession[]>(`${BASE}/attendance-sessions/?class=${classId}`); }
  catch { return []; }
}

export async function fetchAttendanceRecordsApi(sessionId: string): Promise<AttendanceRecord[]> {
  try { return await http.get<AttendanceRecord[]>(`${BASE}/attendance-records/?session=${sessionId}`); }
  catch { return []; }
}

export async function fetchMilestonesApi(subProgramId: string): Promise<LearningMilestone[]> {
  try { return await http.get<LearningMilestone[]>(`${BASE}/milestones/?sub_program=${subProgramId}`); }
  catch { return []; }
}

export async function fetchStudentProgressApi(enrollmentId: string): Promise<StudentProgress[]> {
  try { return await http.get<StudentProgress[]>(`${BASE}/student-progress/?enrollment=${enrollmentId}`); }
  catch { return []; }
}

export async function fetchLearningMaterialsApi(subProgramId: string): Promise<LearningMaterial[]> {
  try { return await http.get<LearningMaterial[]>(`${BASE}/learning-materials/?sub_program=${subProgramId}`); }
  catch { return []; }
}

export async function fetchCertificateTemplatesApi(): Promise<Certificate[]> {
  try { return await http.get<Certificate[]>(`${BASE}/certificates/`); }
  catch { return []; }
}

export async function fetchStudentCertificatesApi(studentId: string): Promise<StudentCertificate[]> {
  try { return await http.get<StudentCertificate[]>(`${BASE}/student-certificates/?student=${studentId}`); }
  catch { return []; }
}

export async function createProgramApi(payload: AcademicProgramPayload): Promise<Program> {
  return http.post<Program>(`${BASE}/programs/`, payload);
}

export async function updateProgramApi(id: string, payload: Partial<AcademicProgramPayload>): Promise<Program> {
  return http.patch<Program>(`${BASE}/programs/${id}/`, payload);
}

export async function setProgramActiveApi(id: string, active: boolean): Promise<Program> {
  return http.post<Program>(`${BASE}/programs/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}

export async function createSubProgramApi(payload: AcademicSubProgramPayload): Promise<SubProgram> {
  return http.post<SubProgram>(`${BASE}/sub-programs/`, payload);
}

export async function updateSubProgramApi(id: string, payload: Partial<AcademicSubProgramPayload>): Promise<SubProgram> {
  return http.patch<SubProgram>(`${BASE}/sub-programs/${id}/`, payload);
}

export async function setSubProgramActiveApi(id: string, active: boolean): Promise<SubProgram> {
  return http.post<SubProgram>(`${BASE}/sub-programs/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}
