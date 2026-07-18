import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Target, BookOpen, Archive, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LearningMilestone, UserProfile } from '@/shared/types';
import { fetchMilestonesApi, createMilestoneApi, updateMilestoneApi, archiveMilestoneApi, fetchSubProgramsApi, fetchClassesApi } from '@/domains/learning/academics/api/academicApi';
import { isInstructor } from '@/shared/auth/permissions';
import { formatApiError } from '@/shared/utils/formatApiError';

const defaultForm = {
  sub_program: '', title: '', description: '', scope_class: '',
};

export default function LearningMilestonesManager({ currentUser }: { currentUser?: UserProfile }) {
  const [milestones, setMilestones] = useState<LearningMilestone[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LearningMilestone | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    const skipStaffCalls = currentUser?.role === 'Secretary' || isInstructor(currentUser);
    Promise.allSettled([
      skipStaffCalls ? Promise.resolve([]) : fetchMilestonesApi(),
      fetchSubProgramsApi(),
      skipStaffCalls ? Promise.resolve([]) : fetchClassesApi(),
    ]).then(([m, sp, c]) => {
      setMilestones(m.status === 'fulfilled' && Array.isArray(m.value) ? m.value : []);
      setSubPrograms(sp.status === 'fulfilled' && Array.isArray(sp.value) ? sp.value : []);
      setClasses(c.status === 'fulfilled' && Array.isArray(c.value) ? c.value.filter((cl: any) => cl.is_active !== false) : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (m: LearningMilestone) => {
    setEditing(m);
    setForm({
      sub_program: (m as any).sub_program || '',
      title: m.title,
      description: (m as any).description || '',
      scope_class: (m as any).scope_class || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.sub_program) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateMilestoneApi(editing.id, form);
      } else {
        await createMilestoneApi(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMilestoneApi(id);
      setMilestones(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const filtered = milestones.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || ((m as any).description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Learning Milestones</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Milestone
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
          { label: 'Total Milestones', value: milestones.length, icon: Target, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Active', value: milestones.filter(m => (m as any).is_active !== false).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Archived', value: milestones.filter(m => (m as any).is_active === false).length, icon: Archive, color: 'text-slate-600', bg: 'bg-slate-100' },
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

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search milestones..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600" />
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Sub-Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Class</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No milestones matching search' : 'No learning milestones defined'}
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><Target className="w-3.5 h-3.5 text-emerald-600" /></div>
                      <span className="text-xs font-semibold text-slate-900">{m.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{(m as any).sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{(m as any).scope_class_name || 'Shared'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(m)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Edit"><Target className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleArchive(m.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
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
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Target className="w-4 h-4 text-emerald-600" /></div>
                    <h3 className="font-bold text-base text-slate-900">{editing ? 'Edit Milestone' : 'New Learning Milestone'}</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Title</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" placeholder="e.g. Build Base Robot" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program</label>
                    <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                      <option value="">Select sub-program...</option>
                      {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select></div>
                  {classes.length > 0 && <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Scope Class (optional)</label>
                    <select value={form.scope_class} onChange={e => setForm(p => ({ ...p, scope_class: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                      <option value="">All classes (shared milestone)</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {(c as any).sub_program_name || ''}</option>)}
                    </select></div>}
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title || !form.sub_program}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create Milestone'}
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
