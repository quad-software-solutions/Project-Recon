import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, BookOpen, Users, UserCheck, Filter, CheckCircle2, RotateCcw, Split } from 'lucide-react';
import { AcademicClass } from '@/shared/types';
import { fetchClassesApi, createClassApi, updateClassApi, assignClassInstructorApi, setClassActiveApi, fetchSubProgramsApi, splitClassApi } from '@/domains/learning/academics/api/academicApi';
import { fetchAllUsersApi, resolveRole, branchesApi } from '@/domains/user/shared/api/adminApi';
import { formatApiError } from '@/shared/utils/formatApiError';

const defaultForm = {
  sub_program: '', branch: '', instructor: '', name: '', class_type: 'GROUP', class_period: '', capacity: '', start_date: '', end_date: '',
};

export default function ClassManagerPanel() {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AcademicClass | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [assigning, setAssigning] = useState<{ classId: string; instructor: string } | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [splitting, setSplitting] = useState<{ sourceId: string; targetClass: string; count: string } | null>(null);
  const [splitSaving, setSplitSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchClassesApi(),
      fetchSubProgramsApi(),
      branchesApi.list().catch(() => []),
      fetchAllUsersApi().then(users => {
        return users.filter((u: any) => {
          const role = resolveRole(u.assignments);
          return role === 'instructor' || role === 'Instructor';
        });
      }).catch(() => []),
    ]).then(([c, sp, br, inst]) => {
      setClasses(Array.isArray(c) ? c : []);
      setSubPrograms(Array.isArray(sp) ? sp : []);
      setBranches(Array.isArray(br) ? br : []);
      setInstructors(inst);
    }).catch(() => setError('Failed to load classes')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setInstructorSearch('');
    setShowInstructorDropdown(false);
    setShowForm(true);
  };

  const openEdit = (c: AcademicClass) => {
    setEditing(c);
    const instId = (c as any).instructor || '';
    const instObj = instructors.find(i => i.id === instId);
    setInstructorSearch(instObj ? `${instObj.full_name} (${instObj.email})` : '');
    setShowInstructorDropdown(false);
    setForm({
      sub_program: (c as any).sub_program || '',
      branch: (c as any).branch || '',
      instructor: (c as any).instructor || '',
      name: c.name,
      class_type: c.class_type || 'GROUP',
      class_period: (c as any).class_period || '',
      capacity: String((c as any).capacity || ''),
      start_date: (c as any).start_date || '',
      end_date: (c as any).end_date || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sub_program || !form.branch || !form.instructor) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = { ...form, capacity: form.capacity ? Number(form.capacity) : undefined };
      if (!payload.class_period) delete payload.class_period;

      if (editing) {
        await updateClassApi(editing.id, payload);
      } else {
        await createClassApi(payload);
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

  const handleAssign = async () => {
    if (!assigning) return;
    setAssignSaving(true);
    setError(null);
    try {
      await assignClassInstructorApi(assigning.classId, assigning.instructor);
      setAssigning(null);
      load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setAssignSaving(false);
    }
  };

  const handleSplit = async () => {
    if (!splitting?.targetClass || !splitting.count) return;
    const count = Number(splitting.count);
    if (!Number.isFinite(count) || count < 1) {
      setError('Enter a valid number of enrollments to move');
      return;
    }
    setSplitSaving(true);
    setError(null);
    try {
      await splitClassApi(splitting.sourceId, {
        target_class: splitting.targetClass,
        count,
      });
      setSplitting(null);
      load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSplitSaving(false);
    }
  };

  const toggleActive = async (c: AcademicClass) => {
    try {
      await setClassActiveApi(c.id, c.is_active === false);
      load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const filtered = classes.filter(c => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && c.is_active === false) return false;
      if (statusFilter === 'inactive' && c.is_active !== false) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || ((c as any).sub_program_name || '').toLowerCase().includes(q) || ((c as any).instructor_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Classes</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Class
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
          { label: 'Total Classes', value: classes.length, icon: BookOpen, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Active', value: classes.filter(c => c.is_active !== false).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: classes.filter(c => c.is_active === false).length, icon: RotateCcw, color: 'text-slate-600', bg: 'bg-slate-100' },
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
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search classes..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Class</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Instructor</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Type</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No classes matching' : 'No classes defined'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-blue/5 flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-brand-blue" /></div>
                      <span className="text-xs font-semibold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                    {(c as any).instructor_name || (
                      <button onClick={() => setAssigning({ classId: c.id, instructor: '' })} className="text-blue-600 hover:underline text-[10px] font-bold">Assign</button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{c.class_type || 'GROUP'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setAssigning({ classId: c.id, instructor: (c as any).instructor || '' })} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Assign Instructor"><UserCheck className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setSplitting({ sourceId: c.id, targetClass: '', count: '' })} className="p-1 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50" title="Split class"><Split className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(c)} className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Edit"><BookOpen className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(c)} className={`p-1 rounded-lg ${c.is_active !== false ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={c.is_active !== false ? 'Deactivate' : 'Activate'}>
                        {c.is_active !== false ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <h3 className="font-bold text-base text-slate-900">{editing ? 'Edit Class' : 'New Class'}</h3>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-visible">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Class Name <span className="text-red-500">*</span></label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" placeholder="e.g. VEX V5 - Section A" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program <span className="text-red-500">*</span></label>
                      <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="">Select...</option>
                        {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                      </select></div>
                    <div className="relative"><label className="text-[11px] font-bold text-slate-600 mb-1 block">Instructor <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          value={instructorSearch}
                          onChange={e => {
                            setInstructorSearch(e.target.value);
                            setForm(p => ({ ...p, instructor: '' }));
                            setShowInstructorDropdown(true);
                          }}
                          onFocus={() => setShowInstructorDropdown(true)}
                          placeholder="Search instructor..."
                          className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        />
                        {showInstructorDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowInstructorDropdown(false)} />
                            <div className="absolute top-full mt-1 left-0 right-0 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                              {instructors.filter(i => 
                                i.full_name.toLowerCase().includes(instructorSearch.toLowerCase()) || 
                                i.email.toLowerCase().includes(instructorSearch.toLowerCase())
                              ).map(inst => (
                                <div key={inst.id} onClick={() => {
                                  setForm(p => ({ ...p, instructor: inst.id }));
                                  setInstructorSearch(`${inst.full_name} (${inst.email})`);
                                  setShowInstructorDropdown(false);
                                }} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 truncate">
                                  {inst.full_name} <span className="text-slate-400 text-xs">({inst.email})</span>
                                </div>
                              ))}
                              {instructors.filter(i => 
                                i.full_name.toLowerCase().includes(instructorSearch.toLowerCase()) || 
                                i.email.toLowerCase().includes(instructorSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-slate-400 text-center">No instructors found</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Type <span className="text-red-500">*</span></label>
                      <select value={form.class_type} onChange={e => setForm(p => ({ ...p, class_type: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="GROUP">Group</option>
                        <option value="INDIVIDUAL">Individual</option>
                      </select></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Period</label>
                      <select value={form.class_period} onChange={e => setForm(p => ({ ...p, class_period: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="">Any</option>
                        <option value="FULL_DAY">Full Day</option>
                        <option value="HALF_DAY">Half Day</option>
                      </select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Capacity {form.class_type === 'GROUP' && <span className="text-red-500">*</span>}</label>
                      <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600" placeholder="e.g. 20" /></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Branch <span className="text-red-500">*</span></label>
                      <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
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
                  <button onClick={handleSave} disabled={saving || !form.name || !form.sub_program || !form.branch || !form.instructor}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create Class'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {assigning && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssigning(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <h3 className="font-bold text-base text-slate-900">Assign Instructor</h3>
                  <button onClick={() => setAssigning(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Instructor</label>
                    <select value={assigning.instructor} onChange={e => setAssigning(p => p ? { ...p, instructor: e.target.value } : null)} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600">
                      <option value="">Select instructor...</option>
                      {instructors.map((inst: any) => (
                        <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.email})</option>
                      ))}
                    </select></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setAssigning(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleAssign} disabled={assignSaving || !assigning.instructor}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {assignSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {assignSaving ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {splitting && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSplitting(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <h3 className="font-bold text-base text-slate-900">Split Class</h3>
                  <button onClick={() => setSplitting(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-500">Move a number of enrollments from this class into another active class.</p>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Target class</label>
                    <select
                      value={splitting.targetClass}
                      onChange={e => setSplitting(p => p ? { ...p, targetClass: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    >
                      <option value="">Select target...</option>
                      {classes.filter(c => c.id !== splitting.sourceId && c.is_active !== false).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Enrollments to move</label>
                    <input
                      type="number"
                      min={1}
                      value={splitting.count}
                      onChange={e => setSplitting(p => p ? { ...p, count: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setSplitting(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSplit} disabled={splitSaving || !splitting.targetClass || !splitting.count}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {splitSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {splitSaving ? 'Splitting...' : 'Split'}
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
