import type { ActiveTab, UserProfile } from '../types';

/** Backend role constants — mirrors apps.accounts.constants.Roles */
export type BackendRole =
  | 'super_admin'
  | 'branch_manager'
  | 'secretary'
  | 'instructor'
  | 'student';

export type AppRole = UserProfile['role'];

export interface UserAssignment {
  id?: string;
  branch_id: string | null;
  branch_name?: string | null;
  role: string;
  is_primary?: boolean;
  is_active?: boolean;
}

const FRONTEND_TO_BACKEND: Record<AppRole, BackendRole | null> = {
  Admin: 'super_admin',
  Manager: 'branch_manager',
  Secretary: 'secretary',
  Instructor: 'instructor',
  Student: 'student',
  Parent: 'student',
  EventManager: 'branch_manager',
};

const ROLE_PRIORITY: BackendRole[] = [
  'super_admin',
  'branch_manager',
  'secretary',
  'instructor',
  'student',
];

const PUBLIC_TABS: ActiveTab[] = [
  'home',
  'about',
  'history',
  'store',
  'store-orders',
  'store-order-detail',
  'login',
  'register',
  'registration',
  'simulator',
  'competitions',
  'cert-verify',
  'forgot-password',
  'reset-password',
  'privacy',
  'terms',
  'help',
];

/** Active backend roles for a user, derived from assignments or primary role fallback. */
export function getActiveBackendRoles(user: UserProfile | null | undefined): Set<BackendRole> {
  if (!user) return new Set();

  const assignments = user.assignments?.filter(a => a.is_active !== false) ?? [];
  if (assignments.length > 0) {
    const roles = new Set<BackendRole>();
    for (const a of assignments) {
      if (ROLE_PRIORITY.includes(a.role as BackendRole)) {
        roles.add(a.role as BackendRole);
      }
    }
    if (roles.size > 0) return roles;
  }

  const mapped = FRONTEND_TO_BACKEND[user.role];
  return mapped ? new Set([mapped]) : new Set();
}

export function hasBackendRole(
  user: UserProfile | null | undefined,
  role: BackendRole,
): boolean {
  return getActiveBackendRoles(user).has(role);
}

export function isSuperAdmin(user: UserProfile | null | undefined): boolean {
  return hasBackendRole(user, 'super_admin');
}

export function isBranchManager(user: UserProfile | null | undefined): boolean {
  return hasBackendRole(user, 'branch_manager');
}

export function isSecretary(user: UserProfile | null | undefined): boolean {
  return hasBackendRole(user, 'secretary');
}

export function isInstructor(user: UserProfile | null | undefined): boolean {
  return hasBackendRole(user, 'instructor');
}

export function isStudent(user: UserProfile | null | undefined): boolean {
  return hasBackendRole(user, 'student');
}

export function isSuperAdminOrBranchManager(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user) || isBranchManager(user);
}

/** CMS admin endpoints require Super Admin (IsCMSStaff). */
export function canManageCms(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user);
}

/** Account & assignment management — Super Admin only. */
export function canManageAccounts(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user);
}

/** Audit logs — Super Admin only. */
export function canViewAuditLogs(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user);
}

/** Branch management — Super Admin or Branch Manager. */
export function canManageBranches(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user);
}

/** Store catalog/orders staff — Super Admin only (backend IsStoreStaff). */
export function canManageStore(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user);
}

/** Branch inventory — Super Admin or Branch Manager (backend IsStoreInventoryStaff). */
export function canManageStoreInventory(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user);
}

/** Learning materials & milestones — Super Admin or Branch Manager (also instructors on teacher UI). */
export function canManageLearningContent(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user) || isInstructor(user);
}

/** Academic catalog, classes, enrollments — Super Admin or Branch Manager. */
export function canManageAcademicCatalog(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user);
}

/** Enrollment periods — matches backend IsAcademicStaff (Admin, Manager, Secretary). */
export function canManageEnrollmentPeriods(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user) || isBranchManager(user) || isSecretary(user);
}

/** Payments — Super Admin, Branch Manager, or Secretary. */
export function canManagePayments(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user) || isBranchManager(user) || isSecretary(user);
}

/** Certificates — Super Admin, Branch Manager, or Secretary. */
export function canManageCertificates(user: UserProfile | null | undefined): boolean {
  return isSuperAdmin(user) || isBranchManager(user) || isSecretary(user);
}

/** Events/competitions — Super Admin or Branch Manager. */
export function canManageEvents(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user);
}

/** Event registrations & payments — Super Admin, Branch Manager, or Secretary. */
export function canManageEventRegistrations(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user) || isSecretary(user);
}

/** Staff attendance — Super Admin or Branch Manager. */
export function canManageStaffAttendance(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user);
}

/** View published announcements (public CMS news). */
export function canViewAnnouncements(user: UserProfile | null | undefined): boolean {
  return !!user;
}

/** Create/edit/delete announcements — Super Admin only (CMS admin API). */
export function canManageAnnouncements(user: UserProfile | null | undefined): boolean {
  return canManageCms(user);
}

/** Contact request management — Super Admin only (CMS admin API). */
export function canManageContactRequests(user: UserProfile | null | undefined): boolean {
  return canManageCms(user);
}

/** Command center — Super Admin or Branch Manager. */
export function canAccessCommandCenter(user: UserProfile | null | undefined): boolean {
  return isSuperAdminOrBranchManager(user);
}

export const STAFF_ROLES: AppRole[] = ['Admin', 'Manager', 'Secretary', 'Instructor'];

/** Legacy permission type — kept for tab routing compatibility. */
export type Permission =
  | 'dashboard:view'
  | 'command-center:view';

export function hasPermission(user: UserProfile | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  switch (permission) {
    case 'dashboard:view':
      return true;
    case 'command-center:view':
      return canAccessCommandCenter(user);
    default:
      return false;
  }
}

export function canAccessTab(user: UserProfile | null | undefined, tab: ActiveTab): boolean {
  if (PUBLIC_TABS.includes(tab)) return true;
  if (tab === 'dashboard') return !!user;
  if (tab === 'command-center') return canAccessCommandCenter(user);
  return false;
}

export function getDefaultAuthenticatedTab(user: UserProfile | null | undefined): ActiveTab {
  return user ? 'dashboard' : 'login';
}

export function normalizeRole(role: string | undefined | null): AppRole {
  const valid: AppRole[] = ['Admin', 'Manager', 'Secretary', 'Instructor', 'Student', 'Parent', 'EventManager'];
  if (role && valid.includes(role as AppRole)) return role as AppRole;
  return 'Student';
}
