import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Calendar, Clock, CheckCircle2, RotateCcw, Filter } from 'lucide-react';
import { EnrollmentPeriod, UserProfile } from '@/shared/types';
import { fetchEnrollmentPeriodsApi, createEnrollmentPeriodApi, updateEnrollmentPeriodApi, setEnrollmentPeriodActiveApi, fetchProgramsApi, fetchSubProgramsApi } from '@/domains/learning/academics/api/academicApi';
import { branchesApi } from '@/domains/user/shared/api/adminApi';

const defaultForm = {
  branch: '', program: '', sub_program: '', class_type: 'GROUP', class_period: '', title: '', start_date: '', end_date: '',
};

export default function EnrollmentPeriodsPanel({ currentUser }: { currentUser?: UserProfile }) {
  const [periods, setPeriods] = useState<EnrollmentPeriod[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EnrollmentPeriod | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    const isSecretary = currentUser?.role === 'Secretary';
    Promise.allSettled([
      fetchEnrollmentPeriodsApi(),
      isSecretary ? Promise.resolve([]) : branchesApi.list(),
      fetchProgramsApi(),
      fetchSubProgramsApi(),
    ]).then(([p, b, pr, sp]) => {
      if (p.status === 'fulfilled') setPeriods(Array.isArray(p.value) ? p.value : []);
      if (b.status === 'fulfilled') setBranches(Array.isArray(b.value) ? b.value : (b.value as any)?.results || []);
      if (pr.status === 'fulfilled') setPrograms(Array.isArray(pr.value) ? pr.value : []);
      if (sp.status === 'fulfilled') setSubPrograms(Array.isArray(sp.value) ? sp.value : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (p: EnrollmentPeriod) => {
    setEditing(p);
    setForm({
      branch: (p as any).branch || '',
      program: (p as any).program || '',
      sub_program: (p as any).sub_program || '',
      class_type: p.class_type || 'GROUP',
      class_period: (p as any).class_period || '',
      title: p.title,
      start_date: p.start_date || '',
      end_date: p.end_date || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.branch || !form.program || !form.sub_program || !form.start_date || !form.end_date) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateEnrollmentPeriodApi(editing.id, form);
      } else {
        await createEnrollmentPeriodApi(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save enrollment period');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: EnrollmentPeriod) => {
    try {
      await setEnrollmentPeriodActiveApi(p.id, p.is_active === false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle period');
    }
  };

  const filtered = periods.filter(p => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && p.is_active === false) return false;
      if (statusFilter === 'inactive' && p.is_active !== false) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p as any).program_name?.toLowerCase().includes(q) || (p as any).branch_name?.toLowerCase().includes(q);
  });

  const now = new Date();
  const activePeriods = periods.filter(p => p.is_active !== false && new Date(p.end_date) >= now);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Enrollment Periods</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Period
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
          { label: 'Total Periods', value: periods.length, icon: Calendar, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Open Now', value: activePeriods.length, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: periods.filter(p => p.is_active === false).length, icon: RotateCcw, color: 'text-slate-600', bg: 'bg-slate-100' },
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
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search periods..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Dates</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No periods matching search' : 'No enrollment periods defined'}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-blue/5 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-brand-blue" /></div>
                      <span className="text-xs font-semibold text-slate-900">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{(p as any).program_name || (p as any).sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {p.start_date?.slice(0, 10) || '?'} — {p.end_date?.slice(0, 10) || '?'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Edit"><Calendar className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(p)} className={`p-1 rounded-lg ${p.is_active !== false ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={p.is_active !== false ? 'Deactivate' : 'Activate'}>
                        {p.is_active !== false ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
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
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center"><Calendar className="w-4 h-4 text-brand-blue" /></div>
                    <h3 className="font-bold text-base text-slate-900">{editing ? 'Edit Period' : 'New Enrollment Period'}</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Title</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" placeholder="e.g. Fall 2026 Enrollment" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Branch</label>
                    {branches.length === 0 ? (
                      <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Branches unavailable — check permissions
                      </div>
                    ) : (
                      <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    )}</div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Program</label>
                    <select value={form.program} onChange={e => setForm(p => ({ ...p, program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                      <option value="">Select program...</option>
                      {programs.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program</label>
                    <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                      <option value="">Select sub-program...</option>
                      {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Class Type</label>
                      <select value={form.class_type} onChange={e => setForm(p => ({ ...p, class_type: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="GROUP">Group</option>
                        <option value="INDIVIDUAL">Individual</option>
                      </select></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Period</label>
                      <select value={form.class_period} onChange={e => setForm(p => ({ ...p, class_period: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="">Any</option>
                        <option value="MORNING">Morning</option>
                        <option value="AFTERNOON">Afternoon</option>
                        <option value="EVENING">Evening</option>
                        <option value="WEEKEND">Weekend</option>
                      </select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Start Date</label>
                      <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" /></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">End Date</label>
                      <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" /></div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title || !form.branch || !form.program || !form.sub_program || !form.start_date || !form.end_date}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : editing ? 'Update Period' : 'Create Period'}
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
