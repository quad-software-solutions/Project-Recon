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
  title: string;
  category: 'VEX IQ' | 'VEX V5' | 'Enjoy AI' | 'Arduino' | 'STEM Foundations';
  description: string;
  detailedDescription: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
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
  role: 'Student' | 'Instructor' | 'Admin' | 'Manager' | 'Parent' | 'EventManager';
  enrolledPrograms: string[];
  bio?: string;
  xpPoints: number;
  badges: string[];
  referralCode?: string;
  subscriptionTier?: 'free' | 'explorer' | 'pro' | 'school';
  childName?: string;
  language?: 'en' | 'am';
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
