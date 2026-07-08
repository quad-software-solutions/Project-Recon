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

export type OnlineEnrollmentPayload = {
  enrolled_class: string;
  callback_url?: string;
  return_url?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  phone_number?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
};

export type CashPaymentPayload = {
  enrollment: string;
  amount: string;
  payment_date?: string;
};

// ─── Programs ───
export async function fetchProgramsApi(): Promise<Program[]> {
  try { return unwrapList(await http.get<ListResponse<Program>>(`${BASE}/programs/`)); }
  catch { return []; }
}

export async function fetchSubProgramsApi(programId?: string): Promise<SubProgram[]> {
  try { return unwrapList(await http.get<ListResponse<SubProgram>>(`${BASE}/sub-programs/` + (programId ? `?program=${programId}` : ''))); }
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

// ─── Classes ───
export async function fetchClassesApi(subProgramId?: string): Promise<AcademicClass[]> {
  try { return unwrapList(await http.get<ListResponse<AcademicClass>>(`${BASE}/classes/` + (subProgramId ? `?sub_program=${subProgramId}` : ''))); }
  catch { return []; }
}

// ─── Enrollment Periods ───
export async function fetchEnrollmentPeriodsApi(): Promise<EnrollmentPeriod[]> {
  try { return unwrapList(await http.get<ListResponse<EnrollmentPeriod>>(`${BASE}/enrollment-periods/`)); }
  catch { return []; }
}

// ─── Enrollments ───
export async function fetchEnrollmentsApi(studentId?: string): Promise<Enrollment[]> {
  try { return unwrapList(await http.get<ListResponse<Enrollment>>(`${BASE}/enrollments/` + (studentId ? `?student=${studentId}` : ''))); }
  catch { return []; }
}

export async function onlineEnrollApi(payload: OnlineEnrollmentPayload): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/online/`, payload);
}

export async function cancelEnrollmentApi(id: string): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/${id}/cancel/`, {});
}

export async function completeEnrollmentApi(id: string): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/${id}/complete/`, {});
}

// ─── Students ───
export async function fetchStudentsApi(): Promise<StudentProfile[]> {
  try { return unwrapList(await http.get<ListResponse<StudentProfile>>(`${BASE}/students/search/?q=`)); }
  catch { return []; }
}

// ─── Payments ───
export async function createCashPaymentApi(payload: CashPaymentPayload): Promise<EnrollmentPayment> {
  return http.post<EnrollmentPayment>(`${BASE}/payments/cash/`, payload);
}

export async function fetchPaymentsApi(): Promise<EnrollmentPayment[]> {
  try { return unwrapList(await http.get<ListResponse<EnrollmentPayment>>(`${BASE}/payments/`)); }
  catch { return []; }
}

// ─── Attendance ───
export async function fetchAttendanceSessionsApi(classId: string): Promise<AttendanceSession[]> {
  try { return unwrapList(await http.get<ListResponse<AttendanceSession>>(`${BASE}/attendance/sessions/?enrolled_class=${classId}`)); }
  catch { return []; }
}

export async function fetchAttendanceRecordsApi(sessionId: string): Promise<AttendanceRecord[]> {
  try { return unwrapList(await http.get<ListResponse<AttendanceRecord>>(`${BASE}/attendance/sessions/${sessionId}/`)); }
  catch { return []; }
}

// ─── Milestones & Progress ───
export async function fetchMilestonesApi(subProgramId: string): Promise<LearningMilestone[]> {
  try { return unwrapList(await http.get<ListResponse<LearningMilestone>>(`${BASE}/learning-milestones/?sub_program=${subProgramId}`)); }
  catch { return []; }
}

export async function fetchStudentProgressApi(enrollmentId: string): Promise<StudentProgress[]> {
  try { return unwrapList(await http.get<ListResponse<StudentProgress>>(`${BASE}/student-progress/enrollments/${enrollmentId}/history/`)); }
  catch { return []; }
}

// ─── Learning Materials ───
export async function fetchLearningMaterialsApi(subProgramId: string): Promise<LearningMaterial[]> {
  try { return unwrapList(await http.get<ListResponse<LearningMaterial>>(`${BASE}/learning-materials/?sub_program=${subProgramId}`)); }
  catch { return []; }
}

// ─── Certificates ───
export async function fetchCertificateTemplatesApi(): Promise<Certificate[]> {
  try { return unwrapList(await http.get<ListResponse<Certificate>>(`${BASE}/certificate-templates/`)); }
  catch { return []; }
}

export async function fetchStudentCertificatesApi(studentId: string): Promise<StudentCertificate[]> {
  try { return unwrapList(await http.get<ListResponse<StudentCertificate>>(`${BASE}/student-certificates/?student=${studentId}`)); }
  catch { return []; }
}
