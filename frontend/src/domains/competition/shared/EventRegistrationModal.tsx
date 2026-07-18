import { useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, CheckCircle2, CreditCard, DollarSign, Loader2, Lock, Shield, User, X,
} from 'lucide-react';
import type { Tournament, Workshop, UserProfile } from '@/shared/types';
import { registerForEvent, type PublicRegistrationData } from '../api/competitionApi';
import { cacheStudentId } from '@/domains/user/student/api/studentContext';
import {
  formatRegistrationDeadline,
  getRegistrationEligibility,
  REGISTRATION_MODE_LABELS,
} from './eventRegistrationUtils';
import { formatApiError } from '@/shared/utils/formatApiError';

interface EventRegistrationModalProps {
  event: Tournament | Workshop;
  currentUser?: UserProfile | null;
  isRegistered: boolean;
  onClose: () => void;
  onSuccess: (eventId: string) => void;
  onNavigateLogin?: () => void;
}

export default function EventRegistrationModal({
  event,
  currentUser,
  isRegistered,
  onClose,
  onSuccess,
  onNavigateLogin,
}: EventRegistrationModalProps) {
  const eligibility = getRegistrationEligibility(event, currentUser, isRegistered);
  const [regForm, setRegForm] = useState<PublicRegistrationData>({
    public_full_name: currentUser?.name || '',
    public_email: currentUser?.email || '',
    public_phone: currentUser?.phone_number || '',
    public_organization: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'eligibility' | 'details' | 'confirm'>('eligibility');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE'>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [bankName, setBankName] = useState('');

  const isStudentMode = eligibility.canRegister && eligibility.mode === 'student';

  const steps = useMemo(() => {
    if (!eligibility.canRegister) return ['eligibility'] as const;
    if (isStudentMode) return ['eligibility', 'confirm'] as const;
    return ['eligibility', 'details', 'confirm'] as const;
  }, [eligibility.canRegister, isStudentMode]);

  const currentStepIndex = useMemo(() => steps.indexOf(step as any), [steps, step]);
  const progressPct = useMemo(() => {
    if (success) return 100;
    if (steps.length <= 1) return 0;
    const idx = Math.max(0, currentStepIndex);
    return Math.round((idx / (steps.length - 1)) * 100);
  }, [success, steps.length, currentStepIndex]);

  const validateDetails = (): string | null => {
    if (isStudentMode) return null;
    if (!regForm.public_full_name?.trim()) return 'Full name is required.';
    const email = regForm.public_email?.trim() || '';
    if (!email) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email.';
    if (!regForm.public_phone?.trim()) return 'Phone number is required.';
    return null;
  };

  const goNext = () => {
    if (!eligibility.canRegister) return;
    setError(null);
    if (step === 'eligibility') {
      if (isStudentMode) setStep('confirm');
      else setStep('details');
      return;
    }
    if (step === 'details') {
      const err = validateDetails();
      if (err) { setError(err); return; }
      setStep('confirm');
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'confirm') {
      setStep(isStudentMode ? 'eligibility' : 'details');
      return;
    }
    if (step === 'details') {
      setStep('eligibility');
    }
  };

  const submit = async () => {
    if (!eligibility.canRegister) return;

    const validationError = validateDetails();
    if (validationError) { setError(validationError); return; }
    if (event.paymentRequired && paymentMethod !== 'CASH' && !transactionReference.trim()) {
      setError('Transaction reference is required for manual payment.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payment = event.paymentRequired ? {
        amount: event.registrationFee || '0',
        payment_method: paymentMethod,
        transaction_reference: transactionReference.trim() || undefined,
        bank_name: bankName.trim() || undefined,
      } : undefined;
      const payload = isStudentMode ? { payment } : { ...regForm, payment };
      const result = await registerForEvent(event.id, payload as PublicRegistrationData);
      if (currentUser?.email && result?.student) {
        cacheStudentId(currentUser.email, result.student);
      }
      setSuccess(true);
      onSuccess(event.id);
    } catch (err: unknown) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-slate-900">
              {success ? 'Registration Submitted' : 'Event registration'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {!success && (
          <div className="px-6 pt-4">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-red to-brand-red-dark rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Step {Math.max(1, currentStepIndex + 1)} / {steps.length}</span>
              <span>{step === 'eligibility' ? 'Overview' : step === 'details' ? 'Details' : 'Confirm'}</span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">You&apos;re registered!</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your registration is pending review. You&apos;ll be notified once it&apos;s approved.
              </p>
            </div>
          ) : !eligibility.canRegister ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              {eligibility.action === 'login' ? (
                <>
                  <User className="w-8 h-8 text-brand-red mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 mb-3">{eligibility.reason}</p>
                  <button
                    onClick={() => { onClose(); onNavigateLogin?.(); }}
                    className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider"
                  >
                    Sign In to Register
                  </button>
                </>
              ) : (
                <>
                  <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">{eligibility.reason}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Registration type</span>
                  <span className="font-bold text-slate-700">{REGISTRATION_MODE_LABELS[event.registrationMode]}</span>
                </div>
                {event.registrationDeadline && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deadline</span>
                    <span className="font-bold text-slate-700">{formatRegistrationDeadline(event.registrationDeadline)}</span>
                  </div>
                )}
                {event.capacity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Spots left</span>
                    <span className="font-bold text-slate-700">{Math.max(0, event.capacity - event.enrolledCount)}</span>
                  </div>
                )}
              </div>

              {event.paymentRequired && event.registrationFee && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] font-bold text-amber-700">
                    Registration fee: {event.registrationFee} Birr (payment may be required after approval)
                  </p>
                </div>
              )}

              {step === 'eligibility' && isStudentMode ? (
                <div className="bg-brand-red/5 border border-brand-red/10 rounded-xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Register as <span className="font-bold">{currentUser?.name}</span> ({currentUser?.email})?
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Your student account will be linked to this registration automatically.
                  </p>
                </div>
              ) : step === 'details' && !isStudentMode ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Full Name *
                    </label>
                    <input
                      value={regForm.public_full_name || ''}
                      onChange={e => setRegForm(p => ({ ...p, public_full_name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={regForm.public_email || ''}
                      onChange={e => setRegForm(p => ({ ...p, public_email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={regForm.public_phone || ''}
                      onChange={e => setRegForm(p => ({ ...p, public_phone: e.target.value }))}
                      placeholder="+251 ..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Organization
                    </label>
                    <input
                      value={regForm.public_organization || ''}
                      onChange={e => setRegForm(p => ({ ...p, public_organization: e.target.value }))}
                      placeholder="School or team name (optional)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </>
              ) : step === 'confirm' ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm</p>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                    You&apos;re about to register for <span className="font-black text-slate-900">{event.title}</span>.
                  </p>
                  {!isStudentMode ? (
                    <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="font-bold text-slate-800">{regForm.public_full_name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email</span>
                        <span className="font-bold text-slate-800">{regForm.public_email || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Phone</span>
                        <span className="font-bold text-slate-800">{regForm.public_phone || '—'}</span>
                      </div>
                      {regForm.public_organization ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Organization</span>
                          <span className="font-bold text-slate-800">{regForm.public_organization}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-slate-500">
                      Student registrations will be linked to your account automatically.
                    </p>
                  )}
                  {event.paymentRequired && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Manual payment · {event.registrationFee || 'Required'} Birr
                      </p>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="MOBILE_MONEY">Mobile money</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CASH">Cash</option>
                      </select>
                      {paymentMethod !== 'CASH' && (
                        <input value={transactionReference} onChange={e => setTransactionReference(e.target.value)} placeholder="Transaction reference *" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      )}
                      {paymentMethod === 'BANK_TRANSFER' && (
                        <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank name (optional)" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      )}
                      <p className="text-[11px] text-slate-500">Your registration remains pending until staff verify the payment.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 pt-0">
          {success ? (
            <button
              onClick={onClose}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-wider"
            >
              Done
            </button>
          ) : eligibility.canRegister ? (
            <div className="flex items-center gap-2">
              {step !== 'eligibility' && (
                <button
                  onClick={goBack}
                  disabled={submitting}
                  className="px-4 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {step !== 'confirm' ? (
                <button
                  onClick={goNext}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                  ) : (
                    <><Shield className="w-4 h-4" />Submit Registration</>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
