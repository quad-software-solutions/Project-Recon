import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, X, GripVertical, Search, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getAll<Faq>('faqs')); }
    catch { setItems([]); }
    setLoading(false);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (search && !item.question.toLowerCase().includes(search.toLowerCase()) && !item.answer.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      return true;
    });
  }, [items, search, categoryFilter]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openCreate = () => { setEditing({ ...emptyForm() }); setFormErrors({}); };
  const openEdit = (item: Faq) => { setEditing({ ...item }); setFormErrors({}); };
  const closeForm = () => { setEditing(null); setFormErrors({}); };

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' })); };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editing?.question?.trim()) errors.question = 'Question is required';
    if (!editing?.answer?.trim()) errors.answer = 'Answer is required';
    if (!editing?.category?.trim()) errors.category = 'Category is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!editing || !validate()) return;
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
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-slate-800">FAQs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage frequently asked questions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      <div className="flex items-center gap-2 p-3 border-b border-slate-100 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FAQs..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/30" />
        </div>
        {categories.length > 0 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/30 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <span className="text-xs text-slate-400">{filtered.length} FAQ{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {items.length === 0 ? 'No FAQs yet' : 'No FAQs match your search'}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(item => {
            const isExpanded = expanded.has(item.id);
            return (
              <div key={item.id} className="transition-colors">
                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleExpand(item.id)}>
                  <GripVertical className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  <HelpCircle className="w-4 h-4 text-brand-red shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{item.question}</p>
                      {item.category && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">{item.category}</span>
                      )}
                    </div>
                    <p className={`text-xs text-slate-400 mt-0.5 ${isExpanded ? '' : 'line-clamp-1'}`}>{item.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleExpand(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex items-center gap-1">
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
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 ml-10 border-l-2 border-brand-red/20 pl-4">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
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
              <Field label="Question" value={editing.question ?? ''} onChange={v => { setEditing({ ...editing, question: v }); clearError('question'); }} error={formErrors.question} required placeholder="e.g. How do I register for a program?" />
              <Textarea label="Answer" value={editing.answer ?? ''} onChange={v => { setEditing({ ...editing, answer: v }); clearError('answer'); }} error={formErrors.answer} required placeholder="e.g. You can register by visiting our registration page..." />
              <Field label="Category" value={editing.category ?? ''} onChange={v => { setEditing({ ...editing, category: v }); clearError('category'); }} error={formErrors.category} required placeholder="e.g. Registration, Programs, General" />
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
