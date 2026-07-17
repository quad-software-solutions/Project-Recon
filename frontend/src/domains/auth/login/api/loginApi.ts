import { http } from '../../../../shared/api/http';
import type { UserProfile } from '../../../../shared/types';
import type { LoginCredentials, AuthResponse } from '../../model/types';
import { setTokens, getRefreshToken, clearTokens } from '@/shared/utils/auth';
import { clearSessionStorage, getOrCreateDeviceId, getCachedStudentId, setCachedStudentId } from '@/shared/utils/storage';

/**
 * Custom error thrown when login fails because the user's email is not verified.
 * Contains the email so the frontend can redirect to the OTP page.
 */
export class EmailNotVerifiedError extends Error {
  email: string;
  constructor(email: string) {
    super('Email verification required.');
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

/**
 * Decode a JWT payload without a library.
 */
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Backend role constants → frontend UserProfile role mapping.
 *
 * Backend roles (from UserAssignment.role):
 *   super_admin, branch_manager, secretary, instructor, student
 *
 * Frontend UserProfile roles:
 *   Admin, Manager, Secretary, Instructor, Student
 */
const ROLE_MAP: Record<string, UserProfile['role']> = {
  super_admin: 'Admin',
  branch_manager: 'Manager',
  secretary: 'Secretary',
  instructor: 'Instructor',
  student: 'Student',
};

/**
 * Pick the highest-priority role from an array of backend assignment objects.
 * Each assignment has: { role, is_primary, is_active, branch_id, branch_name }
 */
function resolveRole(assignments: Array<{ role: string; is_primary?: boolean; is_active?: boolean }>): UserProfile['role'] {
  if (!assignments || assignments.length === 0) return 'Student';

  // Priority order mirrors backend operational responsibility.
  const priority = ['super_admin', 'branch_manager', 'secretary', 'instructor', 'student'];

  // Check primary assignment first
  const primary = assignments.find((a) => a.is_primary && a.is_active);
  if (primary && ROLE_MAP[primary.role]) return ROLE_MAP[primary.role];

  // Fall back to highest priority active assignment
  for (const p of priority) {
    const match = assignments.find((a) => a.role === p && a.is_active !== false);
    if (match) return ROLE_MAP[p];
  }

  return 'Student';
}

/**
 * Authenticate against the backend and build a UserProfile.
 *
 * Flow:
 *  1. POST /accounts/login/  →  { access, refresh }
 *  2. Store tokens in localStorage
 *  3. GET /accounts/users/{id}/  → user details + assignments
 *  4. Map backend user to frontend UserProfile
 */
export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const deviceId = getOrCreateDeviceId();

  // Step 1: Authenticate – get JWT tokens
  const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
  const loginUrl = `${BASE_URL}/accounts/login/`;
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      device_id: deviceId,
      device_name: navigator.platform || 'Browser',
      fingerprint: deviceId,
      user_agent: navigator.userAgent,
    }),
  });

  const loginBody = await loginRes.json();

  // Check for email verification required
  if (loginRes.status === 403 && loginBody.code === 'email_not_verified') {
    throw new EmailNotVerifiedError(loginBody.email);
  }

  if (!loginRes.ok) {
    const msg = loginBody.detail || Object.values(loginBody).flat().join('; ') || 'Login failed';
    throw new Error(msg);
  }

  const tokenData = loginBody as { access: string; refresh: string };

  // Step 2: Persist tokens
  setTokens(tokenData.access, tokenData.refresh);

  // Step 3: Decode token for user_id, then fetch user profile
  const payload = parseJwt(tokenData.access);
  const userId = payload?.user_id as string | undefined;

  let userProfile: UserProfile = {
    id: userId || '',
    email: credentials.email,
    name: credentials.email.split('@')[0],
    role: 'Student',
    xpPoints: 0,
    badges: [],
  };

  if (userId) {
    try {
      const userData = await http.get<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        full_name: string;
        status: string;
        is_email_verified: boolean;
        assignments: Array<{
          id: string;
          branch_id: string | null;
          branch_name: string | null;
          role: string;
          is_primary: boolean;
          is_active: boolean;
        }>;
        phone_number?: string;
        profile_picture?: string;
        date_of_birth?: string;
        gender?: string;
      }>(`/accounts/users/${userId}/`);

      const role = resolveRole(userData.assignments);

      userProfile = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name || `${userData.first_name} ${userData.last_name}`.trim() || userData.email.split('@')[0],
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number || '',
        profile_picture: userData.profile_picture || '',
        date_of_birth: userData.date_of_birth || '',
        gender: userData.gender || '',
        role,
        assignments: userData.assignments.map(a => ({
          id: a.id,
          branch_id: a.branch_id,
          branch_name: a.branch_name,
          role: a.role,
          is_primary: a.is_primary,
          is_active: a.is_active,
        })),
        xpPoints: 0,
        badges: [],
      };
    } catch (err) {
      // If user detail fetch fails (e.g. permission), use token claims
      console.warn('Could not fetch user profile, using token claims:', err);
    }
  }

  // Step 4: For students, try to discover student ID from localStorage or certificates
  if (userProfile.role === 'Student') {
    const storedId = getCachedStudentId(userProfile.email);
    if (storedId) {
      userProfile.studentId = storedId;
    } else {
      try {
        const certBody = await http.get<{ student: string }[] | { results: { student: string }[] }>('/academic/student-certificates/');
        const certList = Array.isArray(certBody) ? certBody : certBody.results;
        if (certList.length > 0 && certList[0].student) {
          userProfile.studentId = certList[0].student;
          setCachedStudentId(userProfile.email, certList[0].student);
        }
      } catch {
        // Student has no certificates yet — no fallback available
      }
    }
  }

  return { user: userProfile, token: tokenData.access };
}

/**
 * Social login is not yet supported by the backend.
 * Keeping as a stub that shows an informational error.
 */
export async function socialLoginApi(_provider: 'google' | 'github'): Promise<AuthResponse> {
  throw new Error('Social login is not yet available. Please use email and password.');
}

/**
 * Call the backend logout endpoint to blacklist the refresh token.
 */
export async function logoutApi(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await http.post('/accounts/logout/', { refresh });
    } catch {
      // Logout should not block the UI even if the server call fails
      console.warn('Backend logout failed, clearing local tokens anyway.');
    }
  }
  clearTokens();
  clearSessionStorage();
}

/**
 * Call the backend forgot-password endpoint.
 * The API intentionally does NOT reveal whether the email exists.
 */
export async function forgotPasswordApi(email: string): Promise<void> {
  await http.post('/accounts/password/forgot/', { email });
}

/**
 * Call the backend reset-password endpoint to submit the OTP and new password.
 */
export async function resetPasswordApi(otp: string, password: string): Promise<void> {
  await http.post('/accounts/password/reset/', {
    otp,
    new_password: password
  });
}

/**
 * Request an email verification OTP (public, no auth required).
 */
export async function requestEmailVerificationApi(email: string): Promise<void> {
  await http.post('/accounts/public/email-verification/request/', { email });
}

/**
 * Verify an email OTP and receive JWT tokens on success (public, no auth required).
 */
export async function verifyEmailOtpApi(email: string, otp: string): Promise<AuthResponse> {
  const deviceId = getOrCreateDeviceId();

  const tokenData = await http.post<{ access: string; refresh: string }>(
    '/accounts/public/email-verification/verify/',
    {
      email,
      otp,
      device_id: deviceId,
      fingerprint: deviceId,
      user_agent: navigator.userAgent,
    }
  );

  // Persist tokens
  setTokens(tokenData.access, tokenData.refresh);

  // Decode token for user_id, then fetch user profile
  const payload = parseJwt(tokenData.access);
  const userId = payload?.user_id as string | undefined;

  let userProfile: UserProfile = {
    id: userId || '',
    email,
    name: email.split('@')[0],
    role: 'Student',
    xpPoints: 0,
    badges: [],
  };

  if (userId) {
    try {
      const userData = await http.get<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        full_name: string;
        status: string;
        is_email_verified: boolean;
        assignments: Array<{
          id: string;
          branch_id: string | null;
          branch_name: string | null;
          role: string;
          is_primary: boolean;
          is_active: boolean;
        }>;
      }>(`/accounts/users/${userId}/`);

      const role = resolveRole(userData.assignments);

      userProfile = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name || `${userData.first_name} ${userData.last_name}`.trim() || userData.email.split('@')[0],
        role,
        assignments: userData.assignments.map(a => ({
          id: a.id,
          branch_id: a.branch_id,
          branch_name: a.branch_name,
          role: a.role,
          is_primary: a.is_primary,
          is_active: a.is_active,
        })),
        xpPoints: 0,
        badges: [],
      };
    } catch (err) {
      console.warn('Could not fetch user profile after verification:', err);
    }
  }

  // Step 4: For students, try to discover student ID from localStorage or certificates
  if (userProfile.role === 'Student') {
    const storedId = getCachedStudentId(userProfile.email);
    if (storedId) {
      userProfile.studentId = storedId;
    } else {
      try {
        const certBody = await http.get<{ student: string }[] | { results: { student: string }[] }>('/academic/student-certificates/');
        const certList = Array.isArray(certBody) ? certBody : certBody.results;
        if (certList.length > 0 && certList[0].student) {
          userProfile.studentId = certList[0].student;
          setCachedStudentId(userProfile.email, certList[0].student);
        }
      } catch {
        // Student has no certificates yet — no fallback available
      }
    }
  }

  return { user: userProfile, token: tokenData.access };
}
