import type { StudentProfile, Program, SubProgram, AcademicClass, Enrollment, EnrollmentPeriod, EnrollmentPayment, AttendanceSession, AttendanceRecord, LearningMilestone, StudentProgress, LearningMaterial, Certificate, StudentCertificate } from '@/src/shared/types';
import { http } from '@/src/shared/api/http';

export async function fetchStudentsApi(): Promise<StudentProfile[]> {
  try { return await http.get<StudentProfile[]>('/academics/students/'); }
  catch { return []; }
}

export async function fetchProgramsApi(): Promise<Program[]> {
  try { return await http.get<Program[]>('/academics/programs/'); }
  catch { return []; }
}

export async function fetchSubProgramsApi(programId?: string): Promise<SubProgram[]> {
  try { return await http.get<SubProgram[]>('/academics/sub-programs/' + (programId ? `?program=${programId}` : '')); }
  catch { return []; }
}

export async function fetchClassesApi(subProgramId?: string): Promise<AcademicClass[]> {
  try { return await http.get<AcademicClass[]>('/academics/classes/' + (subProgramId ? `?sub_program=${subProgramId}` : '')); }
  catch { return []; }
}

export async function fetchEnrollmentsApi(studentId?: string): Promise<Enrollment[]> {
  try { return await http.get<Enrollment[]>('/academics/enrollments/' + (studentId ? `?student=${studentId}` : '')); }
  catch { return []; }
}

export async function fetchEnrollmentPeriodsApi(): Promise<EnrollmentPeriod[]> {
  try { return await http.get<EnrollmentPeriod[]>('/academics/enrollment-periods/'); }
  catch { return []; }
}

export async function fetchEnrollmentPaymentsApi(enrollmentId: string): Promise<EnrollmentPayment | null> {
  try { return await http.get<EnrollmentPayment>(`/academics/enrollment-payments/${enrollmentId}/`); }
  catch { return null; }
}

export async function fetchAttendanceSessionsApi(classId: string): Promise<AttendanceSession[]> {
  try { return await http.get<AttendanceSession[]>(`/academics/attendance-sessions/?class=${classId}`); }
  catch { return []; }
}

export async function fetchAttendanceRecordsApi(sessionId: string): Promise<AttendanceRecord[]> {
  try { return await http.get<AttendanceRecord[]>(`/academics/attendance-records/?session=${sessionId}`); }
  catch { return []; }
}

export async function fetchMilestonesApi(subProgramId: string): Promise<LearningMilestone[]> {
  try { return await http.get<LearningMilestone[]>(`/academics/milestones/?sub_program=${subProgramId}`); }
  catch { return []; }
}

export async function fetchStudentProgressApi(enrollmentId: string): Promise<StudentProgress[]> {
  try { return await http.get<StudentProgress[]>(`/academics/student-progress/?enrollment=${enrollmentId}`); }
  catch { return []; }
}

export async function fetchLearningMaterialsApi(subProgramId: string): Promise<LearningMaterial[]> {
  try { return await http.get<LearningMaterial[]>(`/academics/learning-materials/?sub_program=${subProgramId}`); }
  catch { return []; }
}

export async function fetchCertificateTemplatesApi(): Promise<Certificate[]> {
  try { return await http.get<Certificate[]>('/academics/certificates/'); }
  catch { return []; }
}

export async function fetchStudentCertificatesApi(studentId: string): Promise<StudentCertificate[]> {
  try { return await http.get<StudentCertificate[]>(`/academics/student-certificates/?student=${studentId}`); }
  catch { return []; }
}
