import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  BookOpen,
  Building,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
  XCircle,
  Search,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Clock,
  DollarSign,
  X,
  Check,
} from 'lucide-react';
import type { Program, SubProgram } from '@/shared/types';
import {
  createProgramApi,
  createSubProgramApi,
  fetchProgramsApi,
  fetchSubProgramsApi,
  setProgramActiveApi,
  setSubProgramActiveApi,
  updateProgramApi,
  updateSubProgramApi,
  type AcademicProgramPayload,
  type AcademicSubProgramPayload,
} from '@/domains/learning/academics/api/academicApi';

type ProgramForm = AcademicProgramPayload & { id?: string };
type SubProgramForm = AcademicSubProgramPayload & { id?: string };

const emptyProgram: ProgramForm = {
  name: '', slug: '', description: '', supports_group: true, supports_individual: true,
};

const emptySubProgram: SubProgramForm = {
  program: '', name: '', slug: '', description: '', duration: 12, duration_unit: 'WEEK', fee: '0.00',
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AcademicCatalogManager({ role = 'Manager' }: { role?: 'Admin' | 'Manager' }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [programForm, setProgramForm] = useState<ProgramForm>(emptyProgram);
  const [subProgramForm, setSubProgramForm] = useState<SubProgramForm>(emptySubProgram);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name');
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const [programData, subProgramData] = await Promise.all([fetchProgramsApi(), fetchSubProgramsApi()]);
      setPrograms(programData);
      setSubPrograms(subProgramData);
      setSubProgramForm(prev => ({ ...prev, program: prev.program || programData[0]?.id || '' }));
    } catch {
      setError('Could not load academic catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, []);

  const activePrograms = programs.filter(p => p.is_active !== false);
  const subProgramCountByProgram = useMemo(() => {
    return subPrograms.reduce<Record<string, number>>((counts, sp) => {
      counts[sp.program] = (counts[sp.program] || 0) + 1;
      return counts;
    }, {});
  }, [subPrograms]);

  const filteredPrograms = useMemo(() => {
    let list = [...programs];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase()));
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [programs, search, sortBy]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const saveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.name.trim()) return;
    setSaving('program');
    setError('');
    const payload: AcademicProgramPayload = {
      name: programForm.name.trim(),
      slug: programForm.slug || slugify(programForm.name),
      description: programForm.description,
      supports_group: programForm.supports_group,
      supports_individual: programForm.supports_individual,
    };
    try {
      if (programForm.id) { await updateProgramApi(programForm.id, payload); showSuccess('Program updated'); }
      else { await createProgramApi(payload); showSuccess('Program created'); }
      setProgramForm(emptyProgram);
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save program.');
    } finally { setSaving(null); }
  };

  const saveSubProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subProgramForm.program || !subProgramForm.name.trim()) return;
    setSaving('sub-program');
    setError('');
    const payload: AcademicSubProgramPayload = {
      program: subProgramForm.program,
      name: subProgramForm.name.trim(),
      slug: subProgramForm.slug || slugify(subProgramForm.name),
      description: subProgramForm.description,
      duration: subProgramForm.duration ? Number(subProgramForm.duration) : null,
      duration_unit: subProgramForm.duration_unit || null,
      fee: subProgramForm.fee || '0.00',
    };
    try {
      if (subProgramForm.id) { await updateSubProgramApi(subProgramForm.id, payload); showSuccess('Sub program updated'); }
      else { await createSubProgramApi(payload); showSuccess('Sub program created'); }
      setSubProgramForm({ ...emptySubProgram, program: payload.program });
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save sub program.');
    } finally { setSaving(null); }
  };

  const toggleProgram = async (program: Program) => {
    setSaving(program.id);
    setError('');
    try {
      await setProgramActiveApi(program.id, !program.is_active);
      showSuccess(program.is_active ? 'Program deactivated' : 'Program activated');
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update program status.');
    } finally { setSaving(null); }
  };

  const toggleSubProgram = async (subProgram: SubProgram) => {
    setSaving(subProgram.id);
    setError('');
    try {
      await setSubProgramActiveApi(subProgram.id, !subProgram.is_active);
      showSuccess(subProgram.is_active ? 'Sub program deactivated' : 'Sub program activated');
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update sub program status.');
    } finally { setSaving(null); }
  };

  return (
    <div className="space-y-6">

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-lg">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Programs', value: programs.length, icon: BookOpen, from: 'from-blue-500', to: 'to-blue-600', bg: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: activePrograms.length, icon: CheckCircle2, from: 'from-emerald-500', to: 'to-emerald-600', bg: 'bg-emerald-50 text-emerald-600' },
          { label: 'Sub Programs', value: subPrograms.length, icon: Layers3, from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-purple-50 text-purple-600' },
          { label: 'Role', value: role === 'Admin' ? 'Super Admin' : 'Manager', icon: ShieldCheck, from: 'from-amber-500', to: 'to-amber-600', bg: 'bg-amber-50 text-amber-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="relative bg-white rounded-2xl border border-slate-200 p-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-[0.06] rounded-full -translate-y-8 translate-x-8" />
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Academic Catalog</h2>
            <p className="text-sm text-slate-500 mt-1">Manage programs, sub-programs, and their availability.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..."
                className="w-48 pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red" />
            </div>
            <button onClick={() => setSortBy(sortBy === 'name' ? 'created' : 'name')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowUpDown className="w-3.5 h-3.5" /> {sortBy === 'name' ? 'Name' : 'Created'}
            </button>
            <button onClick={loadCatalog} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setError('')}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Action Failed</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-red-50 p-3 rounded-lg border border-red-100 font-mono text-left max-h-32 overflow-y-auto">
                  {error}
                </p>
                <button onClick={() => setError('')}
                  className="w-full bg-slate-900 text-white text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Okay, understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <FormCard icon={BookOpen} title={programForm.id ? 'Edit Program' : 'New Program'} onClear={() => setProgramForm(emptyProgram)} showClear={!!programForm.id}>
          <form onSubmit={saveProgram} className="flex flex-col gap-4">
            <FormField label="Program Name" required>
              <input value={programForm.name} onChange={e => setProgramForm(p => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))}
                placeholder="e.g. Robotics" className="form-input" />
            </FormField>
            <FormField label="Slug">
              <input value={programForm.slug} onChange={e => setProgramForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="robotics" className="form-input font-mono text-xs" />
            </FormField>
            <FormField label="Description">
              <textarea value={programForm.description || ''} onChange={e => setProgramForm(p => ({ ...p, description: e.target.value }))}
                rows={3} className="form-input resize-none" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <ToggleSwitch label="Group classes" checked={programForm.supports_group} onChange={v => setProgramForm(p => ({ ...p, supports_group: v }))} />
              <ToggleSwitch label="Private sessions" checked={programForm.supports_individual} onChange={v => setProgramForm(p => ({ ...p, supports_individual: v }))} />
            </div>
            <ActionButton loading={saving === 'program'} label={programForm.id ? 'Save Changes' : 'Create Program'} />
          </form>
        </FormCard>

        <FormCard icon={Layers3} title={subProgramForm.id ? 'Edit Sub Program' : 'New Sub Program'} onClear={() => setSubProgramForm({ ...emptySubProgram, program: programs[0]?.id || '' })} showClear={!!subProgramForm.id}>
          <form onSubmit={saveSubProgram} className="flex flex-col gap-4">
            <FormField label="Parent Program" required>
              <select value={subProgramForm.program} onChange={e => setSubProgramForm(p => ({ ...p, program: e.target.value }))} className="form-input">
                <option value="">Select program...</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>
            <FormField label="Sub Program Name" required>
              <input value={subProgramForm.name} onChange={e => setSubProgramForm(p => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))}
                placeholder="e.g. VEX IQ Junior" className="form-input" />
            </FormField>
            <FormField label="Slug">
              <input value={subProgramForm.slug} onChange={e => setSubProgramForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="vex-iq-junior" className="form-input font-mono text-xs" />
            </FormField>
            <FormField label="Description">
              <textarea value={subProgramForm.description || ''} onChange={e => setSubProgramForm(p => ({ ...p, description: e.target.value }))}
                rows={2} className="form-input resize-none" />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Duration">
                <input type="number" value={subProgramForm.duration ?? ''} onChange={e => setSubProgramForm(p => ({ ...p, duration: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="12" className="form-input" />
              </FormField>
              <FormField label="Unit">
                <select value={subProgramForm.duration_unit || ''} onChange={e => setSubProgramForm(p => ({ ...p, duration_unit: e.target.value || null }))} className="form-input">
                  <option value="">—</option>
                  <option value="DAY">Day</option>
                  <option value="WEEK">Week</option>
                  <option value="MONTH">Month</option>
                </select>
              </FormField>
              <FormField label="Fee (Birr)">
                <input value={subProgramForm.fee} onChange={e => setSubProgramForm(p => ({ ...p, fee: e.target.value }))}
                  placeholder="5000" className="form-input" />
              </FormField>
            </div>
            <ActionButton loading={saving === 'sub-program'} label={subProgramForm.id ? 'Save Changes' : 'Create Sub Program'} disabled={programs.length === 0} />
          </form>
        </FormCard>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Programs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-red" />
              <h3 className="font-black text-sm text-slate-900">Programs</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{programs.length}</span>
            </div>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">{search ? 'No programs match your search' : 'No programs yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPrograms.map(program => (
                <div key={program.id} className="hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${program.is_active ? 'bg-brand-red/10 text-brand-red' : 'bg-slate-100 text-slate-400'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{program.name}</p>
                      <p className="text-xs text-slate-400 truncate font-mono">{program.slug}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${program.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => setExpandedProgram(expandedProgram === program.id ? null : program.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-red/5 transition-colors">
                      <Layers3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {program.description && (
                    <p className="px-5 pb-1 text-xs text-slate-500 line-clamp-2">{program.description}</p>
                  )}
                  <div className="px-5 pb-3 flex items-center gap-2">
                    {program.supports_group && <Tag icon={Users} text="Group" />}
                    {program.supports_individual && <Tag icon={GraduationCap} text="Private" />}
                    <Tag icon={Layers3} text={`${subProgramCountByProgram[program.id] || 0} sub`} />
                  </div>
                  {expandedProgram === program.id && (
                    <div className="px-5 pb-3 space-y-1.5">
                      {subPrograms.filter(sp => sp.program === program.id).length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-6">No sub programs</p>
                      ) : (
                        subPrograms.filter(sp => sp.program === program.id).map(sp => (
                          <div key={sp.id} className="flex items-center gap-2 pl-6 py-1.5 text-xs text-slate-600 border-l-2 border-brand-red/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-red/30 shrink-0" />
                            <span className="font-medium">{sp.name}</span>
                            <span className="text-slate-400">{Number(sp.fee).toLocaleString()} Birr</span>
                            {sp.duration && <span className="text-slate-400">({sp.duration} {sp.duration_unit?.toLowerCase()})</span>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <div className="px-5 pb-3 flex items-center gap-2">
                    <button onClick={() => setProgramForm({ ...emptyProgram, ...program })}
                      className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => toggleProgram(program)} disabled={saving === program.id}
                      className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                      {saving === program.id ? '...' : program.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sub Programs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-purple-500" />
              <h3 className="font-black text-sm text-slate-900">Sub Programs</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{subPrograms.length}</span>
            </div>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : subPrograms.length === 0 ? (
            <div className="p-8 text-center">
              <Layers3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">No sub programs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subPrograms.map(sp => {
                const parentProgram = programs.find(p => p.id === sp.program);
                return (
                  <div key={sp.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sp.is_active ? 'bg-purple-50 text-purple-500' : 'bg-slate-100 text-slate-400'}`}>
                      <Layers3 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{sp.name}</p>
                      <p className="text-xs text-slate-400 truncate">{parentProgram?.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      {Number(sp.fee) > 0 && <span className="font-bold text-slate-700">{Number(sp.fee).toLocaleString()} Birr</span>}
                      {sp.duration && <span className="text-slate-400">| {sp.duration}{sp.duration_unit?.charAt(0)?.toLowerCase()}</span>}
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {sp.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSubProgramForm({ ...emptySubProgram, ...sp, fee: String(sp.fee) })}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleSubProgram(sp)} disabled={saving === sp.id}
                        className={`p-1 rounded-lg transition-colors ${sp.is_active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                        title={sp.is_active ? 'Deactivate' : 'Activate'}>
                        {sp.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FormCard({ icon: Icon, title, children, onClear, showClear }: { icon: React.ElementType; title: string; children: React.ReactNode; onClear: () => void; showClear: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-red/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-brand-red" />
          </div>
          <h3 className="font-black text-sm text-slate-900">{title}</h3>
        </div>
        {showClear && (
          <button type="button" onClick={onClear} className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
        {label}{required && <span className="text-brand-red">*</span>}
      </span>
      {children}
    </label>
  );
}

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
        checked ? 'border-brand-red/30 bg-brand-red/5 text-brand-red' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}>
      <span>{label}</span>
      <div className={`w-8 h-4.5 rounded-full transition-colors ${checked ? 'bg-brand-red' : 'bg-slate-300'} relative`}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

function ActionButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white text-sm font-black px-4 py-2.5 rounded-xl shadow-lg shadow-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {label}
    </button>
  );
}

function Tag({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
      <Icon className="w-3 h-3" /> {text}
    </span>
  );
}
