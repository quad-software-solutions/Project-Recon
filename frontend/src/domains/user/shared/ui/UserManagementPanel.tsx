import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Filter, Plus, X, Loader2, AlertCircle, CheckCircle,
  ChevronDown, Eye, Edit3, Trash2, Mail, Phone, Shield, UserCheck, UserX, Archive, MoreVertical, Calendar
} from 'lucide-react';
import {
  fetchUsersApi, toggleUserStatusApi, archiveUserApi,
  createStaffApi, createBranchManagerApi, updateUserApi, branchesApi,
  type AdminUserResponse, type BranchResponse, type PaginatedResponse,
} from '../api/adminApi';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const ROLE_BADGE: Record<string, string> = {
  Admin: 'bg-purple-50 text-purple-600',
  Manager: 'bg-amber-50 text-amber-600',
  Instructor: 'bg-blue-50 text-blue-600',
  Secretary: 'bg-rose-50 text-rose-600',
  Student: 'bg-emerald-50 text-emerald-600',
};

const STATUS_STYLE = (s: string) => {
  const c: Record<string, string> = { Active: 'text-emerald-600', Suspended: 'text-red-600', Pending: 'text-amber-600', Archived: 'text-slate-500' };
  const d: Record<string, string> = { Active: 'bg-emerald-500', Suspended: 'bg-red-500', Pending: 'bg-amber-500', Archived: 'bg-slate-400' };
  return { color: c[s] || 'text-slate-600', dot: d[s] || 'bg-slate-400' };
};

function resolveRole(u: AdminUserResponse): string {
  const primary = u.assignments?.find(a => a.is_primary && a.is_active);
  if (primary) {
    const map: Record<string, string> = { super_admin: 'Admin', branch_manager: 'Manager', instructor: 'Instructor', secretary: 'Secretary', student: 'Student' };
    return map[primary.role] || 'Student';
  }
  return 'Student';
}

export default function UserManagementPanel({ title = 'User Management' }: { title?: string }) {
  const [data, setData] = useState<PaginatedResponse<AdminUserResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<AdminUserResponse | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUserResponse | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', password: '', branch_id: '', role: 'instructor', phone_number: '', gender: '', date_of_birth: '' });
  const [addUserRole, setAddUserRole] = useState<'staff' | 'branch_manager'>('staff');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, branchRes] = await Promise.all([
        fetchUsersApi(),
        branchesApi.list().catch(() => []),
      ]);
      setData(userRes);
      setBranches(Array.isArray(branchRes) ? branchRes : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!actionMenuUserId) return;
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuUserId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [actionMenuUserId]);

  const handleToggle = async (u: AdminUserResponse) => {
    setToggling(u.id);
    try { await toggleUserStatusApi(u.id, u.status); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setToggling(null); }
  };

  const handleArchive = async (u: AdminUserResponse) => {
    try { await archiveUserApi(u.id); setConfirmArchive(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.password || !formData.branch_id) return;
    const payload = {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
      branch_id: formData.branch_id,
      role: formData.role,
      phone_number: formData.phone_number || undefined,
      gender: formData.gender || undefined,
      date_of_birth: formData.date_of_birth || undefined,
    };
    try {
      if (addUserRole === 'branch_manager') {
        await createBranchManagerApi(payload);
      } else {
        await createStaffApi(payload);
      }
      setShowAddModal(false);
      setFormData({ email: '', first_name: '', last_name: '', password: '', branch_id: '', role: 'instructor', phone_number: '', gender: '', date_of_birth: '' });
      setAddUserRole('staff');
      await load();
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Failed to create user';
      if (msg.includes('Branch manager already exists')) {
        msg = 'This branch already has an active manager. Please choose a different branch or re-assign the manager.';
      }
      setError(msg);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      await updateUserApi(editingUser.id, {
        email: editingUser.email,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        phone_number: editingUser.phone_number || null,
        gender: editingUser.gender || null,
        date_of_birth: editingUser.date_of_birth || null,
      });
      setEditingUser(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  };

  const users = data?.results || [];
  const filtered = users.filter(u => {
    const name = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    const role = resolveRole(u);
    if (search && !name.includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && role.toLowerCase() !== roleFilter) return false;
    return true;
  });

  const stats = [
    { label: 'Active', count: users.filter(u => u.status === 'Active').length, color: 'text-emerald-600' },
    { label: 'Pending', count: users.filter(u => u.status === 'Pending').length, color: 'text-amber-600' },
    { label: 'Suspended', count: users.filter(u => u.status === 'Suspended').length, color: 'text-red-600' },
    { label: 'Archived', count: users.filter(u => u.status === 'Archived').length, color: 'text-slate-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">{title}</h2>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-brand-red text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg self-start">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>



      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="instructor">Instructor</option>
          <option value="secretary">Secretary</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">User</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Contact</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Role</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">No users found</td></tr>
              ) : filtered.map(u => {
                const role = resolveRole(u);
                const st = STATUS_STYLE(u.status);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                          {(u.first_name?.[0] || u.email[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{u.first_name} {u.last_name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {u.phone_number && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone_number}</span>}
                        <span className="text-[10px] text-slate-400">{u.assignments?.filter(a => a.is_active).map(a => a.branch_name).filter(Boolean).join(', ') || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[role] || 'bg-slate-50 text-slate-600'}`}>{role}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <div className="relative" ref={actionMenuRef}>
                          <button onClick={(e) => { e.stopPropagation(); setActionMenuUserId(actionMenuUserId === u.id ? null : u.id); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          <AnimatePresence>
                            {actionMenuUserId === u.id && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-slate-200 shadow-lg z-10 py-1 overflow-hidden">
                                <button onClick={() => { setActionMenuUserId(null); setEditingUser({ ...u }); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit
                                </button>
                                <button onClick={() => { setActionMenuUserId(null); handleToggle(u); }} disabled={toggling === u.id}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                                  {toggling === u.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : u.status === 'Active'
                                      ? <UserX className="w-3.5 h-3.5 text-emerald-500" />
                                      : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  }
                                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => { setActionMenuUserId(null); setConfirmArchive(u); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 transition-colors">
                                  <Archive className="w-3.5 h-3.5" /> Archive
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Add Staff User</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">First Name <span className="text-red-500">*</span></label><input value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} placeholder="e.g. Yonas" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Last Name <span className="text-red-500">*</span></label><input value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} placeholder="e.g. Tadesse" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                </div>
                <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Email <span className="text-red-500">*</span></label><input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="e.g. yonas.tadesse@email.com" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Password <span className="text-red-500">*</span></label><input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="e.g. ••••••••" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Phone <span className="text-slate-400 text-[10px]">(optional)</span></label><input value={formData.phone_number} onChange={e => setFormData(p => ({ ...p, phone_number: e.target.value }))} placeholder="e.g. +251-911-000000" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Gender <span className="text-slate-400 text-[10px]">(optional)</span></label>
                    <select value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Date of Birth <span className="text-slate-400 text-[10px]">(optional)</span></label><input type="date" value={formData.date_of_birth} onChange={e => setFormData(p => ({ ...p, date_of_birth: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Branch <span className="text-red-500">*</span></label>
                    <select value={formData.branch_id} onChange={e => setFormData(p => ({ ...p, branch_id: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">User Type</label>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 mb-2">
                    <button onClick={() => { setAddUserRole('staff'); setFormData(p => ({ ...p, role: 'instructor' })); }}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${addUserRole === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Staff</button>
                    <button onClick={() => { setAddUserRole('branch_manager'); setFormData(p => ({ ...p, role: 'branch_manager' })); }}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${addUserRole === 'branch_manager' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Manager</button>
                  </div>
                </div>
                {addUserRole === 'staff' && (
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Role <span className="text-slate-400 text-[10px]">(optional)</span></label>
                    <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="instructor">Instructor</option>
                      <option value="secretary">Secretary</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                <button onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleCreate} disabled={!formData.email || !formData.first_name || !formData.last_name || !formData.password || !formData.branch_id}
                  className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">Create User</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View User Modal */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setViewingUser(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  {viewingUser.profile_picture ? (
                    <img src={viewingUser.profile_picture} alt={viewingUser.full_name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {viewingUser.first_name?.[0] || viewingUser.email?.[0] || '?'}{viewingUser.last_name?.[0] || ''}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{viewingUser.full_name}</h3>
                    <p className="text-xs text-slate-500">{viewingUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[resolveRole(viewingUser)] || 'bg-slate-50 text-slate-600'}`}>
                        {resolveRole(viewingUser)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${STATUS_STYLE(viewingUser.status).color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE(viewingUser.status).dot}`} />
                        {viewingUser.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewingUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Contact</h4>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Phone className="w-3.5 h-3.5" /></div>
                        <div><p className="text-[10px] text-slate-400">Phone</p><p className="text-sm font-medium text-slate-900">{viewingUser.phone_number || '—'}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Mail className="w-3.5 h-3.5" /></div>
                        <div><p className="text-[10px] text-slate-400">Email</p><p className="text-sm font-medium text-slate-900">{viewingUser.email}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Personal Info</h4>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Users className="w-3.5 h-3.5" /></div>
                        <div><p className="text-[10px] text-slate-400">Gender</p><p className="text-sm font-medium text-slate-900">{viewingUser.gender || '—'}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Calendar className="w-3.5 h-3.5" /></div>
                        <div><p className="text-[10px] text-slate-400">Date of Birth</p><p className="text-sm font-medium text-slate-900">{viewingUser.date_of_birth || '—'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Account</h4>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><p className="text-[10px] text-slate-400 mb-0.5">Status</p><p className={`text-sm font-semibold ${STATUS_STYLE(viewingUser.status).color}`}>{viewingUser.status}</p></div>
                      <div><p className="text-[10px] text-slate-400 mb-0.5">Email Verified</p><p className="text-sm font-semibold text-slate-900">{viewingUser.is_email_verified ? 'Yes' : 'No'}</p></div>
                      <div><p className="text-[10px] text-slate-400 mb-0.5">Member Since</p><p className="text-sm font-semibold text-slate-900">{viewingUser.created_at?.slice(0, 10) || '—'}</p></div>
                      <div><p className="text-[10px] text-slate-400 mb-0.5">Last Updated</p><p className="text-sm font-semibold text-slate-900">{viewingUser.updated_at?.slice(0, 10) || '—'}</p></div>
                    </div>
                  </div>
                </div>

                {/* Assignments */}
                {viewingUser.assignments && viewingUser.assignments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Assignments ({viewingUser.assignments.length})</h4>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Role</th>
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Branch</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Primary</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viewingUser.assignments.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-medium text-slate-900 capitalize">{a.role.replace('_', ' ')}</td>
                              <td className="px-4 py-2.5 text-slate-600">{a.branch_name || '—'}</td>
                              <td className="px-4 py-2.5 text-center">
                                {a.is_primary
                                  ? <span className="text-emerald-500 font-bold">✓</span>
                                  : <span className="text-slate-300">—</span>
                                }
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {a.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setViewingUser(null); setEditingUser({ ...viewingUser }); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    <Edit3 className="w-3.5 h-3.5" /> Edit User
                  </button>
                  <button onClick={() => handleToggle(viewingUser)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                      viewingUser.status === 'Active'
                        ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}>
                    {viewingUser.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {viewingUser.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { setViewingUser(null); setConfirmArchive(viewingUser); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors shadow-sm">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                </div>
                <button onClick={() => setViewingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">First Name</label><input value={editingUser.first_name} onChange={e => setEditingUser(p => ({ ...p, first_name: e.target.value }))} placeholder="e.g. Yonas" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Last Name</label><input value={editingUser.last_name} onChange={e => setEditingUser(p => ({ ...p, last_name: e.target.value }))} placeholder="e.g. Tadesse" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                </div>
                <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Email</label><input value={editingUser.email} onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))} placeholder="e.g. yonas.tadesse@email.com" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Phone</label><input value={editingUser.phone_number || ''} onChange={e => setEditingUser(p => p ? { ...p, phone_number: e.target.value } : p)} placeholder="e.g. +251-911-000000" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Gender</label>
                    <select value={editingUser.gender || ''} onChange={e => setEditingUser(p => p ? { ...p, gender: e.target.value as AdminUserResponse['gender'] } : p)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Date of Birth</label><input type="date" value={editingUser.date_of_birth || ''} onChange={e => setEditingUser(p => p ? { ...p, date_of_birth: e.target.value } : p)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                <button onClick={() => setEditingUser(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleUpdate} className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Archive Modal */}
      <AnimatePresence>
        {confirmArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setConfirmArchive(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3"><Archive className="w-5 h-5 text-red-500" /></div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Archive User?</h3>
              <p className="text-xs text-slate-500 mb-5">This will archive <strong>{confirmArchive.first_name} {confirmArchive.last_name}</strong>. This action can be reversed.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setConfirmArchive(null)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button onClick={() => handleArchive(confirmArchive)} className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Archive</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
}
