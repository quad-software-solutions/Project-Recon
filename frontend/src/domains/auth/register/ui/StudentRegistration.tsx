import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Building2, GraduationCap, Hash, Info, Loader2, Lock, Mail, Phone, RotateCcw,
  Smartphone, User, Users, Wallet, FileText, AlertCircle,
} from 'lucide-react';
import { registerApi, type PaymentMethodType } from '../api/registerApi';
import {
  fetchProgramsApi,
  fetchSubProgramsApi,
  fetchBankAccountsApi,
  fetchAvailableBranchesApi,
  type Branch,
  type BankAccount,
} from '../../../learning/academics/api/academicApi';
import type { Program, SubProgram, Enrollment } from '@/shared/types';
import { isApiError } from '@/shared/api/http';
import { SelectableCard, CardSkeleton } from './components/SelectableCard';
import { ReceiptUpload } from './components/ReceiptUpload';
import { EnrollmentSuccess } from './components/EnrollmentSuccess';
import { EnrollmentSummaryPanel } from './components/EnrollmentSummaryPanel';

const PAYMENT_OPTIONS: { value: PaymentMethodType; label: string; icon: React.ReactNode }[] = [
  { value: 'CASH', label: 'Cash', icon: <Wallet className="w-5 h-5" /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Building2 className="w-5 h-5" /> },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone className="w-5 h-5" /> },
  { value: 'CHEQUE', label: 'Cheque', icon: <FileText className="w-5 h-5" /> },
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
};

function formatApiError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 404) return 'The requested resource was not found. Please refresh and try again.';
    if (err.status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
    return err.message || 'Unable to complete enrollment.';
  }
  if (err instanceof TypeError || (err instanceof Error && /network|fetch/i.test(err.message))) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  if (err instanceof Error) return err.message;
  return 'Unable to complete enrollment. Please try again.';
}

function SectionHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-xs font-black shrink-0">
        {step}
      </div>
      <div>
        <h2 className="font-black text-lg text-slate-900 tracking-tight">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden />
      <p className="font-bold text-slate-700 text-sm">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">{message}</p>
    </div>
  );
}

export default function StudentRegistration() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState('');

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [subProgramsLoading, setSubProgramsLoading] = useState(false);
  const [subProgramsError, setSubProgramsError] = useState('');
  const [selectedSubProgramId, setSelectedSubProgramId] = useState('');

  const [classType, setClassType] = useState<'GROUP' | 'INDIVIDUAL' | ''>('');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BANK_TRANSFER');
  const [bankName, setBankName] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
  const selectedBranch = useMemo(
    () => branches.find((b) => String(b.id) === selectedBranchId),
    [branches, selectedBranchId],
  );

  const fee = useMemo(() => {
    if (!selectedSub || !classType) return 0;
    return Number(classType === 'GROUP' ? selectedSub.group_fee : (selectedSub.individual_fee ?? 0));
  }, [selectedSub, classType]);

  const classTypeOptions = useMemo(() => {
    const options: Array<'GROUP' | 'INDIVIDUAL'> = [];
    if (!selectedProgram || selectedProgram.supports_group) options.push('GROUP');
    if (!selectedProgram || selectedProgram.supports_individual) options.push('INDIVIDUAL');
    if (options.length === 0) return ['GROUP', 'INDIVIDUAL'] as Array<'GROUP' | 'INDIVIDUAL'>;
    return options;
  }, [selectedProgram]);

  const loadPrograms = useCallback(() => {
    setProgramsLoading(true);
    setProgramsError('');
    Promise.all([
      fetchProgramsApi(),
      fetchBankAccountsApi().catch(() => [] as BankAccount[]),
    ])
      .then(([progs, banks]) => {
        setPrograms((progs || []).filter((p) => p.is_active));
        setBankAccounts(Array.isArray(banks) ? banks.filter((b) => b.is_active !== false) : []);
      })
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
    setSubProgramsError('');
    setSelectedSubProgramId('');
    setClassType('');
    setSelectedBranchId('');
    setBranches([]);

    fetchSubProgramsApi(selectedProgramId)
      .then((rows) => {
        if (cancelled) return;
        setSubPrograms((rows || []).filter((s) => s.is_active));
      })
      .catch((err) => {
        if (cancelled) return;
        setSubPrograms([]);
        setSubProgramsError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setSubProgramsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProgramId]);

  useEffect(() => {
    if (!selectedSubProgramId || !classType) {
      setBranches([]);
      setSelectedBranchId('');
      return;
    }
    let cancelled = false;
    setBranchesLoading(true);
    setBranchesError('');
    setSelectedBranchId('');

    fetchAvailableBranchesApi(selectedSubProgramId, classType)
      .then((rows) => {
        if (cancelled) return;
        setBranches(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setBranches([]);
        setBranchesError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSubProgramId, classType]);

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!form.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
    else if (!/^[+\d][\d\s()-]{6,}$/.test(form.phoneNumber.trim())) errors.phoneNumber = 'Enter a valid phone number.';
    if (!form.guardianName.trim()) errors.guardianName = 'Guardian name is required.';
    if (!form.guardianPhone.trim()) errors.guardianPhone = 'Guardian phone is required.';
    else if (!/^[+\d][\d\s()-]{6,}$/.test(form.guardianPhone.trim())) errors.guardianPhone = 'Enter a valid phone number.';
    if (!form.guardianEmail.trim()) errors.guardianEmail = 'Guardian email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardianEmail.trim())) errors.guardianEmail = 'Enter a valid email address.';

    if (paymentMethod !== 'CASH') {
      if (!transactionReference.trim() && !attachment) {
        errors.payment = 'Transaction reference or receipt upload is required for non-cash payments.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canSubmit = Boolean(
    selectedProgramId &&
      selectedSubProgramId &&
      classType &&
      selectedBranchId &&
      form.firstName &&
      form.lastName &&
      form.email &&
      form.password &&
      !isSubmitting,
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError('');
    if (!selectedSubProgramId || !classType || !selectedBranchId) {
      setSubmitError('Please complete program, class type, and branch selection.');
      return;
    }
    if (!validateClient()) {
      setSubmitError('Please fix the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerApi({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianEmail: form.guardianEmail,
        subProgramId: selectedSubProgramId,
        classType,
        branchId: selectedBranchId,
        paymentMethod,
        bankName: paymentMethod === 'CASH' ? undefined : bankName,
        transactionReference: paymentMethod === 'CASH' ? undefined : transactionReference,
        attachment: paymentMethod === 'CASH' ? null : attachment,
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
    setPaymentMethod('BANK_TRANSFER');
    setBankName('');
    setTransactionReference('');
    setAttachment(null);
    setFieldErrors({});
    setSubmitError('');
  };

  if (enrollment) {
    return (
      <EnrollmentSuccess
        enrollment={enrollment}
        onRegisterAnother={resetAll}
        onReturnHome={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  const showForm = Boolean(selectedBranchId);
  const progressStep =
    !selectedProgramId ? 1
      : !selectedSubProgramId ? 2
        : !classType ? 3
          : !selectedBranchId ? 4
            : 5;

  return (
    <div className="min-h-screen bg-brand-paper relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.07] via-brand-paper to-slate-100/80 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(15 23 42) 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 pb-32 lg:pb-12">
        <header className="mb-8 lg:mb-10 text-center lg:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue mb-2">Online Enrollment</p>
          <h1 className="font-black text-3xl md:text-4xl text-slate-900 tracking-tight">Enroll in a Program</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base max-w-2xl">
            Select a program, choose your class format and branch, then complete your details to submit for review.
          </p>
        </header>

        {/* Progress stepper */}
        <nav aria-label="Enrollment progress" className="mb-8 lg:mb-10">
          <ol className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
            {['Program', 'Course', 'Class Type', 'Branch', 'Details'].map((label, idx) => {
              const n = idx + 1;
              const done = progressStep > n;
              const current = progressStep === n;
              return (
                <li key={label} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                        done ? 'bg-emerald-500 text-white'
                          : current ? 'bg-brand-blue text-white'
                            : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}
                      aria-current={current ? 'step' : undefined}
                    >
                      {n}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:inline ${current || done ? 'text-slate-800' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                  {n < 5 && <span className="w-4 sm:w-8 h-px bg-slate-200" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left column ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* Step 1 — Programs */}
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white/95 rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6" aria-labelledby="programs-heading">
              <SectionHeader step={1} title="Select a Program" subtitle="Choose the academic program you want to join." />
              <h3 id="programs-heading" className="sr-only">Programs</h3>

              {programsLoading ? (
                <CardSkeleton count={4} />
              ) : programsError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                  <AlertCircle className="w-7 h-7 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-700 mb-1">Could not load programs</p>
                  <p className="text-xs text-red-600/80 mb-4">{programsError}</p>
                  <button
                    type="button"
                    onClick={loadPrograms}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-blue-dark"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              ) : programs.length === 0 ? (
                <EmptyState title="No programs available" message="Active programs will appear here once they are published." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {programs.map((program) => (
                    <SelectableCard
                      key={program.id}
                      selected={selectedProgramId === program.id}
                      onSelect={() => setSelectedProgramId(program.id)}
                      title={program.name}
                      subtitle={program.description || undefined}
                      icon={<GraduationCap className="w-5 h-5" />}
                    />
                  ))}
                </div>
              )}
            </motion.section>

            {/* Step 2 — Sub programs */}
            {selectedProgramId && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white/95 rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6" aria-labelledby="subprograms-heading">
                <SectionHeader step={2} title="Select a Sub Program" subtitle={`Courses under ${selectedProgram?.name || 'this program'}.`} />
                <h3 id="subprograms-heading" className="sr-only">Sub programs</h3>

                {subProgramsLoading ? (
                  <CardSkeleton count={3} />
                ) : subProgramsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
                    <p className="text-sm font-bold text-red-700">{subProgramsError}</p>
                  </div>
                ) : subPrograms.length === 0 ? (
                  <EmptyState title="No sub programs available" message="There are no active courses for this program right now." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subPrograms.map((sub) => (
                      <SelectableCard
                        key={sub.id}
                        selected={selectedSubProgramId === sub.id}
                        onSelect={() => {
                          setSelectedSubProgramId(sub.id);
                          setClassType('');
                          setSelectedBranchId('');
                        }}
                        title={sub.name}
                        subtitle={sub.program_name}
                        icon={<BookOpen className="w-5 h-5" />}
                        meta={
                          <p className="text-xs font-bold text-brand-blue">
                            Group {Number(sub.group_fee || 0).toLocaleString()} Birr
                            {sub.individual_fee != null && (
                              <> · Individual {Number(sub.individual_fee).toLocaleString()} Birr</>
                            )}
                          </p>
                        }
                      />
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* Step 3 — Class type */}
            {selectedSubProgramId && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="bg-white/95 rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6" aria-labelledby="classtype-heading">
                <SectionHeader step={3} title="Select Class Type" subtitle="Choose group classes or individual tutoring." />
                <h3 id="classtype-heading" className="sr-only">Class type</h3>

                <div
                  className="inline-flex bg-slate-100 rounded-xl p-1 gap-1"
                  role="group"
                  aria-label="Class type"
                >
                  {classTypeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClassType(type)}
                      aria-pressed={classType === type}
                      className={`min-h-[44px] inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
                        classType === type
                          ? 'bg-brand-blue text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {type === 'GROUP' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      {type === 'GROUP' ? 'Group' : 'Individual'}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Step 4 — Branches */}
            {selectedSubProgramId && classType && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white/95 rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6" aria-labelledby="branches-heading">
                <SectionHeader step={4} title="Select a Branch" subtitle="Only branches with an available class are listed." />
                <h3 id="branches-heading" className="sr-only">Branches</h3>

                {branchesLoading ? (
                  <CardSkeleton count={3} />
                ) : branchesError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
                    <p className="text-sm font-bold text-red-700">{branchesError}</p>
                  </div>
                ) : branches.length === 0 ? (
                  <EmptyState
                    title="No branches available"
                    message="No branches are currently available for the selected program."
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {branches.map((branch) => (
                      <SelectableCard
                        key={String(branch.id)}
                        selected={selectedBranchId === String(branch.id)}
                        onSelect={() => setSelectedBranchId(String(branch.id))}
                        title={branch.name}
                        subtitle={branch.city || undefined}
                        icon={<Building2 className="w-5 h-5" />}
                        meta={branch.city ? (
                          <p className="text-xs text-slate-500 font-medium">{branch.city}</p>
                        ) : undefined}
                      />
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* Enrollment form */}
            {showForm && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }} className="bg-white/95 rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-8" aria-labelledby="form-heading">
                <SectionHeader step={5} title="Enrollment Details" subtitle="Personal information and payment evidence." />
                <h3 id="form-heading" className="sr-only">Enrollment form</h3>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="First Name" required error={fieldErrors.firstName}>
                      <InputIcon icon={<User className="w-4 h-4" />}>
                        <input
                          type="text"
                          autoComplete="given-name"
                          value={form.firstName}
                          onChange={(e) => updateForm('firstName', e.target.value)}
                          className={inputClass(fieldErrors.firstName)}
                          placeholder="Abebe"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Last Name" required error={fieldErrors.lastName}>
                      <InputIcon icon={<User className="w-4 h-4" />}>
                        <input
                          type="text"
                          autoComplete="family-name"
                          value={form.lastName}
                          onChange={(e) => updateForm('lastName', e.target.value)}
                          className={inputClass(fieldErrors.lastName)}
                          placeholder="Kebede"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Email" required error={fieldErrors.email} className="md:col-span-2">
                      <InputIcon icon={<Mail className="w-4 h-4" />}>
                        <input
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(e) => updateForm('email', e.target.value)}
                          className={inputClass(fieldErrors.email)}
                          placeholder="student@email.com"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Password" required error={fieldErrors.password} className="md:col-span-2">
                      <InputIcon icon={<Lock className="w-4 h-4" />}>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) => updateForm('password', e.target.value)}
                          className={inputClass(fieldErrors.password)}
                          placeholder="Min. 8 characters"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Phone Number" required error={fieldErrors.phoneNumber} className="md:col-span-2">
                      <InputIcon icon={<Phone className="w-4 h-4" />}>
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={form.phoneNumber}
                          onChange={(e) => updateForm('phoneNumber', e.target.value)}
                          className={inputClass(fieldErrors.phoneNumber)}
                          placeholder="+251 911 00 00 00"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Guardian Name" required error={fieldErrors.guardianName} className="md:col-span-2">
                      <InputIcon icon={<User className="w-4 h-4" />}>
                        <input
                          type="text"
                          value={form.guardianName}
                          onChange={(e) => updateForm('guardianName', e.target.value)}
                          className={inputClass(fieldErrors.guardianName)}
                          placeholder="Guardian full name"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Guardian Phone" required error={fieldErrors.guardianPhone}>
                      <InputIcon icon={<Phone className="w-4 h-4" />}>
                        <input
                          type="tel"
                          value={form.guardianPhone}
                          onChange={(e) => updateForm('guardianPhone', e.target.value)}
                          className={inputClass(fieldErrors.guardianPhone)}
                          placeholder="+251 911 00 00 00"
                        />
                      </InputIcon>
                    </Field>
                    <Field label="Guardian Email" required error={fieldErrors.guardianEmail}>
                      <InputIcon icon={<Mail className="w-4 h-4" />}>
                        <input
                          type="email"
                          value={form.guardianEmail}
                          onChange={(e) => updateForm('guardianEmail', e.target.value)}
                          className={inputClass(fieldErrors.guardianEmail)}
                          placeholder="guardian@email.com"
                        />
                      </InputIcon>
                    </Field>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 mb-4">Payment</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(opt.value);
                          setBankName('');
                          setTransactionReference('');
                          setAttachment(null);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.payment;
                            return next;
                          });
                        }}
                        aria-pressed={paymentMethod === opt.value}
                        className={`min-h-[88px] flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
                          paymentMethod === opt.value
                            ? 'border-brand-blue bg-brand-blue/[0.04] text-brand-blue'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === opt.value ? 'bg-brand-blue/10' : 'bg-slate-100'
                        }`}>
                          {opt.icon}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-center leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                      <Field label={paymentMethod === 'MOBILE_MONEY' ? 'Provider / Bank Name' : 'Bank Name'}>
                        {paymentMethod === 'BANK_TRANSFER' && bankAccounts.length > 0 ? (
                          <InputIcon icon={<Building2 className="w-4 h-4" />}>
                            <select
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className={`${inputClass()} appearance-none cursor-pointer`}
                            >
                              <option value="">Select a bank…</option>
                              {[...new Set(bankAccounts.map((a) => a.bank_name))].map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </InputIcon>
                        ) : (
                          <InputIcon icon={paymentMethod === 'MOBILE_MONEY' ? <Smartphone className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}>
                            <input
                              type="text"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className={inputClass()}
                              placeholder={paymentMethod === 'MOBILE_MONEY' ? 'e.g. Telebirr' : 'Bank name'}
                            />
                          </InputIcon>
                        )}
                      </Field>

                      <Field label="Transaction Reference" error={fieldErrors.payment}>
                        <InputIcon icon={<Hash className="w-4 h-4" />}>
                          <input
                            type="text"
                            value={transactionReference}
                            onChange={(e) => {
                              setTransactionReference(e.target.value);
                              setFieldErrors((prev) => {
                                if (!prev.payment) return prev;
                                const next = { ...prev };
                                delete next.payment;
                                return next;
                              });
                            }}
                            className={inputClass(fieldErrors.payment)}
                            placeholder="Transaction ID or receipt number"
                          />
                        </InputIcon>
                      </Field>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                          Receipt Upload
                        </label>
                        <ReceiptUpload file={attachment} onChange={setAttachment} />
                      </div>

                      {paymentMethod === 'BANK_TRANSFER' && bankAccounts.length > 0 && (
                        <div className="rounded-xl border border-brand-blue/15 bg-brand-blue/[0.04] p-4">
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" /> Our Bank Accounts
                          </p>
                          <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {bankAccounts.map((acc) => (
                              <li key={acc.id || acc.account_number} className="flex items-baseline gap-2 text-xs bg-white rounded-lg border border-brand-blue/10 px-3 py-2">
                                <span className="font-mono font-bold text-slate-800">{acc.account_number}</span>
                                <span className="text-slate-500 truncate">{acc.bank_name} · {acc.account_holder}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'CASH' && (
                    <div className="flex items-start gap-3 rounded-xl border border-brand-blue/15 bg-brand-blue/[0.04] p-4">
                      <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cash payments are verified in person at the selected branch. No transaction reference or receipt is required online.
                      </p>
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-700 whitespace-pre-wrap">{submitError}</p>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            )}
          </div>

          {/* ── Right column — sticky summary ── */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <EnrollmentSummaryPanel
                programName={selectedProgram?.name}
                subProgramName={selectedSub?.name}
                classType={classType}
                branchName={selectedBranch?.name}
                branchCity={selectedBranch?.city}
                paymentMethod={showForm ? paymentMethod : ''}
                feeLabel={selectedSub && classType ? `${fee.toLocaleString()} Birr` : undefined}
                canSubmit={canSubmit && showForm}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full pl-10 pr-4 py-3 min-h-[44px] bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-slate-200 focus:border-brand-blue focus:ring-brand-blue/20'
  }`;
}

function Field({
  label,
  required,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
        {label} {required && <span className="text-brand-blue">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}

function InputIcon({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors pointer-events-none">
        {icon}
      </span>
      {children}
    </div>
  );
}
