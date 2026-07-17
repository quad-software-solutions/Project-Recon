import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Plus, Edit2, Trash2, X, Search, Calendar, Upload, Eye, EyeOff } from 'lucide-react';
import { api, News } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const emptyForm = (): Partial<News> => ({
  title: '', subtitle: '', content: '', author: '',
  imageUrl: '', category: 'NEWS', tags: '', publishedAt: new Date().toISOString().slice(0, 10), isActive: true,
});

export default function NewsManager({ addToast }: Props) {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<News> | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditing(prev => prev ? { ...prev, imageUrl: reader.result as string } : prev);
    reader.readAsDataURL(file);
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<News>('news')); }
    catch { setItems([]); addToast('Failed to load news', 'error'); }
    setLoading(false);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.subtitle?.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      return true;
    });
  }, [items, search, categoryFilter]);

  const openCreate = () => { setEditing({ ...emptyForm() }); setFormErrors({}); };
  const openEdit = (item: News) => { setEditing({ ...item }); setFormErrors({}); };
  const closeForm = () => { setEditing(null); setFormErrors({}); };

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' })); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.title?.trim()) errors.title = 'Title is required';
    if (!editing?.content?.trim()) errors.content = 'Content is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('news', editing.id, editing);
        addToast('News article updated', 'success');
      } else {
        await api.create('news', editing);
        addToast('News article created', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this news article?')) return;
    try { await api.delete('news', id); addToast('Article deleted', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: News) => {
    try { await api.update('news', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">News & Announcements</h2>
          {!loading && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} / {items.length}</span>}
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Article
        </button>
      </div>

      <div className="flex items-center gap-2 p-3 border-b border-slate-100 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
        </div>
        {categories.length > 0 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {items.length === 0 ? 'No articles yet' : 'No articles match your search'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors group relative">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                onMouseEnter={e => { const t = e.currentTarget.querySelector('.preview-popup') as HTMLElement; if (t) t.style.display = 'block'; }}
                onMouseLeave={e => { const t = e.currentTarget.querySelector('.preview-popup') as HTMLElement; if (t) t.style.display = 'none'; }}
              >
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-slate-400" />}
                {item.imageUrl && (
                  <div className="preview-popup hidden fixed z-50 w-72 rounded-xl shadow-2xl border border-slate-200 overflow-hidden bg-white"
                    style={{ transform: 'translate(calc(-100% + 40px), calc(-100% - 8px))' }}>
                    <img src={item.imageUrl} alt="" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                  {item.author && <span className="text-xs text-slate-400 shrink-0">by {item.author}</span>}
                </div>
                <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.category && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">{item.category}</span>}
                  {item.publishedAt && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>{item.isActive ? 'Published' : 'Draft'}</span>
                <button onClick={() => toggleActive(item)} className={`p-1 rounded-lg transition-colors ${item.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`} title={item.isActive ? 'Unpublish' : 'Publish'}>
                  {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Article' : 'New Article'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field label="Title" value={editing.title ?? ''} onChange={v => { setEditing({ ...editing, title: v }); clearError('title'); }} error={formErrors.title} required placeholder="e.g. New VEX Robotics Competition Announced" />
              <Field label="Subtitle" value={editing.subtitle ?? ''} onChange={v => { setEditing({ ...editing, subtitle: v }); clearError('subtitle'); }} error={formErrors.subtitle} placeholder="e.g. Teams from across the country will compete" />
              <Field label="Author" value={editing.author ?? ''} onChange={v => { setEditing({ ...editing, author: v }); clearError('author'); }} error={formErrors.author} placeholder="e.g. Abebe Kebede" />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Field label="Image URL" value={editing.imageUrl ?? ''} onChange={v => { setEditing({ ...editing, imageUrl: v }); clearError('imageUrl'); }} error={formErrors.imageUrl} placeholder="e.g. https://example.com/image.jpg" />
                </div>
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="mt-5 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors" title="Upload image">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {editing.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={editing.imageUrl} alt="" className="w-full h-32 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <Select label="Category" value={editing.category ?? 'NEWS'} onChange={v => { setEditing({ ...editing, category: v }); clearError('category'); }} error={formErrors.category} options={[
                { value: 'NEWS', label: 'News' },
                { value: 'ANNOUNCEMENT', label: 'Announcement' },
              ]} />
              <Field label="Tags (comma-separated)" value={editing.tags ?? ''} onChange={v => { setEditing({ ...editing, tags: v }); clearError('tags'); }} error={formErrors.tags} placeholder="e.g. robotics, competition, vex" />
              <Field label="Published Date" type="date" value={editing.publishedAt?.slice(0, 10) ?? ''} onChange={v => { setEditing({ ...editing, publishedAt: v }); clearError('publishedAt'); }} error={formErrors.publishedAt} />
              <Textarea label="Content" value={editing.content ?? ''} onChange={v => { setEditing({ ...editing, content: v }); clearError('content'); }} error={formErrors.content} required placeholder="e.g. Write the full article content here..." />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editing.isActive ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="rounded" />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-slate-200">
              <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', error, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; error?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required ? <span className="text-red-400 ml-0.5">*</span> : <span className="text-slate-400 normal-case ml-1 font-normal">(optional)</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Select({ label, value, onChange, error, options }: { label: string; value: string; onChange: (v: string) => void; error?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, error, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required ? <span className="text-red-400 ml-0.5">*</span> : <span className="text-slate-400 normal-case ml-1 font-normal">(optional)</span>}
      </label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={5} placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
