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

export type AdmitStudentPayload = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone_number?: string;
  branch: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
};

export type StaffEnrollmentPayload = {
  student: string;
  enrolled_class: string;
  remarks?: string;
};

export type IssueCertificatePayload = {
  student: string;
  certificate: string;
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

export async function enrollStudentApi(payload: StaffEnrollmentPayload): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/`, payload);
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
  try { return unwrapList(await http.get<ListResponse<StudentProfile>>(`${BASE}/students/`)); }
  catch { return []; }
}

export async function searchStudentsApi(query: string): Promise<StudentProfile[]> {
  try { return unwrapList(await http.get<ListResponse<StudentProfile>>(`${BASE}/students/search/?q=${encodeURIComponent(query)}`)); }
  catch { return []; }
}

export async function createStudentApi(payload: { email: string; first_name: string; last_name: string; password: string; branch: string }): Promise<any> {
  return http.post(`${BASE}/admissions/`, payload);
}

export async function admitStudentApi(payload: AdmitStudentPayload): Promise<StudentProfile> {
  return http.post<StudentProfile>(`${BASE}/admissions/`, payload);
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

export async function createAttendanceSessionApi(payload: { enrolled_class: string; session_date: string; topic?: string }): Promise<AttendanceSession> {
  return http.post<AttendanceSession>(`${BASE}/attendance/sessions/`, payload);
}

export async function recordBulkAttendanceApi(sessionId: string, records: { enrollment: string; status: string; remarks?: string }[]): Promise<any> {
  return http.post(`${BASE}/attendance/sessions/${sessionId}/records/`, { records });
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

export async function updateStudentProgressApi(id: string, payload: { status: string; remarks?: string }): Promise<StudentProgress> {
  return http.patch<StudentProgress>(`${BASE}/student-progress/${id}/`, payload);
}

// ─── Learning Materials ───
export async function fetchLearningMaterialsApi(subProgramId?: string): Promise<LearningMaterial[]> {
  const params = subProgramId ? `?sub_program=${subProgramId}` : '';
  try { return unwrapList(await http.get<ListResponse<LearningMaterial>>(`${BASE}/learning-materials/${params}`)); }
  catch { return []; }
}

// ─── Certificates ───
export async function fetchCertificateTemplatesApi(): Promise<Certificate[]> {
  try { return unwrapList(await http.get<ListResponse<Certificate>>(`${BASE}/certificate-templates/`)); }
  catch { return []; }
}

export async function fetchStudentCertificatesApi(studentId?: string): Promise<StudentCertificate[]> {
  try { return unwrapList(await http.get<ListResponse<StudentCertificate>>(`${BASE}/student-certificates/` + (studentId ? `?student=${studentId}` : ''))); }
  catch { return []; }
}

export async function issueStudentCertificateApi(payload: IssueCertificatePayload): Promise<StudentCertificate> {
  return http.post<StudentCertificate>(`${BASE}/student-certificates/issue/`, payload);
}

// ─── Reports (PDF download) ───
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

async function downloadPdf(endpoint: string, filename: string) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download report');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadStudentReportPdf(studentId: string) {
  return downloadPdf(`${BASE}/reports/students/${studentId}/academic/`, `student-report-${studentId}.pdf`);
}

export function downloadEnrollmentReportPdf(studentId: string) {
  return downloadPdf(`${BASE}/reports/students/${studentId}/enrollments/`, `enrollment-report-${studentId}.pdf`);
}

export function downloadAttendanceReportPdf(studentId: string, enrollmentId?: string) {
  const params = enrollmentId ? `?enrollment_id=${enrollmentId}` : '';
  return downloadPdf(`${BASE}/reports/students/${studentId}/attendance/${params}`, `attendance-report-${studentId}.pdf`);
}

export function downloadProgressReportPdf(studentId: string, enrollmentId?: string) {
  const params = enrollmentId ? `?enrollment_id=${enrollmentId}` : '';
  return downloadPdf(`${BASE}/reports/students/${studentId}/progress/${params}`, `progress-report-${studentId}.pdf`);
}

export function downloadCertificateReportPdf(studentId: string) {
  return downloadPdf(`${BASE}/reports/students/${studentId}/certificates/`, `certificate-report-${studentId}.pdf`);
}

export function downloadClassReportPdf(classId: string) {
  return downloadPdf(`${BASE}/reports/classes/${classId}/`, `class-report-${classId}.pdf`);
}

export function downloadSubProgramReportPdf(subProgramId: string) {
  return downloadPdf(`${BASE}/reports/sub-programs/${subProgramId}/`, `sub-program-report-${subProgramId}.pdf`);
}

export function downloadProgramReportPdf(programId: string) {
  return downloadPdf(`${BASE}/reports/programs/${programId}/`, `program-report-${programId}.pdf`);
}
