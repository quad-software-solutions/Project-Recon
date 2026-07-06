import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, X, Globe, Lock, GripVertical } from 'lucide-react';
import { api, Faq } from '../api/cmsApi';
import type { Toast } from './CmsDashboard';

interface Props { addToast: (msg: string, type: 'success' | 'error') => void }

const emptyForm = (): Partial<Faq> => ({
  question: '', answer: '', category: '', priority: 0, isActive: true,
});

export default function FaqManager({ addToast }: Props) {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<Faq>('faqs')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const openCreate = () => setEditing({ ...emptyForm() });
  const openEdit = (item: Faq) => setEditing({ ...item });
  const closeForm = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.update('faqs', editing.id, editing);
        addToast('FAQ updated', 'success');
      } else {
        await api.create('faqs', editing);
        addToast('FAQ created', 'success');
      }
      closeForm();
      load();
    } catch (e: any) { addToast(e?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this FAQ?')) return;
    try { await api.delete('faqs', id); addToast('FAQ deleted', 'success'); load(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const toggleActive = async (item: Faq) => {
    try { await api.update('faqs', item.id, { isActive: !item.isActive }); load(); }
    catch { addToast('Update failed', 'error'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h2 className="font-bold text-slate-800">FAQs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage frequently asked questions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No FAQs yet</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors">
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
              <HelpCircle className="w-4 h-4 text-brand-red shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{item.question}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.answer}</p>
                {item.category && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md mt-1 inline-block">{item.category}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-1">
                <button onClick={() => toggleActive(item)} className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}>
                  {item.isActive ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{editing.id ? 'Edit FAQ' : 'New FAQ'}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field label="Question" value={editing.question ?? ''} onChange={v => setEditing({ ...editing, question: v })} />
              <Textarea label="Answer" value={editing.answer ?? ''} onChange={v => setEditing({ ...editing, answer: v })} />
              <Field label="Category" value={editing.category ?? ''} onChange={v => setEditing({ ...editing, category: v })} />
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
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={4}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 resize-none" />
    </div>
  );
}
