import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, Search, X, Megaphone, Calendar, Eye, EyeOff,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { cmsNewsApi, NewsArticleResponse } from '../../../../cms/shared/api/cmsApi';

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<NewsArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NewsArticleResponse | null>(null);
  const [form, setForm] = useState<Partial<NewsArticleResponse>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cmsNewsApi.list();
      setAnnouncements(data.filter(a => a.type === 'ANNOUNCEMENT'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load announcements');
    }
    setLoading(false);
  };

  const filtered = announcements.filter(a => {
    const q = search.toLowerCase();
    return !q || a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q);
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', summary: '', content: '', type: 'ANNOUNCEMENT', is_active: true });
    setShowModal(true);
  };

  const openEdit = (a: NewsArticleResponse) => {
    setEditing(a);
    setForm({ ...a });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await cmsNewsApi.update(editing.id, form);
      } else {
        await cmsNewsApi.create({ ...form, type: 'ANNOUNCEMENT' });
      }
      setShowModal(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save announcement');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    setError(null);
    try {
      await cmsNewsApi.delete(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete announcement');
    }
  };

  const toggleActive = async (a: NewsArticleResponse) => {
    setError(null);
    try {
      await cmsNewsApi.update(a.id, { is_active: !a.is_active });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update announcement status');
    }
  };

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
          { label: 'Total Announcements', value: announcements.length, icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Published', value: announcements.filter(a => a.is_active).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Drafts', value: announcements.filter(a => !a.is_active).length, icon: EyeOff, color: 'text-slate-400', bg: 'bg-slate-50' },
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
            <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 w-[220px]"
            />
          </div>
          <button onClick={openAdd}
            className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Announcement
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No announcements yet</p>
            </div>
          ) : (
            filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{a.title}</h4>
                    {a.is_active ? <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(a.published_at || a.created_at)}</span>
                    {a.summary && <span className="truncate ml-1">· {a.summary}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(a)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleActive(a)}
                    className={`p-1.5 rounded-lg transition-all ${a.is_active ? 'text-slate-500 hover:bg-amber-50 hover:text-amber-600' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                  >
                    {a.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Title *</label>
                    <input type="text" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Registration Now Open for 2025 Season" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Summary</label>
                    <input type="text" value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="Brief summary for the announcement card" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Content</label>
                    <textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} rows={4}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400 resize-none" placeholder="Full announcement content..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Button Text (optional)</label>
                    <input type="text" value={form.button_text || ''} onChange={e => setForm({ ...form, button_text: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="e.g. Register Now" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Button URL (optional)</label>
                    <input type="url" value={form.button_url || ''} onChange={e => setForm({ ...form, button_url: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-400" placeholder="https://example.com/register" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" id="announcement-active" />
                    <label htmlFor="announcement-active" className="text-sm text-slate-700">Published (visible to users)</label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editing ? 'Update' : 'Publish'}
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
