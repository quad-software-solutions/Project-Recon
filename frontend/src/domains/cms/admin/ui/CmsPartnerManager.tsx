import React, { useState, useEffect } from 'react';
import { Handshake, Plus, Edit2, Trash2, X, Globe, Lock, GripVertical } from 'lucide-react';
import { api, Partner } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const emptyForm = (): Partial<Partner> => ({
  name: '', logoUrl: '', websiteUrl: '', description: '', isActive: true, priority: 0,
});

export default function CmsPartnerManager({ addToast }: Props) {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Partner> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<Partner>('partners')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const openCreate = () => setEditing({ ...emptyForm() });
  const openEdit = (item: Partner) => setEditing({ ...item });
  const closeForm = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('partners', editing.id, editing);
        addToast('Partner updated', 'success');
      } else {
        await api.create('partners', editing);
        addToast('Partner added', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this partner?')) return;
    try { await api.delete('partners', id); addToast('Partner removed', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: Partner) => {
    try { await api.update('partners', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800">Partners & Sponsors</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700">
          <Plus className="w-3.5 h-3.5" /> Add Partner
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No partners added yet</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                {item.logoUrl ? <img src={item.logoUrl} alt="" className="w-full h-full object-cover" /> : <Handshake className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                {item.websiteUrl && <p className="text-xs text-blue-500 truncate">{item.websiteUrl}</p>}
              </div>
              <button onClick={() => toggleActive(item)} className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}>
                {item.isActive ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
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
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Partner' : 'New Partner'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field label="Partner Name" value={editing.name ?? ''} onChange={v => setEditing({ ...editing, name: v })} />
              <Field label="Logo URL" value={editing.logoUrl ?? ''} onChange={v => setEditing({ ...editing, logoUrl: v })} />
              <Field label="Website URL" value={editing.websiteUrl ?? ''} onChange={v => setEditing({ ...editing, websiteUrl: v })} />
              <Textarea label="Description" value={editing.description ?? ''} onChange={v => setEditing({ ...editing, description: v })} />
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority</label>
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
                {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30" />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 resize-none" />
    </div>
  );
}
