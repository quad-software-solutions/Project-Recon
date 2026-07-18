export interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  supports_group: boolean;
  supports_individual: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramDisplay extends Program {
  title: string;
  category: string;
  detailedDescription: string;
  level: string;
  ageGroup: string;
  duration: string;
  syllabus: string[];
  skillsGained: string[];
  image: string;
}

export interface Certificate {
  id: string;
  sub_program: string;
  sub_program_name?: string;
  title: string;
  background_url?: string | null;
  institute_logo_url?: string | null;
  signature_url?: string | null;
  body_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: VideoLesson[];
  completionPct: number;
  rating: number;
  enrolled: number;
}

export interface VideoLesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

export interface ConsultancyRequest {
  id: string;
  schoolName: string;
  contactName: string;
  email: string;
  phone: string;
  labType: 'robotics' | 'coding' | 'electronics' | 'full-stem';
  budget: string;
  studentCapacity: string;
  status: 'pending' | 'in-review' | 'approved' | 'completed';
  submittedDate: string;
  notes: string;
}

/* ─── ACADEMIC TYPES ─── */

export type ClassType = 'GROUP' | 'INDIVIDUAL';
export type DurationUnit = 'DAY' | 'WEEK' | 'MONTH';
export type EnrollmentStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type VerificationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type SessionStatus = 'DRAFT' | 'PUBLISHED';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type MaterialType = 'PDF' | 'PPT' | 'PPTX' | 'DOC' | 'DOCX' | 'IMAGE' | 'ZIP' | 'OTHER';

export interface StudentProfile {
  id: string;
  user: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  branch: string;
  branch_name?: string;
  date_joined: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubProgram {
  id: string;
  program: string;
  program_name?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  duration?: number;
  duration_unit?: DurationUnit;
  group_fee: number;
  individual_fee?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicClass {
  id: string;
  sub_program: string;
  sub_program_name?: string;
  branch: string;
  branch_name?: string;
  instructor: string;
  instructor_name?: string;
  name: string;
  class_type: ClassType;
  class_period?: string;
  capacity?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student: string;
  student_name?: string;
  student_email?: string;
  enrolled_class: string;
  class_name?: string;
  class_type?: ClassType;
  sub_program_name?: string;
  program_name?: string;
  branch_name?: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  verification_status?: VerificationStatus;
  rejection_reason?: string;
  enrollment_number?: string;
  pending_code?: string;
  payment_status?: PaymentStatus | string | null;
  payment_method?: PaymentMethod | string | null;
  transferred_from?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentPeriod {
  id: string;
  branch: string;
  branch_name?: string;
  program: string;
  program_name?: string;
  sub_program: string;
  sub_program_name?: string;
  class_type: ClassType;
  class_period?: string;
  title: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentPayment {
  id: string;
  enrollment: string;
  enrollment_id?: string;
  student_name?: string;
  class_name?: string;
  sub_program_name?: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  bank_name?: string;
  transfer_reference?: string;
  attachment?: string;
  payment_date?: string;
  status: PaymentStatus;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  enrolled_class: string;
  class_name?: string;
  branch_name?: string;
  session_date: string;
  topic?: string;
  recorded_by: string;
  recorded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  attendance_session: string;
  enrollment: string;
  enrollment_id?: string;
  student_name?: string;
  status: AttendanceStatus;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningMilestone {
  id: string;
  sub_program: string;
  sub_program_name?: string;
  scope_class?: string;
  scope_class_name?: string;
  scope?: 'shared' | 'class_specific';
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  enrollment: string;
  milestone: string;
  milestone_title?: string;
  scope?: string;
  student_name?: string;
  status: ProgressStatus;
  completed_at?: string;
  remarks?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningMaterial {
  id: string;
  sub_program: string;
  sub_program_name?: string;
  title: string;
  description?: string;
  file_url: string;
  material_type: MaterialType;
  uploaded_by: string;
  uploaded_by_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentAward {
  id: string;
  studentName: string;
  programTitle: string;
  category: string;
  issueDate: string;
  type: 'completion' | 'competition' | 'milestone' | 'award';
  verificationCode: string;
  rank?: string;
  eventName?: string;
  hoursCompleted?: number;
  eventId?: string;
  awardCategory?: string;
  teamName?: string;
  schoolName?: string;
}

export interface StudentCertificate {
  id: string;
  student: string;
  student_name?: string;
  certificate: string;
  certificate_title?: string;
  sub_program: string;
  sub_program_name?: string;
  certificate_number: string;
  issued_by: string;
  issued_by_name?: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
}
