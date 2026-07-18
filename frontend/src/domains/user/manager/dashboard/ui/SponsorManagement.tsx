import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, Search, X, Handshake, Globe, CheckCircle, XCircle,
  Loader2, ExternalLink, Lock
} from 'lucide-react';
import { cmsPartnersApi, CmsPartnerResponse } from '../../../../cms/shared/api/cmsApi';
import { cmsPublicApi } from '../../../../cms/public/api/cmsPublicApi';
import type { UserProfile } from '@/shared/types';
import { isSuperAdmin, isSuperAdminOrBranchManager } from '@/shared/auth/permissions';
import { formatApiError } from '@/shared/utils/formatApiError';

interface Props {
  currentUser: UserProfile;
}

export default function SponsorManagement({ currentUser }: Props) {
  const canManage = isSuperAdmin(currentUser);
  const canView = isSuperAdminOrBranchManager(currentUser);
  const [sponsors, setSponsors] = useState<CmsPartnerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CmsPartnerResponse | null>(null);
  const [form, setForm] = useState<Partial<CmsPartnerResponse>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CmsPartnerResponse | null>(null);

  useEffect(() => { load(); }, [canManage]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (canManage) {
        const data = await cmsPartnersApi.list();
        setSponsors(data);
      } else {
        const data = await cmsPublicApi.getPartners();
        setSponsors(data);
      }
    } catch (e) {
      setError(formatApiError(e));
    }
    setLoading(false);
  };

  const filtered = sponsors.filter(s => {
    const q = search.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', website_url: '', type: 'Tech', is_active: true });
    setShowModal(true);
  };

  const openEdit = (s: CmsPartnerResponse) => {
    setEditing(s);
    setForm({ ...s });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await cmsPartnersApi.update(editing.id, form);
      } else {
        await cmsPartnersApi.create(form);
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
      await cmsPartnersApi.delete(id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const toggleActive = async (s: CmsPartnerResponse) => {
    setError(null);
    try {
      await cmsPartnersApi.update(s.id, { is_active: !s.is_active });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  if (!canView) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="mt-1 text-amber-700">Sponsor & partner management is restricted to Super Admin and Branch Manager roles.</p>
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

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Sponsors', value: sponsors.length, icon: Handshake, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: sponsors.filter(s => s.is_active).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: sponsors.filter(s => !s.is_active).length, icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50' },
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search sponsors..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 w-[220px]"
            />
          </div>
          {canManage && (
            <button onClick={openAdd}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Sponsor
            </button>
          )}
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Handshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No sponsors found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="group relative bg-slate-50 rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 border border-slate-200 flex items-center justify-center">
                      <Handshake className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{s.title}</h4>
                        {s.is_active ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{s.type}</span>
                    </div>
                  </div>
                  {s.description && <p className="mt-2 text-xs text-slate-600 line-clamp-2">{s.description}</p>}
                  {s.website_url && (
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                    >
                      <Globe className="w-3 h-3" /> {s.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {canManage && (
                    <div className="mt-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => toggleActive(s)}
                        className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${s.is_active ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}
                      >
                        {s.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setDeleteTarget(s)}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
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
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900">{editing ? 'Edit Sponsor' : 'Add Sponsor'}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Title *</label>
                    <input type="text" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Safaricom Ethiopia" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Type</label>
                    <select value={form.type || 'Tech'} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400"
                    >
                      {['Tech', 'Education', 'Finance', 'NGO', 'Government', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Description</label>
                    <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400 resize-none" placeholder="Brief description of the sponsorship..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Website URL</label>
                    <input type="url" value={form.website_url || ''} onChange={e => setForm({ ...form, website_url: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="https://example.com" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" id="sponsor-active" />
                    <label htmlFor="sponsor-active" className="text-sm text-slate-700">Active</label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editing ? 'Update' : 'Add Sponsor'}
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
                    <h3 className="font-bold text-base text-slate-900">Delete Sponsor</h3>
                    <p className="text-xs text-slate-500">This action is permanent.</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete <strong>{deleteTarget.title}</strong>?</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                  <button onClick={() => handleDelete(deleteTarget.id)} className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
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
