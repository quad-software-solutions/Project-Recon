import React, { useState, useEffect } from 'react';
import {
  Users, Search, X, CheckCircle2, AlertTriangle, Loader2,
  Clock, Mail, Shield, UserCheck, Building, ChevronRight,
  Sparkles, Ban, Star, UserPlus, CalendarDays,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchAllUsersApi,
  branchesApi,
  assignmentsApi,
  type AdminUserResponse,
  type BranchResponse,
  type AssignmentResponse,
} from '../api/adminApi';
import type { UserProfile } from '@/shared/types';
import { canManageAccounts } from '@/shared/auth/permissions';
import { formatApiError } from '@/shared/utils/formatApiError';

const ROLE_DEFS = [
  { key: 'student', label: 'Student', icon: Users, color: 'bg-emerald-500' },
  { key: 'instructor', label: 'Instructor', icon: Shield, color: 'bg-blue-500' },
  { key: 'secretary', label: 'Secretary', icon: UserCheck, color: 'bg-rose-500' },
  { key: 'branch_manager', label: 'Manager', icon: Building, color: 'bg-amber-500' },
  { key: 'super_admin', label: 'Admin', icon: Shield, color: 'bg-purple-500' },
] as const;

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
];

function avatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

interface Props {
  currentUser: UserProfile;
}

export default function PendingUsersPanel({ currentUser }: Props) {
  const canManage = canManageAccounts(currentUser);
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [assignForm, setAssignForm] = useState({
    user_id: '',
    branch_id: '',
    role: 'student',
    is_primary: true,
  });
  const [saving, setSaving] = useState(false);
  const [quickRole, setQuickRole] = useState<string | null>(null);

  const clearSuccess = () => setTimeout(() => setSuccess(null), 3500);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, branchArr, assignArr] = await Promise.all([
        fetchAllUsersApi(),
        branchesApi.list().catch(() => [] as BranchResponse[]),
        assignmentsApi.list().catch(() => [] as AssignmentResponse[]),
      ]);
      setUsers(userRes);
      setBranches(branchArr.filter(b => b.status !== 'Archived'));
      setAssignments(assignArr);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingUsers = users.filter(u =>
    !u.assignments?.some(a => a.is_active !== false),
  );

  const activeBranches = branches.filter(b => b.status === 'Active');

  const filtered = search
    ? pendingUsers.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : pendingUsers;

  const handleQuickAssign = async (user: AdminUserResponse, role: string) => {
    if (!canManage || saving) return;
    setQuickRole(`${user.id}-${role}`);
    setSaving(true);
    setError(null);
    try {
      const requiresBranch = role !== 'super_admin';
      const branchId = requiresBranch && activeBranches.length > 0
        ? activeBranches[0].id
        : '';
      if (requiresBranch && !branchId) {
        setSelectedUser(user);
        setAssignForm({ user_id: user.id, branch_id: '', role, is_primary: true });
        setShowAssignModal(true);
        return;
      }
      await assignmentsApi.create({
        user_id: user.id,
        branch_id: requiresBranch ? branchId : null,
        role,
        is_primary: true,
      });
      setSuccess(`${user.full_name} assigned as ${ROLE_DEFS.find(r => r.key === role)?.label || role}.`);
      clearSuccess();
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
      setQuickRole(null);
    }
  };

  const handleFullAssign = async () => {
    if (!assignForm.user_id || saving) return;
    setSaving(true);
    setError(null);
    try {
      const roleDef = ROLE_DEFS.find(r => r.key === assignForm.role);
      const requiresBranch = assignForm.role !== 'super_admin';
      await assignmentsApi.create({
        user_id: assignForm.user_id,
        branch_id: requiresBranch ? assignForm.branch_id : null,
        role: assignForm.role,
        is_primary: assignForm.is_primary,
      });
      setShowAssignModal(false);
      setSelectedUser(null);
      setAssignForm({ user_id: '', branch_id: '', role: 'student', is_primary: true });
      setSuccess(`Role assigned successfully.`);
      clearSuccess();
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = (user: AdminUserResponse) => {
    setSelectedUser(user);
    setAssignForm({ user_id: user.id, branch_id: '', role: 'student', is_primary: true });
    setShowAssignModal(true);
  };

  const registeredToday = pendingUsers.filter(u => {
    const d = new Date(u.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="space-y-4 w-full animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pending Users</h2>
            {pendingUsers.length > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                {pendingUsers.length} need{pendingUsers.length === 1 ? 's' : ''} action
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Users who have registered but haven't been assigned a role yet.
          </p>
        </div>
        {canManage && pendingUsers.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setAssignForm({ user_id: '', branch_id: '', role: 'student', is_primary: true });
              setShowAssignModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Bulk Assign
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{pendingUsers.length}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Awaiting Role</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{registeredToday}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Registered Today</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{activeBranches.length}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Active Branches</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Total Users</p>
        </div>
      </div>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
          <Ban className="w-4 h-4 shrink-0" />
          <span>Viewing pending users only. Role assignment requires Super Admin access.</span>
        </div>
      )}

      {/* Search */}
      {pendingUsers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search pending users by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow"
          />
        </div>
      )}

      {/* User Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          {pendingUsers.length === 0 ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">All Clear</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Every user has a role assigned. New registrations will appear here automatically.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Matches</h3>
              <p className="text-sm text-slate-500">Try a different search term.</p>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } }, hidden: {} }}
          className="space-y-3"
        >
          {filtered.map(u => {
            const initials = u.full_name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || '?';
            const grad = avatarGradient(u.id);
            return (
              <motion.div
                key={u.id}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 truncate text-base">{u.full_name}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'Pending' ? 'bg-amber-500' :
                              u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {u.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          {u.email}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                          Registered {daysAgo(u.created_at)}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {ROLE_DEFS.filter(r => r.key !== 'super_admin').map(r => {
                            const isLoading = quickRole === `${u.id}-${r.key}`;
                            return (
                              <button
                                key={r.key}
                                type="button"
                                onClick={() => handleQuickAssign(u, r.key)}
                                disabled={saving}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 shadow-sm hover:shadow
                                  border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <r.icon className="w-3 h-3" />
                                )}
                                {r.label}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => openAssignModal(u)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm"
                          >
                            Assign <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length < pendingUsers.length && (
            <p className="text-xs text-center text-slate-400 pt-2 font-medium">
              Showing {filtered.length} of {pendingUsers.length} pending users
            </p>
          )}
        </motion.div>
      )}

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight">
                    {selectedUser ? 'Assign Role' : 'Bulk Assign Role'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedUser
                      ? `Grant platform access to ${selectedUser.full_name}.`
                      : 'Select a user and role to assign.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setSelectedUser(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {!selectedUser && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Select User</label>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {pendingUsers.map(u => (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => setAssignForm(p => ({ ...p, user_id: u.id }))}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            assignForm.user_id === u.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 uppercase ${
                            assignForm.user_id === u.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {u.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{u.full_name}</p>
                            <p className={`text-[11px] truncate ${assignForm.user_id === u.id ? 'text-slate-300' : 'text-slate-500'}`}>
                              {u.email}
                            </p>
                          </div>
                          {assignForm.user_id === u.id && <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {selectedUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedUser.full_name}</p>
                      <p className="text-xs text-slate-500">{selectedUser.email}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Role</label>
                    <select
                      value={assignForm.role}
                      onChange={e => setAssignForm(p => ({
                        ...p,
                        role: e.target.value,
                        branch_id: e.target.value === 'super_admin' ? '' : p.branch_id,
                      }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow"
                    >
                      {ROLE_DEFS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                      {assignForm.role !== 'super_admin' ? 'Branch *' : 'Branch'}
                    </label>
                    <select
                      value={assignForm.branch_id}
                      onChange={e => setAssignForm(p => ({ ...p, branch_id: e.target.value }))}
                      disabled={assignForm.role === 'super_admin'}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow disabled:opacity-60"
                    >
                      {assignForm.role !== 'super_admin' ? (
                        <>
                          <option value="">Select branch…</option>
                          {activeBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </>
                      ) : (
                        <option value="">Global (no branch)</option>
                      )}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={assignForm.is_primary}
                    onChange={e => setAssignForm(p => ({ ...p, is_primary: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Set as Primary Role</p>
                    <p className="text-xs text-slate-500 mt-0.5">Determines the user's default dashboard.</p>
                  </div>
                </label>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowAssignModal(false); setSelectedUser(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFullAssign}
                    disabled={!assignForm.user_id || (assignForm.role !== 'super_admin' && !assignForm.branch_id) || saving}
                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Assign Role
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
