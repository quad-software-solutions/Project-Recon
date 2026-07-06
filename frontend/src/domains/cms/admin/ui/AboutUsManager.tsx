import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit2, Trash2, X, Globe, Lock } from 'lucide-react';
import { api, AboutUs } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const emptyForm = (): Partial<AboutUs> => ({
  title: '', content: '', mission: '', vision: '', imageUrl: '', isActive: true,
});

export default function AboutUsManager({ addToast }: Props) {
  const [items, setItems] = useState<AboutUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AboutUs> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<AboutUs>('about')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const openCreate = () => setEditing({ ...emptyForm() });
  const openEdit = (item: AboutUs) => setEditing({ ...item });
  const closeForm = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('about', editing.id, editing);
        addToast('About section updated', 'success');
      } else {
        await api.create('about', editing);
        addToast('About section created', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this about section?')) return;
    try { await api.delete('about', id); addToast('Deleted', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: AboutUs) => {
    try { await api.update('about', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800">About Us Sections</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700">
          <Plus className="w-3.5 h-3.5" /> Add Section
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No about sections yet</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
              <Building className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-400 truncate line-clamp-1">{item.content}</p>
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
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit Section' : 'New Section'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field label="Title" value={editing.title ?? ''} onChange={v => setEditing({ ...editing, title: v })} />
              <Field label="Image URL" value={editing.imageUrl ?? ''} onChange={v => setEditing({ ...editing, imageUrl: v })} />
              <Textarea label="Content" value={editing.content ?? ''} onChange={v => setEditing({ ...editing, content: v })} />
              <Textarea label="Mission" value={editing.mission ?? ''} onChange={v => setEditing({ ...editing, mission: v })} />
              <Textarea label="Vision" value={editing.vision ?? ''} onChange={v => setEditing({ ...editing, vision: v })} />
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
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={4}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 resize-none" />
    </div>
  );
}
