import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3, Users, Shield, Settings, FileText, Bell, Activity,
  Plus, RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle,
  BookOpen, MessageSquare, GraduationCap, Award, DollarSign, Building,
  Handshake, UserCog, Swords, Medal, Wrench, ClipboardList, Cpu, Star, Target,
  Edit3, Trash2, Eye, EyeOff, Search, Filter, Download, ChevronDown, Save, X,
  UserPlus, UserCheck, UserX, Lock, Globe, Zap, TrendingUp, TrendingDown,
  Mail, Phone, MapPin, Camera, Sparkles, Send, Loader2, Archive, LayoutDashboard, GitBranch, BellOff, CheckCircle2
} from 'lucide-react';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import CmsDashboard from '@/src/domains/cms/admin/ui/CmsDashboard';
import { NavItem } from '@/src/shared/ui/Sidebar';
import { BranchSectionShell } from '@/src/domains/branches/ui/BranchSectionShell';
import AcademicCatalogManager from '@/src/domains/learning/academics/ui/AcademicCatalogManager';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import type { UserProfile, AppNotification, Enrollment, EnrollmentPayment } from '@/src/shared/types';
import { fetchEnrollmentsApi, fetchPaymentsApi } from '@/src/domains/learning/academics/api/academicApi';
import {
  fetchUsersApi,
  toggleUserStatusApi,
  archiveUserApi,
  createStaffApi,
  createBranchManagerApi,
  updateUserApi,
  resolveRole,
  formatRelativeTime,
  formatJoinDate,
  branchesApi,
  assignmentsApi,
  type AdminUserResponse,
  type PaginatedResponse,
  type BranchResponse,
  type AssignmentResponse,
} from '../api/adminApi';
import { getNotifications } from '@/src/domains/notification/model/notificationApi';
import UserManagementPanel from './UserManagementPanel';
import AdminAccount from './AdminAccount';
import SystemHealth from './SystemHealth';
import SystemLogs from './SystemLogs';
import AdminOverviewDashboard from './AdminOverviewDashboard';

interface Props { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'overview' | 'users' | 'roles' | 'academics' | 'account' | 'audit' | 'branches' | 'registrations' | 'cms';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3, group: 'main' },
  { id: 'users', label: 'Accounts & Users', icon: Users, group: 'main' },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield, group: 'main' },
  { id: 'academics', label: 'Academic Catalog', icon: GraduationCap, group: 'main' },
  { id: 'registrations', label: 'Enrollments', icon: ClipboardList, group: 'main' },
  { id: 'branches', label: 'Branches', icon: GitBranch, group: 'main' },
  { id: 'cms', label: 'Content Manager', icon: LayoutDashboard, group: 'main' },
  { id: 'audit', label: 'System Logs', icon: FileText, group: 'system' },
  { id: 'account', label: 'My Account', icon: Shield, group: 'system' },
];

const pageTitle: Record<SectionId, string> = {
  overview: 'Dashboard', users: 'User Management', roles: 'Roles & Permissions',
  academics: 'Academic Catalog',
  branches: 'Branch Management', registrations: 'Registration Management',
  audit: 'Audit Logs',
  cms: 'Content Management', account: 'My Account',
};

/* ─── HELPERS ─── */
const roleBadge = (role: string) => {
  const colors: Record<string, string> = {
    Admin: 'bg-purple-50 text-purple-600',
    Manager: 'bg-amber-50 text-amber-600',
    Instructor: 'bg-blue-50 text-blue-600',
    Secretary: 'bg-rose-50 text-rose-600',
    Student: 'bg-emerald-50 text-emerald-600',
    Parent: 'bg-emerald-50 text-emerald-600',
  };
  return colors[role] || 'bg-slate-50 text-slate-600';
};

const statusDisplay = (s: string) => {
  const colors: Record<string, string> = {
    Active: 'text-emerald-600',
    Suspended: 'text-red-600',
    Pending: 'text-amber-600',
    Archived: 'text-slate-500',
  };
  const dots: Record<string, string> = {
    Active: 'bg-emerald-500',
    Suspended: 'bg-red-500',
    Pending: 'bg-amber-500',
    Archived: 'bg-slate-400',
  };
  return { color: colors[s] || 'text-slate-600', dot: dots[s] || 'bg-slate-400' };
};

/* ─── MODAL (extracted to prevent unmount on parent re-render) ─── */
const Modal = React.memo(({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-lg text-slate-900">{title}</h3><button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
      {children}
    </div>
  </div>
));

/* ─── PAGE SECTIONS ─── */
function Overview() {
  const stats = [
    { label: 'Total Users', value: '486', icon: Users, change: '+12 this week', color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
    { label: 'Active Students', value: '342', icon: GraduationCap, change: '70% of total', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Instructors', value: '24', icon: Award, change: '3 pending', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Revenue (MTD)', value: '890K ETB', icon: DollarSign, change: '+23.6%', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Platform Uptime', value: '99.97%', icon: Activity, change: 'Last 30 days', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Programs', value: '12', icon: BookOpen, change: '8 running', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];
  const recentActivity = [
    { text: 'New user registered: Hana M.', time: '12 min ago', type: 'create' },
    { text: 'System backup completed', time: '3 hours ago', type: 'system' },
    { text: 'Yonas D. account suspended', time: '5 hours ago', type: 'update' },
    { text: 'Forum post flagged for review', time: '8 hours ago', type: 'alert' },
    { text: 'Certificate #AWRD-00006 generated', time: '1 day ago', type: 'create' },
  ];
  const activityIcons: Record<string, React.ElementType> = { create: Plus, system: RefreshCw, alert: AlertTriangle, update: Clock };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow-sm transition-shadow"
            >
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2.5`}><SIcon className={`w-4 h-4 ${s.color}`} /></div>
              <p className="text-lg sm:text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.change}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((a, i) => {
              const ActIcon = activityIcons[a.type] || Clock;
              return (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0"><ActIcon className="w-3.5 h-3.5" /></div>
                  <div className="min-w-0 flex-1"><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400 mt-0.5">{a.time}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-4">User Distribution</h3>
          <div className="space-y-3">
            {[{ role: 'Students', count: 342, pct: 70 }, { role: 'Instructors', count: 24, pct: 5 }, { role: 'Managers', count: 6, pct: 1.2 }, { role: 'Parents', count: 114, pct: 23.5 }].map(r => (
              <div key={r.role} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-20 shrink-0">{r.role}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${r.role === 'Students' ? 'bg-slate-800' : r.role === 'Instructors' ? 'bg-purple-500' : r.role === 'Managers' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <span className="text-sm font-semibold text-slate-600 w-12 text-right">{r.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-xs text-slate-500">Avg. Session</p><p className="text-sm font-bold text-slate-900">24m 30s</p></div>
            <div className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-xs text-slate-500">Bounce Rate</p><p className="text-sm font-bold text-slate-900">12.4%</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserManagement({ userRole }: { userRole?: string }) {
  const [data, setData] = useState<PaginatedResponse<AdminUserResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<AdminUserResponse | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUserResponse | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [formData, setFormData] = useState({
    email: '', first_name: '', last_name: '', password: '', branch_id: '', role: 'instructor',
    phone_number: '', gender: '', date_of_birth: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, branchRes] = await Promise.all([
        fetchUsersApi(),
        branchesApi.list().catch(() => null),
      ]);
      setData(userRes);
      if (branchRes) setBranches(branchRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (u: AdminUserResponse) => {
    setToggling(u.id);
    try {
      await toggleUserStatusApi(u.id, u.status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setToggling(null);
    }
  };

  const handleArchive = async (u: AdminUserResponse) => {
    setArchiving(u.id);
    try {
      await archiveUserApi(u.id);
      setConfirmArchive(null);
      setSelectedIds(prev => { const next = new Set(prev); next.delete(u.id); return next; });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to archive user');
    } finally {
      setArchiving(null);
    }
  };

  const handleBulkToggle = async (activate: boolean) => {
    setBulkProcessing(true);
    setError(null);
    let success = 0;
    for (const id of selectedIds) {
      const user = filtered.find(u => u.id === id);
      if (!user) continue;
      const shouldToggle = activate ? user.status !== 'Active' : user.status === 'Active';
      if (!shouldToggle) { success++; continue; }
      try {
        await toggleUserStatusApi(id, user.status);
        success++;
      } catch { /* skip failed */ }
    }
    setSelectedIds(new Set());
    setBulkProcessing(false);
    await load();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(u => u.id)));
    }
  };

  const minPwLength = formData.role === 'super_admin' ? 6 : 8;

  const validatePassword = (pw: string): string | null => {
    if (pw.length < minPwLength) return `Password must be at least ${minPwLength} characters`;
    return null;
  };

  const handleAdd = async () => {
    setError(null);
    const email = formData.email.trim();
    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();

    if (!email || !firstName || !lastName) {
      setError('Email, first name, and last name are required.');
      return;
    }
    if (!formData.branch_id) {
      setError('Please select a branch before creating this user.');
      return;
    }
    if (formData.role === 'branch_manager' && userRole !== 'Admin') {
      setError('Only an Admin can create a branch manager account.');
      return;
    }

    const pwError = validatePassword(formData.password);
    if (pwError) {
      setError(pwError);
      return;
    }
    try {
      const extra = { phone_number: formData.phone_number || undefined, gender: formData.gender || undefined, date_of_birth: formData.date_of_birth || undefined };
      if (formData.role === 'branch_manager') {
        await createBranchManagerApi({
          email,
          first_name: firstName,
          last_name: lastName,
          password: formData.password,
          branch_id: formData.branch_id,
          ...extra,
        });
      } else {
        await createStaffApi({
          email,
          first_name: firstName,
          last_name: lastName,
          password: formData.password,
          branch_id: formData.branch_id,
          role: formData.role,
          ...extra,
        });
      }
      setShowAddModal(false);
      setFormData({ email: '', first_name: '', last_name: '', password: '', branch_id: '', role: 'instructor', phone_number: '', gender: '', date_of_birth: '' });
      await load();
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Failed to create user';
      if (msg.includes('Branch manager already exists')) {
        msg = 'This branch already has an active manager. Please choose a different branch or re-assign the manager.';
      }
      setError(msg);
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    try {
      await updateUserApi(editingUser.id, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        phone_number: editingUser.phone_number || null,
        gender: editingUser.gender || null,
        date_of_birth: editingUser.date_of_birth || null,
      });
      setEditingUser(null);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update user';
      if (msg.includes('permission') || msg.includes('403') || msg.includes('not allowed')) {
        setError('You do not have permission to edit this user. Contact a super admin.');
      } else {
        setError(msg);
      }
    }
  };

  const filtered = useMemo(() => {
    let list = data?.results ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') {
      list = list.filter(u => resolveRole(u.assignments).toLowerCase() === roleFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(u => u.status.toLowerCase() === statusFilter);
    }
    return list;
  }, [data, search, roleFilter, statusFilter]);

  const userStats = useMemo(() => {
    const users = data?.results ?? [];
    return {
      active: users.filter(u => u.status === 'Active').length,
      pending: users.filter(u => u.status === 'Pending').length,
      suspended: users.filter(u => u.status === 'Suspended').length,
      archived: users.filter(u => u.status === 'Archived').length,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: 'Active', value: userStats.active, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending', value: userStats.pending, color: 'text-amber-600 bg-amber-50' },
          { label: 'Suspended', value: userStats.suspended, color: 'text-red-600 bg-red-50' },
          { label: 'Archived', value: userStats.archived, color: 'text-slate-600 bg-slate-100' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`mb-2 inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide ${stat.color}`}>{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400">accounts in current page</p>
          </div>
        ))}
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-brand-blue/30">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="secretary">Secretary</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-brand-blue/30">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </select>
            {data && <span className="text-xs text-slate-400">{data.count} total</span>}
            <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-sm font-extrabold hover:bg-brand-red-dark shadow-md hover:shadow-lg"><UserPlus className="w-4 h-4" /> Add User</button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-blue/5 border border-brand-blue/20 rounded-lg">
            <span className="text-xs font-semibold text-slate-600">{selectedIds.size} selected</span>
            <div className="h-3 w-px bg-slate-200" />
            <button onClick={() => handleBulkToggle(true)} disabled={bulkProcessing} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50">
              {bulkProcessing ? 'Processing...' : 'Activate All'}
            </button>
            <button onClick={() => handleBulkToggle(false)} disabled={bulkProcessing} className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
              {bulkProcessing ? 'Processing...' : 'Deactivate All'}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 ml-auto">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} className="rounded border-slate-300" />
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">Last Active</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No users found</td></tr>
            ) : filtered.map(u => {
              const role = resolveRole(u.assignments);
              const sd = statusDisplay(u.status);
              return (
                <tr key={u.id} className={`hover:bg-slate-50/50 ${selectedIds.has(u.id) ? 'bg-brand-blue/[0.02]' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded border-slate-300" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">{u.full_name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0"><div className="font-medium text-slate-900 truncate max-w-[180px]">{u.full_name}</div><div className="text-xs text-slate-400 truncate max-w-[180px]">{u.email}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-lg ${roleBadge(role)}`}>{role}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className={`flex items-center gap-1.5 text-xs font-semibold ${sd.color}`}><span className={`w-1.5 h-1.5 rounded-full ${sd.dot}`} />{u.status.charAt(0).toUpperCase() + u.status.slice(1)}</span></td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatJoinDate(u.date_joined)}</td>
                  <td className="px-4 py-3 text-slate-500 hidden xl:table-cell">{formatRelativeTime(u.last_login)}</td>
                  <td className="px-4 py-3">
                    {userRole === 'Admin' || userRole === 'Manager' ? (
                      <div className="flex gap-1">
                        <button onClick={() => setViewingUser(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingUser(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleToggle(u)} disabled={toggling === u.id} className={`p-1.5 rounded-lg ${toggling === u.id ? 'text-slate-300' : u.status === 'Active' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={u.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          {toggling === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        {u.status !== 'Archived' && (
                          <button onClick={() => setConfirmArchive(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" title="Archive">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <Modal title="Add Staff User" onClose={() => setShowAddModal(false)}>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Email</label><input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. yonas.tadesse@email.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">First Name</label><input value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. Yonas" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Last Name</label><input value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. Tadesse" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Phone</label><input value={formData.phone_number} onChange={e => setFormData(p => ({ ...p, phone_number: e.target.value }))} placeholder="e.g. +251-911-000000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Gender</label>
                <select value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Date of Birth</label><input type="date" value={formData.date_of_birth} onChange={e => setFormData(p => ({ ...p, date_of_birth: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. ••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1.5 space-y-1">
                {[`At least ${minPwLength} characters`].map((req) => {
                  const met = formData.password.length >= minPwLength;
                  return (
                    <div key={req} className={`flex items-center gap-1.5 text-xs ${formData.password ? (met ? 'text-green-600' : 'text-red-500') : 'text-slate-400'}`}>
                      <span>{met ? '✓' : '○'}</span> {req}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Role</label>
                <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                  <option value="instructor">Instructor</option>
                  <option value="secretary">Secretary</option>
                  <option value="student">Student</option>
                  {userRole === 'Admin' && <option value="branch_manager">Branch Manager</option>}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Branch</label>
                <select value={formData.branch_id} onChange={e => setFormData(p => ({ ...p, branch_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                  <option value="">Select branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!formData.branch_id} className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-50">Create</button>
            </div>
          </div>
        </Modal>
      )}

      {editingUser && (
        <Modal title="Edit User" onClose={() => setEditingUser(null)}>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Email</label><input value={editingUser.email} onChange={e => setEditingUser(p => p ? { ...p, email: e.target.value } : p)} placeholder="e.g. yonas.tadesse@email.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">First Name</label><input value={editingUser.first_name} onChange={e => setEditingUser(p => p ? { ...p, first_name: e.target.value } : p)} placeholder="e.g. Yonas" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Last Name</label><input value={editingUser.last_name} onChange={e => setEditingUser(p => p ? { ...p, last_name: e.target.value } : p)} placeholder="e.g. Tadesse" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Phone</label><input value={editingUser.phone_number || ''} onChange={e => setEditingUser(p => p ? { ...p, phone_number: e.target.value } : p)} placeholder="e.g. +251-911-000000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Gender</label>
                <select value={editingUser.gender || ''} onChange={e => setEditingUser(p => p ? { ...p, gender: e.target.value } : p)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Date of Birth</label><input type="date" value={editingUser.date_of_birth || ''} onChange={e => setEditingUser(p => p ? { ...p, date_of_birth: e.target.value } : p)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingUser(null)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {viewingUser && (
        <Modal title="User Details" onClose={() => setViewingUser(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-black text-slate-600 shrink-0">
                {viewingUser.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-slate-900">{viewingUser.full_name}</h3>
                <p className="text-sm text-slate-500">{viewingUser.email}</p>
              </div>
              <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-lg ${statusDisplay(viewingUser.status).color} ${statusDisplay(viewingUser.status).color.replace('text-', 'bg-').replace('600', '50')}`}>
                {viewingUser.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">First Name</span><span className="text-slate-900 font-medium">{viewingUser.first_name || '—'}</span></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Name</span><span className="text-slate-900 font-medium">{viewingUser.last_name || '—'}</span></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone</span><span className="text-slate-900 font-medium">{viewingUser.phone_number || '—'}</span></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span><span className="text-slate-900 font-medium">{viewingUser.gender || '—'}</span></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span><span className="text-slate-900 font-medium">{viewingUser.date_of_birth || '—'}</span></div>
              <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Verified</span><span className={`font-medium ${viewingUser.is_email_verified ? 'text-emerald-600' : 'text-amber-600'}`}>{viewingUser.is_email_verified ? 'Yes' : 'No'}</span></div>
              <div className="col-span-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joined</span><span className="text-slate-900 font-medium">{formatJoinDate(viewingUser.created_at)}</span></div>
            </div>
            {viewingUser.assignments && viewingUser.assignments.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Role Assignments</span>
                <div className="flex flex-wrap gap-2">
                    {viewingUser.assignments.map(a => {
                    const badge = roleBadge(a.role === 'super_admin' ? 'Admin' : a.role === 'branch_manager' ? 'Manager' : a.role === 'secretary' ? 'Secretary' : a.role === 'instructor' ? 'Instructor' : 'Student');
                    return (
                      <span key={a.id} className={`text-xs font-semibold px-2 py-1 rounded-lg ${badge}`}>
                        {a.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        {a.branch_name && ` @ ${a.branch_name}`}
                        {a.is_primary && ' ⭐'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingUser(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmArchive && (
        <Modal title="Archive User" onClose={() => setConfirmArchive(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to archive <strong>{confirmArchive.full_name}</strong>?
              This will suspend their account and remove access.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmArchive(null)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleArchive(confirmArchive)} disabled={archiving === confirmArchive.id} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {archiving === confirmArchive.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                {archiving === confirmArchive.id ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
}

const PERMISSIONS: Record<string, { label: string; permissions: string[] }> = {
  super_admin: {
    label: 'Admin',
    permissions: [
      'Full user management (create, edit, suspend, archive)',
      'Branch management (create, edit, archive schools)',
      'Role & assignment management',
      'System settings & configuration',
      'Audit log access',
      'Content moderation',
      'All platform resources',
    ],
  },
  branch_manager: {
    label: 'Manager',
    permissions: [
      'Manage branch users & staff',
      'View & manage branch registrations',
      'Manage local content & announcements',
      'View branch analytics',
      'Assign instructor roles (branch scope)',
    ],
  },
  secretary: {
    label: 'Secretary',
    permissions: [
      'Process student admissions & enrollments',
      'Manage payments & receipts',
      'Issue certificates',
      'Manage daily branch operations',
      'View student records',
    ],
  },
  instructor: {
    label: 'Instructor',
    permissions: [
      'Create & manage courses',
      'Grade students & track progress',
      'Moderate forum content',
      'Create announcements',
      'View student analytics',
    ],
  },
  student: {
    label: 'Student',
    permissions: [
      'Access enrolled courses',
      'Participate in forums & discussions',
      'Shop in the store',
      'View certificates & achievements',
      'Track personal progress',
    ],
  },
};

function RolesPermissions() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [showPerms, setShowPerms] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editAssign, setEditAssign] = useState<AssignmentResponse | null>(null);
  const [assignForm, setAssignForm] = useState({ user_id: '', branch_id: '', role: 'instructor', is_primary: false });
  const [userSearch, setUserSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, branchArr, assignArr] = await Promise.all([
        fetchUsersApi(),
        branchesApi.list().catch(() => [] as BranchResponse[]),
        assignmentsApi.list().catch(() => [] as AssignmentResponse[]),
      ]);
      setUsers(userRes.results ?? []);
      setBranches(branchArr);
      setAssignments(assignArr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load role data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const roleDefs = [
    { key: 'super_admin', label: 'Admin', plural: 'Admins', weight: 'high', icon: Shield, desc: 'Full system access. Manage users, branches, settings, and all platform resources.' },
    { key: 'branch_manager', label: 'Manager', plural: 'Managers', weight: 'high', icon: Building, desc: 'Manage branch operations, users, registrations, and local content.' },
    { key: 'secretary', label: 'Secretary', plural: 'Secretaries', weight: 'mid', icon: ClipboardList, desc: 'Handle admissions, enrollments, payments, certificates, and daily operations.' },
    { key: 'instructor', label: 'Instructor', plural: 'Instructors', weight: 'mid', icon: GraduationCap, desc: 'Create and manage courses, grade students, moderate forum content.' },
    { key: 'student', label: 'Student', plural: 'Students', weight: 'low', icon: Users, desc: 'Access courses, participate in forums, shop in store, view certificates.' },
  ] as const;

  const getUsersByRole = (roleKey: string) =>
    users.filter(u => u.assignments?.some(a => a.role === roleKey && a.is_active !== false));

  const getAssignmentsByRole = (roleKey: string) =>
    assignments.filter(a => a.role === roleKey && a.is_active !== false);

  const unassignedUsers = users.filter(u =>
    !u.assignments?.some(a => a.is_active !== false)
  );

  const userOptions = users.filter(u =>
    !u.assignments?.some(a => a.role === assignForm.role && a.is_active !== false)
  );

  const filteredUserOptions = userSearch
    ? userOptions.filter(u =>
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : userOptions;

  const handleAssignRole = async () => {
    try {
      await assignmentsApi.create({
        user_id: assignForm.user_id,
        branch_id: assignForm.branch_id || null,
        role: assignForm.role,
        is_primary: assignForm.is_primary,
      });
      setShowAssignModal(false);
      setAssignForm({ user_id: '', branch_id: '', role: 'instructor', is_primary: false });
      setUserSearch('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign role');
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editAssign) return;
    try {
      await assignmentsApi.update(editAssign.id, {
        is_primary: editAssign.is_primary,
        is_active: editAssign.is_active,
      });
      setEditAssign(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update assignment');
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await assignmentsApi.delete(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove assignment');
    }
  };

  const roleMap = Object.fromEntries(roleDefs.map(r => [r.key, r]));

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  // Calculate stats for signature element
  const total = users.length || 1; // prevent div by zero
  const weightColors = { high: 'bg-slate-900', mid: 'bg-slate-400', low: 'bg-slate-200' };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Signature Element: Proportional Distribution Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{users.length}</h2>
            <p className="text-sm font-medium text-slate-500">Total System Users</p>
          </div>
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-px">
            <Plus className="w-4 h-4" /> Assign Role
          </button>
        </div>

        {/* The Bar */}
        <div className="flex w-full h-3 rounded-full overflow-hidden mb-4 bg-slate-50 shadow-inner">
          {roleDefs.map(r => {
            const count = getUsersByRole(r.key).length;
            const width = (count / total) * 100;
            if (width === 0) return null;
            return <div key={r.key} style={{ width: `${width}%` }} className={`${weightColors[r.weight]} border-r border-white/20 last:border-r-0 transition-all`} title={`${r.plural}: ${count}`} />
          })}
          {unassignedUsers.length > 0 && (
            <div style={{ width: `${(unassignedUsers.length / total) * 100}%` }} className="bg-red-200 transition-all" title={`Unassigned: ${unassignedUsers.length}`} />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {roleDefs.map(r => {
            const count = getUsersByRole(r.key).length;
            return (
              <div key={r.key} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${weightColors[r.weight]}`} />
                <span className="font-medium text-slate-600">{r.plural}</span>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
            );
          })}
          {unassignedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-200" />
              <span className="font-medium text-slate-600">Unassigned</span>
              <span className="font-bold text-slate-900">{unassignedUsers.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Unassigned Users Callout */}
      {unassignedUsers.length > 0 && (
        <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{unassignedUsers.length} pending user{unassignedUsers.length !== 1 && 's'}</h4>
              <p className="text-xs text-slate-600 mt-0.5">These users have registered but have no role assignment.</p>
            </div>
          </div>
          <button onClick={() => { setAssignForm(p => ({ ...p, role: 'student' })); setShowAssignModal(true); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 transition-colors shrink-0">
            Review Unassigned
          </button>
        </div>
      )}

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roleDefs.map(r => {
          const roleUsers = getUsersByRole(r.key);
          const roleAssignments = getAssignmentsByRole(r.key);
          const Icon = r.icon;
          const isExpanded = expandedRole === r.key;
          const permsOpen = showPerms === r.key;
          const permDef = PERMISSIONS[r.key] || { permissions: [] };

          const filteredRoleUsers = roleSearch && isExpanded
            ? roleUsers.filter(u =>
                u.full_name.toLowerCase().includes(roleSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(roleSearch.toLowerCase())
              )
            : roleUsers;

          const branchCounts = [...new Set(roleAssignments.map(a => a.branch?.id).filter(Boolean))].length;

          // Distinct weight styling
          const cardClass = r.weight === 'high'
            ? 'bg-white border-2 border-slate-900 shadow-sm'
            : r.weight === 'mid'
            ? 'bg-white border border-slate-200 shadow-sm'
            : 'bg-slate-50 border border-slate-200 border-dashed';

          const iconClass = r.weight === 'high'
            ? 'bg-slate-900 text-white'
            : r.weight === 'mid'
            ? 'bg-slate-100 text-slate-700'
            : 'bg-transparent text-slate-400 border border-slate-200';

          return (
            <div key={r.key} className={`rounded-xl overflow-hidden transition-all duration-200 ${cardClass} flex flex-col`}>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 tracking-tight">{r.label}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                        <span>{roleUsers.length} user{roleUsers.length !== 1 && 's'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{branchCounts} branch{branchCounts !== 1 && 'es'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Empty state explicit indicator if high/mid weight */}
                  {roleUsers.length === 0 && r.weight !== 'low' && (
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase tracking-wider rounded-md">Empty</span>
                  )}
                </div>

                <p className="text-sm text-slate-600 mb-5 leading-relaxed">{r.desc}</p>

                {roleUsers.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-lg border border-slate-100 mt-auto">
                    <p className="text-sm font-semibold text-slate-700">No {r.plural.toLowerCase()} assigned</p>
                    <p className="text-xs text-slate-500 mb-3 mt-1">Assign users to this role to grant them access.</p>
                    <button
                      onClick={() => { setAssignForm(p => ({ ...p, role: r.key })); setShowAssignModal(true); }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Assign {r.label}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* User Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roleAssignments.slice(0, 4).map(a => {
                        const nameParts = (a.user?.full_name || '').split(' ');
                        const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0]?.[0] || '?';
                        return (
                          <div key={a.id} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md p-1.5 pr-2.5 transition-colors cursor-pointer" onClick={() => setEditAssign(a)}>
                            <div className="w-6 h-6 rounded bg-slate-200 text-[9px] font-bold flex items-center justify-center text-slate-600 shrink-0 uppercase">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-semibold text-slate-900 leading-tight truncate">{a.user?.full_name?.split(' ')[0]}</span>
                              <span className="text-[9px] text-slate-500 leading-tight truncate">{a.branch?.name?.slice(0, 15) || 'Global'}</span>
                            </div>
                          </div>
                        );
                      })}
                      {roleAssignments.length > 4 && (
                        <div className="flex items-center justify-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-500">
                          +{roleAssignments.length - 4}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { setExpandedRole(isExpanded ? null : r.key); setRoleSearch(''); }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'Manage'} Users
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => setShowPerms(permsOpen ? null : r.key)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {permsOpen ? 'Hide' : 'View'} Policies
                      </button>
                    </div>
                  </>
                )}

                {/* Policies Drawer */}
                <AnimatePresence>
                  {permsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Granted Permissions</p>
                        {permDef.permissions.map(p => (
                          <div key={p} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Expanded User List */}
              <AnimatePresence>
                {isExpanded && roleUsers.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-200 bg-slate-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          value={roleSearch}
                          onChange={e => setRoleSearch(e.target.value)}
                          placeholder={`Search ${r.plural.toLowerCase()}...`}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-shadow"
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
                      {filteredRoleUsers.length === 0 ? (
                        <p className="p-4 text-xs text-center text-slate-500 font-medium">No matches found.</p>
                      ) : filteredRoleUsers.map(u => {
                        const userAssignments = assignments.filter(a => a.role === r.key && a.user?.id === u.id && a.is_active !== false);
                        const nameParts = u.full_name.split(' ');
                        const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0]?.[0] || '?';
                        return (
                          <div key={u.id} className="p-3 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 uppercase">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{u.full_name}</p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {userAssignments.map(a => (
                                    <span key={a.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-600">
                                      {a.branch?.name ? <><Building className="w-2.5 h-2.5 text-slate-400" />{a.branch.name}</> : 'Global Access'}
                                      {a.is_primary && <Star className="w-2.5 h-2.5 text-amber-500" />}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 ml-2">
                              {userAssignments.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => setEditAssign(a)}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                                >
                                  Edit Access
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Assign Role Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight">Assign Role</h3>
                  <p className="text-xs text-slate-500 mt-1">Grant platform access to a registered user.</p>
                </div>
                <button onClick={() => { setShowAssignModal(false); setUserSearch(''); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Select User</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {filteredUserOptions.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500 text-center font-medium">No available users found.</p>
                    ) : filteredUserOptions.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setAssignForm(p => ({ ...p, user_id: u.id }))}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${assignForm.user_id === u.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 uppercase ${assignForm.user_id === u.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {u.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{u.full_name}</p>
                          <p className={`text-[11px] truncate ${assignForm.user_id === u.id ? 'text-slate-300' : 'text-slate-500'}`}>{u.email}</p>
                        </div>
                        {assignForm.user_id === u.id && <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Role</label>
                      <select value={assignForm.role} onChange={e => setAssignForm(p => ({ ...p, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow">
                        {roleDefs.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Branch Restriction</label>
                    <select value={assignForm.branch_id} onChange={e => setAssignForm(p => ({ ...p, branch_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow">
                      <option value="">Global Access (All)</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors mt-2">
                  <input type="checkbox" checked={assignForm.is_primary} onChange={e => setAssignForm(p => ({ ...p, is_primary: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Set as Primary Role</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">This determines the user's default dashboard and badges.</p>
                  </div>
                </label>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => { setShowAssignModal(false); setUserSearch(''); }}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Cancel</button>
                  <button onClick={handleAssignRole} disabled={!assignForm.user_id || !assignForm.role}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm">Confirm Assignment</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Assignment Modal */}
      <AnimatePresence>
        {editAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setEditAssign(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight">Edit Access</h3>
                  <p className="text-xs text-slate-500 mt-1">Modify existing role assignment.</p>
                </div>
                <button onClick={() => setEditAssign(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">User</span>
                    <span className="font-bold text-slate-900">{editAssign.user?.full_name || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Role</span>
                    <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-200 rounded-md text-xs">{roleMap[editAssign.role]?.label || editAssign.role}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Scope</span>
                    <span className="font-bold text-slate-900">{editAssign.branch?.name || 'Global Access'}</span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={editAssign.is_primary}
                      onChange={e => setEditAssign(p => p ? { ...p, is_primary: e.target.checked } : p)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Primary Role <Star className="inline w-3.5 h-3.5 text-amber-500 mb-0.5" /></p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={editAssign.is_active}
                      onChange={e => setEditAssign(p => p ? { ...p, is_active: e.target.checked } : p)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Active Status</p>
                    </div>
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-slate-100 items-center">
                  <button onClick={() => handleRemoveAssignment(editAssign.id)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5 transition-colors shadow-sm">
                    <Trash2 className="w-4 h-4" /> Revoke
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => setEditAssign(null)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Cancel</button>
                  <button onClick={handleUpdateAssignment}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">Save Changes</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContentModeration() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [queueFilter, setQueueFilter] = useState<'all' | 'Forum' | 'Community' | 'Media'>('all');
  const [resolved, setResolved] = useState<string[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const initialFlags = [
    { id: 'f1', title: 'Inappropriate language in thread', author: 'FlagBot', post: 'Re: How to tune PID', date: '2 hours ago', severity: 'high' as const, queue: 'Forum' as const, excerpt: 'This comment used language that may violate student safety rules.', reporter: 'Auto-flag', action: 'Pending' as const },
    { id: 'f2', title: 'Spam promotional content', author: 'Coach Nebil', post: 'Cheap robots for sale!', date: '5 hours ago', severity: 'high' as const, queue: 'Community' as const, excerpt: 'External sales link detected in a student discussion thread.', reporter: 'Coach Nebil', action: 'Pending' as const },
    { id: 'f3', title: 'Off-topic discussion', author: 'Student Kelby', post: 'General chat thread', date: '1 day ago', severity: 'low' as const, queue: 'Forum' as const, excerpt: 'Thread drifted away from the assigned robotics challenge.', reporter: 'Student Kelby', action: 'Pending' as const },
    { id: 'f4', title: 'Unverified event photo', author: 'Media Review', post: 'Workshop gallery upload', date: '2 days ago', severity: 'medium' as const, queue: 'Media' as const, excerpt: 'Photo includes students and needs publishing confirmation.', reporter: 'Auto-flag', action: 'Pending' as const },
    { id: 'f5', title: 'Duplicate user account', author: 'Admin System', post: 'Registration #9821', date: '3 days ago', severity: 'medium' as const, queue: 'Community' as const, excerpt: 'Multiple accounts detected from same IP address with different names.', reporter: 'Admin System', action: 'Pending' as const },
    { id: 'f6', title: 'Copyrighted material', author: 'Coach Hanna', post: 'VEX CAD files', date: '4 days ago', severity: 'high' as const, queue: 'Media' as const, excerpt: 'Uploaded CAD files appear to be from a restricted source.', reporter: 'Coach Hanna', action: 'Pending' as const },
  ];

  const [flags, setFlags] = useState(initialFlags);

  const severityColor: Record<string, string> = {
    high: 'text-red-600 bg-red-50 border-red-100',
    medium: 'text-amber-600 bg-amber-50 border-amber-100',
    low: 'text-slate-600 bg-slate-100 border-slate-200'
  };
  const queueColor: Record<string, string> = {
    Forum: 'bg-blue-50 text-blue-600',
    Community: 'bg-purple-50 text-purple-600',
    Media: 'bg-emerald-50 text-emerald-600',
  };

  const visible = flags.filter(f =>
    !resolved.includes(f.id) &&
    (filter === 'all' || f.severity === filter) &&
    (queueFilter === 'all' || f.queue === queueFilter) &&
    (!searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.post.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = [
    { label: 'Open Flags', value: String(flags.length - resolved.length), detail: 'pending review', icon: AlertTriangle, tone: 'amber' as const },
    { label: 'High Risk', value: String(flags.filter(f => f.severity === 'high' && !resolved.includes(f.id)).length), detail: 'needs immediate attention', icon: XCircle, tone: 'red' as const },
    { label: 'Media Queue', value: String(flags.filter(f => f.queue === 'Media' && !resolved.includes(f.id)).length), detail: 'publish review', icon: Camera, tone: 'blue' as const },
    { label: 'Resolved', value: String(resolved.length), detail: 'actions taken this session', icon: CheckCircle, tone: 'emerald' as const },
  ];

  const handleAction = (id: string, action: 'approve' | 'remove' | 'warn') => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, action: action === 'approve' ? 'Approved' as const : action === 'remove' ? 'Removed' as const : 'Warned' as const } : f));
    setResolved(prev => [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <DashboardCommandCenter title="Moderation Queue" subtitle="Review flagged content, user reports, and media before publishing." signals={stats} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search flags..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-red/40 transition-all" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map(level => (
            <button key={level} onClick={() => setFilter(level)}
              className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${filter === level ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}>
              {level}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {(['all', 'Forum', 'Community', 'Media'] as const).map(q => (
            <button key={q} onClick={() => setQueueFilter(q)}
              className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${queueFilter === q ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-slate-600'}`}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {visible.map(f => {
        const isSelected = selectedFlag === f.id;
        return (
          <motion.div key={f.id} layout className={`bg-white border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-brand-red/40 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedFlag(isSelected ? null : f.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900">{f.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${queueColor[f.queue]}`}>{f.queue}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${severityColor[f.severity]}`}>{f.severity}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">in <span className="font-medium text-slate-700">{f.post}</span></p>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3">
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{f.excerpt}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Flagged by <strong className="text-slate-600">{f.reporter}</strong></span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {f.date}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  <button onClick={() => handleAction(f.id, 'approve')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-all whitespace-nowrap">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleAction(f.id, 'remove')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-all whitespace-nowrap">
                    <XCircle className="w-3.5 h-3.5" /> Remove
                  </button>
                  <button onClick={() => handleAction(f.id, 'warn')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-all whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5" /> Warn
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {visible.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
          <p className="text-sm font-semibold text-slate-700">All clear!</p>
          <p className="text-xs text-slate-400 mt-1">No pending moderation items match your filters.</p>
        </motion.div>
      )}

      {resolved.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="px-4 py-3 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-700 transition-colors select-none">
            Resolved ({resolved.length}) — click to expand
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {flags.filter(f => resolved.includes(f.id)).map(f => (
              <div key={f.id} className="flex items-center justify-between py-1.5 border-t border-slate-100 first:border-0">
                <span className="text-xs text-slate-600">{f.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  f.action === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                  f.action === 'Warned' ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-600'
                }`}>{f.action}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function NotificationsPanel() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const handleDismiss = async (id: string) => {
    const { dismissNotification } = await import('@/src/domains/notification/model/notificationApi');
    await dismissNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const timeAgo = (ts: string) => {
    if (!ts.startsWith('20')) return ts;
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'all' ? 'bg-brand-red text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>All</button>
          <button onClick={() => setActiveTab('unread')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'unread' ? 'bg-brand-red text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Unread</button>
        </div>
        <span className="text-xs text-slate-400">{notifications.length} total</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
          <BellOff className="w-8 h-8 text-slate-300" />
          <span className="text-xs font-semibold text-slate-500">All caught up!</span>
        </div>
      ) : filtered.map(n => (
        <div key={n.id} className={`group bg-white border ${n.read ? 'border-slate-200' : 'border-brand-red/20 bg-brand-red/[0.02]'} rounded-xl p-4 sm:p-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-slate-900">{n.title}</h3>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand-red shrink-0" />}
              </div>
              <p className="text-sm text-slate-500 mt-1">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1.5">{n.timestamp.startsWith('20') ? timeAgo(n.timestamp) : n.timestamp}</p>
            </div>
            <button
              onClick={() => handleDismiss(n.id)}
              className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SystemSettings() {
  const [settings, setSettings] = useState({
    'Site Name': 'Ethio Robotics Academy',
    'Tagline': 'Empowering the Next Generation of Engineers',
    'Language': 'English',
    'Two-Factor Auth': true,
    'Password Policy': 'Strong (12+ chars)',
    'Session Timeout': '30 minutes',
    'Maintenance Mode': false,
    'Email Provider': 'SMTP (smtp.ethiorobotics.com)',
    'Storage Backend': 'AWS S3',
    'Analytics': 'Google Analytics 4',
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const sections = [
    {
      title: 'General', icon: Globe,
      items: ['Site Name', 'Tagline', 'Language'],
    },
    {
      title: 'Security', icon: Lock,
      items: ['Two-Factor Auth', 'Password Policy', 'Session Timeout', 'Maintenance Mode'],
    },
    {
      title: 'Integrations', icon: Zap,
      items: ['Email Provider', 'Storage Backend', 'Analytics'],
    },
  ];

  const startEdit = (title: string) => {
    const sectionSettings: Record<string, string | boolean> = {};
    const section = sections.find(s => s.title === title);
    section?.items.forEach(label => { sectionSettings[label] = settings[label]; });
    setDraft(sectionSettings);
    setEditingSection(title);
  };

  const save = async () => {
    setSaveLoading(true);
    setSettings(prev => ({ ...prev, ...draft }));
    setEditingSection(null);
    setSaveLoading(false);
  };

  const cancel = () => {
    setEditingSection(null);
    setDraft({});
  };

  const updateDraft = (label: string, value: string | boolean) => {
    setDraft(prev => ({ ...prev, [label]: value }));
  };

  const isEditing = (title: string) => editingSection === title;

  return (
    <div className="space-y-6">
      {sections.map(s => {
        const SIcon = s.icon;
        const editing = isEditing(s.title);
        return (
          <div key={s.title} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <SIcon className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-base text-slate-900">{s.title}</h3>
              {editing && (
                <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Editing</span>
              )}
            </div>

            <div className="space-y-4">
              {s.items.map(label => {
                const val = editing ? draft[label] : settings[label];
                const isBool = typeof val === 'boolean';
                return (
                  <div key={label} className={`flex items-center justify-between py-2 border-b border-slate-100 last:border-0 ${editing ? 'bg-slate-50/50 -mx-2 px-2 rounded' : ''}`}>
                    <span className="text-sm text-slate-600">{label}</span>
                    {editing ? (
                      isBool ? (
                        <button
                          onClick={() => updateDraft(label, !val)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${val ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      ) : (
                        <input
                          value={val as string}
                          onChange={e => updateDraft(label, e.target.value)}
                          className="w-48 text-right text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-blue/40"
                        />
                      )
                    ) : (
                      <span className={`text-sm font-medium ${isBool ? (val ? 'text-emerald-600' : 'text-slate-400') : 'text-slate-900'}`}>
                        {isBool ? (val ? 'Enabled' : 'Disabled') : val}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              {editing ? (
                <>
                  <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={save} disabled={saveLoading} className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-brand-red hover:bg-brand-red-dark rounded-lg transition-colors disabled:opacity-50">
                    {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                </>
              ) : (
                <button onClick={() => startEdit(s.title)} className="flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-blue-dark transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  status: 'Active' | 'Pending' | 'Expired';
  since: string;
  contact: string;
  email: string;
  description: string;
}

function PartnerSponsorshipPanel() {
  const [partners, setPartners] = useState<Partner[]>([
    { id: 'p1', name: 'Ministry of Education', logo: '🏛️', tier: 'Platinum', status: 'Active', since: '2024', contact: 'Dr. Tarekegn W.', email: 'info@moe.gov.et', description: 'National education authority supporting STEM programs across Ethiopia.' },
    { id: 'p2', name: 'Addis Ababa University', logo: '🎓', tier: 'Gold', status: 'Active', since: '2024', contact: 'Prof. Mekonnen A.', email: 'partnerships@aau.edu.et', description: 'Leading higher education institution providing research collaboration.' },
    { id: 'p3', name: 'Ethio Telecom', logo: '📡', tier: 'Gold', status: 'Active', since: '2025', contact: 'Samuel T.', email: 'sponsorship@ethiotelecom.et', description: 'National telecom provider enabling connectivity for remote learning.' },
    { id: 'p4', name: 'African Robotics Network', logo: '🌍', tier: 'Silver', status: 'Pending', since: '2026', contact: 'Grace O.', email: 'info@africanrobotics.org', description: 'Pan-African robotics community fostering regional competition and knowledge sharing.' },
  ]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: '', logo: '🤝', tier: 'Silver' as Partner['tier'], status: 'Pending' as Partner['status'], since: '2026', contact: '', email: '', description: '' });

  const filtered = search
    ? partners.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tier.toLowerCase().includes(search.toLowerCase()) ||
        p.status.toLowerCase().includes(search.toLowerCase())
      )
    : partners;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', logo: '🤝', tier: 'Silver', status: 'Pending', since: '2026', contact: '', email: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ name: p.name, logo: p.logo, tier: p.tier, status: p.status, since: p.since, contact: p.contact, email: p.email, description: p.description });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editing) {
      setPartners(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
    } else {
      setPartners(prev => [...prev, { id: `p${Date.now()}`, ...form }]);
    }
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    setShowModal(false);
    setEditing(null);
  };

  const handleToggleStatus = (id: string) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Pending' : 'Active' as const } : p));
  };

  const tierColor: Record<string, string> = {
    Platinum: 'bg-indigo-100 text-indigo-600', Gold: 'bg-amber-100 text-amber-600', Silver: 'bg-slate-100 text-slate-500', Bronze: 'bg-orange-100 text-orange-600',
  };
  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-600', Pending: 'bg-amber-50 text-amber-600', Expired: 'bg-red-50 text-red-600',
  };

  const emojis = ['🤝', '🏛️', '🎓', '📡', '🌍', '🏢', '💼', '🔬', '🤖', '⚡', '📊', '🎯'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark"><Plus className="w-4 h-4" /> Add Partner</button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-500">
        <span className="font-semibold text-slate-700">{partners.length} partners</span>
        <span className="text-slate-300">|</span>
        {['Active', 'Pending', 'Expired'].map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${s === 'Active' ? 'bg-emerald-500' : s === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span>{s}</span>
            <span className="font-semibold text-slate-800">{partners.filter(p => p.status === s).length}</span>
          </span>
        ))}
      </div>

      {/* Partner cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">{p.logo}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-slate-900 truncate">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tierColor[p.tier]}`}>{p.tier}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[p.status]}`}>{p.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleToggleStatus(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Toggle status">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">{p.description}</p>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{p.contact}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                <span>Since {p.since}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
            <Handshake className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No partners found</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowModal(false); setEditing(null); }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-900">{editing ? 'Edit Partner' : 'Add Partner'}</h3>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Organization Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. Ministry of Education" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Logo</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojis.map(e => (
                      <button key={e} onClick={() => setForm(p => ({ ...p, logo: e }))}
                        className={`w-8 h-8 rounded-lg border text-lg flex items-center justify-center hover:bg-slate-50 ${form.logo === e ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200'}`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Since Year</label>
                  <input value={form.since} onChange={e => setForm(p => ({ ...p, since: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Tier</label>
                  <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value as Partner['tier'] }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Partner['status'] }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Contact Person</label>
                <input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} disabled={!form.name}
                  className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark disabled:opacity-50">
                  {editing ? 'Save Changes' : 'Add Partner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── VEX ROLES ADMIN ─── */

const ROLE_OPTIONS = [
  { value: 'Driver', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'Programmer', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'Builder', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'Captain', color: 'bg-brand-red/10 text-brand-red border-brand-red/20' },
  { value: 'Notebook Lead', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'Scout', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { value: 'Pit Manager', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

function VexRolesAdmin() {
  const [teams, setTeams] = useState([
    { team: 'VEX-001', members: [{ name: 'Abebe K.', role: 'Driver' }, { name: 'Selam B.', role: 'Programmer' }, { name: 'Kidus G.', role: 'Builder' }] },
    { team: 'VEX-002', members: [{ name: 'Hana M.', role: 'Driver' }, { name: 'Yonas D.', role: 'Programmer' }] },
  ]);
  const [showAdd, setShowAdd] = useState<{ team: string } | null>(null);
  const [newMember, setNewMember] = useState({ name: '', role: 'Driver' });
  const [editingRole, setEditingRole] = useState<{ team: string; member: string } | null>(null);

  const handleAdd = () => {
    if (!showAdd || !newMember.name.trim()) return;
    setTeams(prev => prev.map(t => t.team === showAdd.team ? { ...t, members: [...t.members, { name: newMember.name.trim(), role: newMember.role }] } : t));
    setNewMember({ name: '', role: 'Driver' });
    setShowAdd(null);
  };

  const handleRoleChange = (teamName: string, memberName: string, newRole: string) => {
    setTeams(prev => prev.map(t => t.team === teamName ? { ...t, members: t.members.map(m => m.name === memberName ? { ...m, role: newRole } : m) } : t));
    setEditingRole(null);
  };

  const handleDelete = (teamName: string, memberName: string) => {
    setTeams(prev => prev.map(t => t.team === teamName ? { ...t, members: t.members.filter(m => m.name !== memberName) } : t));
  };

  const roleBadge = (role: string) => ROLE_OPTIONS.find(r => r.value === role)?.color || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-lg text-slate-900">VEX Team Roles</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage team members and their roles across all VEX teams.</p>
        </div>
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">Demo Mode</span>
      </div>

      <div className="grid gap-5">
        {teams.map(t => (
          <div key={t.team} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red/5 to-white px-5 py-3 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-red" /> {t.team}
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{t.members.length} members</span>
              </h3>
              <button onClick={() => setShowAdd({ team: t.team })}
                className="flex items-center gap-1 text-xs font-bold text-brand-red bg-brand-red/5 border border-brand-red/20 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/10 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Member
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {t.members.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <Users className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">No members in this team yet.</p>
                </div>
              ) : t.members.map(m => (
                <div key={m.name} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-black text-xs">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingRole?.team === t.team && editingRole?.member === m.name ? (
                      <select value={m.role} onChange={e => handleRoleChange(t.team, m.name, e.target.value)}
                        className="text-[10px] font-bold px-1.5 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-brand-red"
                        autoFocus
                        onBlur={() => setEditingRole(null)}
                      >
                        {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.value}</option>)}
                      </select>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge(m.role)}`}>{m.role}</span>
                    )}
                    <button onClick={() => setEditingRole({ team: t.team, member: m.name })} className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(t.team, m.name)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-red" /> Available Roles
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_OPTIONS.map(r => (
            <span key={r.value} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.color}`}>{r.value}</span>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAdd(null); setNewMember({ name: '', role: 'Driver' }); }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Add Team Member</h3>
                  <button onClick={() => { setShowAdd(null); setNewMember({ name: '', role: 'Driver' }); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Member Name</label>
                    <input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-brand-red"
                      placeholder="e.g. Kidus G."
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Role</label>
                    <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-brand-red"
                    >
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.value}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => { setShowAdd(null); setNewMember({ name: '', role: 'Driver' }); }} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleAdd} disabled={!newMember.name.trim()}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                    Add Member
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchEnrollmentsApi(), fetchPaymentsApi()])
      .then(([enrollmentData, paymentData]) => {
        setRegistrations(enrollmentData);
        setPayments(paymentData);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load enrollments.'))
      .finally(() => setLoading(false));
  }, []);

  const paymentByEnrollment = useMemo(() => {
    return payments.reduce<Record<string, EnrollmentPayment>>((map, payment) => {
      map[payment.enrollment] = payment;
      return map;
    }, {});
  }, [payments]);

  const statusClass = (status: string) => {
    if (status === 'ACTIVE' || status === 'COMPLETED') return 'bg-emerald-50 text-emerald-600';
    if (status === 'PENDING_PAYMENT') return 'bg-amber-50 text-amber-600';
    return 'bg-red-50 text-red-600';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3 font-semibold text-slate-600">Student</th><th className="px-4 py-3 font-semibold text-slate-600">Program</th><th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Date</th><th className="px-4 py-3 font-semibold text-slate-600">Status</th><th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Amount</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            )}
            {!loading && registrations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No enrollments found.</td></tr>
            )}
            {registrations.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.student_name || r.student_email || 'Student'}</td>
                <td className="px-4 py-3 text-slate-600">{r.class_name || r.sub_program_name || 'Class'}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{r.enrolled_at?.slice(0, 10) || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusClass(r.status)}`}>{r.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">{paymentByEnrollment[r.id] ? `${Number(paymentByEnrollment[r.id].amount).toLocaleString()} ETB` : '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5"><Eye className="w-3.5 h-3.5" /></button><button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-red/5"><Edit3 className="w-3.5 h-3.5" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function AdminDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverviewDashboard />;
      case 'users': return <UserManagementPanel title="User Management" />;
      case 'roles': return <RolesPermissions />;
      case 'academics': return <AcademicCatalogManager role="Admin" />;
      case 'branches': return <BranchSectionShell />;
      case 'audit': return <SystemLogs />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
      case 'registrations': return <AdminRegistrations />;
      case 'cms': return <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm"><CmsDashboard /></div>;
      default: return <UserManagementPanel title="User Management" />;
    }
  };

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Admin Panel',
        icon: Shield,
        accentColor: 'blue',
        userName: currentUser.name,
        userRole: currentUser.role,
      }}
      topNavbar={{
        title: pageTitle[activeSection],
        subtitle: 'Admin Dashboard',
      }}
      onLogout={onLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}
