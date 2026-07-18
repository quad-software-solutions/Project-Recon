import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BookOpen, Building2, CheckCircle2, GraduationCap, Loader2, Lock,
  Mail, Phone, Store, User, Users,
} from 'lucide-react';
import { registerApi } from '@/domains/auth/register/api/registerApi';
import {
  fetchProgramsApi,
  fetchSubProgramsApi,
  fetchAvailableBranchesApi,
  type Branch,
} from '@/domains/learning/academics/api/academicApi';
import type { Enrollment, Program, SubProgram, UserProfile } from '@/shared/types';
import { isSuperAdminOrBranchManager } from '@/shared/auth/permissions';
import { formatApiError } from '@/shared/utils/formatApiError';

interface Props {
  currentUser: UserProfile;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
};

export default function WalkInRegistration({ currentUser }: Props) {
  const canManage = isSuperAdminOrBranchManager(currentUser);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState('');

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [subProgramsLoading, setSubProgramsLoading] = useState(false);
  const [selectedSubProgramId, setSelectedSubProgramId] = useState('');
  const [classType, setClassType] = useState<'GROUP' | 'INDIVIDUAL' | ''>('');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId),
    [programs, selectedProgramId],
  );
  const selectedSub = useMemo(
    () => subPrograms.find((s) => s.id === selectedSubProgramId),
    [subPrograms, selectedSubProgramId],
  );
  const fee = useMemo(() => {
    if (!selectedSub || !classType) return 0;
    return Number(classType === 'GROUP' ? selectedSub.group_fee : (selectedSub.individual_fee ?? 0));
  }, [selectedSub, classType]);

  const loadPrograms = useCallback(() => {
    setProgramsLoading(true);
    setProgramsError('');
    fetchProgramsApi()
      .then((rows) => setPrograms((rows || []).filter((p) => p.is_active)))
      .catch((err) => setProgramsError(formatApiError(err)))
      .finally(() => setProgramsLoading(false));
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgramId) {
      setSubPrograms([]);
      setSelectedSubProgramId('');
      return;
    }
    let cancelled = false;
    setSubProgramsLoading(true);
    setSelectedSubProgramId('');
    setClassType('');
    setSelectedBranchId('');
    fetchSubProgramsApi(selectedProgramId)
      .then((rows) => {
        if (!cancelled) setSubPrograms((rows || []).filter((s) => s.is_active));
      })
      .catch(() => {
        if (!cancelled) setSubPrograms([]);
      })
      .finally(() => {
        if (!cancelled) setSubProgramsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedProgramId]);

  useEffect(() => {
    if (!selectedSubProgramId || !classType) {
      setBranches([]);
      setSelectedBranchId('');
      return;
    }
    let cancelled = false;
    setBranchesLoading(true);
    setSelectedBranchId('');
    fetchAvailableBranchesApi(selectedSubProgramId, classType)
      .then((rows) => {
        if (!cancelled) setBranches(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedSubProgramId, classType]);

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError('');

    if (!selectedSubProgramId || !classType || !selectedBranchId) {
      setSubmitError('Select program, course, class type, and branch.');
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setSubmitError('Student first and last name are required.');
      return;
    }
    if (!form.email.trim()) {
      setSubmitError('Student email is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const tempPassword = `Walkin@${Math.random().toString(36).slice(2, 10)}`;
      const result = await registerApi({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: tempPassword,
        phoneNumber: form.phoneNumber.trim(),
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim(),
        guardianEmail: form.guardianEmail.trim(),
        subProgramId: selectedSubProgramId,
        classType,
        branchId: selectedBranchId,
        paymentMethod: 'CASH',
      });
      setEnrollment(result);
    } catch (err) {
      setSubmitError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setEnrollment(null);
    setSelectedProgramId('');
    setSubPrograms([]);
    setSelectedSubProgramId('');
    setClassType('');
    setBranches([]);
    setSelectedBranchId('');
    setForm(EMPTY_FORM);
    setSubmitError('');
  };

  if (!canManage) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="mt-1 text-amber-700">Walk-in registration is only available to Super Admin and Branch Manager roles.</p>
          </div>
        </div>
      </div>
    );
  }

  if (enrollment) {
    const refCode = enrollment.pending_code || enrollment.enrollment_number || '';
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg text-center max-w-md w-full border border-slate-200">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="font-black text-xl text-slate-900 mb-1">Walk-In Registered</h2>
          <p className="text-slate-500 text-sm mb-5">
            {enrollment.student_name || `${form.firstName} ${form.lastName}`} has been enrolled.
            Collect <strong className="text-slate-900">{fee.toLocaleString()} Birr</strong> cash at the desk.
          </p>
          <div className="text-xs text-slate-400 bg-slate-50 rounded-xl px-4 py-3 mb-5">
            Login credentials will be provided to the student via their email address.
          </div>
          {refCode && (
            <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/[0.04] px-4 py-3 mb-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-brand-blue mb-1">Pending Code</p>
              <p className="font-black text-lg text-brand-blue tracking-widest">{refCode}</p>
            </div>
          )}
          <button
            type="button"
            onClick={resetAll}
            className="w-full bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-dark transition-colors"
          >
            Register Another Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="font-black text-xl text-slate-900">Walk-In Registration</h2>
        <p className="text-sm text-slate-500 mt-1">Register an in-person student using the same enrollment API as online registration.</p>
      </div>

      {programsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{programsError}</span>
          <button type="button" onClick={loadPrograms} className="text-xs font-bold uppercase text-red-700 hover:underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          {/* Student details */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Student & Guardian</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First Name" required>
                <input value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} className={inputClass} placeholder="Abebe" />
              </Field>
              <Field label="Last Name" required>
                <input value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} className={inputClass} placeholder="Kebede" />
              </Field>
              <Field label="Student Email" required className="md:col-span-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className={`${inputClass} pl-10`} placeholder="student@email.com" />
                </div>
              </Field>
              <Field label="Phone Number" className="md:col-span-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" value={form.phoneNumber} onChange={(e) => updateForm('phoneNumber', e.target.value)} className={`${inputClass} pl-10`} placeholder="+251 911 00 00 00" />
                </div>
              </Field>
              <Field label="Guardian Name" className="md:col-span-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={form.guardianName} onChange={(e) => updateForm('guardianName', e.target.value)} className={`${inputClass} pl-10`} placeholder="Guardian name" />
                </div>
              </Field>
              <Field label="Guardian Phone">
                <input type="tel" value={form.guardianPhone} onChange={(e) => updateForm('guardianPhone', e.target.value)} className={inputClass} placeholder="+251 911 00 00 00" />
              </Field>
              <Field label="Guardian Email">
                <input type="email" value={form.guardianEmail} onChange={(e) => updateForm('guardianEmail', e.target.value)} className={inputClass} placeholder="guardian@email.com" />
              </Field>
            </div>
          </section>

          {/* Program */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Program</h3>
            {programsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
            ) : programs.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No active programs available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {programs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProgramId(p.id)}
                    className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selectedProgramId === p.id ? 'border-brand-blue bg-brand-blue/[0.04] text-brand-blue' : 'border-slate-200 hover:border-brand-blue/40'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Sub program */}
          {selectedProgramId && (
            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3">Sub Program</h3>
              {subProgramsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : subPrograms.length === 0 ? (
                <p className="text-sm text-slate-500">No active courses for this program.</p>
              ) : (
                <div className="space-y-2">
                  {subPrograms.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedSubProgramId(s.id); setClassType(''); setSelectedBranchId(''); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedSubProgramId === s.id ? 'border-brand-blue bg-brand-blue/[0.04]' : 'border-slate-200 hover:border-brand-blue/40'
                      }`}
                    >
                      <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                      <span className="block text-xs text-brand-blue mt-0.5">{Number(s.group_fee || 0).toLocaleString()} Birr (group)</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Class type + branch */}
          {selectedSubProgramId && (
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Class Type</h3>
                <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                  {(['GROUP', 'INDIVIDUAL'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClassType(type)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        classType === type ? 'bg-brand-blue text-white' : 'text-slate-500'
                      }`}
                    >
                      {type === 'GROUP' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      {type === 'GROUP' ? 'Group' : 'Individual'}
                    </button>
                  ))}
                </div>
              </div>

              {classType && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Branch</h3>
                  {branchesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading branches…</div>
                  ) : branches.length === 0 ? (
                    <p className="text-sm text-slate-500">No branches are currently available for the selected program.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {branches.map((b) => (
                        <button
                          key={String(b.id)}
                          type="button"
                          onClick={() => setSelectedBranchId(String(b.id))}
                          className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            selectedBranchId === String(b.id) ? 'border-brand-blue bg-brand-blue/[0.04]' : 'border-slate-200 hover:border-brand-blue/40'
                          }`}
                        >
                          <span className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-brand-blue" /> {b.name}
                          </span>
                          {b.city && <span className="text-xs text-slate-500 mt-0.5 block">{b.city}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 overflow-hidden">
            <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark px-5 py-4">
              <h3 className="font-bold text-white">Summary</h3>
              <p className="text-blue-100/80 text-xs mt-0.5">Cash payment · pending verification</p>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <SummaryRow icon={GraduationCap} label="Program" value={selectedProgram?.name} />
              <SummaryRow icon={BookOpen} label="Course" value={selectedSub?.name} />
              <SummaryRow icon={Users} label="Class Type" value={classType ? (classType === 'GROUP' ? 'Group' : 'Individual') : undefined} />
              <SummaryRow icon={Store} label="Branch" value={branches.find((b) => String(b.id) === selectedBranchId)?.name} />
              {fee > 0 && (
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-slate-600">Course fee</span>
                  <span className="font-black text-brand-blue">{fee.toLocaleString()} Birr</span>
                </div>
              )}
            </div>
            <div className="p-5 pt-0">
              {submitError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedBranchId}
                className="w-full min-h-[48px] bg-brand-blue disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-blue-dark transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting…' : 'Complete Walk-In Registration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputClass() {
  return 'w-full px-3 py-2.5 min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20';
}

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
        {label}{required && <span className="text-brand-blue"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-semibold text-slate-900">{value || '—'}</p>
      </div>
    </div>
  );
}
