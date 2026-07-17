import {
  fetchEnrollmentsApi,
  fetchStudentsApi,
  fetchClassesApi,
  fetchAttendanceSessionsApi,
} from '@/domains/learning/academics/api/academicApi';
import { http } from '@/shared/api/http';
import type { AcademicClass, AttendanceSession, Enrollment, StudentProfile } from '@/shared/types';

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

/** Fetch session detail with embedded records + recorded_by. */
async function fetchSessionDetail(sessionId: string): Promise<(AttendanceSession & { records?: any[] }) | null> {
  try {
    return await http.get<AttendanceSession & { records?: any[] }>(
      `/academic/attendance/sessions/${sessionId}/`,
    );
  } catch {
    return null;
  }
}

async function buildInstructorRoster(
  classId: string,
  currentUserId: string,
): Promise<{ enrollments: Enrollment[]; students: StudentProfile[] }> {
  const sessions = await fetchAttendanceSessionsApi(classId).catch(() => []);

  const enrollmentMap = new Map<string, { enrollment: Enrollment; studentName: string }>();
  const chunkSize = 3;

  for (let i = 0; i < sessions.length; i += chunkSize) {
    const chunk = sessions.slice(i, i + chunkSize);
    const details = await Promise.all(chunk.map(s => fetchSessionDetail(s.id)));

    for (const detail of details) {
      if (!detail) continue;
      if (detail.recorded_by !== currentUserId) continue;

      const records = Array.isArray(detail.records) ? detail.records : [];
      for (const record of records) {
        const enrollmentId = record.enrollment_id || record.enrollment;
        if (!enrollmentId || enrollmentMap.has(enrollmentId)) continue;

        const studentName = record.student_name || 'Student';
        enrollmentMap.set(enrollmentId, {
          enrollment: {
            id: enrollmentId,
            student: `_synth_${enrollmentId}`,
            enrolled_class: classId,
            class_name: detail.class_name || '',
            student_name: studentName,
            status: 'ACTIVE',
            enrolled_at: detail.session_date,
            created_at: detail.session_date,
            updated_at: detail.session_date,
          } as Enrollment,
          studentName,
        });
      }
    }

    if (enrollmentMap.size > 0) break;
  }

  const entries = Array.from(enrollmentMap.values());
  const enrollments = entries.map(e => e.enrollment);
  const students = entries.map(({ enrollment, studentName }) => {
    const parts = studentName.split(' ');
    return {
      id: enrollment.student,
      first_name: parts[0] || studentName,
      last_name: parts.slice(1).join(' ') || '',
      email: '',
      is_active: true,
    } as StudentProfile;
  });

  return { enrollments, students };
}

async function discoverInstructorClasses(): Promise<TeacherClassOption[]> {
  const sessions = await fetchAttendanceSessionsApi().catch(() => []);
  const map = new Map<string, string>();
  sessions.forEach(s => {
    if (s.enrolled_class) map.set(s.enrolled_class, s.class_name || 'Class');
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

export async function loadTeacherDashboardData(
  role?: string,
  currentUserId?: string,
): Promise<TeacherDashboardData> {
  const isAdminOrStaff = role === 'Admin' || role === 'Manager' || role === 'Secretary';

  if (isAdminOrStaff) {
    const [enrollments, students, classesRaw] = await Promise.all([
      fetchEnrollmentsApi().catch(() => [] as Enrollment[]),
      fetchStudentsApi().catch(() => [] as StudentProfile[]),
      fetchClassesApi().catch(() => [] as AcademicClass[]),
    ]);

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

  let selectedClassId = '';
  let roster = { enrollments: [] as Enrollment[], students: [] as StudentProfile[] };
  for (const c of classes) {
    const r = await buildInstructorRoster(c.id, currentUserId || '').catch(
      () => ({ enrollments: [] as Enrollment[], students: [] as StudentProfile[] }),
    );
    if (r.enrollments.length > 0) {
      selectedClassId = c.id;
      roster = r;
      break;
    }
  }

  return {
    mode: 'instructor',
    enrollments: roster.enrollments,
    students: roster.students,
    classes,
    selectedClassId,
  };
}

export async function loadClassRoster(
  mode: 'staff' | 'instructor',
  classId: string,
  allEnrollments: Enrollment[],
  allStudents: StudentProfile[],
  currentUserId?: string,
): Promise<{ enrollments: Enrollment[]; students: StudentProfile[] }> {
  if (!classId) return { enrollments: [], students: [] };

  if (mode === 'staff') {
    const filtered = allEnrollments.filter(
      e => e.enrolled_class === classId && e.status === 'ACTIVE',
    );
    const studentIds = new Set(filtered.map(e => e.student));
    return {
      enrollments: filtered,
      students: allStudents.filter(s => studentIds.has(s.id)),
    };
  }

  return buildInstructorRoster(classId, currentUserId || '');
}
