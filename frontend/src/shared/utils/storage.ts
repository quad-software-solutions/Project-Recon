import type { UserProfile } from '@/shared/types';

/** Centralized localStorage keys — do not duplicate these strings elsewhere. */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'ethio_robotics_user',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
  DEVICE_ID: 'device_id',
  CMS_BRANDING: 'ethio-cms-branding',
  STUDENT_SETTINGS: 'student_settings',
  STORE_CART_BRANCH: 'store_cart_branch',
} as const;

export function studentIdKey(email: string): string {
  return `studentId_${email}`;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota or private mode */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export function getUserProfile(): UserProfile | null {
  const raw = safeGet(STORAGE_KEYS.USER_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setUserProfile(user: UserProfile): void {
  safeSet(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
}

export function updateUserProfile(partial: Partial<UserProfile>): UserProfile | null {
  const current = getUserProfile();
  if (!current) return null;
  const updated = { ...current, ...partial };
  setUserProfile(updated);
  return updated;
}

export function clearUserProfile(): void {
  safeRemove(STORAGE_KEYS.USER_PROFILE);
}

export function getStoreCartBranch(): string | null {
  return safeGet(STORAGE_KEYS.STORE_CART_BRANCH);
}

export function setStoreCartBranch(branchId: string): void {
  safeSet(STORAGE_KEYS.STORE_CART_BRANCH, branchId);
}

export function clearStoreCartBranch(): void {
  safeRemove(STORAGE_KEYS.STORE_CART_BRANCH);
}

export function getCachedStudentId(email: string): string | null {
  return safeGet(studentIdKey(email));
}

export function setCachedStudentId(email: string, studentId: string): void {
  safeSet(studentIdKey(email), studentId);
}

export function getSidebarCollapsed(): boolean {
  return safeGet(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
}

export function setSidebarCollapsed(collapsed: boolean): void {
  safeSet(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
}

export function getOrCreateDeviceId(): string {
  const existing = safeGet(STORAGE_KEYS.DEVICE_ID);
  if (existing) return existing;
  const id = crypto.randomUUID();
  safeSet(STORAGE_KEYS.DEVICE_ID, id);
  return id;
}

export function summarizeSettled<T extends readonly PromiseSettledResult<unknown>[]>(
  results: T,
): { allFailed: boolean; anyFailed: boolean; fulfilled: number } {
  const fulfilled = results.filter(r => r.status === 'fulfilled').length;
  return {
    allFailed: fulfilled === 0,
    anyFailed: fulfilled < results.length,
    fulfilled,
  };
}
