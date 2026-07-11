import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, X, Search, Upload, Eye, EyeOff } from 'lucide-react';
import { api, MapNode } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const CATEGORIES = [
  { value: 'CHAMPIONSHIP', label: 'Championship' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'STRATEGY', label: 'Strategy' },
  { value: 'ALLIANCE', label: 'Alliance' },
];

const emptyForm = (): Partial<MapNode> => ({
  city: '', country: '', title: '', achievement: '',
  x: 50, y: 50, lat: '', lng: '', imageUrl: '', category: 'CHAMPIONSHIP', isActive: true,
});

export default function MapNodeManager({ addToast }: Props) {
  const [items, setItems] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<MapNode> | null>(null);
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
    try { setItems(await api.getAll<MapNode>('map-nodes')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.city.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => { setEditing({ ...emptyForm() }); setFormErrors({}); };
  const openEdit = (item: MapNode) => { setEditing({ ...item }); setFormErrors({}); };
  const closeForm = () => { setEditing(null); setFormErrors({}); };

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' })); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.city?.trim()) errors.city = 'City is required';
    if (!editing?.country?.trim()) errors.country = 'Country is required';
    if (!editing?.title?.trim()) errors.title = 'Title is required';
    if (!editing?.achievement?.trim()) errors.achievement = 'Achievement is required';
    if (editing?.x === undefined || editing.x < 0 || editing.x > 100) errors.x = 'X must be 0–100';
    if (editing?.y === undefined || editing.y < 0 || editing.y > 100) errors.y = 'Y must be 0–100';
    if (!editing?.category) errors.category = 'Category is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('map-nodes', editing.id, editing);
        addToast('Map node updated', 'success');
      } else {
        await api.create('map-nodes', editing);
        addToast('Map node created', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const remove = async (id: number | string) => {
    if (!confirm('Delete this map node?')) return;
    try { await api.delete('map-nodes', id); addToast('Deleted', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: MapNode) => {
    try { await api.update('map-nodes', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  const categoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      CHAMPIONSHIP: 'bg-amber-100 text-amber-700',
      ACADEMIC: 'bg-blue-100 text-blue-700',
      RESEARCH: 'bg-purple-100 text-purple-700',
      STRATEGY: 'bg-cyan-100 text-cyan-700',
      ALLIANCE: 'bg-emerald-100 text-emerald-700',
    };
    return colors[cat] ?? 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Map Nodes</h2>
          {!loading && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} / {items.length}</span>}
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700">
          <Plus className="w-3.5 h-3.5" /> Add Node
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nodes..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/30" />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {items.length === 0 ? 'No map nodes yet' : 'No nodes match your search'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-400 truncate">{item.city}, {item.country}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${categoryBadge(item.category)}`}>
                  {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                </span>
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
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Map Node' : 'New Map Node'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={editing.city ?? ''} onChange={v => { setEditing({ ...editing, city: v }); clearError('city'); }} error={formErrors.city} required placeholder="e.g. Addis Ababa" />
                <Field label="Country" value={editing.country ?? ''} onChange={v => { setEditing({ ...editing, country: v }); clearError('country'); }} error={formErrors.country} required placeholder="e.g. Ethiopia" />
              </div>
              <Field label="Title" value={editing.title ?? ''} onChange={v => { setEditing({ ...editing, title: v }); clearError('title'); }} error={formErrors.title} required placeholder="e.g. African Robotics Championship" />
              <Textarea label="Achievement" value={editing.achievement ?? ''} onChange={v => { setEditing({ ...editing, achievement: v }); clearError('achievement'); }} error={formErrors.achievement} required placeholder="e.g. Led the national team to victory at the ARC finals..." />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">X Position <span className="text-red-400 ml-0.5">*</span></label>
                  <input type="number" min={0} max={100} value={editing.x ?? 50}
                    onChange={e => { const v = parseFloat(e.target.value) || 0; setEditing({ ...editing, x: v }); clearError('x'); }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${formErrors.x ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-brand-red/30'}`} />
                  {formErrors.x && <p className="text-xs text-red-500 mt-1">{formErrors.x}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Y Position <span className="text-red-400 ml-0.5">*</span></label>
                  <input type="number" min={0} max={100} value={editing.y ?? 50}
                    onChange={e => { const v = parseFloat(e.target.value) || 0; setEditing({ ...editing, y: v }); clearError('y'); }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${formErrors.y ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-brand-red/30'}`} />
                  {formErrors.y && <p className="text-xs text-red-500 mt-1">{formErrors.y}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" value={editing.lat ?? ''} onChange={v => setEditing({ ...editing, lat: v })} placeholder='e.g. 8.9806° N' />
                <Field label="Longitude" value={editing.lng ?? ''} onChange={v => setEditing({ ...editing, lng: v })} placeholder='e.g. 38.7578° E' />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category <span className="text-red-400 ml-0.5">*</span></label>
                <select value={editing.category ?? 'CHAMPIONSHIP'} onChange={e => { setEditing({ ...editing, category: e.target.value }); clearError('category'); }}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${formErrors.category ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-brand-red/30'}`}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Field label="Image URL" value={editing.imageUrl ?? ''} onChange={v => { setEditing({ ...editing, imageUrl: v }); clearError('imageUrl'); }} error={formErrors.imageUrl} placeholder="e.g. https://example.com/photo.jpg" />
                </div>
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="mt-5 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-red transition-colors" title="Upload image">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {editing.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={editing.imageUrl} alt="" className="w-full h-32 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editing.isActive ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="rounded" />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-slate-200">
              <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700 disabled:opacity-50">
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
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error ? 'border-red-300 focus:ring-red-30 bg-red-50' : 'border-slate-200 focus:ring-brand-red/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
