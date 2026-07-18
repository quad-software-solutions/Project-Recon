import type { StudentProfile, Program, SubProgram, AcademicClass, Enrollment, EnrollmentPeriod, EnrollmentPayment, AttendanceSession, AttendanceRecord, LearningMilestone, StudentProgress, LearningMaterial, Certificate, StudentCertificate } from '@/shared/types';
import { http } from '@/shared/api/http';

const BASE = '/academic';

type ListResponse<T> = T[] | { results: T[] };
export interface PaginatedListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
type QueryValue = string | number | boolean | null | undefined;

function unwrapList<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.results;
}

function queryString(params: { [key: string]: QueryValue } = {}): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export type AcademicProgramPayload = {
  name: string;
  slug: string;
  description?: string;
  image?: string | File | null;
  supports_group: boolean;
  supports_individual: boolean;
};

export type AcademicSubProgramPayload = {
  program: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | File | null;
  duration?: number | null;
  duration_unit?: string | null;
  group_fee: string;
  individual_fee?: string;
};

export type OnlineEnrollmentPayload = {
  sub_program: string;
  class_type: 'GROUP' | 'INDIVIDUAL';
  branch: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone_number?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  payment_method: string;
  transaction_reference?: string;
  transfer_reference?: string;
  bank_name?: string;
  attachment?: File | null;
};

export type RecordPaymentPayload = {
  enrollment: string;
  amount: string;
  payment_method: string;
  payment_date?: string;
  transaction_reference?: string;
  bank_name?: string;
  transfer_reference?: string;
  verification_notes?: string;
};

export type RejectPaymentPayload = {
  rejection_reason: string;
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

export type AcademicClassPayload = {
  sub_program: string;
  branch: string;
  instructor?: string | null;
  name: string;
  class_type: string;
  class_period?: string | null;
  capacity?: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type EnrollmentPeriodPayload = {
  branch: string;
  program: string;
  sub_program: string;
  class_type: string;
  class_period?: string | null;
  title: string;
  start_date: string;
  end_date: string;
};

export type LearningMilestonePayload = {
  sub_program: string;
  title: string;
  description?: string;
  scope_class?: string | null;
};

export type LearningMaterialPayload = {
  sub_program: string;
  title: string;
  description?: string;
  file_url?: string;
  material_type: string;
};

export type CertificateTemplatePayload = {
  sub_program: string;
  title: string;
  background?: File | null;
  institute_logo?: File | null;
  signature?: File | null;
  body_text: string;
  signatory_name?: string;
  signatory_title?: string;
};

const SIGNATORY_SEP = '\n\n---SIGNATORY---\n';

function encodeBodyWithSignatory(body: string, name?: string, title?: string): string {
  if (!name && !title) return body;
  return `${body}${SIGNATORY_SEP}${name || ''}\n${title || ''}`;
}

export function decodeBodyWithSignatory(body: string): { body: string; signatory_name: string; signatory_title: string } {
  const idx = body.indexOf(SIGNATORY_SEP);
  if (idx === -1) return { body, signatory_name: '', signatory_title: '' };
  const main = body.slice(0, idx);
  const parts = body.slice(idx + SIGNATORY_SEP.length).split('\n');
  return { body: main, signatory_name: parts[0] || '', signatory_title: parts[1] || '' };
}

export type StaffAttendanceRecordPayload = {
  staff_member: string;
  status: string;
  notes?: string;
};

// ─── Programs ───
export async function fetchProgramsApi(): Promise<Program[]> {
  return unwrapList(await http.get<ListResponse<Program>>(`${BASE}/programs/`));
}

export async function fetchSubProgramsApi(programId?: string): Promise<SubProgram[]> {
  // Backend SearchFilter only matches name/slug — filter by program FK from the response.
  const rows = unwrapList(await http.get<ListResponse<SubProgram>>(`${BASE}/sub-programs/`));
  if (!programId) return rows;
  return rows.filter((s) => s.program === programId);
}

function toProgramFormData(payload: Partial<AcademicProgramPayload>): FormData | typeof payload {
  if (!(payload.image instanceof File)) return payload;
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'image') { fd.append('image', v as File); }
    else if (v !== undefined) { fd.append(k, String(v)); }
  }
  return fd;
}

export async function createProgramApi(payload: AcademicProgramPayload): Promise<Program> {
  return http.post<Program>(`${BASE}/programs/`, toProgramFormData(payload));
}

export async function updateProgramApi(id: string, payload: Partial<AcademicProgramPayload>): Promise<Program> {
  return http.patch<Program>(`${BASE}/programs/${id}/`, toProgramFormData(payload));
}

export async function setProgramActiveApi(id: string, active: boolean): Promise<Program> {
  return http.post<Program>(`${BASE}/programs/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}

function toSubProgramFormData(payload: Partial<AcademicSubProgramPayload>): FormData | typeof payload {
  if (!(payload.image instanceof File)) return payload;
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'image') { fd.append('image', v as File); }
    else if (v !== undefined) { fd.append(k, String(v)); }
  }
  return fd;
}

export async function createSubProgramApi(payload: AcademicSubProgramPayload): Promise<SubProgram> {
  return http.post<SubProgram>(`${BASE}/sub-programs/`, toSubProgramFormData(payload));
}

export async function updateSubProgramApi(id: string, payload: Partial<AcademicSubProgramPayload>): Promise<SubProgram> {
  return http.patch<SubProgram>(`${BASE}/sub-programs/${id}/`, toSubProgramFormData(payload));
}

export async function setSubProgramActiveApi(id: string, active: boolean): Promise<SubProgram> {
  return http.post<SubProgram>(`${BASE}/sub-programs/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}

// ─── Classes ───
export async function fetchClassesApi(subProgramId?: string): Promise<AcademicClass[]> {
  return unwrapList(await http.get<ListResponse<AcademicClass>>(`${BASE}/classes/${queryString({ sub_program: subProgramId })}`));
}

export async function createClassApi(payload: AcademicClassPayload): Promise<AcademicClass> {
  return http.post<AcademicClass>(`${BASE}/classes/`, payload);
}

export async function updateClassApi(id: string, payload: Partial<AcademicClassPayload>): Promise<AcademicClass> {
  return http.patch<AcademicClass>(`${BASE}/classes/${id}/`, payload);
}

export async function assignClassInstructorApi(classId: string, instructorId: string): Promise<{ detail: string }> {
  return http.post<{ detail: string }>(`${BASE}/classes/${classId}/assign-instructor/`, { instructor: instructorId });
}

export async function setClassActiveApi(id: string, active: boolean): Promise<AcademicClass> {
  return http.post<AcademicClass>(`${BASE}/classes/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}

// ─── Enrollment Periods ───
export async function fetchEnrollmentPeriodsApi(): Promise<EnrollmentPeriod[]> {
  return unwrapList(await http.get<ListResponse<EnrollmentPeriod>>(`${BASE}/enrollment-periods/`));
}

export async function createEnrollmentPeriodApi(payload: EnrollmentPeriodPayload): Promise<EnrollmentPeriod> {
  return http.post<EnrollmentPeriod>(`${BASE}/enrollment-periods/`, payload);
}

export async function updateEnrollmentPeriodApi(id: string, payload: Partial<EnrollmentPeriodPayload>): Promise<EnrollmentPeriod> {
  return http.patch<EnrollmentPeriod>(`${BASE}/enrollment-periods/${id}/`, payload);
}

export async function setEnrollmentPeriodActiveApi(id: string, active: boolean): Promise<EnrollmentPeriod> {
  return http.post<EnrollmentPeriod>(`${BASE}/enrollment-periods/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}

// ─── Enrollments ───
// ponytail: backend ignores ?student= query param, so we fetch branch-scoped
// and filter client-side. Fine for 1-3 enrollments per student.
export async function fetchEnrollmentsApi(studentId?: string): Promise<Enrollment[]> {
  const all = unwrapList(await http.get<ListResponse<Enrollment>>(`${BASE}/enrollments/`));
  if (!studentId) return all;
  return all.filter((e) => e.student === studentId);
}

export async function fetchEnrollmentsPaginatedApi(
  page = 1,
  pageSize = 20,
  params?: { search?: string; ordering?: string },
): Promise<PaginatedListResponse<Enrollment>> {
  return http.get<PaginatedListResponse<Enrollment>>(`${BASE}/enrollments/${queryString({
    page: String(page),
    page_size: String(pageSize),
    search: params?.search,
    ordering: params?.ordering,
  })}`);
}

export async function enrollStudentApi(payload: StaffEnrollmentPayload): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/`, payload);
}

function toOnlineEnrollmentBody(payload: OnlineEnrollmentPayload): FormData | Record<string, string> {
  const entries: [string, string | File][] = [];
  const append = (key: string, value: string | File | null | undefined) => {
    if (value === undefined || value === null || value === '') return;
    entries.push([key, value]);
  };

  append('sub_program', payload.sub_program);
  append('class_type', payload.class_type);
  append('branch', payload.branch);
  append('email', payload.email);
  append('first_name', payload.first_name);
  append('last_name', payload.last_name);
  append('password', payload.password);
  append('phone_number', payload.phone_number);
  append('guardian_name', payload.guardian_name);
  append('guardian_phone', payload.guardian_phone);
  append('guardian_email', payload.guardian_email);
  append('payment_method', payload.payment_method);
  append('transaction_reference', payload.transaction_reference);
  append('transfer_reference', payload.transfer_reference);
  append('bank_name', payload.bank_name);

  if (payload.attachment instanceof File) {
    const fd = new FormData();
    for (const [key, value] of entries) fd.append(key, value);
    fd.append('attachment', payload.attachment);
    return fd;
  }

  return Object.fromEntries(entries.map(([k, v]) => [k, String(v)]));
}

/** Public online enrollment — backend returns the Enrollment serializer payload (HTTP 201). */
export async function onlineEnrollApi(payload: OnlineEnrollmentPayload): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/online/`, toOnlineEnrollmentBody(payload));
}

export async function cancelEnrollmentApi(id: string): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/${id}/cancel/`, {});
}

export async function completeEnrollmentApi(id: string): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/${id}/complete/`, {});
}

// ─── Students ───
export async function fetchStudentsApi(): Promise<StudentProfile[]> {
  return unwrapList(await http.get<ListResponse<StudentProfile>>(`${BASE}/students/`));
}

export async function searchStudentsApi(query: string): Promise<StudentProfile[]> {
  return unwrapList(await http.get<ListResponse<StudentProfile>>(`${BASE}/students/search/${queryString({ q: query })}`));
}

export async function admitStudentApi(payload: AdmitStudentPayload): Promise<StudentProfile> {
  return http.post<StudentProfile>(`${BASE}/admissions/`, payload);
}

export async function updateStudentApi(id: string, payload: Partial<AdmitStudentPayload & { is_active: boolean }>): Promise<StudentProfile> {
  return http.patch<StudentProfile>(`${BASE}/students/${id}/`, payload);
}

export async function setStudentActiveApi(id: string, active: boolean): Promise<StudentProfile> {
  return http.post<StudentProfile>(`${BASE}/students/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}



// ─── Payments ───
export async function recordPaymentApi(payload: RecordPaymentPayload): Promise<EnrollmentPayment> {
  return http.post<EnrollmentPayment>(`${BASE}/payments/`, payload);
}

export async function fetchPaymentsListApi(): Promise<EnrollmentPayment[]> {
  return unwrapList(await http.get<ListResponse<EnrollmentPayment>>(`${BASE}/payments/list/`));
}

/** @deprecated Use fetchPaymentsListApi */
export const fetchPaymentsApi = fetchPaymentsListApi;

export async function fetchVerificationQueueApi(): Promise<EnrollmentPayment[]> {
  return unwrapList(await http.get<ListResponse<EnrollmentPayment>>(`${BASE}/payments/verification-queue/`));
}

export async function setUnderReviewApi(pk: string): Promise<{ status: string }> {
  return http.post<{ status: string }>(`${BASE}/payments/${pk}/under-review/`, {});
}

export async function rejectPaymentApi(pk: string, payload: RejectPaymentPayload): Promise<{ status: string }> {
  return http.post<{ status: string }>(`${BASE}/payments/${pk}/reject/`, payload);
}

// ─── Attendance ───
export async function fetchAttendanceSessionsApi(classId?: string): Promise<AttendanceSession[]> {
  return unwrapList(await http.get<ListResponse<AttendanceSession>>(`${BASE}/attendance/sessions/${queryString({ enrolled_class: classId })}`));
}



export async function createAttendanceSessionApi(payload: { enrolled_class: string; session_date: string; topic?: string }): Promise<AttendanceSession> {
  return http.post<AttendanceSession>(`${BASE}/attendance/sessions/`, payload);
}

/** Backend expects a JSON array of records, not `{ records: [...] }`. */
export async function recordBulkAttendanceApi(sessionId: string, records: { enrollment: string; status: string; remarks?: string }[]): Promise<any> {
  return http.post(`${BASE}/attendance/sessions/${sessionId}/records/`, records);
}



export async function fetchEnrollmentAttendanceSummaryApi(enrollmentId: string): Promise<Record<string, unknown>> {
  return http.get<Record<string, unknown>>(`${BASE}/attendance/enrollments/${enrollmentId}/summary/`);
}

// ─── Staff Attendance (backend field: `date`, not `session_date`) ───

export async function fetchAvailableStaffApi(params?: { branch?: string; role?: string }): Promise<any[]> {
  return unwrapList(await http.get<ListResponse<any>>(`${BASE}/staff-attendance/sessions/available-staff/${queryString(params)}`));
}

function mapStaffSessionFromApi(row: Record<string, unknown>) {
  return {
    ...row,
    session_date: row.date ?? row.session_date,
  };
}

export async function fetchStaffAttendanceSessionsApi(params?: {
  branch?: string;
  session_date?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}): Promise<any[]> {
  const query: Record<string, string> = {};
  if (params?.branch) query.branch = params.branch;
  if (params?.status) query.status = params.status;
  if (params?.date_from) query.date_from = params.date_from;
  if (params?.date_to) query.date_to = params.date_to;
  if (params?.session_date) {
    query.date_from = params.session_date;
    query.date_to = params.session_date;
  }
  const rows = unwrapList(await http.get<ListResponse<any>>(`${BASE}/staff-attendance/sessions/${queryString(query)}`));
  return rows.map(r => mapStaffSessionFromApi(r as Record<string, unknown>));
}

export async function createStaffAttendanceSessionApi(payload: {
  branch: string;
  session_date: string;
  notes?: string;
}): Promise<any> {
  const res = await http.post(`${BASE}/staff-attendance/sessions/`, {
    branch: payload.branch,
    date: payload.session_date,
    notes: payload.notes,
  });
  return mapStaffSessionFromApi(res as Record<string, unknown>);
}

export async function updateStaffAttendanceSessionApi(
  id: string,
  payload: Partial<{ branch: string; session_date: string; notes: string }>,
): Promise<any> {
  const body: Record<string, string> = {};
  if (payload.branch) body.branch = payload.branch;
  if (payload.session_date) body.date = payload.session_date;
  if (payload.notes !== undefined) body.notes = payload.notes;
  const res = await http.patch(`${BASE}/staff-attendance/sessions/${id}/`, body);
  return mapStaffSessionFromApi(res as Record<string, unknown>);
}

/**
 * Include `branch` in body for Branch Managers — permission mixin needs it on POST.
 * Super Admins work with `{}` as well.
 */
export async function publishStaffAttendanceSessionApi(id: string, branch?: string): Promise<any> {
  return http.post(`${BASE}/staff-attendance/sessions/${id}/publish/`, branch ? { branch } : {});
}

export async function fetchStaffAttendanceSessionApi(id: string, branch?: string): Promise<any> {
  const q = branch ? queryString({ branch }) : '';
  const res = await http.get(`${BASE}/staff-attendance/sessions/${id}/${q}`);
  return mapStaffSessionFromApi(res as Record<string, unknown>);
}

/**
 * SA can POST an array. BM permission check fails on array bodies — send one object
 * at a time with `branch` so get_branch_id resolves without crashing.
 */
export async function upsertStaffAttendanceRecordsApi(
  sessionId: string,
  records: StaffAttendanceRecordPayload[],
  branch?: string,
): Promise<any> {
  if (!branch) {
    return http.post(`${BASE}/staff-attendance/sessions/${sessionId}/records/`, records);
  }
  const results = [];
  for (const record of records) {
    const row = await http.post(`${BASE}/staff-attendance/sessions/${sessionId}/records/`, {
      ...record,
      branch,
    });
    results.push(row);
  }
  return results.flat();
}



// ─── Milestones & Progress ───
export async function fetchMilestonesApi(subProgramId?: string, scopeClass?: string): Promise<LearningMilestone[]> {
  return unwrapList(await http.get<ListResponse<LearningMilestone>>(`${BASE}/learning-milestones/${queryString({ sub_program: subProgramId, scope_class: scopeClass })}`));
}

export async function createMilestoneApi(payload: LearningMilestonePayload): Promise<LearningMilestone> {
  return http.post<LearningMilestone>(`${BASE}/learning-milestones/`, payload);
}

export async function updateMilestoneApi(id: string, payload: Partial<LearningMilestonePayload>): Promise<LearningMilestone> {
  return http.patch<LearningMilestone>(`${BASE}/learning-milestones/${id}/`, payload);
}

export async function archiveMilestoneApi(id: string): Promise<LearningMilestone> {
  return http.post<LearningMilestone>(`${BASE}/learning-milestones/${id}/archive/`, {});
}



export async function fetchStudentProgressApi(enrollmentId: string): Promise<StudentProgress[]> {
  return unwrapList(await http.get<ListResponse<StudentProgress>>(`${BASE}/student-progress/enrollments/${enrollmentId}/history/`));
}

export async function fetchStudentProgressSummaryApi(enrollmentId: string): Promise<Record<string, unknown>> {
  return http.get<Record<string, unknown>>(`${BASE}/student-progress/enrollments/${enrollmentId}/summary/`);
}



export async function updateStudentProgressApi(id: string, payload: { status: string; remarks?: string }): Promise<StudentProgress> {
  return http.patch<StudentProgress>(`${BASE}/student-progress/${id}/`, payload);
}

export async function recordStudentProgressApi(payload: { enrollment: string; milestone: string; status: string; remarks?: string }): Promise<StudentProgress> {
  return http.post<StudentProgress>(`${BASE}/student-progress/`, payload);
}

// ─── Learning Materials ───
export async function fetchLearningMaterialsApi(subProgramId?: string): Promise<LearningMaterial[]> {
  return unwrapList(await http.get<ListResponse<LearningMaterial>>(`${BASE}/learning-materials/${queryString({ sub_program: subProgramId })}`));
}

export async function createLearningMaterialApi(payload: LearningMaterialPayload): Promise<LearningMaterial> {
  return http.post<LearningMaterial>(`${BASE}/learning-materials/`, payload);
}

export async function updateLearningMaterialApi(id: string, payload: Partial<LearningMaterialPayload>): Promise<LearningMaterial> {
  return http.patch<LearningMaterial>(`${BASE}/learning-materials/${id}/`, payload);
}

export async function deleteLearningMaterialApi(id: string): Promise<void> {
  await http.post(`${BASE}/learning-materials/${id}/delete/`, {});
}

export function downloadLearningMaterialApi(id: string) {
  return downloadFile(`${BASE}/learning-materials/${id}/download/`, `learning-material-${id}`);
}

// ─── Certificates ───
export async function fetchCertificateTemplatesApi(): Promise<Certificate[]> {
  return unwrapList(await http.get<ListResponse<Certificate>>(`${BASE}/certificate-templates/`));
}

function toCertificateFormData(payload: Partial<CertificateTemplatePayload>): FormData {
  const fd = new FormData();
  if (payload.sub_program) fd.append('sub_program', payload.sub_program);
  if (payload.title) fd.append('title', payload.title);
  if (payload.background instanceof File) fd.append('background', payload.background);
  if (payload.institute_logo instanceof File) fd.append('institute_logo', payload.institute_logo);
  if (payload.signature instanceof File) fd.append('signature', payload.signature);
  if (payload.body_text !== undefined) {
    fd.append('body_text', encodeBodyWithSignatory(payload.body_text, payload.signatory_name, payload.signatory_title));
  }
  return fd;
}

export async function createCertificateTemplateApi(payload: CertificateTemplatePayload): Promise<Certificate> {
  return http.post<Certificate>(`${BASE}/certificate-templates/`, toCertificateFormData(payload));
}

export async function updateCertificateTemplateApi(id: string, payload: Partial<CertificateTemplatePayload>): Promise<Certificate> {
  return http.patch<Certificate>(`${BASE}/certificate-templates/${id}/`, toCertificateFormData(payload));
}

export async function setCertificateTemplateActiveApi(id: string, active: boolean): Promise<Certificate> {
  return http.post<Certificate>(`${BASE}/certificate-templates/${id}/${active ? 'activate' : 'deactivate'}/`, {});
}

export async function fetchStudentCertificatesApi(studentId?: string): Promise<StudentCertificate[]> {
  return unwrapList(await http.get<ListResponse<StudentCertificate>>(`${BASE}/student-certificates/${queryString({ student: studentId })}`));
}

export async function fetchStudentCertificateApi(id: string): Promise<StudentCertificate> {
  return http.get<StudentCertificate>(`${BASE}/student-certificates/${id}/`);
}

export async function issueStudentCertificateApi(payload: IssueCertificatePayload): Promise<StudentCertificate> {
  return http.post<StudentCertificate>(`${BASE}/student-certificates/issue/`, payload);
}

export async function verifyCertificateApi(number: string): Promise<Record<string, unknown>> {
  return http.get<Record<string, unknown>>(`${BASE}/certificates/verify/${number}/`);
}



// ─── Reports (PDF download) ───

async function downloadFile(endpoint: string, filename: string) {
  const blob = await http.downloadBlob(endpoint);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadPdf(endpoint: string, filename: string) {
  return downloadFile(endpoint, filename);
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

export type BankAccount = {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch?: string;
  swift_code?: string;
  iban?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export async function fetchBankAccountsApi(): Promise<BankAccount[]> {
  return http.get<BankAccount[]>('/bank-accounts/');
}

export async function createBankAccountApi(data: Partial<BankAccount>): Promise<BankAccount> {
  return http.post<BankAccount>('/bank-accounts/', data);
}

export async function updateBankAccountApi(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
  return http.put<BankAccount>(`/bank-accounts/${id}/`, data);
}

export async function deleteBankAccountApi(id: string): Promise<void> {
  return http.delete(`/bank-accounts/${id}/`);
}

// ---- Branch Transfer ----

export type BranchTransferRequest = {
  id: string;
  enrollment: string;
  from_branch: string;
  to_branch: string;
  target_class: string;
  requested_by: string;
  approved_by?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
};

export type Branch = {
  id: string;
  name: string;
  code?: string;
  city?: string;
};

export async function fetchAvailableBranchesApi(subProgramId: string, classType: string): Promise<Branch[]> {
  return http.get<Branch[]>(`${BASE}/enrollments/available-branches/${queryString({ sub_program: subProgramId, class_type: classType })}`);
}

export async function fetchBranchesApi(): Promise<Branch[]> {
  return http.get<Branch[]>('/accounts/branches/');
}

export async function requestTransferApi(data: { enrollment: string; target_class: string; to_branch: string }): Promise<BranchTransferRequest> {
  return http.post<BranchTransferRequest>(`${BASE}/transfers/request/`, data);
}

export async function listTransferRequestsApi(): Promise<BranchTransferRequest[]> {
  return http.get<BranchTransferRequest[]>(`${BASE}/transfers/`);
}

export async function approveTransferApi(id: string): Promise<BranchTransferRequest> {
  return http.post<BranchTransferRequest>(`${BASE}/transfers/${id}/approve/`, {});
}

export async function rejectTransferApi(id: string, rejection_reason: string): Promise<BranchTransferRequest> {
  return http.post<BranchTransferRequest>(`${BASE}/transfers/${id}/reject/`, { rejection_reason });
}

export async function moveEnrollmentApi(
  enrollmentId: string,
  payload: { target_class: string },
): Promise<Enrollment> {
  return http.post<Enrollment>(`${BASE}/enrollments/${enrollmentId}/move/`, payload);
}

export async function splitClassApi(
  classId: string,
  payload: { target_class: string; enrollment_ids?: string[] },
): Promise<{ detail?: string }> {
  return http.post(`${BASE}/classes/${classId}/split/`, payload);
}

export async function switchSubProgramApi(
  enrollmentId: string,
  payload: { target_class: string },
): Promise<{ old_enrollment: Enrollment; new_enrollment: Enrollment; amount_due?: string | number }> {
  return http.post(`${BASE}/enrollments/${enrollmentId}/switch-subprogram/`, payload);
}
