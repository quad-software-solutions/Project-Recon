import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, Search, X, Building, MapPin, Phone, Mail,
  Users, CheckCircle, XCircle, Clock, Loader2, Lock
} from 'lucide-react';
import { branchesApi, BranchResponse } from '../../../shared/api/adminApi';
import type { UserProfile } from '@/shared/types';
import { isSuperAdmin } from '@/shared/auth/permissions';
import { formatApiError } from '@/shared/utils/formatApiError';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  Active: { icon: CheckCircle, color: 'text-emerald-500' },
  Inactive: { icon: XCircle, color: 'text-slate-400' },
  Archived: { icon: Clock, color: 'text-amber-500' },
};

interface Props {
  currentUser: UserProfile;
}

export default function SchoolManagement({ currentUser }: Props) {
  const canManage = isSuperAdmin(currentUser);
  const [schools, setSchools] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BranchResponse | null>(null);
  const [form, setForm] = useState<Partial<BranchResponse>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BranchResponse | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchesApi.list();
      setSchools(data);
    } catch (e) {
      setError(formatApiError(e));
    }
    setLoading(false);
  };

  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSchools = schools.filter(s => s.status === 'Active').length;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', email: '', phone_number: '', address: '', city: '', state_region: '', country: 'Ethiopia' });
    setShowModal(true);
  };

  const openEdit = (s: BranchResponse) => {
    setEditing(s);
    setForm({ ...s });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await branchesApi.update(editing.id, form);
      } else {
        await branchesApi.create(form as { name: string; code: string });
      }
      setShowModal(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await branchesApi.archive(id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const toggleActive = async (s: BranchResponse) => {
    setError(null);
    try {
      await branchesApi.toggleActive(s.id, s.status === 'Active');
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  if (!canManage) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="mt-1 text-amber-700">School management is restricted to Super Admin only.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Schools', value: schools.length, icon: Building, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Active', value: activeSchools, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive / Archived', value: schools.filter(s => s.status !== 'Active').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 w-[180px]"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          {canManage && (
            <button onClick={openAdd}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add School
            </button>
          )}
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No schools match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((s, i) => {
                const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Inactive;
                const StatusIcon = statusCfg.icon;
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group relative bg-slate-50 rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-sky-100 to-blue-100 border border-slate-200 flex items-center justify-center">
                        <Building className="w-6 h-6 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{s.name}</h4>
                          <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusCfg.color}`} />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{[s.city, s.state_region, s.country].filter(Boolean).join(', ') || s.address || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span>{s.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{s.phone_number || '—'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">Code: {s.code}</div>
                    </div>

                    {canManage && (
                      <div className="mt-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(s)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-all">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => toggleActive(s)}
                          className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${s.status === 'Active' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}
                        >
                          {s.status === 'Active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setDeleteTarget(s)}
                          className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      <AnimatePresence>
        {showModal && canManage && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900">{editing ? 'Edit School' : 'Add School'}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">School Name *</label>
                      <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Addis Ababa Science & Technology University" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Code *</label>
                      <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. AASTU" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Email</label>
                      <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. info@aastu.edu.et" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Phone</label>
                      <input type="text" value={form.phone_number || ''} onChange={e => setForm({ ...form, phone_number: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. +251 911 000 000" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600">Address</label>
                      <input type="text" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Bole, Africa Avenue" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">City</label>
                      <input type="text" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Addis Ababa" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">State / Region</label>
                      <input type="text" value={form.state_region || ''} onChange={e => setForm({ ...form, state_region: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Addis Ababa" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Country</label>
                      <input type="text" value={form.country || 'Ethiopia'} onChange={e => setForm({ ...form, country: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Ethiopia" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.name || !form.code}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editing ? 'Update' : 'Add School'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Archive School</h3>
                    <p className="text-xs text-slate-500">This action archives the school.</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">Are you sure you want to archive <strong>{deleteTarget.name}</strong>?</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                  <button onClick={() => handleDelete(deleteTarget.id)} className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Archive
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
