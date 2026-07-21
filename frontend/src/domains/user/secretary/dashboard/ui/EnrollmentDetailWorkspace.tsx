import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRightLeft, Ban, BookOpen, Building2, CalendarDays, CheckCircle2,
  Clock, CreditCard, Download, DollarSign, Loader2, Printer, RefreshCw, ThumbsDown,
  User, X, Award, TrendingUp,
} from 'lucide-react';
import type { AcademicClass, Enrollment, EnrollmentPayment, StudentCertificate, StudentProfile } from '@/shared/types';
import {
  downloadEnrollmentReportPdf,
  fetchEnrollmentAttendanceSummaryApi,
  fetchStudentCertificatesApi,
  fetchStudentProgressSummaryApi,
} from '@/domains/learning/academics/api/academicApi';
import { formatMoney, formatMoneyCompact } from '@/shared/utils/formatCurrency';
import {
  ENROLLMENT_STATUS_META, VERIFICATION_META, PAYMENT_STATUS_META, PAYMENT_METHODS,
  formatDate, formatDateTime, labelize,
} from './enrollmentShared';

function hasText(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function text(v: unknown, fallback = '—'): string {
  return hasText(v) ? String(v).trim() : fallback;
}

function MetaRow({ label, value, mono }: { label: string; value: unknown; mono?: boolean }) {
  if (!hasText(value)) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-slate-900 text-right break-words ${mono ? 'font-mono text-xs text-slate-700' : 'font-semibold'}`}>
        {text(value)}
      </span>
    </div>
  );
}

function Panel({ title, icon, children, className = '', actions }: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500">{icon}</span>}
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function BigBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export type EnrollmentWorkspaceActions = {
  onBack: () => void;
  onUnderReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onMove: () => void;
  onSwitch: () => void;
  onVerifyActivate?: () => void;
  busy?: boolean;
};

type Props = {
  enrollment: Enrollment;
  student: StudentProfile | null;
  payment: EnrollmentPayment | null;
  klass: AcademicClass | undefined;
  loading?: boolean;
  actions: EnrollmentWorkspaceActions;
};

const PAYMENT_DETAIL_LABELS: Record<string, string> = {
  PENDING: 'Awaiting verification',
  PAID: 'Verified',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};
function paymentDetailLabel(s?: string | null): string {
  if (!s) return '—';
  return PAYMENT_DETAIL_LABELS[s] || labelize(s);
}

function canRecordApproval(e: Enrollment) {
  return e.status === 'PENDING_VERIFICATION' && !e.payment_status;
}
function canReject(e: Enrollment) {
  return e.status === 'PENDING_VERIFICATION' && Boolean(e.pending_code);
}
function isStuckUnderReview(e: Enrollment): boolean {
  return e.status === 'PENDING_VERIFICATION' && e.verification_status === 'UNDER_REVIEW';
}

export default function EnrollmentDetailWorkspace({
  enrollment: e,
  student,
  payment,
  klass,
  loading,
  actions,
}: Props) {
  const [att, setAtt] = useState<Record<string, unknown> | null>(null);
  const [prog, setProg] = useState<Record<string, unknown> | null>(null);
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [focusPayment, setFocusPayment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRelatedLoading(true);
    Promise.all([
      fetchEnrollmentAttendanceSummaryApi(e.id).catch(() => null),
      fetchStudentProgressSummaryApi(e.id).catch(() => null),
      e.student ? fetchStudentCertificatesApi(e.student).catch(() => []) : Promise.resolve([]),
    ]).then(([a, p, c]) => {
      if (cancelled) return;
      setAtt(a);
      setProg(p);
      setCerts(Array.isArray(c) ? c : []);
    }).finally(() => {
      if (!cancelled) setRelatedLoading(false);
    });
    return () => { cancelled = true; };
  }, [e.id, e.student]);

  const initials = (e.student_name || student?.first_name || '?').charAt(0).toUpperCase();
  const fullName = e.student_name
    || (student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '')
    || e.student_email
    || 'Student';

  const enrollRef = e.enrollment_number || e.pending_code;
  const statusMeta = ENROLLMENT_STATUS_META[e.status];
  const verMeta = e.verification_status ? VERIFICATION_META[e.verification_status] : null;

  const timeline = useMemo(() => {
    const steps: { key: string; label: string; detail?: string; state: 'done' | 'current' | 'upcoming' }[] = [
      { key: 'submitted', label: 'Submitted', detail: formatDateTime(e.enrolled_at || e.created_at), state: 'done' },
      {
        key: 'pending',
        label: 'Pending Verification',
        state: e.status === 'PENDING_VERIFICATION' && e.verification_status === 'SUBMITTED' ? 'current'
          : (e.verification_status && e.verification_status !== 'SUBMITTED') || e.status !== 'PENDING_VERIFICATION' ? 'done' : 'upcoming',
      },
      {
        key: 'review',
        label: 'Under Review',
        state: e.verification_status === 'UNDER_REVIEW' ? 'current'
          : e.verification_status === 'VERIFIED' || e.status === 'ACTIVE' || e.status === 'COMPLETED' || e.verification_status === 'REJECTED' ? 'done'
            : 'upcoming',
      },
      {
        key: 'paid',
        label: 'Payment Verified',
        detail: payment?.verified_at ? formatDateTime(payment.verified_at) : payment ? paymentDetailLabel(String(payment.status)) : undefined,
        state: payment?.status === 'PAID' || e.verification_status === 'VERIFIED' || e.status === 'ACTIVE' || e.status === 'COMPLETED'
          ? (e.status === 'ACTIVE' || e.status === 'COMPLETED' || payment?.status === 'PAID' ? 'done' : 'current')
          : e.status === 'REJECTED' ? 'upcoming' : 'upcoming',
      },
      {
        key: 'active',
        label: 'Active',
        state: e.status === 'ACTIVE' ? 'current' : e.status === 'COMPLETED' ? 'done' : 'upcoming',
      },
      {
        key: 'completed',
        label: 'Completed',
        state: e.status === 'COMPLETED' ? 'current' : 'upcoming',
      },
    ];

    if (e.status === 'CANCELLED') {
      steps.push({ key: 'cancelled', label: 'Cancelled', detail: formatDateTime(e.updated_at), state: 'current' });
    }
    if (e.status === 'REJECTED') {
      steps.push({ key: 'rejected', label: 'Rejected', detail: e.rejection_reason || formatDateTime(e.updated_at), state: 'current' });
    }
    if (e.transferred_from) {
      const activeIdx = steps.findIndex(s => s.key === 'active');
      steps.splice(activeIdx >= 0 ? activeIdx + 1 : steps.length, 0, {
        key: 'transfer',
        label: 'Transferred',
        detail: 'Linked from prior enrollment',
        state: 'done',
      });
    }
    return steps;
  }, [e, payment]);

  const actionBtn = 'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors disabled:opacity-50';

  const handlePrint = () => window.print();
  const handleDownload = () => {
    if (e.student) downloadEnrollmentReportPdf(e.student);
  };

  return (
    <div className="min-h-[70vh] space-y-5 print:space-y-4">
      {/* Breadcrumb / back */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={actions.onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Enrollments
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePrint} className={`${actionBtn} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`}>
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          {e.student && (
            <button type="button" onClick={handleDownload} className={`${actionBtn} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`}>
              <Download className="h-3.5 w-3.5" /> Download report
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50" />
            <div className="relative px-5 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-2xl sm:text-3xl font-black text-white shadow-lg shadow-blue-600/20">
                    {initials}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">{fullName}</h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                      {enrollRef && (
                        <span className="font-mono text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {enrollRef}
                        </span>
                      )}
                      {hasText(e.program_name || e.sub_program_name) && (
                        <span className="truncate">{text(e.program_name || e.sub_program_name)}</span>
                      )}
                      {hasText(e.branch_name) && (
                        <span className="text-slate-400">· {text(e.branch_name)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {statusMeta && <BigBadge label={statusMeta.label} tone={statusMeta.color} />}
                      {verMeta && <BigBadge label={`Verification: ${verMeta.label}`} tone={verMeta.color} />}
                      {e.payment_status && (
                        <BigBadge
                          label={`Payment: ${labelize(String(e.payment_status))}`}
                          tone={`${PAYMENT_STATUS_META[String(e.payment_status)] || 'bg-slate-100 text-slate-600'} border-transparent`}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {payment && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4 lg:min-w-[200px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Amount</p>
                    <p className="text-2xl font-black text-emerald-800 mt-0.5">{formatMoney(payment.amount)}</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || labelize(payment.payment_method)}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Quick Actions ── */}
              <div className="mt-6 space-y-3 print:hidden border-t border-slate-200/70 pt-5">
                {/* Online enrollment — PENDING_VERIFICATION + SUBMITTED + has payment */}
                {e.status === 'PENDING_VERIFICATION' && e.verification_status === 'SUBMITTED' && e.payment_status && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={actions.busy} onClick={actions.onVerifyActivate}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        <CheckCircle2 className="h-4 w-4" /> {actions.busy ? 'Processing…' : 'Verify & Activate'}
                      </button>
                      <button type="button" disabled={actions.busy} onClick={actions.onUnderReview}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors">
                        <Clock className="h-3.5 w-3.5" /> Under Review
                      </button>
                      <button type="button" disabled={actions.busy} onClick={actions.onReject}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-xs text-blue-800 leading-relaxed">
                        <span className="font-bold">Online enrollment:</span> This student submitted a bank transfer payment.
                        Click <strong>Verify & Activate</strong> to approve the payment and activate the enrollment,
                        or use <strong>Under Review</strong> to flag for further review.
                      </p>
                    </div>
                  </>
                )}

                {/* Walk-in / no existing payment — ready to record payment */}
                {canRecordApproval(e) && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={actions.busy} onClick={actions.onApprove}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        <DollarSign className="h-4 w-4" /> {actions.busy ? 'Processing…' : 'Approve & Record Payment'}
                      </button>
                      {canReject(e) && (
                        <button type="button" disabled={actions.busy} onClick={actions.onReject}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                          <ThumbsDown className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        <span className="font-bold">Walk-in</span> — no payment recorded yet.
                        Click <strong>Approve & Record Payment</strong> to register the payment and activate this enrollment.
                      </p>
                    </div>
                  </>
                )}

                {/* PENDING_VERIFICATION + SUBMITTED but NO payment status (edge case) */}
                {e.status === 'PENDING_VERIFICATION' && e.verification_status === 'SUBMITTED' && !e.payment_status && !canRecordApproval(e) && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={actions.busy} onClick={actions.onUnderReview}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      <Clock className="h-3.5 w-3.5" /> Under Review
                    </button>
                    {canReject(e) && (
                      <button type="button" disabled={actions.busy} onClick={actions.onReject}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    )}
                  </div>
                )}

                {/* PENDING_VERIFICATION — no verification status yet */}
                {e.status === 'PENDING_VERIFICATION' && !e.verification_status && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={actions.busy} onClick={actions.onUnderReview}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      <Clock className="h-3.5 w-3.5" /> Start Review
                    </button>
                    {canReject(e) && (
                      <button type="button" disabled={actions.busy} onClick={actions.onReject}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    )}
                    <button type="button" disabled={actions.busy} onClick={actions.onCancel}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                )}

                {/* UNDER_REVIEW stuck-state banner */}
                {isStuckUnderReview(e) && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={actions.busy} onClick={actions.onVerifyActivate}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        <CheckCircle2 className="h-4 w-4" /> {actions.busy ? 'Processing…' : 'Verify & Activate'}
                      </button>
                      <button type="button" disabled={actions.busy} onClick={actions.onReject}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 space-y-1">
                          <p className="font-bold">Under Review</p>
                          <p>This enrollment was moved to Under Review. Click <strong>Verify & Activate</strong> to approve and activate, or <strong>Reject</strong> to decline.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ACTIVE — management actions */}
                {e.status === 'ACTIVE' && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={actions.busy} onClick={actions.onComplete}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                    </button>
                    <button type="button" disabled={actions.busy} onClick={actions.onMove}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors">
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Move Class
                    </button>
                    <button type="button" disabled={actions.busy} onClick={actions.onSwitch}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-100 px-4 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-200 disabled:opacity-50 transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" /> Switch Sub-Program
                    </button>
                    <button type="button" disabled={actions.busy} onClick={actions.onCancel}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                      <X className="h-3.5 w-3.5" /> Cancel Enrollment
                    </button>
                    {payment && (
                      <button type="button" onClick={() => {
                        setFocusPayment(true);
                        document.getElementById('enrollment-payment-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                        <CreditCard className="h-3.5 w-3.5" /> View Payment
                      </button>
                    )}
                  </div>
                )}

                {/* Cancel — for PENDING_VERIFICATION without other matching blocks */}
                {e.status === 'PENDING_VERIFICATION' && e.verification_status && e.verification_status !== 'SUBMITTED' && e.verification_status !== 'UNDER_REVIEW' && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={actions.busy} onClick={actions.onCancel}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                      <X className="h-3.5 w-3.5" /> Cancel Enrollment
                    </button>
                    {payment && (
                      <button type="button" onClick={() => {
                        setFocusPayment(true);
                        document.getElementById('enrollment-payment-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                        <CreditCard className="h-3.5 w-3.5" /> View Payment
                      </button>
                    )}
                  </div>
                )}

                {/* Generic View Payment for any state that has payment but no other buttons matched */}
                {payment && e.status !== 'ACTIVE' && e.status !== 'PENDING_VERIFICATION' && (
                  <button type="button" onClick={() => {
                    setFocusPayment(true);
                    document.getElementById('enrollment-payment-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                    <CreditCard className="h-3.5 w-3.5" /> View Payment
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 space-y-5">
              <Panel title="Academic profile" icon={<BookOpen className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    <MetaRow label="Program" value={e.program_name} />
                    <MetaRow label="Sub-program" value={e.sub_program_name} />
                    <MetaRow label="Class" value={e.class_name} />
                    <MetaRow label="Class type" value={labelize(e.class_type)} />
                    <MetaRow label="Class period" value={labelize(klass?.class_period)} />
                  </div>
                  <div>
                    <MetaRow label="Branch" value={e.branch_name || klass?.branch_name} />
                    <MetaRow label="Instructor" value={klass?.instructor_name} />
                    <MetaRow label="Start date" value={klass?.start_date ? formatDate(klass.start_date) : null} />
                    <MetaRow label="End date" value={klass?.end_date ? formatDate(klass.end_date) : null} />
                    <MetaRow label="Capacity" value={klass?.capacity} />
                  </div>
                </div>
              </Panel>

              <Panel title="Enrollment information" icon={<Building2 className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    <MetaRow label="Enrollment number" value={e.enrollment_number} mono />
                    <MetaRow label="Pending code" value={e.pending_code} mono />
                    <MetaRow label="Status" value={statusMeta?.label || labelize(e.status)} />
                    <MetaRow label="Verification" value={verMeta?.label || labelize(e.verification_status)} />
                    <MetaRow label="Enrolled" value={formatDateTime(e.enrolled_at)} />
                  </div>
                  <div>
                    <MetaRow label="Created" value={formatDateTime(e.created_at)} />
                    <MetaRow label="Updated" value={formatDateTime(e.updated_at)} />
                    <MetaRow label="Payment status" value={labelize(e.payment_status ? String(e.payment_status) : null)} />
                    <MetaRow label="Payment method" value={labelize(e.payment_method ? String(e.payment_method) : null)} />
                    <MetaRow label="Transferred from" value={e.transferred_from ? 'Yes (prior enrollment)' : null} />
                  </div>
                </div>
                {(hasText(e.remarks) || hasText(e.rejection_reason)) && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {hasText(e.remarks) && (
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 mb-1">Remarks</p>
                        <p className="text-sm text-slate-800 leading-relaxed">{e.remarks}</p>
                      </div>
                    )}
                    {hasText(e.rejection_reason) && (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-[11px] font-bold text-red-600 mb-1 flex items-center gap-1"><Ban className="h-3 w-3" /> Rejection reason</p>
                        <p className="text-sm text-red-800">{e.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </Panel>

              <Panel
                title="Payment"
                icon={<CreditCard className="h-4 w-4" />}
                className={focusPayment ? 'ring-2 ring-blue-500/30' : ''}
                actions={
                  <button type="button" id="enrollment-payment-panel" className="sr-only" tabIndex={-1}>Payment</button>
                }
              >
                {!payment ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No payment recorded yet</p>
                    {canRecordApproval(e) && (
                      <button type="button" onClick={actions.onApprove}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                        <DollarSign className="h-3.5 w-3.5" /> Approve & Record Payment
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-4 text-white">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</p>
                        <p className="text-3xl font-black tracking-tight mt-0.5">{formatMoney(payment.amount)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_STATUS_META[String(payment.status)] || 'bg-slate-100 text-slate-700'}`}>
                          {labelize(String(payment.status))}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">ETB</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                      <div>
                        <MetaRow label="Method" value={PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method} />
                        <MetaRow label="Transaction reference" value={payment.transaction_reference} mono />
                        <MetaRow label="Transfer reference" value={payment.transfer_reference} mono />
                        <MetaRow label="Bank" value={payment.bank_name} />
                      </div>
                      <div>
                        <MetaRow label="Payment date" value={formatDateTime(payment.payment_date)} />
                        <MetaRow label="Recorded / verified by" value={payment.verified_by} />
                        <MetaRow label="Verified at" value={formatDateTime(payment.verified_at)} />
                        <MetaRow label="Notes" value={payment.verification_notes} />
                        <MetaRow label="Refund" value={String(payment.status) === 'REFUNDED' ? 'Refunded' : String(payment.status) === 'CANCELLED' ? 'Cancelled' : null} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 mb-3">Payment timeline</p>
                      <ol className="space-y-0">
                        {[
                          { label: 'Created', d: payment.created_at, done: true },
                          { label: 'Payment date', d: payment.payment_date, done: Boolean(payment.payment_date) },
                          { label: 'Verified', d: payment.verified_at, done: Boolean(payment.verified_at) },
                        ].filter(x => x.d || x.label === 'Created').map((item, i, arr) => (
                          <li key={item.label} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className={`h-2.5 w-2.5 rounded-full mt-1.5 ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              {i < arr.length - 1 && <span className="w-px flex-1 bg-slate-200 min-h-[20px]" />}
                            </div>
                            <div className="pb-4">
                              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.d ? formatDateTime(item.d) : '—'}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div className="xl:col-span-4 space-y-5">
              <Panel title="Student" icon={<User className="h-4 w-4" />}>
                <div className="space-y-0">
                  <MetaRow label="Name" value={fullName} />
                  <MetaRow label="Email" value={e.student_email || student?.email} />
                  <MetaRow label="Phone" value={student?.phone_number} />
                  <MetaRow label="Branch" value={student?.branch_name} />
                  <MetaRow label="Date joined" value={student?.date_joined ? formatDate(student.date_joined) : null} />
                  <MetaRow label="Account" value={student ? (student.is_active ? 'Active' : 'Inactive') : null} />
                </div>
                {(hasText(student?.guardian_name) || hasText(student?.guardian_phone) || hasText(student?.guardian_email)) && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Guardian</p>
                    <MetaRow label="Name" value={student?.guardian_name} />
                    <MetaRow label="Phone" value={student?.guardian_phone} />
                    <MetaRow label="Email" value={student?.guardian_email} />
                  </div>
                )}
              </Panel>

              <Panel title="Enrollment timeline" icon={<CalendarDays className="h-4 w-4" />}>
                <ol className="space-y-0">
                  {timeline.map((step, i) => (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold border ${
                          step.state === 'done' ? 'bg-blue-600 border-blue-600 text-white'
                            : step.state === 'current' ? 'bg-white border-blue-600 text-blue-700 ring-4 ring-blue-100'
                              : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {step.state === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        {i < timeline.length - 1 && (
                          <span className={`w-px flex-1 min-h-[22px] ${step.state === 'done' ? 'bg-blue-200' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="pb-5 min-w-0">
                        <p className={`text-sm font-semibold ${step.state === 'current' ? 'text-blue-700' : 'text-slate-800'}`}>
                          {step.label}
                        </p>
                        {step.detail && step.detail !== 'Not Available' && (
                          <p className="text-xs text-slate-500 mt-0.5 break-words">{step.detail}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="Related" icon={<TrendingUp className="h-4 w-4" />}>
                {relatedLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                      <p className="text-lg font-bold text-slate-900">{String(att?.rate ?? '—')}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Attendance</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                      <p className="text-lg font-bold text-slate-900">{String(prog?.completion_rate ?? '—')}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Progress</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                      <p className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-500" />{certs.length}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Certificates</p>
                    </div>
                  </div>
                )}
                {payment && (
                  <p className="mt-3 text-xs text-slate-500">
                    Latest payment {formatMoneyCompact(payment.amount)} · {labelize(String(payment.status))}
                  </p>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
