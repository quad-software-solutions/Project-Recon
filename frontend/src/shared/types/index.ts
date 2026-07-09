export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Sensors' | 'Microcontrollers' | 'Accessories' | 'Apparel & Bags' | 'Stationery' | 'Rental' | 'Robotics Kits';
  rating: number;
  reviewsCount: number;
  features: string[];
  rentalPrice?: number;
  rentalPeriod?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
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

export interface UpdatePost {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  iconType: 'calendar' | 'camping' | 'security';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  date_of_birth?: string;
  gender?: string;
  role: 'Student' | 'Instructor' | 'Admin' | 'Manager' | 'Parent' | 'EventManager' | 'Secretary';
  bio?: string;
  xpPoints: number;
  badges: string[];
  referralCode?: string;
  subscriptionTier?: 'free' | 'explorer' | 'pro' | 'school';
  childName?: string;
  language?: 'en' | 'am';
  studentId?: string;
}

export type ActiveTab = 'home' | 'about' | 'store' | 'dashboard' | 'login' | 'register' | 'registration' | 'simulator' | 'competitions' | 'community' | 'consultancy' | 'command-center' | 'forgot-password' | 'reset-password';

export interface SubscriptionTier {
  id: 'free' | 'explorer' | 'pro' | 'school';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  maxStudents?: number;
}

export interface Certificate {
  id: string;
  sub_program: string;
  title: string;
  background: string;
  institute_logo?: string;
  signature?: string;
  body_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  instructorRole: string;
  instructorImage: string;
  location: string;
  category: 'VEX IQ' | 'VEX V5' | 'Enjoy AI' | 'Arduino' | 'STEM' | 'Coding';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  capacity: number;
  enrolled: number;
  price: number;
  image: string;
  topics: string[];
  requirements: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'upcoming' | 'live' | 'completed';
  category: 'VEX IQ' | 'VEX V5' | 'Enjoy AI';
  teams: TournamentTeam[];
  maxTeams: number;
  registrationDeadline: string;
  prizePool: string;
  streamUrl?: string;
  description: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
  school: string;
  members: number;
  wins: number;
  losses: number;
  score: number;
  rank?: number;
  avatar?: string;
}

export interface MatchResult {
  id: string;
  tournamentId: string;
  round: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: 'scheduled' | 'live' | 'completed';
  time: string;
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole: string;
  avatar: string;
  title: string;
  content: string;
  category: 'General' | 'Help' | 'Showcase' | 'Competition' | 'Tutorial';
  timestamp: string;
  likes: number;
  replies: ForumReply[];
  tags: string[];
  pinned?: boolean;
}

export interface ForumReply {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  timestamp: string;
  likes: number;
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

export interface Referral {
  id: string;
  referrerCode: string;
  refereeName: string;
  refereeEmail: string;
  status: 'pending' | 'enrolled' | 'rewarded';
  date: string;
  reward: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  school: string;
  xp: number;
  badges: number;
  streak: number;
  avatar: string;
  trend: 'up' | 'down' | 'same';
  program: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VexTeam {
  id: string;
  name: string;
  number: string;
  school: string;
  location: string;
  members: string[];
  coach: string;
  bio: string;
  established: string;
  avatar: string;
  color: string;
}

export interface VexRobot {
  id: string;
  name: string;
  competition: string;
  season: string;
  image: string;
  description: string;
  specs: string[];
  achievements: string[];
  status: 'active' | 'retired' | 'development';
  drivetrain: string;
  brain: string;
  weight: string;
}

export interface VexAward {
  id: string;
  name: string;
  event: string;
  date: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  upcoming?: boolean;
}

export interface VexNotebookEntry {
  id: string;
  title: string;
  date: string;
  author: string;
  content: string;
  drawings: string[];
  tags: string[];
}

export interface VexMatchRecord {
  id: string;
  event: string;
  date: string;
  round: string;
  opponent: string;
  score: string;
  result: 'win' | 'loss' | 'upcoming';
  notes: string;
}

/* ─── ACADEMIC TYPES ─── */

export type ClassType = 'GROUP' | 'INDIVIDUAL';
export type DurationUnit = 'DAY' | 'WEEK' | 'MONTH';
export type EnrollmentStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'ONLINE';
export type PaymentProvider = 'CHAPA' | 'STRIPE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
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
  duration?: number;
  duration_unit?: DurationUnit;
  fee: number;
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
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
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
  payment_provider?: PaymentProvider;
  transaction_reference?: string;
  payment_date?: string;
  status: PaymentStatus;
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
  pdf: string;
  issued_by: string;
  issued_by_name?: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

export type PartnerTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'community';
export type PartnerType = 'financial' | 'in-kind' | 'media' | 'educational' | 'venue';

export interface SponsorPartner {
  id: string;
  name: string;
  logo: string;
  tier: PartnerTier;
  type: PartnerType;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  contractStart: string;
  contractEnd: string;
  contractValue: number;
  active: boolean;
  description: string;
  impressions: number;
  reach: number;
  notes: string;
  joinedDate: string;
}

export type VexCompetitionRole =
  | 'referee' | 'head-referee' | 'scout' | 'pit-manager' | 'field-manager'
  | 'queue-manager' | 'judge' | 'volunteer' | 'technical-inspector'
  | 'scorekeeper' | 'announcer' | 'photographer';

export interface VexRoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: VexCompetitionRole;
  eventName: string;
  eventDate: string;
  assignedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  notes: string;
}

export interface SchoolPartner {
  id: string;
  name: string;
  logo: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  partnershipType: 'tier-1' | 'tier-2' | 'tier-3' | 'affiliate';
  programs: string[];
  studentCount: number;
  activeSince: string;
  status: 'active' | 'inactive' | 'pending';
  notes: string;
}

export interface RegistrationRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  age: number;
  grade: string;
  school: string;
  parentName: string;
  parentPhone: string;
  program: string;
  amount: number;
  registeredAt: string;
  source: 'online' | 'walk-in';
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface AnalyticsData {
  monthlyRevenue: { month: string; amount: number }[];
  enrollmentTrend: { month: string; count: number }[];
  programDistribution: { program: string; count: number; color: string }[];
  topMetrics: { label: string; value: string; change: string; trend: 'up' | 'down' }[];
  recentTransactions: { id: string; student: string; amount: number; type: string; date: string; status: string }[];
}
