import { http } from '../../../../shared/api/http';
import { fetchAllPages } from '../../../../shared/api/pagination';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserAssignmentNested {
  id: string;
  branch_id: string | null;
  branch_name: string | null;
  role: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  profile_picture: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Prefer not to say' | null;
  status: 'Pending' | 'Active' | 'Suspended' | 'Archived';
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
  assignments: UserAssignmentNested[];
}

export interface BranchResponse {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state_region: string | null;
  country: string;
  status: 'Active' | 'Inactive' | 'Archived';
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor: { id: string; email: string; full_name: string } | null;
  branch: { id: string; name: string; code: string } | null;
}

export interface AssignmentResponse {
  id: string;
  user: { id: string; email: string; full_name: string } | null;
  branch: { id: string; name: string; code: string } | null;
  role: string;
  is_primary: boolean;
  is_active: boolean;
  assigned_by: { id: string; email: string; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

/* ─── ROLE HELPERS ─── */

const ROLE_PRIORITY = ['super_admin', 'branch_manager', 'secretary', 'instructor', 'student'];
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Admin',
  branch_manager: 'Manager',
  secretary: 'Secretary',
  instructor: 'Instructor',
  student: 'Student',
};

export function resolveRole(assignments: UserAssignmentNested[]): string {
  if (!assignments || assignments.length === 0) return 'Student';
  const primary = assignments.find(a => a.is_primary && a.is_active);
  if (primary && ROLE_LABEL[primary.role]) return ROLE_LABEL[primary.role];
  for (const p of ROLE_PRIORITY) {
    const match = assignments.find(a => a.role === p && a.is_active !== false);
    if (match) return ROLE_LABEL[p];
  }
  return 'Student';
}

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending',
  Active: 'Active',
  Suspended: 'Suspended',
  Archived: 'Archived',
};

export function displayStatus(status: string): string {
  return STATUS_LABEL[status] || status;
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatJoinDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/* ─── USER API ─── */

export async function fetchUsersApi(): Promise<PaginatedResponse<AdminUserResponse>> {
  return http.get<PaginatedResponse<AdminUserResponse>>('/accounts/users/');
}

export async function fetchAllUsersApi(): Promise<AdminUserResponse[]> {
  return fetchAllPages(page =>
    http.get<PaginatedResponse<AdminUserResponse>>('/accounts/users/', {
      params: { page: String(page), page_size: '100' },
    }),
  );
}

export async function fetchUserApi(id: string): Promise<AdminUserResponse> {
  return http.get<AdminUserResponse>(`/accounts/users/${id}/`);
}

export async function updateUserApi(userId: string, data: {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  profile_picture?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
}): Promise<AdminUserResponse> {
  return http.patch<AdminUserResponse>(`/accounts/users/${userId}/`, data);
}

export async function toggleUserStatusApi(userId: string, currentStatus: string): Promise<void> {
  const action = currentStatus === 'Active' ? 'deactivate' : 'activate';
  await http.post(`/accounts/users/${userId}/${action}/`, {});
}

export async function archiveUserApi(userId: string): Promise<void> {
  await http.post(`/accounts/users/${userId}/archive/`, {});
}

export async function createStaffApi(data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  branch_id: string;
  role?: string;
}): Promise<void> {
  await http.post('/accounts/users/staff/', data);
}

export async function createBranchManagerApi(data: {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  branch_id: string;
}): Promise<void> {
  await http.post('/accounts/users/branch-managers/', data);
}

/* ─── AUDIT API ─── */

export async function fetchAuditLogsApi(): Promise<AuditLogEntry[]> {
  return fetchAllPages(page =>
    http.get<PaginatedResponse<AuditLogEntry>>('/audit/', {
      params: { page: String(page), page_size: '100' },
    }),
  );
}

/* ─── BRANCH API ─── */

export const branchesApi = {
  list: () => http.get<BranchResponse[]>('/accounts/branches/'),

  get: (id: string) => http.get<BranchResponse>(`/accounts/branches/${id}/`),

  create: (data: {
    name: string;
    code: string;
    email?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state_region?: string;
    country?: string;
  }) => http.post<BranchResponse>('/accounts/branches/', data),

  update: (id: string, data: Partial<{
    name: string;
    code: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    city: string | null;
    state_region: string | null;
    country: string;
  }>) => http.patch<BranchResponse>(`/accounts/branches/${id}/`, data),

  createWithManager: (data: {
    name: string;
    code: string;
    manager_user_id: string;
    email?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state_region?: string;
    country?: string;
  }) => http.post('/accounts/branches/with-manager/', data),

  assignManager: (branchId: string, managerUserId: string) =>
    http.post(`/accounts/branches/${branchId}/assign-manager/`, { manager_user_id: managerUserId }),

  changeManager: (branchId: string, managerUserId: string) =>
    http.post(`/accounts/branches/${branchId}/change-manager/`, { manager_user_id: managerUserId }),

  toggleActive: (branchId: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'activate';
    return http.post(`/accounts/branches/${branchId}/${action}/`, {});
  },

  archive: (branchId: string) =>
    http.post(`/accounts/branches/${branchId}/archive/`, {}),
};

/* ─── ASSIGNMENT API ─── */

export const assignmentsApi = {
  list: () => http.get<AssignmentResponse[]>('/accounts/assignments/'),

  create: (data: {
    user_id: string;
    branch_id?: string | null;
    role: string;
    is_primary?: boolean;
  }) => http.post<AssignmentResponse>('/accounts/assignments/', data),

  update: (id: string, data: { is_primary?: boolean; is_active?: boolean }) =>
    http.patch<AssignmentResponse>(`/accounts/assignments/${id}/`, data),

  delete: (id: string) => http.delete(`/accounts/assignments/${id}/`),

  makePrimary: (id: string) =>
    http.post(`/accounts/assignments/${id}/make-primary/`, {}),

  transfer: (data: {
    user_id: string;
    from_branch_id: string;
    to_branch_id: string;
    role: string;
  }) => http.post('/accounts/assignments/transfer/', data),
};
