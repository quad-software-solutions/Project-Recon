import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Image, Plus, Edit2, Trash2, X, GripVertical, Search, ExternalLink, Upload, Eye, EyeOff } from 'lucide-react';
import { api, HeroBanner } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const emptyForm = (): Partial<HeroBanner> => ({
  title: '', subtitle: '', description: '', imageUrl: '',
  linkUrl: '', isActive: true, priority: 0,
});

export default function HeroBannerManager({ addToast }: Props) {
  const [items, setItems] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<HeroBanner> | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
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
    try {
      const data = await api.getAll<HeroBanner>('hero-banners');
      setItems(data);
    } catch { setItems([]); }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => { setEditing({ ...emptyForm() }); setFormErrors({}); };
  const openEdit = (item: HeroBanner) => { setEditing({ ...item }); setFormErrors({}); };
  const closeForm = () => { setEditing(null); setFormErrors({}); };

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' })); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.title?.trim()) errors.title = 'Title is required';
    if (!editing?.subtitle?.trim()) errors.subtitle = 'Subtitle is required';
    if (!editing?.description?.trim()) errors.description = 'Description is required';
    if (!editing?.imageUrl?.trim()) errors.imageUrl = 'Image URL is required';
    if (!editing?.linkUrl?.trim()) errors.linkUrl = 'Link URL is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('hero-banners', editing.id, editing);
        addToast('Hero banner updated', 'success');
      } else {
        await api.create('hero-banners', editing);
        addToast('Hero banner created', 'success');
      }
      closeForm();
      load();
    } catch (e: any) {
      addToast(e?.message || 'Save failed', 'error');
    }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this hero banner?')) return;
    try {
      await api.delete('hero-banners', id);
      addToast('Hero banner deleted', 'success');
      load();
    } catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: HeroBanner) => {
    try {
      await api.update('hero-banners', item.id, { isActive: !item.isActive });
      load();
    } catch { addToast('Update failed', 'error'); }
  };

  /* ── Form Modal ── */
  const renderForm = () => {
    if (!editing) return null;
    const isNew = !editing.id;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={closeForm}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">{isNew ? 'New Hero Banner' : 'Edit Hero Banner'}</h3>
            <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <Field label="Title" value={editing.title ?? ''} onChange={v => { setEditing({ ...editing, title: v }); clearError('title'); }} error={formErrors.title} required placeholder="e.g. Welcome to STEM Center" />
            <Field label="Subtitle" value={editing.subtitle ?? ''} onChange={v => { setEditing({ ...editing, subtitle: v }); clearError('subtitle'); }} error={formErrors.subtitle} required placeholder="e.g. Building the Future, One Robot at a Time" />
            <Textarea label="Description" value={editing.description ?? ''} onChange={v => { setEditing({ ...editing, description: v }); clearError('description'); }} error={formErrors.description} required placeholder="e.g. A brief overview of what makes our program unique..." />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Field label="Image URL" value={editing.imageUrl ?? ''} onChange={v => { setEditing({ ...editing, imageUrl: v }); clearError('imageUrl'); }} error={formErrors.imageUrl} required placeholder="e.g. https://example.com/banner.jpg" />
              </div>
              <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
              <button type="button" onClick={() => imageInputRef.current?.click()}
                className="mt-5 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-red transition-colors" title="Upload image">
                <Upload className="w-4 h-4" />
              </button>
            </div>
            {editing.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <img src={editing.imageUrl} alt="" className="w-full h-36 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <Field label="Link URL" value={editing.linkUrl ?? ''} onChange={v => { setEditing({ ...editing, linkUrl: v }); clearError('linkUrl'); }} error={formErrors.linkUrl} required placeholder="e.g. https://example.com/register" />
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                Priority <span className="text-red-400 ml-0.5">*</span>
              </label>
              <input type="number" value={editing.priority ?? 0} onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={editing.isActive ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="rounded" />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end p-4 border-t border-slate-200">
            <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Saving...' : isNew ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Hero Banners</h2>
          {!loading && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} / {items.length}</span>}
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700">
          <Plus className="w-3.5 h-3.5" /> Add Banner
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search banners..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/30" />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {items.length === 0 ? 'No hero banners yet' : 'No banners match your search'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors group">
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                onMouseEnter={e => { const t = e.currentTarget.querySelector('.preview-popup') as HTMLElement; if (t) t.style.display = 'block'; }}
                onMouseLeave={e => { const t = e.currentTarget.querySelector('.preview-popup') as HTMLElement; if (t) t.style.display = 'none'; }}
              >
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <Image className="w-5 h-5 text-slate-400" />}
                {item.imageUrl && (
                  <div className="preview-popup hidden fixed z-50 w-80 rounded-xl shadow-2xl border border-slate-200 overflow-hidden bg-white"
                    style={{ transform: 'translate(calc(-100% + 48px), calc(-100% - 8px))' }}>
                    <img src={item.imageUrl} alt="" className="w-full h-44 object-cover" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                  <span className="text-xs text-slate-400 shrink-0">#{item.priority}</span>
                </div>
              </div>
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
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
      {renderForm()}
    </div>
  );
}

/* ── Shared Field Components ── */
function Field({ label, value, onChange, error, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-brand-red/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, error, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-brand-red/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
