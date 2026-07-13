import type { ActiveTab, UserProfile } from '../types';

export type AppRole = UserProfile['role'];
export type Permission =
  | 'dashboard:view'
  | 'accounts:manage'
  | 'branches:manage'
  | 'cms:manage'
  | 'academic:catalog:manage'
  | 'academic:admissions:manage'
  | 'academic:enrollments:manage'
  | 'academic:payments:manage'
  | 'academic:attendance:manage'
  | 'academic:progress:manage'
  | 'academic:materials:manage'
  | 'academic:certificates:manage'
  | 'academic:reports:view'
  | 'student:self:view'
  | 'command-center:view';

export const STAFF_ROLES: AppRole[] = ['Admin', 'Manager', 'Secretary', 'Instructor'];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  Admin: [
    'dashboard:view',
    'accounts:manage',
    'branches:manage',
    'cms:manage',
    'academic:catalog:manage',
    'academic:admissions:manage',
    'academic:enrollments:manage',
    'academic:payments:manage',
    'academic:attendance:manage',
    'academic:progress:manage',
    'academic:materials:manage',
    'academic:certificates:manage',
    'academic:reports:view',
    'command-center:view',
  ],
  Manager: [
    'dashboard:view',
    'branches:manage',
    'academic:catalog:manage',
    'academic:admissions:manage',
    'academic:enrollments:manage',
    'academic:payments:manage',
    'academic:attendance:manage',
    'academic:progress:manage',
    'academic:materials:manage',
    'academic:certificates:manage',
    'academic:reports:view',
    'command-center:view',
  ],
  Secretary: [
    'dashboard:view',
    'academic:admissions:manage',
    'academic:enrollments:manage',
    'academic:payments:manage',
    'academic:certificates:manage',
    'academic:reports:view',
  ],
  Instructor: [
    'dashboard:view',
    'academic:attendance:manage',
    'academic:progress:manage',
    'academic:materials:manage',
    'academic:reports:view',
  ],
  Student: ['dashboard:view', 'student:self:view'],
  Parent: ['dashboard:view', 'student:self:view'],
  EventManager: ['dashboard:view', 'command-center:view'],
};

const PUBLIC_TABS: ActiveTab[] = [
  'home',
  'about',
  'store',
  'store-orders',
  'store-order-detail',
  'login',
  'register',
  'registration',
  'simulator',
  'competitions',
  'forgot-password',
  'reset-password',
];

const TAB_PERMISSIONS: Partial<Record<ActiveTab, Permission>> = {
  dashboard: 'dashboard:view',
  'command-center': 'command-center:view',
};

export function hasPermission(user: UserProfile | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function canAccessTab(user: UserProfile | null | undefined, tab: ActiveTab): boolean {
  if (PUBLIC_TABS.includes(tab)) return true;
  const permission = TAB_PERMISSIONS[tab];
  return permission ? hasPermission(user, permission) : false;
}

export function getDefaultAuthenticatedTab(user: UserProfile | null | undefined): ActiveTab {
  return user ? 'dashboard' : 'login';
}

export function normalizeRole(role: string | undefined | null): AppRole {
  if (role === 'Admin' || role === 'Manager' || role === 'Secretary' || role === 'Instructor' || role === 'Student' || role === 'Parent' || role === 'EventManager') {
    return role;
  }
  return 'Student';
}
