import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageSquareQuote, Plus, Edit2, Trash2, X, Search, Upload, Eye, EyeOff, Play } from 'lucide-react';
import { api, Testimonial } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const emptyForm = (): Partial<Testimonial> => ({
  name: '', role: '', quote: '', imageUrl: '', videoUrl: '', isActive: true, priority: 0,
});

export default function TestimonialManager({ addToast }: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
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
    try { setItems(await api.getAll<Testimonial>('testimonials')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q) ||
      item.quote?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => { setEditing({ ...emptyForm() }); setFormErrors({}); };
  const openEdit = (item: Testimonial) => { setEditing({ ...item }); setFormErrors({}); };
  const closeForm = () => { setEditing(null); setFormErrors({}); };

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' })); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.name?.trim()) errors.name = 'Name is required';
    if (!editing?.role?.trim()) errors.role = 'Role is required';
    if (!editing?.quote?.trim()) errors.quote = 'Quote is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('testimonials', editing.id, editing);
        addToast('Testimonial updated', 'success');
      } else {
        await api.create('testimonials', editing);
        addToast('Testimonial added', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed — backend endpoint may not be ready yet', 'error'); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this testimonial?')) return;
    try { await api.delete('testimonials', id); addToast('Testimonial removed', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: Testimonial) => {
    try { await api.update('testimonials', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Testimonials</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
            About page
          </span>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Testimonial
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search testimonials..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {items.length === 0 ? 'No testimonials added yet' : 'No testimonials match your search'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                {(item.imageUrl || item.image) ? (
                  <img src={item.imageUrl || item.image || ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MessageSquareQuote className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                  {(item.videoUrl || item.video_url) && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                      <Play className="w-2.5 h-2.5" /> Video
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{item.role} — {item.quote}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.isActive ?? item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>{item.isActive ?? item.is_active ? 'Published' : 'Draft'}</span>
                <button onClick={() => toggleActive(item)} className={`p-1 rounded-lg transition-colors ${(item.isActive ?? item.is_active) ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`} title={(item.isActive ?? item.is_active) ? 'Unpublish' : 'Publish'}>
                  {(item.isActive ?? item.is_active) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Testimonial' : 'New Testimonial'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field label="Name" value={editing.name ?? ''} onChange={v => { setEditing({ ...editing, name: v }); clearError('name'); }} error={formErrors.name} required placeholder="e.g. Hanna Bekele" />
              <Field label="Role" value={editing.role ?? ''} onChange={v => { setEditing({ ...editing, role: v }); clearError('role'); }} error={formErrors.role} required placeholder="e.g. Parent, Student, Partner" />
              <Textarea label="Quote" value={editing.quote ?? ''} onChange={v => { setEditing({ ...editing, quote: v }); clearError('quote'); }} error={formErrors.quote} required placeholder="Their testimonial quote..." />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Field label="Photo URL" value={editing.imageUrl ?? editing.image ?? ''} onChange={v => setEditing({ ...editing, imageUrl: v })} placeholder="https://... or upload" />
                </div>
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="mt-5 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors" title="Upload image">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {(editing.imageUrl || editing.image) && (
                <div className="rounded-xl overflow-hidden border border-slate-200 p-3 flex items-center justify-center bg-slate-50">
                  <img src={editing.imageUrl || editing.image || ''} alt="" className="w-16 h-16 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <Field label="Video URL" value={editing.videoUrl ?? editing.video_url ?? ''} onChange={v => setEditing({ ...editing, videoUrl: v })} placeholder="YouTube, Vimeo, or direct mp4 URL" />
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Order</label>
                <input type="number" value={editing.priority ?? editing.order ?? 0} onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editing.isActive ?? editing.is_active ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="rounded" />
                Active / Published
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

function Field({ label, value, onChange, error, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`} />
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
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-blue-500/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
