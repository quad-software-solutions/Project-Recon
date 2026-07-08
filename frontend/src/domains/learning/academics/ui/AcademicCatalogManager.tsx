import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import type { Program, SubProgram } from '@/src/shared/types';
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
} from '@/src/domains/learning/academics/api/academicApi';

type ProgramForm = AcademicProgramPayload & { id?: string };
type SubProgramForm = AcademicSubProgramPayload & { id?: string };

const emptyProgram: ProgramForm = {
  name: '',
  slug: '',
  description: '',
  supports_group: true,
  supports_individual: true,
};

const emptySubProgram: SubProgramForm = {
  program: '',
  name: '',
  slug: '',
  description: '',
  duration: 12,
  duration_unit: 'WEEK',
  fee: '0.00',
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

  const loadCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const [programData, subProgramData] = await Promise.all([fetchProgramsApi(), fetchSubProgramsApi()]);
      setPrograms(programData);
      setSubPrograms(subProgramData);
      setSubProgramForm(prev => ({ ...prev, program: prev.program || programData[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load academic catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const activePrograms = programs.filter(program => program.is_active !== false);
  const subProgramCountByProgram = useMemo(() => {
    return subPrograms.reduce<Record<string, number>>((counts, subProgram) => {
      counts[subProgram.program] = (counts[subProgram.program] || 0) + 1;
      return counts;
    }, {});
  }, [subPrograms]);

  const saveProgram = async (event: React.FormEvent) => {
    event.preventDefault();
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
      if (programForm.id) await updateProgramApi(programForm.id, payload);
      else await createProgramApi(payload);
      setProgramForm(emptyProgram);
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save program.');
    } finally {
      setSaving(null);
    }
  };

  const saveSubProgram = async (event: React.FormEvent) => {
    event.preventDefault();
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
      if (subProgramForm.id) await updateSubProgramApi(subProgramForm.id, payload);
      else await createSubProgramApi(payload);
      setSubProgramForm({ ...emptySubProgram, program: payload.program });
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save sub program.');
    } finally {
      setSaving(null);
    }
  };

  const toggleProgram = async (program: Program) => {
    setSaving(program.id);
    setError('');
    try {
      await setProgramActiveApi(program.id, !program.is_active);
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update program status.');
    } finally {
      setSaving(null);
    }
  };

  const toggleSubProgram = async (subProgram: SubProgram) => {
    setSaving(subProgram.id);
    setError('');
    try {
      await setSubProgramActiveApi(subProgram.id, !subProgram.is_active);
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update sub program status.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {[
          { label: 'Programs', value: programs.length, icon: BookOpen, tone: 'text-blue-600 bg-blue-50' },
          { label: 'Active Programs', value: activePrograms.length, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Sub Programs', value: subPrograms.length, icon: Layers3, tone: 'text-purple-600 bg-purple-50' },
          { label: 'Creator Role', value: role === 'Admin' ? 'Super Admin' : 'Branch Manager', icon: ShieldCheck, tone: 'text-amber-600 bg-amber-50' },
        ].map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className={`h-9 w-9 rounded-lg ${stat.tone} flex items-center justify-center mb-3`}>
                <StatIcon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-slate-900">Academic Catalog</h2>
            <p className="text-sm text-slate-500 mt-1">Create Programs and Sub Programs using the existing academic backend.</p>
          </div>
          <button onClick={loadCatalog} disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { title: 'Super Admin', body: 'Can perform every academic operation across every branch.', icon: ShieldCheck },
            { title: 'Branch Manager', body: 'Creates and manages branch academic activities, including classes and enrollments.', icon: BuildingIcon },
            { title: 'Secretary', body: 'Registers students, assigns classes, records payments, and issues certificates.', icon: ClipboardList },
            { title: 'Instructor', body: 'Manages attendance, progress, and own learning materials for assigned classes.', icon: GraduationCap },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4 text-brand-blue" />
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <form onSubmit={saveProgram} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <FormHeader icon={BookOpen} title={programForm.id ? 'Edit Program' : 'Create Program'} onReset={() => setProgramForm(emptyProgram)} showReset={Boolean(programForm.id)} />
          <TextInput label="Program Name" value={programForm.name} onChange={value => setProgramForm(prev => ({ ...prev, name: value, slug: prev.slug || slugify(value) }))} placeholder="Robotics" />
          <TextInput label="Slug" value={programForm.slug} onChange={value => setProgramForm(prev => ({ ...prev, slug: slugify(value) }))} placeholder="robotics" />
          <TextArea label="Description" value={programForm.description || ''} onChange={value => setProgramForm(prev => ({ ...prev, description: value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle label="Supports Group" checked={programForm.supports_group} onChange={checked => setProgramForm(prev => ({ ...prev, supports_group: checked }))} />
            <Toggle label="Supports Private" checked={programForm.supports_individual} onChange={checked => setProgramForm(prev => ({ ...prev, supports_individual: checked }))} />
          </div>
          <SubmitButton loading={saving === 'program'} label={programForm.id ? 'Save Program' : 'Create Program'} />
        </form>

        <form onSubmit={saveSubProgram} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <FormHeader icon={Layers3} title={subProgramForm.id ? 'Edit Sub Program' : 'Create Sub Program'} onReset={() => setSubProgramForm({ ...emptySubProgram, program: programs[0]?.id || '' })} showReset={Boolean(subProgramForm.id)} />
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Parent Program</span>
            <select value={subProgramForm.program} onChange={event => setSubProgramForm(prev => ({ ...prev, program: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              {programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
          </label>
          <TextInput label="Sub Program Name" value={subProgramForm.name} onChange={value => setSubProgramForm(prev => ({ ...prev, name: value, slug: prev.slug || slugify(value) }))} placeholder="VEX IQ Junior" />
          <TextInput label="Slug" value={subProgramForm.slug} onChange={value => setSubProgramForm(prev => ({ ...prev, slug: slugify(value) }))} placeholder="vex-iq-junior" />
          <TextArea label="Description" value={subProgramForm.description || ''} onChange={value => setSubProgramForm(prev => ({ ...prev, description: value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <TextInput label="Duration" type="number" value={String(subProgramForm.duration ?? '')} onChange={value => setSubProgramForm(prev => ({ ...prev, duration: value ? Number(value) : null }))} placeholder="12" />
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Unit</span>
              <select value={subProgramForm.duration_unit || ''} onChange={event => setSubProgramForm(prev => ({ ...prev, duration_unit: event.target.value || null }))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="">None</option>
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
              </select>
            </label>
            <TextInput label="Fee" value={subProgramForm.fee} onChange={value => setSubProgramForm(prev => ({ ...prev, fee: value }))} placeholder="5000.00" />
          </div>
          <SubmitButton loading={saving === 'sub-program'} label={subProgramForm.id ? 'Save Sub Program' : 'Create Sub Program'} disabled={programs.length === 0} />
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CatalogList<Program>
          title="Programs"
          icon={BookOpen}
          loading={loading}
          emptyText="No programs yet."
          items={programs}
          renderItem={(program) => (
            <div key={program.id} className="rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{program.name}</p>
                  <p className="text-xs text-slate-400">{program.slug}</p>
                </div>
                <StatusBadge active={program.is_active} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{program.description || 'No description yet.'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {program.supports_group && <SmallBadge icon={Users} label="Group" />}
                {program.supports_individual && <SmallBadge icon={GraduationCap} label="Private" />}
                <SmallBadge icon={Layers3} label={`${subProgramCountByProgram[program.id] || 0} sub programs`} />
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setProgramForm({ ...emptyProgram, ...program })}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button type="button" onClick={() => toggleProgram(program)} disabled={saving === program.id}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {program.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )}
        />

        <CatalogList<SubProgram>
          title="Sub Programs"
          icon={Layers3}
          loading={loading}
          emptyText="No sub programs yet."
          items={subPrograms}
          renderItem={(subProgram) => (
            <div key={subProgram.id} className="rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{subProgram.name}</p>
                  <p className="text-xs text-slate-400">{programs.find(p => p.id === subProgram.program)?.name || 'Program'}</p>
                </div>
                <StatusBadge active={subProgram.is_active} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SmallBadge icon={BookOpen} label={`${subProgram.fee ?? 0} ETB`} />
                {(subProgram.duration || subProgram.duration_unit) && <SmallBadge icon={RefreshCw} label={[subProgram.duration, subProgram.duration_unit].filter(Boolean).join(' ')} />}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setSubProgramForm({ ...emptySubProgram, ...subProgram, fee: String(subProgram.fee) })}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button type="button" onClick={() => toggleSubProgram(subProgram)} disabled={saving === subProgram.id}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {subProgram.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function BuildingIcon(props: React.ComponentProps<typeof Building>) {
  return <Building {...props} />;
}

function FormHeader({ icon: Icon, title, showReset, onReset }: { icon: React.ElementType; title: string; showReset: boolean; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
        <Icon className="h-4 w-4 text-brand-blue" />
        {title}
      </h3>
      {showReset && (
        <button type="button" onClick={onReset} className="text-xs font-bold text-slate-400 hover:text-slate-700">
          Clear
        </button>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <textarea value={value} onChange={event => onChange(event.target.value)} rows={3}
        className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue" />
    </label>
  );
}

function SubmitButton({ label, loading, disabled = false }: { label: string; loading: boolean; disabled?: boolean }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-brand-blue/20 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function SmallBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function CatalogList<T>({ title, icon: Icon, loading, emptyText, items, renderItem }: { title: string; icon: React.ElementType; loading: boolean; emptyText: string; items: T[]; renderItem: (item: T) => React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <Icon className="h-4 w-4 text-brand-blue" />
        {title}
      </h3>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(item => <div key={item} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">{emptyText}</div>
      ) : (
        <div className="space-y-2">{items.map(renderItem)}</div>
      )}
    </div>
  );
}
