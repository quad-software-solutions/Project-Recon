import type { UserProfile } from '../types';
import type { NavItem } from '../ui/Sidebar';
import {
  canManageAccounts,
  canManageAcademicCatalog,
  canManageAnnouncements,
  canManageBranches,
  canManageCertificates,
  canManageContactRequests,
  canManageCms,
  canManageEvents,
  canManagePayments,
  canManageStaffAttendance,
  canManageStore,
  canManageStoreInventory,
  canManageLearningContent,
  canViewAnnouncements,
  canViewAuditLogs,
  isSuperAdmin,
  isSuperAdminOrBranchManager,
} from './permissions';
import type { AdminSectionId } from '@/domains/user/shared/adminCommandCenter';
import type { ManagerSectionId } from '@/domains/user/manager/dashboard/managerCommandCenter';
import type { SecretarySectionId } from '@/domains/user/secretary/dashboard/secretaryCommandCenter';
import type { TeacherSectionId } from '@/domains/user/teacher/dashboard/teacherCommandCenter';

const ADMIN_SECTION_ACCESS: Record<AdminSectionId, (u: UserProfile) => boolean> = {
  overview: () => true,
  users: canManageAccounts,
  roles: canManageAccounts,
  'staff-attendance': canManageStaffAttendance,
  academics: canManageAcademicCatalog,
  classes: canManageAcademicCatalog,
  registrations: canManageAcademicCatalog,
  certificates: canManageCertificates,
  events: canManageEvents,
  tournaments: canManageEvents,
  'tournament-teams': canManageEvents,
  matches: canManageEvents,
  workshops: canManageEvents,
  'event-registrations': canManageEvents,
  store: canManageStore,
  cms: canManageCms,
  branches: isSuperAdmin,
  audit: canViewAuditLogs,
  account: () => true,
  announcements: canManageAnnouncements,
  communications: canManageContactRequests,
};

const MANAGER_SECTION_ACCESS: Record<ManagerSectionId, (u: UserProfile) => boolean> = {
  overview: () => true,
  'academic-catalog': canManageAcademicCatalog,
  classes: canManageAcademicCatalog,
  enrollments: canManageAcademicCatalog,
  'staff-attendance': canManageStaffAttendance,
  certificates: canManageCertificates,
  schools: isSuperAdmin,
  payments: canManagePayments,
  store: canManageStoreInventory,
  materials: canManageLearningContent,
  milestones: canManageLearningContent,
  events: canManageEvents,
  tournaments: canManageEvents,
  'tournament-teams': canManageEvents,
  matches: canManageEvents,
  workshops: canManageEvents,
  'event-registrations': canManageEvents,
  announcements: canViewAnnouncements,
  communications: canManageContactRequests,
  sponsors: isSuperAdminOrBranchManager,
  reports: isSuperAdminOrBranchManager,
  analytics: isSuperAdminOrBranchManager,
  walkin: isSuperAdminOrBranchManager,
  account: () => true,
};

const SECRETARY_SECTION_ACCESS: Record<SecretarySectionId, (u: UserProfile) => boolean> = {
  overview: () => true,
  admissions: () => true,
  enrollments: () => true,
  payments: () => true,
  certificates: () => true,
  templates: () => true,
  reports: () => true,
  periods: () => true,
  announcements: () => true,
  students: () => true,
  'event-registrations': () => true,
  account: () => true,
};

const TEACHER_SECTION_ACCESS: Record<TeacherSectionId, (u: UserProfile) => boolean> = {
  class: () => true,
  workshops: () => true,
  attendance: () => true,
  progress: () => true,
  milestones: () => true,
  materials: () => true,
  metrics: () => true,
  activity: () => true,
  reports: () => true,
  announcements: () => true,
  account: () => true,
};

export function canAccessAdminSection(user: UserProfile, section: AdminSectionId): boolean {
  const check = ADMIN_SECTION_ACCESS[section];
  return check ? check(user) : false;
}

export function canAccessManagerSection(user: UserProfile, section: ManagerSectionId): boolean {
  const check = MANAGER_SECTION_ACCESS[section];
  return check ? check(user) : false;
}

export function filterAdminNavItems(user: UserProfile, items: NavItem[]): NavItem[] {
  return items.filter(item => canAccessAdminSection(user, item.id as AdminSectionId));
}

export function filterManagerNavItems(user: UserProfile, items: NavItem[]): NavItem[] {
  return items.filter(item => canAccessManagerSection(user, item.id as ManagerSectionId));
}

/** Ensure active section is accessible; fall back to overview. */
export function resolveAdminSection(user: UserProfile, section: AdminSectionId): AdminSectionId {
  return canAccessAdminSection(user, section) ? section : 'overview';
}

export function resolveManagerSection(user: UserProfile, section: ManagerSectionId): ManagerSectionId {
  return canAccessManagerSection(user, section) ? section : 'overview';
}

export function canAccessSecretarySection(user: UserProfile, section: SecretarySectionId): boolean {
  const check = SECRETARY_SECTION_ACCESS[section];
  return check ? check(user) : false;
}

export function filterSecretaryNavItems(user: UserProfile, items: NavItem[]): NavItem[] {
  return items.filter(item => canAccessSecretarySection(user, item.id as SecretarySectionId));
}

export function resolveSecretarySection(user: UserProfile, section: SecretarySectionId): SecretarySectionId {
  return canAccessSecretarySection(user, section) ? section : 'overview';
}

export function canAccessTeacherSection(user: UserProfile, section: TeacherSectionId): boolean {
  const check = TEACHER_SECTION_ACCESS[section];
  return check ? check(user) : false;
}

export function filterTeacherNavItems(user: UserProfile, items: NavItem[]): NavItem[] {
  return items.filter(item => canAccessTeacherSection(user, item.id as TeacherSectionId));
}

export function resolveTeacherSection(user: UserProfile, section: TeacherSectionId): TeacherSectionId {
  return canAccessTeacherSection(user, section) ? section : 'class';
}
