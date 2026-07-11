import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, BookOpen, FileText, Download, Trash2, ExternalLink, Filter } from 'lucide-react';
import { LearningMaterial } from '@/src/shared/types';
import { fetchLearningMaterialsApi, createLearningMaterialApi, updateLearningMaterialApi, deleteLearningMaterialApi, downloadLearningMaterialApi, fetchSubProgramsApi } from '@/src/domains/learning/academics/api/academicApi';

const defaultForm = {
  sub_program: '', title: '', description: '', file_url: '', material_type: 'DOCUMENT',
};

const materialTypes = ['DOCUMENT', 'VIDEO', 'IMAGE', 'AUDIO', 'OTHER'];

export default function LearningMaterialsPanel() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LearningMaterial | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchLearningMaterialsApi(),
      fetchSubProgramsApi(),
    ]).then(([m, sp]) => {
      setMaterials(Array.isArray(m) ? m : []);
      setSubPrograms(Array.isArray(sp) ? sp : []);
    }).catch(() => setError('Failed to load materials')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (m: LearningMaterial) => {
    setEditing(m);
    setForm({
      sub_program: (m as any).sub_program || '',
      title: m.title,
      description: (m as any).description || '',
      file_url: (m as any).file_url || '',
      material_type: (m as any).material_type || 'DOCUMENT',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.sub_program) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateLearningMaterialApi(editing.id, form);
      } else {
        await createLearningMaterialApi(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLearningMaterialApi(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete material');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadLearningMaterialApi(id);
    } catch { /* ignore */ }
  };

  const filtered = materials.filter(m => {
    if (typeFilter !== 'all' && (m as any).material_type !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || ((m as any).description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Learning Materials</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-red-dark transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Material
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Materials', value: materials.length, icon: BookOpen, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Documents', value: materials.filter(m => (m as any).material_type === 'DOCUMENT' || !(m as any).material_type).length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Videos & Other', value: materials.filter(m => (m as any).material_type && (m as any).material_type !== 'DOCUMENT').length, icon: ExternalLink, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-xl px-4 py-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="font-black text-lg text-slate-900">{s.value}</p>
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search materials..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-red" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2.5 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-red">
          <option value="all">All Types</option>
          {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Sub-Program</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery || typeFilter !== 'all' ? 'No materials matching filters' : 'No learning materials yet'}
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-blue/5 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-brand-blue" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{m.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {(m as any).material_type || 'DOCUMENT'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{(m as any).sub_program_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleDownload(m.id)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Download"><Download className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(m)} className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Edit"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center"><BookOpen className="w-4 h-4 text-brand-blue" /></div>
                    <h3 className="font-bold text-base text-slate-900">{editing ? 'Edit Material' : 'Add Learning Material'}</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Title</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. VEX V5 Build Guide" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program</label>
                    <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select sub-program...</option>
                      {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Material Type</label>
                    <select value={form.material_type} onChange={e => setForm(p => ({ ...p, material_type: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">File URL</label>
                    <input value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="https://..." /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title || !form.sub_program}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : editing ? 'Update' : 'Add Material'}
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
