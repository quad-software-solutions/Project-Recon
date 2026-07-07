import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3, Users, Shield, Settings, FileText, Bell, Activity,
  Plus, RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle,
  BookOpen, MessageSquare, GraduationCap, Award, DollarSign, Building,
  Handshake, UserCog, Swords, Medal, Wrench, ClipboardList, Cpu, Star, Target,
  Edit3, Trash2, Eye, EyeOff, Search, Filter, Download, ChevronDown, Save, X,
  UserPlus, UserCheck, UserX, Lock, Globe, Zap, TrendingUp, TrendingDown,
  Mail, Phone, MapPin, Camera, Sparkles, Send, Loader2, Archive, LayoutDashboard, GitBranch, BellOff
} from 'lucide-react';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import CmsDashboard from '@/src/domains/cms/admin/ui/CmsDashboard';
import { NavItem } from '@/src/shared/ui/Sidebar';
import { BranchSectionShell } from '@/src/domains/branches/ui/BranchSectionShell';
import type { UserProfile, AppNotification } from '@/src/shared/types';
import {
  fetchUsersApi,
  toggleUserStatusApi,
  archiveUserApi,
  createStaffApi,
  createBranchManagerApi,
  updateUserApi,
  fetchAuditLogsApi,
  resolveRole,
  formatRelativeTime,
  formatJoinDate,
  branchesApi,
  assignmentsApi,
  type AdminUserResponse,
  type AuditLogEntry,
  type PaginatedResponse,
  type BranchResponse,
  type AssignmentResponse,
} from '../api/adminApi';
import { getNotifications } from '@/src/domains/notification/model/notificationApi';

interface Props { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'overview' | 'users' | 'roles' | 'settings' | 'moderation' | 'audit' | 'notifications' | 'maintenance' | 'partners' | 'vex-roles' | 'branches' | 'registrations' | 'cms';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3, group: 'main' },
  { id: 'users', label: 'Accounts & Users', icon: Users, group: 'main' },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield, group: 'main' },
  { id: 'registrations', label: 'Enrollments', icon: ClipboardList, group: 'main' },
  { id: 'partners', label: 'Strategic Partners', icon: Handshake, group: 'main' },
  { id: 'vex-roles', label: 'VEX Teams', icon: UserCog, group: 'vex' },
  { id: 'branches', label: 'Branches', icon: GitBranch, group: 'main' },
  { id: 'cms', label: 'Content Manager', icon: LayoutDashboard, group: 'main' },
  { id: 'moderation', label: 'Content Moderation', icon: MessageSquare, group: 'system' },
  { id: 'audit', label: 'System Logs', icon: FileText, group: 'system' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'system' },
  { id: 'maintenance', label: 'System Health', icon: Activity, group: 'system' },
];

const pageTitle: Record<SectionId, string> = {
  overview: 'Overview', users: 'User Management', roles: 'Roles & Permissions',
  partners: 'Partners & Sponsors', 'vex-roles': 'VEX Role Management',
  branches: 'Branch Management', registrations: 'Registration Management',
  moderation: 'Content Moderation', audit: 'Audit Logs',
  notifications: 'Notifications', settings: 'System Settings', maintenance: 'Maintenance',
  cms: 'Content Management',
};

/* ─── HELPERS ─── */
const roleBadge = (role: string) => {
  const colors: Record<string, string> = {
    Admin: 'bg-purple-50 text-purple-600',
    Manager: 'bg-amber-50 text-amber-600',
    Instructor: 'bg-blue-50 text-blue-600',
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
  const [toggling, setToggling] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [formData, setFormData] = useState({
    email: '', first_name: '', last_name: '', password: '', branch_id: '', role: 'instructor'
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
      if (formData.role === 'branch_manager') {
        await createBranchManagerApi({
          email,
          first_name: firstName,
          last_name: lastName,
          password: formData.password,
          branch_id: formData.branch_id,
        });
      } else {
        await createStaffApi({
          email,
          first_name: firstName,
          last_name: lastName,
          password: formData.password,
          branch_id: formData.branch_id,
          role: formData.role,
        });
      }
      setShowAddModal(false);
      setFormData({ email: '', first_name: '', last_name: '', password: '', branch_id: '', role: 'instructor' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user');
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    try {
      await updateUserApi(editingUser.id, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
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
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}
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
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark"><UserPlus className="w-3.5 h-3.5" /> Add User</button>
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
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Email</label><input value={editingUser.email} onChange={e => setEditingUser(p => p ? { ...p, email: e.target.value } : p)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">First Name</label><input value={editingUser.first_name} onChange={e => setEditingUser(p => p ? { ...p, first_name: e.target.value } : p)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Last Name</label><input value={editingUser.last_name} onChange={e => setEditingUser(p => p ? { ...p, last_name: e.target.value } : p)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingUser(null)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark">Save</button>
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
    { key: 'super_admin', label: 'Admin', color: 'red', icon: Shield, desc: 'Full system access. Manage users, branches, settings, and all platform resources.' },
    { key: 'branch_manager', label: 'Manager', color: 'amber', icon: Building, desc: 'Manage branch operations, users, registrations, and local content.' },
    { key: 'instructor', label: 'Instructor', color: 'blue', icon: GraduationCap, desc: 'Create and manage courses, grade students, moderate forum content.' },
    { key: 'student', label: 'Student', color: 'emerald', icon: Users, desc: 'Access courses, participate in forums, shop in store, view certificates.' },
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

  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };
  const colorBg: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  const colorIcon: Record<string, string> = {
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  const roleMap = Object.fromEntries(roleDefs.map(r => [r.key, r]));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm">
        <span className="font-semibold text-slate-700">{users.length} total users</span>
        <span className="text-slate-300">|</span>
        {roleDefs.map(r => {
          const count = getUsersByRole(r.key).length;
          return (
            <span key={r.key} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${r.color === 'red' ? 'bg-red-500' : r.color === 'amber' ? 'bg-amber-500' : r.color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              <span className="text-slate-600">{r.label}s</span>
              <span className="font-semibold text-slate-800">{count}</span>
            </span>
          );
        })}
        {unassignedUsers.length > 0 && (
          <>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-slate-600">Unassigned</span>
              <span className="font-semibold text-slate-800">{unassignedUsers.length}</span>
            </span>
          </>
        )}
        <div className="ml-auto">
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white rounded-lg text-xs font-semibold hover:bg-brand-red-dark"><Plus className="w-3 h-3" /> Assign Role</button>
        </div>
      </div>

      {/* Unassigned users card */}
      {unassignedUsers.length > 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-600">Unassigned Users</h4>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{unassignedUsers.length}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedUsers.slice(0, 12).map(u => (
              <button
                key={u.id}
                onClick={() => { setAssignForm({ user_id: u.id, branch_id: '', role: 'student', is_primary: false }); setShowAssignModal(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-brand-blue/5 rounded-lg text-xs text-slate-600 hover:text-brand-blue transition-colors group"
              >
                <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[100px]">{u.full_name.split(' ')[0]}</span>
                <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            {unassignedUsers.length > 12 && (
              <span className="px-2.5 py-1.5 text-xs text-slate-400">+{unassignedUsers.length - 12} more</span>
            )}
          </div>
        </div>
      )}

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleDefs.map(r => {
          const roleUsers = getUsersByRole(r.key);
          const roleAssignments = getAssignmentsByRole(r.key);
          const Icon = r.icon;
          const isExpanded = expandedRole === r.key;
          const permsOpen = showPerms === r.key;
          const permDef = PERMISSIONS[r.key];

          const filteredRoleUsers = roleSearch && isExpanded
            ? roleUsers.filter(u =>
                u.full_name.toLowerCase().includes(roleSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(roleSearch.toLowerCase())
              )
            : roleUsers;

          const branchCounts = [...new Set(roleAssignments.map(a => a.branch?.id).filter(Boolean))].length;

          return (
            <div key={r.key} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorIcon[r.color] || colorIcon.emerald}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{r.label}s</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorBg[r.color] || colorBg.emerald}`}>
                      {roleUsers.length} users
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span>{roleAssignments.length} assignment{roleAssignments.length !== 1 ? 's' : ''}</span>
                  <span>{branchCounts} branche{branchCounts !== 1 ? 's' : ''}</span>
                </div>

                {/* User pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {roleAssignments.slice(0, 5).map(a => (
                    <span key={a.id} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${colorMap[r.color] || colorMap.emerald}`}>
                      {a.user?.full_name?.split(' ')?.[0] || '—'} @ {a.branch?.name?.slice(0, 12) || 'HQ'}
                    </span>
                  ))}
                  {roleAssignments.length > 5 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                      +{roleAssignments.length - 5} more
                    </span>
                  )}
                </div>

                {/* Permissions toggle */}
                <button
                  onClick={() => setShowPerms(permsOpen ? null : r.key)}
                  className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  {permsOpen ? 'Hide' : 'View'} permissions ({permDef.permissions.length})
                </button>

                {permsOpen && (
                  <div className="mt-3 space-y-1.5 pl-1">
                    {permDef.permissions.map(p => (
                      <div key={p} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expand users */}
                <button
                  onClick={() => { setExpandedRole(isExpanded ? null : r.key); setRoleSearch(''); }}
                  className="mt-4 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1"
                >
                  {isExpanded ? 'Hide' : 'View'} users with this role
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  {/* Inline search */}
                  <div className="px-5 py-2 border-b border-slate-50">
                    <input
                      value={roleSearch}
                      onChange={e => setRoleSearch(e.target.value)}
                      placeholder="Search users in this role..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:border-brand-blue/30"
                    />
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {filteredRoleUsers.length === 0 ? (
                      <p className="px-5 py-4 text-xs text-slate-400">{roleSearch ? 'No matching users' : 'No users with this role'}</p>
                    ) : filteredRoleUsers.map(u => {
                      const userAssignments = assignments.filter(a =>
                        a.role === r.key && a.user?.id === u.id && a.is_active !== false
                      );
                      return (
                        <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                              {u.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate max-w-[160px]">{u.full_name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                {userAssignments.map(a => (
                                  <span key={a.id} className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                    {a.branch?.name && <><Building className="w-2.5 h-2.5" />{a.branch.name}</>}
                                    {a.is_primary && <span className="text-amber-500 font-bold" title="Primary role">★</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {userAssignments.map(a => (
                              <button
                                key={a.id}
                                onClick={() => setEditAssign(a)}
                                className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                title="Edit assignment"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowAssignModal(false); setUserSearch(''); }}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-900">Assign Role</h3>
              <button onClick={() => { setShowAssignModal(false); setUserSearch(''); }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">User</label>
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg">
                  {filteredUserOptions.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-slate-400 text-center">No available users</p>
                  ) : filteredUserOptions.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setAssignForm(p => ({ ...p, user_id: u.id }))}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors ${assignForm.user_id === u.id ? 'bg-brand-blue/5 text-brand-blue font-semibold' : 'text-slate-700'}`}
                    >
                      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{u.full_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                      {assignForm.user_id === u.id && <CheckCircle className="w-3.5 h-3.5 ml-auto text-brand-blue" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Role</label>
                  <select value={assignForm.role} onChange={e => setAssignForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                    <option value="instructor">Instructor</option>
                    <option value="branch_manager">Manager</option>
                    <option value="super_admin">Admin</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Branch</label>
                  <select value={assignForm.branch_id} onChange={e => setAssignForm(p => ({ ...p, branch_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
                    <option value="">— No branch —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={assignForm.is_primary} onChange={e => setAssignForm(p => ({ ...p, is_primary: e.target.checked }))}
                  className="rounded border-slate-300" />
                Set as primary role
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowAssignModal(false); setUserSearch(''); }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAssignRole} disabled={!assignForm.user_id || !assignForm.role}
                  className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark disabled:opacity-50">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditAssign(null)}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-900">Edit Assignment</h3>
              <button onClick={() => setEditAssign(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
                <p><span className="font-medium text-slate-700">User:</span> {editAssign.user?.full_name || '—'}</p>
                <p><span className="font-medium text-slate-700">Role:</span>
                  <span className={`ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${colorBg[roleMap[editAssign.role]?.color || ''] || 'bg-slate-100 text-slate-600'}`}>
                    {roleMap[editAssign.role]?.label || editAssign.role.replace('_', ' ')}
                  </span>
                </p>
                <p><span className="font-medium text-slate-700">Branch:</span> {editAssign.branch?.name || '—'}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={editAssign.is_primary}
                  onChange={e => setEditAssign(p => p ? { ...p, is_primary: e.target.checked } : p)}
                  className="rounded border-slate-300" />
                <span>Primary role <span className="text-amber-500">★</span></span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={editAssign.is_active}
                  onChange={e => setEditAssign(p => p ? { ...p, is_active: e.target.checked } : p)}
                  className="rounded border-slate-300" />
                <span>Active <span className="text-xs text-slate-400">(inactive assignments are hidden)</span></span>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleRemoveAssignment(editAssign.id)}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
                <div className="flex-1" />
                <button onClick={() => setEditAssign(null)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleUpdateAssignment}
                  className="px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentModeration() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [resolved, setResolved] = useState<string[]>([]);
  const flags = [
    { id: 'f1', title: 'Inappropriate language in thread', author: 'FlagBot', post: 'Re: How to tune PID', date: '2 hours ago', severity: 'medium', queue: 'Forum', excerpt: 'This comment used language that may violate student safety rules.' },
    { id: 'f2', title: 'Spam promotional content', author: 'FlagBot', post: 'Cheap robots for sale!', date: '5 hours ago', severity: 'high', queue: 'Community', excerpt: 'External sales link detected in a student discussion thread.' },
    { id: 'f3', title: 'Off-topic discussion', author: 'Coach Nebil', post: 'General chat thread', date: '1 day ago', severity: 'low', queue: 'Forum', excerpt: 'Thread drifted away from the assigned robotics challenge.' },
    { id: 'f4', title: 'Unverified event photo', author: 'Media Review', post: 'Workshop gallery upload', date: '2 days ago', severity: 'medium', queue: 'Media', excerpt: 'Photo includes students and needs publishing confirmation.' },
  ];
  const severityColor: Record<string, string> = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-slate-600 bg-slate-100' };
  const visible = flags.filter(f => !resolved.includes(f.id) && (filter === 'all' || f.severity === filter));
  const stats = [
    { label: 'Open Flags', value: String(flags.length - resolved.length), detail: 'pending review', icon: AlertTriangle, tone: 'amber' as const },
    { label: 'High Risk', value: String(flags.filter(f => f.severity === 'high' && !resolved.includes(f.id)).length), detail: 'needs first pass', icon: XCircle, tone: 'red' as const },
    { label: 'Media Queue', value: String(flags.filter(f => f.queue === 'Media' && !resolved.includes(f.id)).length), detail: 'publish review', icon: Camera, tone: 'blue' as const },
    { label: 'Resolved', value: String(resolved.length), detail: 'this session', icon: CheckCircle, tone: 'emerald' as const },
  ];
  return (
    <div className="space-y-4">
      <DashboardCommandCenter title="Moderation Queue" subtitle="Review student-facing content before it becomes visible." signals={stats} />
      <div className="flex flex-wrap gap-2">
        {(['all', 'high', 'medium', 'low'] as const).map(level => (
          <button key={level} onClick={() => setFilter(level)}
            className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-all ${filter === level ? 'bg-brand-red text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}>
            {level}
          </button>
        ))}
      </div>
      {visible.map(f => (
        <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-base text-slate-900">{f.title}</h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-600">{f.queue}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">in <span className="font-medium text-slate-700">{f.post}</span></p>
              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{f.excerpt}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400"><span>Flagged by {f.author}</span><span>{f.date}</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor[f.severity] || ''}`}>{f.severity}</span></div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button onClick={() => setResolved(prev => [...prev, f.id])} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
              <button onClick={() => setResolved(prev => [...prev, f.id])} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100"><XCircle className="w-3.5 h-3.5" /> Remove</button>
            </div>
          </div>
        </div>
      ))}
      {visible.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-400">No moderation items match this view.</div>
      )}
    </div>
  );
}

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'write' | 'auth' | 'danger'>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogsApi();
      setLogs(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const typeBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('generat')) return 'bg-emerald-50 text-emerald-600';
    if (actionLower.includes('update') || actionLower.includes('change') || actionLower.includes('edit')) return 'bg-amber-50 text-amber-600';
    if (actionLower.includes('delet') || actionLower.includes('remov') || actionLower.includes('suspend')) return 'bg-red-50 text-red-600';
    if (actionLower.includes('login') || actionLower.includes('logout')) return 'bg-blue-50 text-blue-600';
    return 'bg-slate-100 text-slate-600';
  };

  const formatAuditDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const visibleLogs = logs.filter(log => {
    const action = log.action.toLowerCase();
    const matchesQuery = [log.action, log.actor?.full_name, log.resource_type, log.ip_address].filter(Boolean).some(value => String(value).toLowerCase().includes(query.toLowerCase()));
    const matchesFilter =
      actionFilter === 'all' ||
      (actionFilter === 'auth' && (action.includes('login') || action.includes('logout'))) ||
      (actionFilter === 'danger' && (action.includes('delete') || action.includes('remove') || action.includes('suspend') || action.includes('archive'))) ||
      (actionFilter === 'write' && (action.includes('create') || action.includes('update') || action.includes('change') || action.includes('edit')));
    return matchesQuery && matchesFilter;
  });

  const signals = [
    { label: 'Entries', value: String(logs.length), detail: 'loaded from API', icon: FileText, tone: 'slate' as const },
    { label: 'Writes', value: String(logs.filter(l => /create|update|change|edit/i.test(l.action)).length), detail: 'configuration changes', icon: Edit3, tone: 'amber' as const },
    { label: 'Auth Events', value: String(logs.filter(l => /login|logout/i.test(l.action)).length), detail: 'access activity', icon: Lock, tone: 'blue' as const },
    { label: 'Danger Ops', value: String(logs.filter(l => /delete|remove|suspend|archive/i.test(l.action)).length), detail: 'needs review', icon: AlertTriangle, tone: 'red' as const },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}
      <DashboardCommandCenter title="System Logs" subtitle="Trace account, branch, CMS, and security activity." signals={signals} />
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search action, actor, IP..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue/40" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'write', 'auth', 'danger'] as const).map(item => (
            <button key={item} onClick={() => setActionFilter(item)} className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${actionFilter === item ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}>{item}</button>
          ))}
        <span className="text-xs text-slate-400">{visibleLogs.length} shown</span>
        <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3 font-semibold text-slate-600">Action</th><th className="px-4 py-3 font-semibold text-slate-600">Actor</th><th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Resource</th><th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Date</th><th className="px-4 py-3 font-semibold text-slate-600">IP</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading audit logs...</td></tr>
            ) : visibleLogs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No audit log entries found</td></tr>
            ) : visibleLogs.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{l.action}</td>
                <td className="px-4 py-3 text-slate-600">{l.actor?.full_name || 'System'}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                  <span className="text-xs">{l.resource_type}</span>
                  {l.resource_id && <span className="text-[10px] text-slate-400 ml-1">#{l.resource_id.slice(0, 8)}</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">{formatAuditDate(l.created_at)}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${typeBadge(l.action)}`}>{l.ip_address || '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function VexRolesAdmin() {
  const roles = [
    { team: 'VEX-001', members: [{ name: 'Abebe K.', role: 'Driver' }, { name: 'Selam B.', role: 'Programmer' }, { name: 'Kidus G.', role: 'Builder' }] },
    { team: 'VEX-002', members: [{ name: 'Hana M.', role: 'Driver' }, { name: 'Yonas D.', role: 'Programmer' }] },
  ];
  return (
    <div className="space-y-6">
      {roles.map(r => (
        <div key={r.team} className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-brand-red" /> {r.team}</h3>
          <div className="space-y-3">{r.members.map(m => <div key={m.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">{m.name.charAt(0)}</div><span className="text-sm font-medium text-slate-900">{m.name}</span></div><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{m.role}</span></div>)}</div>
          <div className="flex gap-2 mt-4">{['Driver', 'Programmer', 'Builder'].map(rr => <button key={rr} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-brand-blue hover:text-brand-blue"><Plus className="w-3 h-3 inline mr-1" />{rr}</button>)}</div>
        </div>
      ))}
    </div>
  );
}

function MaintenancePanel() {
  const metrics = [
    { label: 'Server Uptime', value: '99.97%', status: 'healthy' },
    { label: 'Database Size', value: '2.4 GB', status: 'healthy' },
    { label: 'API Response', value: '124ms avg', status: 'healthy' },
    { label: 'Error Rate', value: '0.02%', status: 'healthy' },
    { label: 'Queue Depth', value: '14 tasks', status: 'warning' },
    { label: 'Cache Hit Rate', value: '87%', status: 'healthy' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map(m => <div key={m.label} className={`bg-white border rounded-xl p-4 ${m.status === 'warning' ? 'border-amber-200' : 'border-slate-200'}`}><p className="text-xs text-slate-500">{m.label}</p><p className="text-lg font-bold text-slate-900 mt-1">{m.value}</p><span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{m.status}</span></div>)}
      </div>
      <div className="flex gap-3">
        <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-dark"><RefreshCw className="w-4 h-4" /> Run Backup</button>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> Export Logs</button>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /> Clear Cache</button>
      </div>
    </div>
  );
}

function AdminRegistrations() {
  const registrations = [
    { id: 'R-001', name: 'Kidus G.', program: 'Advanced Robotics', date: 'Jun 20, 2026', status: 'confirmed', amount: '12,500 ETB' },
    { id: 'R-002', name: 'Hana M.', program: 'VEX Competition Prep', date: 'Jun 19, 2026', status: 'pending', amount: '8,000 ETB' },
    { id: 'R-003', name: 'Yonas D.', program: 'Robotics 101', date: 'Jun 18, 2026', status: 'confirmed', amount: '5,000 ETB' },
    { id: 'R-004', name: 'Tigist K.', program: 'Advanced Robotics', date: 'Jun 17, 2026', status: 'cancelled', amount: '12,500 ETB' },
  ];
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3 font-semibold text-slate-600">Student</th><th className="px-4 py-3 font-semibold text-slate-600">Program</th><th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Date</th><th className="px-4 py-3 font-semibold text-slate-600">Status</th><th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Amount</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.program}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{r.date}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-lg ${r.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">{r.amount}</td>
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
      case 'overview': return <Overview />;
      case 'users': return <UserManagement userRole={currentUser.role} />;
      case 'roles': return <RolesPermissions />;
      case 'partners': return <PartnerSponsorshipPanel />;
      case 'vex-roles': return <VexRolesAdmin />;
      case 'branches': return <BranchSectionShell />;
      case 'moderation': return <ContentModeration />;
      case 'audit': return <AuditLogs />;
      case 'notifications': return <NotificationsPanel />;
      case 'settings': return <SystemSettings />;
      case 'maintenance': return <MaintenancePanel />;
      case 'registrations': return <AdminRegistrations />;
      case 'cms': return <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 shadow-sm"><CmsDashboard /></div>;
      default: return <Overview />;
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
      <DashboardCommandCenter
        title="Admin Control Center"
        subtitle="Accounts, moderation, security logs, and platform operations."
        signals={[
          { label: 'User Queue', value: '24', detail: 'pending account actions', icon: Users, tone: 'blue' },
          { label: 'Moderation', value: '4', detail: 'open content flags', icon: MessageSquare, tone: 'amber' },
          { label: 'System Logs', value: 'Live', detail: 'audit API connected', icon: FileText, tone: 'emerald' },
          { label: 'Health', value: '99.97%', detail: 'platform uptime', icon: Activity, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}
