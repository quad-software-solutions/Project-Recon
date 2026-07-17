export * from '../../domains/store/model/types';

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
  role: 'Student' | 'Instructor' | 'Admin' | 'Manager' | 'Secretary';
  bio?: string;
  /** @deprecated No backend XP system — kept for type compatibility only */
  xpPoints?: number;
  /** @deprecated No backend badges system — kept for type compatibility only */
  badges?: string[];
  referralCode?: string;
  subscriptionTier?: 'free' | 'explorer' | 'pro' | 'school';
  childName?: string;
  language?: 'en' | 'am';
  studentId?: string;
}

export type ActiveTab = 'home' | 'about' | 'store' | 'store-orders' | 'store-order-detail' | 'dashboard' | 'login' | 'register' | 'registration' | 'simulator' | 'competitions' | 'community' | 'consultancy' | 'command-center' | 'forgot-password' | 'reset-password' | 'cert-verify';

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

export * from '../../domains/learning/model/types';
export * from '../../domains/competition/model/types';

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

export interface StaffAttendanceSession {
  id: string;
  branch: string;
  branch_name?: string;
  date: string;
  status: SessionStatus;
  notes: string;
  created_by: string;
  created_by_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  records?: StaffAttendanceRecord[];
}

export interface StaffAttendanceRecord {
  id: string;
  session: string;
  staff_member: string;
  staff_member_name?: string;
  status: AttendanceStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}
