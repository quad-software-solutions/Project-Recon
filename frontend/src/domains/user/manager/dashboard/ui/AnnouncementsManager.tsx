import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, XCircle, Megaphone, Calendar, EyeOff,
  CheckCircle, ChevronDown, Image, ExternalLink, Clock, FileText,
  Plus, Edit3, Trash2, Save, Loader2, AlertTriangle,
} from 'lucide-react';
import { cmsNewsApi } from '../../../../cms/shared/api/cmsApi';
import type { NewsArticleResponse } from '../../../../cms/shared/api/cmsApi';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

interface FormState {
  title: string; summary: string; content: string;
  image: string; video_url: string; button_text: string; button_url: string;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  title: '', summary: '', content: '',
  image: '', video_url: '', button_text: '', button_url: '',
  is_active: true,
});

export default function AnnouncementsManager() {
  const [items, setItems] = useState<NewsArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await cmsNewsApi.list();
      setItems((res || []).filter((a: NewsArticleResponse) => a.type === 'ANNOUNCEMENT' || !a.type));
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    setLoading(false);
  };

  const openCreate = () => {
    setForm(emptyForm()); setEditing(null); setShowForm(true); setError(null);
  };

  const openEdit = (a: NewsArticleResponse) => {
    setForm({
      title: a.title, summary: a.summary || '', content: a.content || '',
      image: a.image || '', video_url: a.video_url || '',
      button_text: a.button_text || '', button_url: a.button_url || '',
      is_active: a.is_active,
    });
    setEditing(a.id); setShowForm(true); setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required'); return;
    }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        type: 'ANNOUNCEMENT',
        slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'announcement',
      };
      if (editing) {
        const updated = await cmsNewsApi.update(editing, payload);
        setItems(prev => prev.map(a => a.id === editing ? updated : a));
      } else {
        const created = await cmsNewsApi.create(payload);
        setItems(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await cmsNewsApi.delete(id);
      setItems(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      if (expanded === id) setExpanded(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const filtered = items.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q))
      && (statusTab === 'all'
        || (statusTab === 'published' && a.is_active)
        || (statusTab === 'draft' && !a.is_active));
  });

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const published = items.filter(a => a.is_active).length;
  const drafts = items.filter(a => !a.is_active).length;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-24" />)}</div>
      <div className="bg-white rounded-xl border border-slate-200 h-64" />
    </div>
  );

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto p-0.5 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: items.length, icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Published', value: published, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Drafts', value: drafts, icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2.5`}><Icon className={`w-4 h-4 ${s.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 mb-3 overflow-x-auto">
            {FILTER_TABS.map(t => (
              <button key={t.key} onClick={() => setStatusTab(t.key as typeof statusTab)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  statusTab === t.key
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {t.label}
                {t.key === 'published' && <span className={`ml-1.5 text-[10px] ${statusTab === t.key ? 'text-white/70' : 'text-slate-400'}`}>{published}</span>}
                {t.key === 'draft' && <span className={`ml-1.5 text-[10px] ${statusTab === t.key ? 'text-white/70' : 'text-slate-400'}`}>{drafts}</span>}
              </button>
            ))}
            <button onClick={openCreate}
              className="ml-auto flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-rose-700 transition-colors shadow-sm"
            ><Plus className="w-3.5 h-3.5" /> New</button>
          </div>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="relative grow max-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or summary..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-rose-400 placeholder:text-slate-400" />
            </div>
            <span className="text-[11px] text-slate-400 ml-auto">{filtered.length}/{items.length}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-300">
              <Megaphone className="w-10 h-10 mb-2" />
              <p className="text-sm text-slate-400">No announcements found</p>
            </div>
          ) : (
            filtered.map((a) => {
              const open = expanded === a.id;
              return (
                <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="group flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                    <button onClick={() => setExpanded(open ? null : a.id)}
                      className="flex items-start gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Megaphone className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">{a.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>{a.is_active ? 'Published' : 'Draft'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(a.published_at || a.created_at)}</span>
                          {a.summary && <span className="truncate text-slate-400">{a.summary}</span>}
                        </div>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-300 shrink-0 mt-1.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex items-center gap-1 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      ><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(a.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <div className="ml-[52px] bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-4 space-y-3">
                            {a.image && (
                              <img src={a.image} alt={a.title}
                                className="w-full max-h-48 object-cover rounded-lg border border-slate-200" />
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400" /> Created {fmtDate(a.created_at)}</span>
                              {a.published_at && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-400" /> Published {fmtDate(a.published_at)}</span>}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${
                                a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>{a.is_active ? 'Published' : 'Draft'}</span>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-100 p-3">
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{a.content || a.summary || 'No content'}</p>
                            </div>
                            {a.video_url && (
                              <a href={a.video_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                              ><ExternalLink className="w-3 h-3" /> Watch Video</a>
                            )}
                            {a.button_url && (
                              <a href={a.button_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-rose-600 px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                              >{a.button_text || 'Learn More'} <ExternalLink className="w-3 h-3" /></a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center"><Megaphone className="w-4 h-4 text-rose-600" /></div>
                    <h3 className="font-bold text-slate-900">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Summary</label>
                    <input value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Content *</label>
                    <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 resize-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Image URL</label>
                    <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Video URL</label>
                      <input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Button Text</label>
                      <input value={form.button_text} onChange={e => setForm(p => ({ ...p, button_text: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Button URL</label>
                    <input value={form.button_url} onChange={e => setForm(p => ({ ...p, button_url: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10" />
                  </div>
                  <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-400" />
                    <div><p className="text-sm font-medium text-slate-700">Published</p><p className="text-[10px] text-slate-400">Visible to students immediately</p></div>
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}
                    className="bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> {editing ? 'Update' : 'Create'}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Delete Announcement</h3>
                      <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Keep</button>
                  <button onClick={() => handleDelete(deleteConfirm)}
                    className="bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm">
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
