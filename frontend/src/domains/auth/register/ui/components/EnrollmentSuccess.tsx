import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Copy, Check, Home, RotateCcw } from 'lucide-react';
import type { Enrollment } from '@/shared/types';

type EnrollmentSuccessProps = {
  enrollment: Enrollment;
  onRegisterAnother: () => void;
  onReturnHome: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-bold text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
}

export function EnrollmentSuccess({ enrollment, onRegisterAnother, onReturnHome }: EnrollmentSuccessProps) {
  const [copied, setCopied] = useState(false);
  const pendingCode = enrollment.pending_code || enrollment.enrollment_number || '';

  const copyCode = async () => {
    if (!pendingCode) return;
    try {
      await navigator.clipboard.writeText(pendingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const paymentStatus = enrollment.payment_status
    ? String(enrollment.payment_status).replace(/_/g, ' ')
    : '—';
  const enrollmentStatus = enrollment.status
    ? String(enrollment.status).replace(/_/g, ' ')
    : '—';

  return (
    <div className="min-h-screen bg-brand-paper flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 via-brand-paper to-brand-blue/5" />
      <div className="absolute top-[-10%] left-[-5%] w-[420px] h-[420px] bg-brand-blue/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} className="bg-white rounded-3xl shadow-[0_24px_60px_-16px_rgba(15,23,42,0.12)] max-w-lg w-full border border-slate-200/80 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-brand-blue-dark to-brand-blue" />

        <div className="p-8 md:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" aria-hidden />
          </div>
          <h1 className="font-black text-2xl text-slate-900 tracking-tight">Enrollment Submitted Successfully</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">
            Your application is awaiting administrator review.
          </p>
        </div>

        {pendingCode && (
          <div className="px-8 md:px-10 pb-4">
            <div className="rounded-2xl border-2 border-brand-blue/20 bg-brand-blue/[0.04] px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue mb-2">Pending Code</p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-xl md:text-2xl text-brand-blue tracking-widest break-all">{pendingCode}</p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                  aria-label="Copy reference code"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-8 md:px-10 pb-4">
          <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
            <Row label="Student Name" value={enrollment.student_name || '—'} />
            <Row label="Student Email" value={enrollment.student_email || '—'} />
            <Row label="Assigned Class" value={enrollment.class_name || '—'} />
            <Row label="Payment Status" value={paymentStatus} />
            <Row label="Enrollment Status" value={enrollmentStatus} />
          </div>
        </div>

        <div className="px-8 md:px-10 pb-6">
          <p className="text-slate-600 text-xs leading-relaxed text-center">
            Please save this reference code. Your enrollment will be reviewed by an administrator.
            You will receive an email after payment verification.
          </p>
        </div>

        <div className="px-8 md:px-10 pb-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onReturnHome}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
          >
            <Home className="w-4 h-4" /> Return Home
          </button>
          <button
            type="button"
            onClick={onRegisterAnother}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-blue text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-brand-blue-dark transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          >
            <RotateCcw className="w-4 h-4" /> Register Another Program
          </button>
        </div>
      </motion.div>
    </div>
  );
}
