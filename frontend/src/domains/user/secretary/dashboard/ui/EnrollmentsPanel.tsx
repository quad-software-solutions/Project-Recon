import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, Loader2, AlertCircle, Eye, CheckCircle2, Download, DollarSign,
  ChevronLeft, ChevronRight, ArrowRightLeft, RefreshCw, ThumbsDown, Clock,
  User, BookOpen, Building2, CreditCard, Ban, CalendarDays, ShieldCheck, Filter,
} from 'lucide-react';
import type { Enrollment, StudentProfile, AcademicClass, SubProgram, UserProfile, EnrollmentPayment } from '@/shared/types';
import {
  fetchEnrollmentsPaginatedApi, fetchStudentsApi, fetchClassesApi, fetchSubProgramsApi, enrollStudentApi,
  cancelEnrollmentApi, completeEnrollmentApi, searchStudentsApi, recordPaymentApi,
  moveEnrollmentApi, switchSubProgramApi,
  setUnderReviewApi, rejectPaymentApi, approvePaymentApi, fetchPaymentsListApi, fetchStudentApi,
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

function hasExistingPayment(e: Enrollment): boolean {
  return Boolean(e.payment_status);
}

function canRecordApproval(e: Enrollment): boolean {
  return e.status === 'PENDING_VERIFICATION' && !hasExistingPayment(e) && !e.pending_code;
}

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

const STATUS_ICONS: Record<string, React.ElementType> = {
  ACTIVE: CheckCircle2, PENDING_VERIFICATION: Clock, COMPLETED: BookOpen, CANCELLED: X, REJECTED: Ban,
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  PENDING_VERIFICATION: 'text-amber-600 bg-amber-50 border-amber-200',
  COMPLETED: 'text-blue-600 bg-blue-50 border-blue-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
  REJECTED: 'text-rose-600 bg-rose-50 border-rose-200',
};

export default function EnrollmentsPanel({ currentUser, onNavigate }: { currentUser?: UserProfile; onNavigate?: (section: string) => void }) {
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
    if (selectedIds.size === enrollments.length && enrollments.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(enrollments.map(e => e.id)));
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
    const row = allEnrollments.find(e => e.id === id);
    if (row?.verification_status === 'UNDER_REVIEW') {
      flashSuccess('Already under review');
      return;
    }
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
      await approvePaymentApi(enrollment.id);
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
    const existing = allEnrollments.find(e =>
      e.student === form.student &&
      e.enrolled_class === form.enrolled_class &&
      !['CANCELLED', 'REJECTED'].includes(e.status)
    );
    if (existing) {
      setShowEnroll(false);
      setForm({ student: '', enrolled_class: '', remarks: '' });
      setStudentSearch('');
      setStudentResults([]);
      await openDetail(existing);
      flashSuccess('Existing enrollment opened');
      return;
    }
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

  const selectableEnrollments = useMemo(
    () => filtered.filter(e => canRecordApproval(e) || canRejectEnrollment(e)),
    [filtered],
  );

  const selectedClass = selected
    ? classes.find(c => c.id === selected.enrolled_class)
    : undefined;

  const existingFormEnrollment = form.student && form.enrolled_class
    ? allEnrollments.find(e =>
        e.student === form.student &&
        e.enrolled_class === form.enrolled_class &&
        !['CANCELLED', 'REJECTED'].includes(e.status)
      )
    : null;

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

  function ActionButtons({ e }: { e: Enrollment }) {
    const isPending = e.status === 'PENDING_VERIFICATION';
    const isActive = e.status === 'ACTIVE';
    const canApprove = isPending && canRecordApproval(e);
    const canReject = isPending && canRejectEnrollment(e);
    const canVerify = isPending && (Boolean(e.pending_code) || hasExistingPayment(e)) && e.verification_status !== 'VERIFIED';
    const canReview = isPending && e.verification_status !== 'UNDER_REVIEW' && !canApprove && !canReject && !canVerify;
    const btn = 'p-1.5 rounded-lg transition-all';
    const base = 'text-brand-muted';
    return (
      <div className="flex items-center justify-end gap-0.5" onClick={e => e.stopPropagation()}>
        <button onClick={() => openDetail(e)} className={`${btn} ${base} hover:text-brand-blue hover:bg-brand-blue/10`} title="Open workspace">
          <Eye className="w-4 h-4" />
        </button>
        {canApprove && (
          <button onClick={() => openApprove(e)} className={`${btn} ${base} hover:text-emerald-600 hover:bg-emerald-50`} title="Approve & record payment">
            <DollarSign className="w-4 h-4" />
          </button>
        )}
        {canVerify && (
          <button onClick={() => handleVerifyActivate(e)} className={`${btn} ${base} hover:text-indigo-600 hover:bg-indigo-50`} title="Verify & activate">
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}
        {canReject && (
          <button onClick={() => { setShowReject(e); setRejectReason(''); }} className={`${btn} ${base} hover:text-red-600 hover:bg-red-50`} title="Reject enrollment">
            <Ban className="w-4 h-4" />
          </button>
        )}
        {canReview && (
          <button onClick={() => handleUnderReview(e.id)} className={`${btn} ${base} hover:text-amber-600 hover:bg-amber-50`} title="Mark under review">
            <Clock className="w-4 h-4" />
          </button>
        )}
        {isActive && (
          <>
            <button onClick={() => setConfirm({ kind: 'complete', enrollment: e })} className={`${btn} ${base} hover:text-emerald-600 hover:bg-emerald-50`} title="Mark completed">
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => setConfirm({ kind: 'cancel', enrollment: e })} className={`${btn} ${base} hover:text-amber-600 hover:bg-amber-50`} title="Cancel enrollment">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  function ModalShell({ show, onClose, children }: { show: boolean; onClose: () => void; children: React.ReactNode }) {
    return (
      <AnimatePresence>
        {show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
              <div className="bg-white rounded-2xl shadow-premium-xl border border-brand-border w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  function ModalHeader({ icon: Icon, color, title, onClose }: { icon: React.ElementType; color: string; title: string; onClose: () => void }) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-brand-border/50 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-sm text-brand-ink">{title}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  function ModalFooter({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border/50 bg-brand-surface/30 sticky bottom-0 bg-white">
        {children}
      </div>
    );
  }

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

      {/* Approve & Record Payment */}
      <ModalShell show={!!showPayment} onClose={() => setShowPayment(null)}>
        <ModalHeader icon={DollarSign} color="bg-emerald-600" title="Approve & Record Payment" onClose={() => setShowPayment(null)} />
        <div className="p-4 space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-3.5 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Recording payment activates this enrollment and emails <strong>{showPayment?.student_email || 'the student'}</strong>.</span>
          </div>
          <div className="bg-brand-surface rounded-xl p-3.5 space-y-1.5 text-sm">
            {[
              ['Student', displayValue(showPayment?.student_name || showPayment?.student_email)],
              ['Class', displayValue(showPayment?.class_name)],
              ['Reference', showPayment?.pending_code || showPayment?.enrollment_number || NA],
            ].map(([l, v]) => (
              <div key={l as string} className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-brand-muted">{l as string}</span>
                <span className={`text-xs font-semibold text-brand-ink ${l === 'Reference' ? 'font-mono text-brand-blue' : ''}`}>{v as string}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">
              Amount (ETB)
              {showPayment && getFeeHint(showPayment.sub_program_name) && (
                <button onClick={() => {
                  const hint = getFeeHint(showPayment.sub_program_name);
                  const match = hint?.match(/([\d.]+)/);
                  if (match) setPaymentForm(p => ({ ...p, amount: match[1] }));
                }} className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors">
                  {getFeeHint(showPayment.sub_program_name)}
                </button>
              )}
            </label>
            <input type="number" step="0.01" min="0" value={paymentForm.amount}
              onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
              placeholder="Enter fee amount" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Payment Date</label>
            <input type="date" value={paymentForm.payment_date}
              onChange={e => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))}
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Payment Method</label>
            <select value={paymentForm.payment_method}
              onChange={e => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all">
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {paymentForm.payment_method !== 'CASH' && (
            <>
              <div>
                <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Transaction Reference *</label>
                <input value={paymentForm.transaction_reference}
                  onChange={e => setPaymentForm(p => ({ ...p, transaction_reference: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
                  placeholder="Required for non-cash" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Transfer Reference</label>
                <input value={paymentForm.transfer_reference}
                  onChange={e => setPaymentForm(p => ({ ...p, transfer_reference: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Bank Name</label>
                <input value={paymentForm.bank_name}
                  onChange={e => setPaymentForm(p => ({ ...p, bank_name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
                  placeholder="Optional" />
              </div>
            </>
          )}
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Notes</label>
            <textarea value={paymentForm.verification_notes}
              onChange={e => setPaymentForm(p => ({ ...p, verification_notes: e.target.value }))}
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all min-h-[72px] resize-none"
              placeholder="Optional verification notes" />
          </div>
        </div>
        <ModalFooter>
          <button onClick={() => setShowPayment(null)} className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCashPayment} disabled={submitting || !paymentForm.amount}
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-premium-sm">
            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
            {submitting ? 'Processing...' : 'Confirm & Approve'}
          </button>
        </ModalFooter>
      </ModalShell>

      {/* Reject modal */}
      <ModalShell show={!!showReject} onClose={() => setShowReject(null)}>
        <ModalHeader icon={Ban} color="bg-red-600" title="Reject Enrollment" onClose={() => setShowReject(null)} />
        <div className="p-4 space-y-4">
          <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-3.5 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>An email with this reason will be sent to <strong>{displayValue(showReject?.student_email)}</strong>.</span>
          </div>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all min-h-[100px] resize-none"
            placeholder="Explain why this enrollment is being rejected..." />
        </div>
        <ModalFooter>
          <button onClick={() => setShowReject(null)} className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleReject} disabled={submitting || !rejectReason.trim()}
            className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-premium-sm">
            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
            Reject Enrollment
          </button>
        </ModalFooter>
      </ModalShell>

      {/* Move / Switch */}
      <ModalShell show={!!classAction} onClose={() => setClassAction(null)}>
        <ModalHeader icon={ArrowRightLeft} color="bg-brand-blue" title={classAction?.mode === 'move' ? 'Move Class' : 'Switch Sub-Program'} onClose={() => setClassAction(null)} />
        <div className="p-4 space-y-4">
          <div className="bg-brand-surface rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
            <User className="w-4 h-4 text-brand-muted shrink-0" />
            <div>
              <p className="text-xs font-semibold text-brand-ink">{displayValue(classAction?.enrollment.student_name)}</p>
              <p className="text-[10px] text-brand-muted">Current: {displayValue(classAction?.enrollment.class_name)}</p>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Target class</label>
            {classes.length === 0 ? (
              <p className="text-xs text-brand-muted py-2">No classes available</p>
            ) : (
              <>
                <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all">
                  <option value="">Select class...</option>
                  {classes.filter(c => c.id !== classAction?.enrollment.enrolled_class).map(c => {
                    const full = isClassFull(c);
                    return (
                      <option key={c.id} value={c.id} disabled={full} className={full ? 'text-brand-muted' : ''}>
                        {classOptionLabel(c)}{full ? ' (FULL)' : ''}
                      </option>
                    );
                  })}
                </select>
                {targetClassId && (() => {
                  const c = classes.find(x => x.id === targetClassId);
                  return c && c.capacity && (classEnrollmentCounts.get(c.id) || 0) >= c.capacity ? (
                    <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> This class is full
                    </p>
                  ) : null;
                })()}
              </>
            )}
          </div>
        </div>
        <ModalFooter>
          <button onClick={() => setClassAction(null)} className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleClassAction} disabled={classActionBusy || !targetClassId}
            className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-all shadow-premium-sm">
            {classActionBusy && <Loader2 className="w-3 h-3 animate-spin" />}
            Confirm {classAction?.mode === 'move' ? 'Move' : 'Switch'}
          </button>
        </ModalFooter>
      </ModalShell>

      {/* Batch approve */}
      <ModalShell show={showBatchApprove} onClose={() => setShowBatchApprove(false)}>
        <ModalHeader icon={DollarSign} color="bg-emerald-600" title={`Batch Approve (${selectedIds.size})`} onClose={() => setShowBatchApprove(false)} />
        <div className="p-4 space-y-4">
          <p className="text-xs text-brand-muted">Records cash payment for walk-in enrollments without an existing payment.</p>
          <input type="number" step="0.01" min="0" value={batchAmount} onChange={e => setBatchAmount(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
            placeholder="Amount (ETB) per enrollment" />
        </div>
        <ModalFooter>
          <button onClick={() => setShowBatchApprove(false)} className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleBatchApprove} disabled={submitting || !batchAmount}
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-premium-sm">Approve selected</button>
        </ModalFooter>
      </ModalShell>

      {/* Batch reject */}
      <ModalShell show={showBatchReject} onClose={() => setShowBatchReject(false)}>
        <ModalHeader icon={ThumbsDown} color="bg-red-600" title="Batch Reject" onClose={() => setShowBatchReject(false)} />
        <div className="p-4 space-y-4">
          <textarea value={batchRejectReason} onChange={e => setBatchRejectReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all min-h-[90px] resize-none"
            placeholder="Rejection reason" />
        </div>
        <ModalFooter>
          <button onClick={() => setShowBatchReject(false)} className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleBatchReject} disabled={submitting || !batchRejectReason.trim()}
            className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-premium-sm">Reject</button>
        </ModalFooter>
      </ModalShell>

      {/* Enroll Student */}
      <ModalShell show={showEnroll} onClose={() => setShowEnroll(false)}>
        <ModalHeader icon={Plus} color="bg-brand-blue" title="Enroll Student" onClose={() => setShowEnroll(false)} />
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Student</label>
            <div className="relative">
              <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setForm(p => ({ ...p, student: '' })); }}
                onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all" />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-brand-muted" />}
            </div>
            {searchFocused && !form.student && (
              <div className="mt-1.5 border border-brand-border rounded-xl bg-white max-h-48 overflow-y-auto shadow-premium-sm">
                {(studentSearch.trim().length === 0 ? allStudents : studentResults).map(s => {
                  const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                  return (
                    <button key={s.id} type="button" onClick={() => {
                      setForm(p => ({ ...p, student: s.id }));
                      setStudentSearch(name);
                      setSearchFocused(false);
                    }} className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-brand-blue/5 border-b border-brand-border/30 last:border-0 transition-colors">
                      <p className="font-semibold text-brand-ink truncate">{name}</p>
                      <p className="text-[10px] text-brand-muted truncate">{s.email}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Class</label>
            <select value={form.enrolled_class} onChange={e => setForm(p => ({ ...p, enrolled_class: e.target.value }))}
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all">
              <option value="">Select class...</option>
              {classes.map(c => {
                const full = isClassFull(c);
                return (
                  <option key={c.id} value={c.id} disabled={full} className={full ? 'text-brand-muted' : ''}>
                    {classOptionLabel(c)}{full ? ' (FULL)' : ''}
                  </option>
                );
              })}
            </select>
            {form.enrolled_class && (() => {
              const found = classes.find(c => c.id === form.enrolled_class);
              return found && found.capacity && (classEnrollmentCounts.get(found.id) || 0) >= found.capacity ? (
                <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Class at capacity — enrollment will be rejected.
                </p>
              ) : null;
            })()}
          </div>
          <div>
            <label className="text-[11px] font-bold text-brand-muted-dark mb-1.5 block">Remarks</label>
            <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
              className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
              placeholder="Optional" />
          </div>
          {existingFormEnrollment && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>This student already has an enrollment for this class. Continue to open the existing record.</span>
            </div>
          )}
        </div>
        <ModalFooter>
          <button onClick={() => setShowEnroll(false)} className="px-4 py-2 text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEnroll} disabled={submitting || !form.student || !form.enrolled_class}
            className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-all shadow-premium-sm">
            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
            {existingFormEnrollment ? 'Open Existing' : 'Enroll'}
          </button>
        </ModalFooter>
      </ModalShell>

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
              className="flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {actionSuccess}
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
          </div>
        )}
        {workspaceAndModals(false)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center shadow-premium-sm shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-ink tracking-tight">Enrollments</h2>
            <p className="text-xs text-brand-muted mt-0.5">
              {allEnrollments.length} total · <span className="text-amber-600 font-semibold">{statusCounts.PENDING_VERIFICATION}</span> pending verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted bg-white border border-brand-border px-3 py-2 rounded-lg hover:bg-brand-surface hover:border-brand-muted/30 transition-all">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => loadData()} disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted bg-white border border-brand-border px-3 py-2 rounded-lg hover:bg-brand-surface hover:border-brand-muted/30 transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {classes.length > 0 && (
            <button onClick={() => setShowEnroll(true)} className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-blue-dark transition-all shadow-premium-sm">
              <Plus className="w-3.5 h-3.5" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active', value: statusCounts.ACTIVE, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: statusCounts.PENDING_VERIFICATION, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: statusCounts.COMPLETED, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Inactive', value: statusCounts.CANCELLED + statusCounts.REJECTED, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-brand-border rounded-xl p-4 hover:border-brand-blue/20 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => setStatusTab(s.label.toLowerCase() as StatusTab)}
          >
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2.5`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-brand-ink font-display tracking-tight">{s.value}</p>
            <p className="text-xs text-brand-muted mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Workflow hint */}
      {statusCounts.PENDING_VERIFICATION > 0 && (
        <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-r from-brand-blue/5 to-transparent px-4 py-3 text-xs text-brand-blue flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold">Workflow:</span> Online applications already include a payment — use <span className="font-semibold">Under Review / Reject</span>.
            Walk-in enrollments without a payment use <span className="font-semibold">Approve & Record Payment</span> to activate.
          </div>
        </div>
      )}

      {/* Alerts */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-700 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => loadData()} className="text-xs font-semibold underline shrink-0 hover:no-underline">Retry</button>
          <button onClick={() => setError(null)} className="p-0.5 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, class, or reference..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-ink placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {tabs.map(tab => {
            const count = statusCounts[tab.id as keyof typeof statusCounts] ?? 0;
            const active = statusTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setStatusTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  active ? 'bg-brand-blue text-white shadow-premium-sm' : 'bg-white text-brand-muted border border-brand-border hover:text-brand-ink hover:bg-brand-surface/60'
                }`}>
                {tab.id !== 'all' && STATUS_ICONS[tab.id] && (() => { const Icon = STATUS_ICONS[tab.id]; return <Icon className="w-3.5 h-3.5" />; })()}
                {tab.label}
                {tab.id !== 'all' && count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-brand-surface text-brand-muted'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 bg-brand-ink text-white rounded-xl px-4 py-3 shadow-premium-md">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          </div>
          <div className="flex-1" />
          <button onClick={() => setSelectedIds(new Set())} className="text-[11px] text-brand-muted hover:text-white transition-colors font-medium">Clear</button>
          {[...selectedIds].some(id => {
            const row = allEnrollments.find(e => e.id === id);
            return row && canRecordApproval(row);
          }) && (
            <button onClick={() => setShowBatchApprove(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-all">
              <DollarSign className="w-3 h-3" /> Approve
            </button>
          )}
          {[...selectedIds].some(id => {
            const row = allEnrollments.find(e => e.id === id);
            return row && canRejectEnrollment(row);
          }) && (
            <button onClick={() => setShowBatchReject(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-all">
              <ThumbsDown className="w-3 h-3" /> Reject
            </button>
          )}
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-premium-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-brand-surface/80 border-b border-brand-border/70">
                <th className="w-10 px-2 py-3.5 text-center">
                  <input type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === enrollments.length && enrollments.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue focus:ring-brand-blue/30 cursor-pointer" />
                </th>
                <th className="text-left px-3 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">Student</th>
                <th className="text-left px-3 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">Class / Branch</th>
                <th className="text-left px-3 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider hidden sm:table-cell">Reference</th>
                <th className="text-left px-3 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-center px-3 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">Status</th>
                <th className="text-right px-3 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-20 text-center text-brand-muted">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading enrollments...</span>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-brand-muted">
                    <div className="w-12 h-12 rounded-xl bg-brand-surface flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-brand-border" />
                    </div>
                    <p className="text-sm font-medium text-brand-muted">No enrollments found</p>
                    {classes.length > 0 && (
                      <button onClick={() => setShowEnroll(true)}
                        className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-blue-dark transition-all shadow-premium-sm">
                        <Plus className="w-3.5 h-3.5" /> Enroll Student
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : enrollments.map(e => (
                <tr key={e.id} className={`hover:bg-brand-surface/40 transition-colors group cursor-pointer ${selectedIds.has(e.id) ? 'bg-brand-blue/5' : ''}`} onClick={() => openDetail(e)}>
                  <td className="px-2 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(e.id)} onChange={() => toggleSelect(e.id)}
                      className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue focus:ring-brand-blue/30 cursor-pointer" />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button onClick={ev => { ev.stopPropagation(); if (onNavigate) { try { sessionStorage.setItem('selectedStudentId', e.student || ''); } catch {} onNavigate('students'); } }}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm hover:opacity-90 transition-opacity cursor-pointer" title="View student profile">
                        {(e.student_name || '?').charAt(0).toUpperCase()}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-ink truncate">{e.student_name || e.student_email || NA}</p>
                        <p className="text-[10px] text-brand-muted truncate">{displayValue(e.student_email)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="min-w-0 max-w-[180px]">
                      <p className="text-xs font-semibold text-brand-ink truncate">{displayValue(e.class_name)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-brand-muted shrink-0" />
                        <span className="text-[10px] text-brand-muted truncate">{displayValue(e.branch_name)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className="text-xs font-mono text-brand-blue font-medium bg-brand-blue/5 px-2 py-0.5 rounded-md border border-brand-blue/10">
                      {displayValue(e.pending_code || e.enrollment_number)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                      <CalendarDays className="w-3 h-3 shrink-0" />
                      {formatDate(e.enrolled_at)}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-col items-center gap-1">
                      <StatusBadge status={e.status} map={ENROLLMENT_STATUS_META} dot />
                      {e.status === 'PENDING_VERIFICATION' && e.verification_status && e.verification_status !== 'VERIFIED' && (
                        <StatusBadge status={e.verification_status} map={VERIFICATION_META} />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                    <ActionButtons e={e} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border/50 bg-brand-surface/40 gap-2 flex-wrap">
          <span className="text-[10px] text-brand-muted">
            Showing <span className="font-semibold text-brand-ink">{enrollments.length}</span> of {totalCount} filtered · {allEnrollments.length} total
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1}
              className="p-1.5 rounded-lg text-brand-muted hover:bg-white disabled:opacity-30 transition-all border border-transparent hover:border-brand-border/50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-semibold text-brand-ink px-3 py-1 bg-white border border-brand-border/50 rounded-lg min-w-[60px] text-center tabular-nums">
              {pageSafe} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}
              className="p-1.5 rounded-lg text-brand-muted hover:bg-white disabled:opacity-30 transition-all border border-transparent hover:border-brand-border/50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {workspaceAndModals(true)}
    </div>
  );
}
