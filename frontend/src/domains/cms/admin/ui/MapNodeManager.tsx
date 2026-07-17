import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, X, Search, Upload, Eye, EyeOff, Check } from 'lucide-react';
import { api, MapNode } from '../api/cmsApi';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const MAP_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWgdVFndBUNlNV9eIO2rJrJ6ZMUr1rYW5aNtWkNWsNnCxdVo1LfrWx1j_NG95L-qb3Q3gjhJ5fGtz1r6p_tJCaWWDN504rg8UJKqgmHusbY6G-CNFef5c7SciVdBxxABBRoW_w-JxCxdClCbwBiOIdZdl8hR8llVYgUXw-B5gK5NJn0vWVsUKX_Lcx-6Av43mGDc_0EZw_8Rq_xlPbV3qtR1qT4_Pr6Ue6q1bdVGPlkHPZgOdtLWZv0rqK_27qkGVHeiPrBRbWpU7M';

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

interface PendingLocation { x: number; y: number; lat: string; lng: string }

// ─── Mini Map Picker ────────────────────────────────────────────────────────
function MiniMapPicker({
  existingNodes,
  currentNodeId,
  onConfirm,
}: {
  existingNodes: MapNode[];
  currentNodeId?: number | string;
  onConfirm: (loc: PendingLocation) => void;
}) {
  const [pending, setPending] = useState<PendingLocation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    // Same formula as AboutTab.tsx:75-76
    const latSim = (90 - (yPct / 100) * 180).toFixed(4);
    const lngSim = ((xPct / 100) * 360 - 180).toFixed(4);
    const lat = `${Math.abs(Number(latSim))}° ${Number(latSim) >= 0 ? 'N' : 'S'}`;
    const lng = `${Math.abs(Number(lngSim))}° ${Number(lngSim) >= 0 ? 'E' : 'W'}`;

    setPending({ x: parseFloat(xPct.toFixed(2)), y: parseFloat(yPct.toFixed(2)), lat, lng });
  };

  const handleConfirm = () => {
    if (pending) { onConfirm(pending); setPending(null); }
  };

  const handleCancel = () => setPending(null);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase">
        Pick Location on Map
        <span className="ml-1.5 font-normal text-slate-400 normal-case">(click to preview, then confirm)</span>
      </label>

      {/* Map container */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full rounded-xl overflow-hidden border border-slate-200 cursor-crosshair select-none"
      >
        <img
          src={MAP_URL}
          alt="World map"
          className="w-full h-auto block select-none pointer-events-none opacity-80"
          draggable={false}
        />

        {/* Existing node markers */}
        {existingNodes
          .filter(n => n.id !== currentNodeId)
          .map(n => (
            <div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 border border-white shadow-sm opacity-70" />
            </div>
          ))}

        {/* Pending preview marker */}
        {pending && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
          >
            {/* Pulsing ring */}
            <div className="absolute -inset-2 rounded-full bg-amber-400/30 animate-ping" />
            {/* Pin dot */}
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-md relative z-10" />
            {/* Tooltip */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/90 text-white text-[9px] font-mono px-1.5 py-1 rounded whitespace-nowrap z-20 shadow-lg">
              x={pending.x.toFixed(1)} y={pending.y.toFixed(1)}<br />
              {pending.lat}, {pending.lng}
            </div>
          </div>
        )}

        {/* Crosshair hint */}
        {!pending && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/40 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              Click to place marker
            </span>
          </div>
        )}
      </div>

      {/* Inline confirm / cancel */}
      {pending && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-800 flex-1">
            <span className="font-bold">x={pending.x.toFixed(1)}, y={pending.y.toFixed(1)}</span>
            <span className="mx-1 text-amber-400">·</span>
            {pending.lat}, {pending.lng}
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Check className="w-3 h-3" /> Use
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
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

  const handleMapConfirm = (loc: PendingLocation) => {
    if (!editing) return;
    setEditing({ ...editing, x: loc.x, y: loc.y, lat: loc.lat, lng: loc.lng });
    clearError('x'); clearError('y');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800">Map Nodes</h2>
          {!loading && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} / {items.length}</span>}
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Node
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nodes..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Map Node' : 'New Map Node'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={editing.city ?? ''} onChange={v => { setEditing({ ...editing, city: v }); clearError('city'); }} error={formErrors.city} required placeholder="e.g. Addis Ababa" />
                <Field label="Country" value={editing.country ?? ''} onChange={v => { setEditing({ ...editing, country: v }); clearError('country'); }} error={formErrors.country} required placeholder="e.g. Ethiopia" />
              </div>
              <Field label="Title" value={editing.title ?? ''} onChange={v => { setEditing({ ...editing, title: v }); clearError('title'); }} error={formErrors.title} required placeholder="e.g. African Robotics Championship" />
              <Textarea label="Achievement" value={editing.achievement ?? ''} onChange={v => { setEditing({ ...editing, achievement: v }); clearError('achievement'); }} error={formErrors.achievement} required placeholder="e.g. Led the national team to victory at the ARC finals..." />

              {/* ── Interactive Map Picker ── */}
              <MiniMapPicker
                existingNodes={items}
                currentNodeId={editing.id}
                onConfirm={handleMapConfirm}
              />

              {/* X / Y fields — auto-filled by map picker, still editable */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">X Position <span className="text-red-400 ml-0.5">*</span></label>
                  <input type="number" min={0} max={100} step={0.01} value={editing.x ?? 50}
                    onChange={e => { const v = parseFloat(e.target.value) || 0; setEditing({ ...editing, x: v }); clearError('x'); }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${formErrors.x ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
                  {formErrors.x && <p className="text-xs text-red-500 mt-1">{formErrors.x}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Y Position <span className="text-red-400 ml-0.5">*</span></label>
                  <input type="number" min={0} max={100} step={0.01} value={editing.y ?? 50}
                    onChange={e => { const v = parseFloat(e.target.value) || 0; setEditing({ ...editing, y: v }); clearError('y'); }}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${formErrors.y ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
                  {formErrors.y && <p className="text-xs text-red-500 mt-1">{formErrors.y}</p>}
                </div>
              </div>

              {/* Lat / Lng — auto-filled by map picker */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" value={editing.lat ?? ''} onChange={v => setEditing({ ...editing, lat: v })} placeholder='e.g. 8.9806° N' />
                <Field label="Longitude" value={editing.lng ?? ''} onChange={v => setEditing({ ...editing, lng: v })} placeholder='e.g. 38.7578° E' />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category <span className="text-red-400 ml-0.5">*</span></label>
                <select value={editing.category ?? 'CHAMPIONSHIP'} onChange={e => { setEditing({ ...editing, category: e.target.value }); clearError('category'); }}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${formErrors.category ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
              </div>

              {/* Image */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Field label="Image URL" value={editing.imageUrl ?? ''} onChange={v => { setEditing({ ...editing, imageUrl: v }); clearError('imageUrl'); }} error={formErrors.imageUrl} placeholder="e.g. https://example.com/photo.jpg" />
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
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editing.isActive ?? true} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="rounded" />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-slate-200 sticky bottom-0 bg-white">
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
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
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
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${error ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-slate-200 focus:ring-blue-600/30'}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
