import {
  fetchEnrollmentsApi,
  fetchStudentsApi,
  fetchClassesApi,
  fetchAttendanceSessionsApi,
  fetchAttendanceRecordsApi,
} from '@/domains/learning/academics/api/academicApi';
import type { AcademicClass, Enrollment, StudentProfile } from '@/shared/types';

export type TeacherClassOption = { id: string; name: string };

export type TeacherDashboardData = {
  mode: 'staff' | 'instructor';
  enrollments: Enrollment[];
  students: StudentProfile[];
  classes: TeacherClassOption[];
  selectedClassId: string;
};

function uniqueClassesFromEnrollments(enrollments: Enrollment[]): TeacherClassOption[] {
  const map = new Map<string, string>();
  enrollments.forEach(e => {
    if (e.enrolled_class) map.set(e.enrolled_class, e.class_name || 'Class');
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

async function buildInstructorRoster(classId: string): Promise<Enrollment[]> {
  const sessions = await fetchAttendanceSessionsApi(classId).catch(() => []);
  const sorted = [...sessions].sort((a, b) =>
    String(b.session_date || '').localeCompare(String(a.session_date || ''))
  );
  const enrollmentMap = new Map<string, Enrollment>();

  for (const session of sorted) {
    try {
      const records = await fetchAttendanceRecordsApi(session.id);
      for (const record of records) {
        const enrollmentId = record.enrollment_id || (record as { enrollment?: string }).enrollment;
        if (!enrollmentId || enrollmentMap.has(enrollmentId)) continue;
        enrollmentMap.set(enrollmentId, {
          id: enrollmentId,
          student: enrollmentId,
          enrolled_class: classId,
          class_name: session.class_name,
          student_name: record.student_name,
          status: 'ACTIVE',
          enrolled_at: session.session_date,
        } as Enrollment);
      }
    } catch {
      /* skip session */
    }
    if (enrollmentMap.size > 0) break;
  }

  return Array.from(enrollmentMap.values());
}

async function discoverInstructorClasses(): Promise<TeacherClassOption[]> {
  const sessions = await fetchAttendanceSessionsApi().catch(() => []);
  const map = new Map<string, string>();
  sessions.forEach(s => {
    if (s.enrolled_class) map.set(s.enrolled_class, s.class_name || 'Class');
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

export async function loadTeacherDashboardData(role?: string): Promise<TeacherDashboardData> {
  const isAdminOrStaff = role === 'Admin' || role === 'Manager' || role === 'Secretary';
  const [enrollments, students, classesRaw] = await Promise.all([
    isAdminOrStaff ? fetchEnrollmentsApi().catch(() => [] as Enrollment[]) : Promise.resolve([] as Enrollment[]),
    isAdminOrStaff ? fetchStudentsApi().catch(() => [] as StudentProfile[]) : Promise.resolve([] as StudentProfile[]),
    isAdminOrStaff ? fetchClassesApi().catch(() => [] as AcademicClass[]) : Promise.resolve([] as AcademicClass[]),
  ]);

  if (classesRaw.length > 0 || enrollments.length > 0) {
    const classes: TeacherClassOption[] = (classesRaw as AcademicClass[]).map(c => ({
      id: c.id,
      name: c.name,
    }));
    const classIds = new Set(classes.map(c => c.id));
    uniqueClassesFromEnrollments(enrollments).forEach(c => {
      if (!classIds.has(c.id)) classes.push(c);
    });
    const selectedClassId =
      enrollments.find(e => e.status === 'ACTIVE')?.enrolled_class ||
      classes[0]?.id ||
      '';

    return {
      mode: 'staff',
      enrollments,
      students,
      classes,
      selectedClassId,
    };
  }

  const classes = await discoverInstructorClasses();
  const selectedClassId = classes[0]?.id || '';
  const rosterEnrollments = selectedClassId
    ? await buildInstructorRoster(selectedClassId).catch(() => [])
    : [];

  return {
    mode: 'instructor',
    enrollments: rosterEnrollments,
    students: rosterEnrollments.map(e => ({
      id: e.student,
      first_name: (e.student_name || '').split(' ')[0] || e.student_name || 'Student',
      last_name: (e.student_name || '').split(' ').slice(1).join(' '),
      email: '',
      is_active: true,
    })) as StudentProfile[],
    classes,
    selectedClassId,
  };
}

export async function loadClassRoster(
  mode: 'staff' | 'instructor',
  classId: string,
  allEnrollments: Enrollment[],
  allStudents: StudentProfile[],
): Promise<{ enrollments: Enrollment[]; students: StudentProfile[] }> {
  if (!classId) return { enrollments: [], students: [] };

  if (mode === 'staff') {
    const enrollments = allEnrollments.filter(
      e => e.enrolled_class === classId && e.status === 'ACTIVE',
    );
    const studentIds = new Set(enrollments.map(e => e.student));
    const students = allStudents.filter(s => studentIds.has(s.id));
    return { enrollments, students };
  }

  const enrollments = await buildInstructorRoster(classId);
  const students = enrollments.map(e => ({
    id: e.student,
    first_name: (e.student_name || '').split(' ')[0] || 'Student',
    last_name: (e.student_name || '').split(' ').slice(1).join(' '),
    email: '',
    is_active: true,
  })) as StudentProfile[];
  return { enrollments, students };
}
