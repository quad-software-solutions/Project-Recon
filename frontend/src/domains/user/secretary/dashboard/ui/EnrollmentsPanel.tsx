import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, Loader2, AlertCircle, Eye, CheckCircle2, Download, DollarSign,
  ChevronLeft, ChevronRight, ArrowRightLeft, RefreshCw, ThumbsDown, Clock,
  User, BookOpen, Building2, CreditCard, Ban, CalendarDays,
} from 'lucide-react';
import type { Enrollment, StudentProfile, AcademicClass, SubProgram, UserProfile, EnrollmentPayment } from '@/shared/types';
import {
  fetchEnrollmentsPaginatedApi, fetchStudentsApi, fetchClassesApi, fetchSubProgramsApi, enrollStudentApi,
  cancelEnrollmentApi, completeEnrollmentApi, searchStudentsApi, recordPaymentApi,
  moveEnrollmentApi, switchSubProgramApi,
  setUnderReviewApi, rejectPaymentApi, fetchPaymentsListApi, fetchStudentApi,
} from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import { formatApiError } from '@/shared/utils/formatApiError';
import { formatMoneyCompact } from '@/shared/utils/formatCurrency';
import { isSuperAdmin } from '@/shared/auth/permissions';
import {
  NA, displayValue, formatDate, formatDateTime, labelize,
  ENROLLMENT_STATUS_META, VERIFICATION_META, PAYMENT_STATUS_META, PAYMENT_METHODS,
  StatusBadge, ConfirmDialog,
} from './enrollmentShared';
import EnrollmentDetailWorkspace from './EnrollmentDetailWorkspace';

const PAGE_SIZE = 20;

/** Online enrollments already create a payment row — staff cannot POST /payments/ again. */
function hasExistingPayment(e: Enrollment): boolean {
  return Boolean(e.payment_status);
}

function canRecordApproval(e: Enrollment): boolean {
  return e.status === 'PENDING_VERIFICATION' && !hasExistingPayment(e);
}

/** Backend reject_payment requires pending_code (online enrollments only). */
function canRejectEnrollment(e: Enrollment): boolean {
  return e.status === 'PENDING_VERIFICATION' && Boolean(e.pending_code);
}

type StatusTab = 'all' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

const tabs: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'PENDING_VERIFICATION', label: 'Pending' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'REJECTED', label: 'Rejected' },
];

type ConfirmKind = 'cancel' | 'complete' | null;

const emptyPaymentForm = () => ({
  amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'CASH',
  transaction_reference: '',
  transfer_reference: '',
  bank_name: '',
  verification_notes: '',
});

export default function EnrollmentsPanel({ currentUser }: { currentUser?: UserProfile }) {
  const isSuper = currentUser ? isSuperAdmin(currentUser) : false;
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentProfile | null>(null);
  const [detailPayment, setDetailPayment] = useState<EnrollmentPayment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showPayment, setShowPayment] = useState<Enrollment | null>(null);
  const [showReject, setShowReject] = useState<Enrollment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentProfile[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [form, setForm] = useState({ student: '', enrolled_class: '', remarks: '' });
  const [classAction, setClassAction] = useState<{ enrollment: Enrollment; mode: 'move' | 'switch' } | null>(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [classActionBusy, setClassActionBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchApprove, setShowBatchApprove] = useState(false);
  const [showBatchReject, setShowBatchReject] = useState(false);
  const [batchAmount, setBatchAmount] = useState('');
  const [batchRejectReason, setBatchRejectReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; enrollment: Enrollment } | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p, 50), 40),
      isSuper ? fetchClassesApi().catch(() => [] as AcademicClass[]) : Promise.resolve([] as AcademicClass[]),
      fetchSubProgramsApi().catch(() => [] as SubProgram[]),
      fetchPaymentsListApi().catch(() => [] as EnrollmentPayment[]),
    ]).then(([enr, cls, sp, pay]) => {
      const rows = enr.status === 'fulfilled' && Array.isArray(enr.value) ? enr.value : [];
      if (enr.status === 'rejected') setError(formatApiError(enr.reason));

      let classRows = cls.status === 'fulfilled'
        ? (Array.isArray(cls.value) ? cls.value : []).filter(c => c.is_active !== false)
        : [];

      if (classRows.length === 0 && rows.length > 0) {
        const seen = new Map<string, AcademicClass>();
        for (const e of rows) {
          if (!e.enrolled_class || seen.has(e.enrolled_class)) continue;
          seen.set(e.enrolled_class, {
            id: e.enrolled_class,
            name: e.class_name || 'Class',
            sub_program: '',
            branch: '',
            branch_name: e.branch_name,
            class_type: e.class_type || 'GROUP',
            is_active: true,
          } as AcademicClass);
        }
        classRows = [...seen.values()];
      }

      for (const row of rows) {
        const c = classRows.find(x => x.id === row.enrolled_class);
        if (c) {
          if (!row.branch_name) row.branch_name = c.branch_name;
          if (!row.class_type) row.class_type = c.class_type;
          if (!row.sub_program_name) row.sub_program_name = c.sub_program_name;
        }
      }
      setAllEnrollments(rows);
      setClasses(classRows);
      if (sp.status === 'fulfilled') setSubPrograms(Array.isArray(sp.value) ? sp.value : []);
      if (pay.status === 'fulfilled') setPayments(Array.isArray(pay.value) ? pay.value : []);
    }).finally(() => setLoading(false));
  }, [isSuper]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (showEnroll) fetchStudentsApi().then(setAllStudents).catch(() => {});
  }, [showEnroll]);

  useEffect(() => {
    if (studentSearch.trim().length < 2) { setStudentResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      searchStudentsApi(studentSearch).then(res => {
        setStudentResults(Array.isArray(res) ? res : []);
      }).catch(() => setStudentResults([])).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const openDetail = async (e: Enrollment) => {
    setSelected(e);
    setDetailStudent(null);
    setDetailPayment(payments.find(p => p.enrollment === e.id || p.enrollment_id === e.id) || null);
    setDetailLoading(true);
    try {
      const [student, payList] = await Promise.all([
        e.student ? fetchStudentApi(e.student).catch(() => null) : Promise.resolve(null),
        payments.length ? Promise.resolve(payments) : fetchPaymentsListApi().catch(() => [] as EnrollmentPayment[]),
      ]);
      if (student) setDetailStudent(student);
      if (Array.isArray(payList) && payList.length) {
        setPayments(payList);
        setDetailPayment(payList.find(p => p.enrollment === e.id || p.enrollment_id === e.id) || null);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const flashSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const patchEnrollment = (id: string, patch: Partial<Enrollment>) => {
    setAllEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    setSelected(prev => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const handleCancel = async (id: string) => {
    setSubmitting(true);
    try {
      const updated = await cancelEnrollmentApi(id);
      patchEnrollment(id, updated);
      flashSuccess('Enrollment cancelled');
      setConfirm(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    setSubmitting(true);
    try {
      const updated = await completeEnrollmentApi(id);
      patchEnrollment(id, updated);
      flashSuccess('Enrollment marked completed');
      setConfirm(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!showReject || !rejectReason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await rejectPaymentApi(showReject.id, { rejection_reason: rejectReason.trim() });
      patchEnrollment(showReject.id, {
        status: 'REJECTED',
        verification_status: 'REJECTED',
        rejection_reason: rejectReason.trim(),
      });
      setShowReject(null);
      setRejectReason('');
      flashSuccess('Enrollment rejected');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectablePending.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectablePending.map(e => e.id)));
  };

  const handleBatchApprove = async () => {
    const ids = [...selectedIds].filter(id => {
      const row = allEnrollments.find(e => e.id === id);
      return row && canRecordApproval(row);
    });
    if (!ids.length || !batchAmount) return;
    setSubmitting(true);
    setError(null);
    let success = 0;
    for (const id of ids) {
      try {
        await recordPaymentApi({
          enrollment: id, amount: batchAmount, payment_method: 'CASH',
          payment_date: new Date().toISOString().slice(0, 10),
        });
        patchEnrollment(id, { status: 'ACTIVE', payment_status: 'PAID', verification_status: 'VERIFIED' });
        success++;
      } catch (e) {
        setError(formatApiError(e));
      }
    }
    setSelectedIds(new Set());
    setBatchAmount('');
    setShowBatchApprove(false);
    flashSuccess(`Approved ${success} of ${ids.length} enrollments`);
    setSubmitting(false);
    loadData();
  };

  const handleBatchReject = async () => {
    const ids = [...selectedIds].filter(id => {
      const row = allEnrollments.find(e => e.id === id);
      return row && canRejectEnrollment(row);
    });
    if (!ids.length || !batchRejectReason.trim()) return;
    setSubmitting(true);
    setError(null);
    let success = 0;
    for (const id of ids) {
      try {
        await rejectPaymentApi(id, { rejection_reason: batchRejectReason.trim() });
        patchEnrollment(id, {
          status: 'REJECTED',
          verification_status: 'REJECTED',
          rejection_reason: batchRejectReason.trim(),
        });
        success++;
      } catch (e) {
        setError(formatApiError(e));
      }
    }
    setSelectedIds(new Set());
    setBatchRejectReason('');
    setShowBatchReject(false);
    flashSuccess(`Rejected ${success} of ${ids.length} enrollments`);
    setSubmitting(false);
  };

  const handleUnderReview = async (id: string) => {
    setSubmitting(true);
    try {
      await setUnderReviewApi(id);
      patchEnrollment(id, { verification_status: 'UNDER_REVIEW' });
      flashSuccess('Marked as under review');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyActivate = async (enrollment: Enrollment) => {
    setSubmitting(true);
    setError(null);
    try {
      await setUnderReviewApi(enrollment.id);
      const payAmount = detailPayment?.amount || 0;
      try {
        const paymentRecord = await recordPaymentApi({
          enrollment: enrollment.id,
          amount: String(payAmount),
          payment_method: String(enrollment.payment_method || 'BANK_TRANSFER'),
          payment_date: new Date().toISOString().slice(0, 10),
        });
        patchEnrollment(enrollment.id, {
          status: 'ACTIVE',
          payment_status: 'PAID',
          verification_status: 'VERIFIED',
        });
        if (detailPayment?.enrollment === enrollment.id) {
          setDetailPayment({ ...detailPayment, status: 'PAID', verified_at: new Date().toISOString() });
        }
        flashSuccess('Enrollment verified and activated');
        loadData();
      } catch {
        patchEnrollment(enrollment.id, { verification_status: 'UNDER_REVIEW' });
        flashSuccess('Marked as under review — payment record API not available for online payments');
      }
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashPayment = async () => {
    if (!showPayment || !paymentForm.amount) return;
    if (hasExistingPayment(showPayment)) {
      setError('This enrollment already has a submitted payment. Use Under Review or Reject — recording a second payment is not allowed by the API.');
      setShowPayment(null);
      return;
    }
    if (paymentForm.payment_method !== 'CASH' && !paymentForm.transaction_reference.trim()) {
      setError('Transaction reference is required for non-cash payments.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payment = await recordPaymentApi({
        enrollment: showPayment.id,
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date || undefined,
        transaction_reference: paymentForm.payment_method === 'CASH' ? undefined : paymentForm.transaction_reference || undefined,
        transfer_reference: paymentForm.payment_method === 'CASH' ? undefined : paymentForm.transfer_reference || undefined,
        bank_name: paymentForm.payment_method === 'CASH' ? undefined : paymentForm.bank_name || undefined,
        verification_notes: paymentForm.verification_notes || undefined,
      });
      patchEnrollment(showPayment.id, {
        status: 'ACTIVE',
        payment_status: 'PAID',
        payment_method: paymentForm.payment_method as Enrollment['payment_method'],
        verification_status: 'VERIFIED',
      });
      setPayments(prev => [payment, ...prev.filter(p => p.enrollment !== showPayment.id)]);
      setShowPayment(null);
      flashSuccess('Enrollment approved — payment recorded');
      loadData();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const openClassAction = (enrollment: Enrollment, mode: 'move' | 'switch') => {
    setClassAction({ enrollment, mode });
    setTargetClassId('');
  };

  const handleClassAction = async () => {
    if (!classAction || !targetClassId) return;
    setClassActionBusy(true);
    setError(null);
    try {
      if (classAction.mode === 'move') {
        const updated = await moveEnrollmentApi(classAction.enrollment.id, { target_class: targetClassId });
        setAllEnrollments(prev => prev.map(e => e.id === updated.id ? updated : e));
        if (selected?.id === updated.id) setSelected(updated);
      } else {
        await switchSubProgramApi(classAction.enrollment.id, { target_class: targetClassId });
      }
      setClassAction(null);
      setTargetClassId('');
      loadData();
      flashSuccess(`Enrollment ${classAction.mode === 'move' ? 'moved' : 'switched'}`);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setClassActionBusy(false);
    }
  };

  const handleEnroll = async () => {
    if (!form.student || !form.enrolled_class) return;
    setSubmitting(true);
    setError(null);
    try {
      const enrollment = await enrollStudentApi(form);
      setAllEnrollments(prev => [enrollment, ...prev]);
      setForm({ student: '', enrolled_class: '', remarks: '' });
      setStudentSearch('');
      setStudentResults([]);
      setShowEnroll(false);
      flashSuccess('Student enrolled — record payment to activate');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const openApprove = (e: Enrollment) => {
    const hint = getFeeHint(e.sub_program_name);
    const match = hint?.match(/([\d.]+)/);
    setPaymentForm({
      ...emptyPaymentForm(),
      amount: match ? match[1] : '',
    });
    setShowPayment(e);
  };

  const statusCounts = useMemo(() => ({
    ACTIVE: allEnrollments.filter(e => e.status === 'ACTIVE').length,
    PENDING_VERIFICATION: allEnrollments.filter(e => e.status === 'PENDING_VERIFICATION').length,
    COMPLETED: allEnrollments.filter(e => e.status === 'COMPLETED').length,
    CANCELLED: allEnrollments.filter(e => e.status === 'CANCELLED').length,
    REJECTED: allEnrollments.filter(e => e.status === 'REJECTED').length,
  }), [allEnrollments]);

  const classEnrollmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of allEnrollments) {
      if (e.status === 'ACTIVE' && e.enrolled_class) {
        counts.set(e.enrolled_class, (counts.get(e.enrolled_class) || 0) + 1);
      }
    }
    return counts;
  }, [allEnrollments]);

  const classOptionLabel = (c: AcademicClass): string => {
    const count = classEnrollmentCounts.get(c.id) || 0;
    const cap = c.capacity;
    const branch = c.branch_name || '';
    const base = `${c.name}${branch ? ` · ${branch}` : ''} · ${c.sub_program_name || 'Program'}`;
    return cap ? `${base} (${count}/${cap})` : base;
  };

  const isClassFull = (c: AcademicClass): boolean => {
    if (!c.capacity) return false;
    return (classEnrollmentCounts.get(c.id) || 0) >= c.capacity;
  };

  const feeMap = useMemo(() => {
    const map = new Map<string, { group_fee: number; individual_fee?: number | null }>();
    for (const sp of subPrograms) {
      if (sp.name) map.set(sp.name.toLowerCase(), { group_fee: sp.group_fee, individual_fee: sp.individual_fee });
    }
    return map;
  }, [subPrograms]);

  const getFeeHint = (subProgramName?: string): string | null => {
    if (!subProgramName) return null;
    const fee = feeMap.get(subProgramName.toLowerCase());
    if (!fee) return null;
    const amounts = [fee.group_fee, fee.individual_fee].filter(Boolean);
    return amounts.length ? `Suggested: ${formatMoneyCompact(amounts[0])}` : null;
  };

  const filtered = useMemo(() =>
    allEnrollments.filter(e => {
      if (statusTab !== 'all' && e.status !== statusTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${e.student_name || ''} ${e.class_name || ''} ${e.sub_program_name || ''} ${e.pending_code || ''} ${e.enrollment_number || ''} ${e.student_email || ''} ${e.branch_name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }),
    [allEnrollments, statusTab, searchQuery],
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const enrollments = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe],
  );

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusTab, searchQuery]);

  const pendingFiltered = useMemo(
    () => filtered.filter(e => e.status === 'PENDING_VERIFICATION'),
    [filtered],
  );

  const selectablePending = useMemo(
    () => pendingFiltered.filter(e => canRecordApproval(e) || canRejectEnrollment(e)),
    [pendingFiltered],
  );

  const selectedClass = selected
    ? classes.find(c => c.id === selected.enrolled_class)
    : undefined;

  const exportCsv = () => {
    const headers = ['Student', 'Email', 'Class', 'Program', 'Branch', 'Reference', 'Date', 'Status', 'Verification', 'Payment'];
    const rows = filtered.map(e => [
      e.student_name || '', e.student_email || '', e.class_name || '', e.sub_program_name || '', e.branch_name || '',
      e.pending_code || e.enrollment_number || '', e.enrolled_at?.slice(0, 10) || '', e.status,
      e.verification_status || '', e.payment_status || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'enrollments.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const ActionButtons = ({ e, compact = false }: { e: Enrollment; compact?: boolean }) => {
    const btn = compact
      ? 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap'
      : 'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap';
    return (
      <div className={`flex flex-wrap items-center ${compact ? 'justify-end gap-1' : 'gap-2'}`}>
        <button type="button" onClick={() => openDetail(e)} className={`${btn} text-white bg-blue-600 hover:bg-blue-700`} title="Open workspace">
          <Eye className="w-3 h-3" /> {compact ? 'Open' : 'Open workspace'}
        </button>
      </div>
    );
  };

  const workspaceAndModals = (listMode: boolean) => (
    <>
      {!listMode && selected && (
        <EnrollmentDetailWorkspace
          enrollment={selected}
          student={detailStudent}
          payment={detailPayment}
          klass={selectedClass}
          loading={detailLoading}
          actions={{
            onBack: () => { setSelected(null); setDetailStudent(null); setDetailPayment(null); },
            onUnderReview: () => handleUnderReview(selected.id),
            onApprove: () => openApprove(selected),
            onReject: () => { setShowReject(selected); setRejectReason(''); },
            onCancel: () => setConfirm({ kind: 'cancel', enrollment: selected }),
            onComplete: () => setConfirm({ kind: 'complete', enrollment: selected }),
            onMove: () => openClassAction(selected, 'move'),
            onSwitch: () => openClassAction(selected, 'switch'),
            onVerifyActivate: () => handleVerifyActivate(selected),
            busy: submitting,
          }}
        />
      )}

      {/* Approve & Record Payment modal */}
      <AnimatePresence>
        {showPayment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPayment(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowPayment(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 sticky top-0 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                    <h3 className="font-bold text-slate-900">Approve & Record Payment</h3>
                  </div>
                  <button type="button" onClick={() => setShowPayment(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                    Recording payment activates this enrollment and emails <strong>{showPayment.student_email || 'the student'}</strong>.
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                    <p><span className="text-slate-500">Student:</span> <span className="font-medium">{displayValue(showPayment.student_name || showPayment.student_email)}</span></p>
                    <p><span className="text-slate-500">Class:</span> <span className="font-medium">{displayValue(showPayment.class_name)}</span></p>
                    <p><span className="text-slate-500">Reference:</span> <span className="font-mono text-brand-blue font-medium">{displayValue(showPayment.pending_code || showPayment.enrollment_number)}</span></p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                      Amount (ETB)
                      {(() => {
                        const hint = getFeeHint(showPayment.sub_program_name);
                        return hint ? (
                          <button type="button" onClick={() => {
                            const match = hint.match(/([\d.]+)/);
                            if (match) setPaymentForm(p => ({ ...p, amount: match[1] }));
                          }} className="ml-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{hint}</button>
                        ) : null;
                      })()}
                    </label>
                    <input type="number" step="0.01" min="0" value={paymentForm.amount}
                      onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                      placeholder="Enter fee amount" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Payment Date</label>
                    <input type="date" value={paymentForm.payment_date}
                      onChange={e => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Payment Method</label>
                    <select value={paymentForm.payment_method}
                      onChange={e => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600">
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  {paymentForm.payment_method !== 'CASH' && (
                    <>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Transaction Reference *</label>
                        <input value={paymentForm.transaction_reference}
                          onChange={e => setPaymentForm(p => ({ ...p, transaction_reference: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                          placeholder="Required for non-cash" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Transfer Reference</label>
                        <input value={paymentForm.transfer_reference}
                          onChange={e => setPaymentForm(p => ({ ...p, transfer_reference: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                          placeholder="Optional" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Bank Name</label>
                        <input value={paymentForm.bank_name}
                          onChange={e => setPaymentForm(p => ({ ...p, bank_name: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                          placeholder="Optional" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Notes</label>
                    <textarea value={paymentForm.verification_notes}
                      onChange={e => setPaymentForm(p => ({ ...p, verification_notes: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 min-h-[72px] resize-none"
                      placeholder="Optional verification notes" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-slate-100 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setShowPayment(null)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="button" onClick={handleCashPayment} disabled={submitting || !paymentForm.amount}
                    className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Processing...' : 'Confirm & Approve'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {showReject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReject(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowReject(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><Ban className="w-4 h-4 text-red-600" /></div>
                    <h3 className="font-bold text-slate-900">Reject Enrollment</h3>
                  </div>
                  <button type="button" onClick={() => setShowReject(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                    An email with this reason will be sent to <strong>{displayValue(showReject.student_email)}</strong>.
                  </p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[90px] resize-none focus:outline-none focus:border-red-400"
                    placeholder="Explain why this enrollment is being rejected..." />
                </div>
                <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
                  <button type="button" onClick={() => setShowReject(null)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="button" onClick={handleReject} disabled={submitting || !rejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Reject Enrollment
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Move / Switch */}
      <AnimatePresence>
        {classAction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setClassAction(null)} className="fixed inset-0 z-40 bg-black/20" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setClassAction(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">
                    {classAction.mode === 'move' ? 'Move Class' : 'Switch Sub-Program'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {displayValue(classAction.enrollment.student_name)} · current: {displayValue(classAction.enrollment.class_name)}
                  </p>
                </div>
                <div className="p-5">
                  <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Target class</label>
                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-400">No classes available</p>
                  ) : (<>
                    <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm">
                      <option value="">Select class...</option>
                      {classes.filter(c => c.id !== classAction.enrollment.enrolled_class).map(c => {
                        const full = isClassFull(c);
                        return (
                          <option key={c.id} value={c.id} disabled={full} className={full ? 'text-slate-400' : ''}>
                            {classOptionLabel(c)}{full ? ' (FULL)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {targetClassId && (() => {
                      const c = classes.find(x => x.id === targetClassId);
                      return c && c.capacity && (classEnrollmentCounts.get(c.id) || 0) >= c.capacity ? (
                        <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> This class is full - backend may reject.
                        </p>
                      ) : null;
                    })()}
                  </>)}
                </div>
                <div className="flex justify-end gap-2 p-5 border-t">
                  <button type="button" onClick={() => setClassAction(null)} className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100">Cancel</button>
                  <button type="button" onClick={handleClassAction} disabled={classActionBusy || !targetClassId}
                    className="bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-50 flex items-center gap-1.5">
                    {classActionBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                    Confirm {classAction.mode === 'move' ? 'Move' : 'Switch'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirm?.kind === 'cancel'}
        title="Cancel enrollment?"
        description={`This will cancel enrollment for ${confirm?.enrollment.student_name || 'this student'}.`}
        confirmLabel="Cancel Enrollment"
        tone="danger"
        busy={submitting}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && handleCancel(confirm.enrollment.id)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'complete'}
        title="Mark enrollment completed?"
        description={`Mark ${confirm?.enrollment.student_name || 'this student'}'s enrollment as completed.`}
        confirmLabel="Mark Completed"
        tone="success"
        busy={submitting}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && handleComplete(confirm.enrollment.id)}
      />
    </>
  );

  if (selected) {
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {actionSuccess && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionSuccess}
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={() => setError(null)} className="ml-auto p-0.5"><X className="w-3 h-3" /></button>
          </div>
        )}
        {workspaceAndModals(false)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Enrollments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {allEnrollments.length} total · {statusCounts.PENDING_VERIFICATION} pending verification
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={exportCsv} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 shadow-sm">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button type="button" onClick={() => loadData()} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {classes.length > 0 && (
            <button type="button" onClick={() => setShowEnroll(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      {statusCounts.PENDING_VERIFICATION > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-800">
          <strong>Workflow:</strong> Online applications already include a payment — use Under Review / Reject.
          Walk-in enrollments without a payment use Approve & Record Payment to activate.
        </div>
      )}

      <AnimatePresence>
        {actionSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          <div className="flex-1" />
          <button type="button" onClick={() => loadData()} className="text-xs font-semibold underline shrink-0">Retry</button>
          <button type="button" onClick={() => setError(null)} className="p-0.5 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, class, or reference..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => {
          const count = statusCounts[tab.id as keyof typeof statusCounts] ?? 0;
          const active = statusTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setStatusTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                active ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}>
              {tab.label}
              {tab.id !== 'all' && count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-2.5 shadow-lg">
          <span className="text-xs font-semibold">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button type="button" onClick={() => setSelectedIds(new Set())} className="text-[11px] text-slate-300 hover:text-white">Clear</button>
          {[...selectedIds].some(id => {
            const row = allEnrollments.find(e => e.id === id);
            return row && canRecordApproval(row);
          }) && (
            <button type="button" onClick={() => setShowBatchApprove(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg">
              <DollarSign className="w-3 h-3" /> Approve (cash)
            </button>
          )}
          {[...selectedIds].some(id => {
            const row = allEnrollments.find(e => e.id === id);
            return row && canRejectEnrollment(row);
          }) && (
            <button type="button" onClick={() => setShowBatchReject(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg">
              <ThumbsDown className="w-3 h-3" /> Reject
            </button>
          )}
        </motion.div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-10 px-2 py-3 text-center">
                  <input type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === selectablePending.length && selectablePending.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Class</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Reference</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading enrollments...</span>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <BookOpen className="w-10 h-10" />
                    <p className="text-sm font-medium text-slate-500">No enrollments found</p>
                    {classes.length > 0 && (
                      <button type="button" onClick={() => setShowEnroll(true)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700">
                        <Plus className="w-3.5 h-3.5" /> Enroll Student
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : enrollments.map(e => (
                <tr key={e.id} className={`hover:bg-slate-50/50 ${selectedIds.has(e.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-2 py-3 text-center">
                    {e.status === 'PENDING_VERIFICATION' ? (
                      <input type="checkbox" checked={selectedIds.has(e.id)} onChange={() => toggleSelect(e.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    ) : <span className="inline-block w-3.5" />}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue shrink-0">
                        {(e.student_name || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{e.student_name || e.student_email || NA}</p>
                        <p className="text-[10px] text-slate-400 truncate">{displayValue(e.student_email)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    <p className="truncate max-w-[160px]">{displayValue(e.class_name)}</p>
                    <p className="text-[10px] text-slate-400">{displayValue(e.branch_name)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-brand-blue">{displayValue(e.pending_code || e.enrollment_number)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(e.enrolled_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <StatusBadge status={e.status} map={ENROLLMENT_STATUS_META} />
                      {e.verification_status && e.verification_status !== 'VERIFIED' && (
                        <StatusBadge status={e.verification_status} map={VERIFICATION_META} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons e={e} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500">Showing {enrollments.length} of {totalCount} filtered · {allEnrollments.length} loaded</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-600 px-2">{pageSafe} / {totalPages}</span>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch approve */}
      <AnimatePresence>
        {showBatchApprove && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBatchApprove(false)} className="fixed inset-0 z-40 bg-black/20" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowBatchApprove(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-slate-900">Batch Approve ({selectedIds.size})</h3>
                <p className="text-xs text-slate-500">Records cash payment only for walk-in enrollments without an existing payment.</p>
                <input type="number" step="0.01" min="0" value={batchAmount} onChange={e => setBatchAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm" placeholder="Amount (ETB) per enrollment" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowBatchApprove(false)} className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100">Cancel</button>
                  <button type="button" onClick={handleBatchApprove} disabled={submitting || !batchAmount}
                    className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-50">Approve selected</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Batch reject */}
      <AnimatePresence>
        {showBatchReject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBatchReject(false)} className="fixed inset-0 z-40 bg-black/20" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowBatchReject(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-slate-900">Batch Reject</h3>
                <textarea value={batchRejectReason} onChange={e => setBatchRejectReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm min-h-[80px]" placeholder="Rejection reason" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowBatchReject(false)} className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100">Cancel</button>
                  <button type="button" onClick={handleBatchReject} disabled={submitting || !batchRejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-50">Reject</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enroll Student */}
      <AnimatePresence>
        {showEnroll && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEnroll(false)} className="fixed inset-0 z-40 bg-black/20" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEnroll(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b">
                  <h3 className="font-bold text-slate-900">Enroll Student</h3>
                  <button type="button" onClick={() => setShowEnroll(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Student</label>
                    <div className="relative">
                      <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setForm(p => ({ ...p, student: '' })); }}
                        onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                        placeholder="Search by name or email..."
                        className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm" />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
                    </div>
                    {searchFocused && !form.student && (
                      <div className="mt-1.5 border rounded-xl bg-white max-h-48 overflow-y-auto shadow-sm">
                        {(studentSearch.trim().length === 0 ? allStudents : studentResults).map(s => {
                          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                          return (
                            <button key={s.id} type="button" onClick={() => {
                              setForm(p => ({ ...p, student: s.id }));
                              setStudentSearch(name);
                              setSearchFocused(false);
                            }} className="w-full text-left px-3 py-2.5 text-xs hover:bg-brand-blue/10 border-b border-slate-50 last:border-0">
                              <p className="font-medium text-slate-900 truncate">{name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{s.email}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Class</label>
                    <select value={form.enrolled_class} onChange={e => setForm(p => ({ ...p, enrolled_class: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm">
                      <option value="">Select class...</option>
                      {classes.map(c => {
                        const full = isClassFull(c);
                        return (
                          <option key={c.id} value={c.id} disabled={full} className={full ? 'text-slate-400' : ''}>
                            {classOptionLabel(c)}{full ? ' (FULL)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {form.enrolled_class && (() => {
                      const found = classes.find(c => c.id === form.enrolled_class);
                      return found && found.capacity && (classEnrollmentCounts.get(found.id) || 0) >= found.capacity ? (
                        <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> This class has reached capacity - enrollment will be rejected.
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Remarks</label>
                    <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm" placeholder="Optional" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-5 border-t">
                  <button type="button" onClick={() => setShowEnroll(false)} className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100">Cancel</button>
                  <button type="button" onClick={handleEnroll} disabled={submitting || !form.student || !form.enrolled_class}
                    className="bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-50 flex items-center gap-1.5">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Enroll
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {workspaceAndModals(true)}
    </div>
  );
}
