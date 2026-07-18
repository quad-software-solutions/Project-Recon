import { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Users, User, MapPin, Wallet } from 'lucide-react';

type EnrollmentSummaryPanelProps = {
  programName?: string;
  subProgramName?: string;
  classType?: 'GROUP' | 'INDIVIDUAL' | '';
  branchName?: string;
  branchCity?: string;
  paymentMethod?: string;
  feeLabel?: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Cheque',
};

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-brand-blue" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value || 'Not selected'}</p>
      </div>
    </div>
  );
}

export function EnrollmentSummaryPanel({
  programName,
  subProgramName,
  classType,
  branchName,
  branchCity,
  paymentMethod,
  feeLabel,
  canSubmit,
  isSubmitting,
  onSubmit,
}: EnrollmentSummaryPanelProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const classTypeLabel = classType === 'GROUP' ? 'Group' : classType === 'INDIVIDUAL' ? 'Individual' : '';
  const branchLabel = branchName ? (branchCity ? `${branchName} · ${branchCity}` : branchName) : '';

  const submitButton = (
    <div className="space-y-3">
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30" />
        <span className="text-xs text-slate-600 leading-relaxed">
          I have read and agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline hover:no-underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline hover:no-underline">Privacy Policy</a>.
        </span>
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || !termsAccepted || isSubmitting}
        className="w-full min-h-[48px] bg-brand-blue disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-brand-blue-dark transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2"
      >
        {isSubmitting ? (
          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
        ) : (
          'Submit Enrollment'
        )}
      </button>
    </div>
  );

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] overflow-hidden"
        aria-label="Enrollment summary"
      >
        <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark px-5 py-4">
          <h2 className="font-black text-white text-base tracking-tight">Enrollment Summary</h2>
          <p className="text-blue-100/80 text-xs mt-0.5">Review your selections before submitting</p>
        </div>

        <div className="px-5 py-2 divide-y divide-slate-100">
          <SummaryRow icon={GraduationCap} label="Program" value={programName || ''} />
          <SummaryRow icon={GraduationCap} label="Sub Program" value={subProgramName || ''} />
          <SummaryRow
            icon={classType === 'INDIVIDUAL' ? User : Users}
            label="Class Type"
            value={classTypeLabel}
          />
          <SummaryRow icon={MapPin} label="Branch" value={branchLabel} />
          <SummaryRow
            icon={Wallet}
            label="Payment Method"
            value={paymentMethod ? PAYMENT_LABELS[paymentMethod] || paymentMethod : ''}
          />
        </div>

        {feeLabel && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Course fee</span>
            <span className="font-black text-brand-blue">{feeLabel}</span>
          </div>
        )}

        <div className="hidden lg:block p-5 pt-3">{submitButton}</div>
      </motion.aside>

      {/* Mobile sticky submit */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-8px_rgba(15,23,42,0.12)]">
        {submitButton}
      </div>
    </>
  );
}
