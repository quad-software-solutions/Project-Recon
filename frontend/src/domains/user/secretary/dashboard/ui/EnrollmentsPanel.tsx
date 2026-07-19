import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, Loader2, AlertCircle, Eye, CheckCircle2, Download, DollarSign,
  ChevronLeft, ChevronRight, ArrowRightLeft, RefreshCw, ThumbsDown, Clock,
  User, Mail, BookOpen, Building2, Hash, CalendarDays, CreditCard, Ban, CheckSquare,
} from 'lucide-react';
import { Enrollment, StudentProfile, AcademicClass, SubProgram, UserProfile } from '@/shared/types';
import {
  fetchEnrollmentsPaginatedApi, fetchStudentsApi, fetchClassesApi, fetchSubProgramsApi, enrollStudentApi,
  cancelEnrollmentApi, completeEnrollmentApi, searchStudentsApi, recordPaymentApi,
  moveEnrollmentApi, switchSubProgramApi,
  setUnderReviewApi, rejectPaymentApi,
} from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import { formatApiError } from '@/shared/utils/formatApiError';
import { isSuperAdmin } from '@/shared/auth/permissions';

const PAGE_SIZE = 20;

/** Online enrollments already create a payment row — staff cannot POST /payments/ again. */
function hasExistingPayment(e: Enrollment): boolean {
  return Boolean(e.payment_status);
}

function canRecordApproval(e: Enrollment): boolean {
  return e.status === 'PENDING_VERIFICATION' && !hasExistingPayment(e);
}

type StatusTab = 'all' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

const statusMeta: Record<string, { color: string; dot: string; label: string }> = {
  ACTIVE:              { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  PENDING_VERIFICATION: { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
  COMPLETED:           { color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'Completed' },
  CANCELLED:           { color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Cancelled' },
  REJECTED:            { color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
};

const verificationMeta: Record<string, { color: string; label: string }> = {
  SUBMITTED:    { color: 'text-amber-600 bg-amber-50', label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-blue-600 bg-blue-50', label: 'Under Review' },
  VERIFIED:     { color: 'text-emerald-600 bg-emerald-50', label: 'Verified' },
  REJECTED:     { color: 'text-red-600 bg-red-50', label: 'Rejected' },
};

const tabs: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'PENDING_VERIFICATION', label: 'Pending' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function EnrollmentsPanel({ currentUser }: { currentUser?: UserProfile }) {
  const isSuper = currentUser ? isSuperAdmin(currentUser) : false;
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showPayment, setShowPayment] = useState<Enrollment | null>(null);
  const [showReject, setShowReject] = useState<Enrollment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'CASH',
    transaction_reference: '',
    transfer_reference: '',
    bank_name: '',
  });
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
  const [classesNote, setClassesNote] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p, 50), 40),
      isSuper ? fetchClassesApi().catch(() => [] as AcademicClass[]) : Promise.resolve([] as AcademicClass[]),
      fetchSubProgramsApi().catch(() => [] as SubProgram[]),
    ]).then(([enr, cls, sp]) => {
      const rows = enr.status === 'fulfilled' && Array.isArray(enr.value) ? enr.value : [];
      if (enr.status === 'rejected') {
        setError(formatApiError(enr.reason));
        setAllEnrollments([]);
      } else {
        setAllEnrollments(rows);
      }

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
            class_type: 'GROUP',
            is_active: true,
          } as AcademicClass);
        }
        classRows = [...seen.values()];
        if (classRows.length > 0) {
          setClassesNote('Showing classes from existing enrollments. Full class catalog requires Branch Manager access.');
        } else {
          setClassesNote('Class catalog is not available for Secretary. Ask a Branch Manager to create classes or enroll students into new classes.');
        }
      } else {
        setClassesNote(null);
      }
      setClasses(classRows);

      if (sp.status === 'fulfilled') {
        setSubPrograms(Array.isArray(sp.value) ? sp.value : []);
      }
    }).finally(() => setLoading(false));
  }, []);

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

  const flashSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const patchEnrollment = (id: string, patch: Partial<Enrollment>) => {
    setAllEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelEnrollmentApi(id);
      patchEnrollment(id, { status: 'CANCELLED' });
      flashSuccess('Enrollment cancelled');
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeEnrollmentApi(id);
      patchEnrollment(id, { status: 'COMPLETED' });
      flashSuccess('Enrollment marked completed');
    } catch (e) {
      setError(formatApiError(e));
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
      setShowReject(null);
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
    if (selectedIds.size === selectablePending.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectablePending.map(e => e.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

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
  };

  const handleBatchReject = async () => {
    const ids = [...selectedIds];
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
    try {
      await setUnderReviewApi(id);
      patchEnrollment(id, { verification_status: 'UNDER_REVIEW' });
      flashSuccess('Marked as under review');
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const handleCashPayment = async () => {
    if (!showPayment || !paymentForm.amount) return;
    if (hasExistingPayment(showPayment)) {
      setError('This enrollment already has a submitted payment. Use Under Review or Reject — recording a second payment is not allowed by the API.');
      setShowPayment(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await recordPaymentApi({
        enrollment: showPayment.id,
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date || undefined,
        transaction_reference: paymentForm.payment_method === 'CASH' ? undefined : paymentForm.transaction_reference || undefined,
        transfer_reference: paymentForm.payment_method === 'CASH' ? undefined : paymentForm.transfer_reference || undefined,
        bank_name: paymentForm.payment_method === 'CASH' ? undefined : paymentForm.bank_name || undefined,
      });
      patchEnrollment(showPayment.id, {
        status: 'ACTIVE',
        payment_status: 'PAID',
        payment_method: paymentForm.payment_method as Enrollment['payment_method'],
        verification_status: 'VERIFIED',
      });
      setShowPayment(null);
      flashSuccess('Enrollment approved — payment recorded');
    } catch (e) {
      setError(formatApiError(e));
      setShowPayment(null);
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
      } else {
        await switchSubProgramApi(classAction.enrollment.id, { target_class: targetClassId });
      }
      setClassAction(null);
      setTargetClassId('');
      loadData();
      flashSuccess(`Enrollment ${classAction.mode === 'move' ? 'moved' : 'switched'}`);
    } catch (e) {
      setError(formatApiError(e));
      setClassAction(null);
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
      setForm(prev => ({ ...prev, remarks: '', student: '' }));
      setStudentSearch('');
      setStudentResults([]);
      setShowEnroll(false);
      flashSuccess('Student enrolled successfully — record cash payment to activate');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const statusCounts = useMemo(() => ({
    ACTIVE: allEnrollments.filter(e => e.status === 'ACTIVE').length,
    PENDING_VERIFICATION: allEnrollments.filter(e => e.status === 'PENDING_VERIFICATION').length,
    COMPLETED: allEnrollments.filter(e => e.status === 'COMPLETED').length,
    CANCELLED: allEnrollments.filter(e => e.status === 'CANCELLED').length,
    REJECTED: allEnrollments.filter(e => e.status === 'REJECTED').length,
  }), [allEnrollments]);

  const feeMap = useMemo(() => {
    const map = new Map<string, { group_fee: number; individual_fee?: number | null }>();
    for (const sp of subPrograms) {
      if (sp.name) map.set(sp.name.toLowerCase(), { group_fee: sp.group_fee, individual_fee: sp.individual_fee });
    }
    return map;
  }, [subPrograms]);

  const getFeeHint = (subProgramName?: string): string | null => {
    if (!subProgramName) return null;
    const key = subProgramName.toLowerCase();
    const fee = feeMap.get(key);
    if (!fee) return null;
    const amounts = [fee.group_fee, fee.individual_fee].filter(Boolean);
    return amounts.length ? `Suggested: ${amounts[0]} Birr` : null;
  };

  const filtered = useMemo(() =>
    allEnrollments.filter(e => {
      if (statusTab !== 'all' && e.status !== statusTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${e.student_name || ''} ${e.class_name || ''} ${e.sub_program_name || ''} ${e.pending_code || ''} ${e.student_email || ''} ${e.branch_name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }),
    [allEnrollments, statusTab, searchQuery]
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

  const pendingFiltered = useMemo(() =>
    filtered.filter(e => e.status === 'PENDING_VERIFICATION'),
  [filtered]);

  const selectablePending = useMemo(
    () => pendingFiltered.filter(e => canRecordApproval(e) || hasExistingPayment(e)),
    [pendingFiltered],
  );

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

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Enrollments</h2>
          <p className="text-xs text-slate-500 mt-0.5">{allEnrollments.length} total · {statusCounts.PENDING_VERIFICATION} pending verification</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => loadData()} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {classes.length > 0 && (
            <button onClick={() => setShowEnroll(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      {classesNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          {classesNote}
        </div>
      )}

      {statusCounts.PENDING_VERIFICATION > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-800">
          <strong>Pending tip:</strong> Online applications already include a payment slip — use Under Review / Reject.
          Walk-in or staff enrollments without a payment use Approve to record cash (or bank) and activate.
        </div>
      )}

      {/* ── Flash messages ── */}
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
          <button onClick={() => loadData()} className="text-xs font-semibold underline hover:no-underline shrink-0">Retry</button>
          <button onClick={() => setError(null)} className="p-0.5 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ── Search & Filter tabs ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, class, or reference..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 shadow-sm" />
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => {
          const count = statusCounts[tab.id as keyof typeof statusCounts] ?? 0;
          const active = statusTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setStatusTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}>
              {tab.label}
              {(tab.id !== 'all' && count > 0) && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Bulk action bar ── */}
      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-slate-900 text-white rounded-xl px-4 py-2.5 shadow-lg">
          <span className="text-xs font-semibold">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button onClick={clearSelection} className="text-[11px] text-slate-300 hover:text-white transition-colors">Clear</button>
          <div className="w-px h-4 bg-slate-700" />
          {[...selectedIds].some(id => {
            const row = allEnrollments.find(e => e.id === id);
            return row && canRecordApproval(row);
          }) && (
            <button onClick={() => setShowBatchApprove(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors">
              <DollarSign className="w-3 h-3" /> Approve (cash)
            </button>
          )}
          <button onClick={() => setShowBatchReject(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors">
            <ThumbsDown className="w-3 h-3" /> Reject All
          </button>
        </motion.div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-10 px-2 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === selectablePending.length && selectablePending.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Class</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Reference</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase hidden lg:table-cell">Date</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
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
                    <div>
                      <p className="text-sm font-medium text-slate-500">No enrollments found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter{classes.length > 0 ? ', or enroll a new student' : ''}</p>
                    </div>
                    {classes.length > 0 && (
                      <button onClick={() => setShowEnroll(true)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Enroll Student
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : enrollments.map(e => (
                <tr key={e.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(e.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-2 py-3 text-center">
                    {e.status === 'PENDING_VERIFICATION' ? (
                      <input type="checkbox" checked={selectedIds.has(e.id)} onChange={() => toggleSelect(e.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    ) : (
                      <span className="inline-block w-3.5" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue shrink-0">
                        {(e.student_name || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{e.student_name || e.student_email || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{e.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 hidden sm:table-cell">
                    <p className="truncate max-w-[160px]">{e.class_name || '—'}</p>
                    <p className="text-[10px] text-slate-400">{e.branch_name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-brand-blue hidden md:table-cell">{e.pending_code || e.enrollment_number || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{e.enrolled_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusMeta[e.status]?.color || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                        {statusMeta[e.status]?.label || e.status.replace('_', ' ')}
                      </span>
                      {e.verification_status && e.verification_status !== 'VERIFIED' && (
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${verificationMeta[e.verification_status]?.color || ''}`}>
                          {verificationMeta[e.verification_status]?.label || e.verification_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors" title="View details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {e.status === 'PENDING_VERIFICATION' && (
                        <>
                          {e.verification_status === 'SUBMITTED' && (
                            <button onClick={() => handleUnderReview(e.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Mark under review">
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canRecordApproval(e) ? (
                            <button onClick={() => {
                              setPaymentForm({
                                amount: '',
                                payment_date: new Date().toISOString().slice(0, 10),
                                payment_method: 'CASH',
                                transaction_reference: '',
                                transfer_reference: '',
                                bank_name: '',
                              });
                              setShowPayment(e);
                            }}
                              className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Approve & record payment">
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded" title="Payment already submitted online">Paid slip</span>
                          )}
                          <button onClick={() => { setShowReject(e); setRejectReason(''); }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Reject">
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {e.status === 'ACTIVE' && (
                        <>
                          <button onClick={() => openClassAction(e, 'move')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Move class">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openClassAction(e, 'switch')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Switch sub-program">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleComplete(e.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors" title="Mark completed">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {(e.status === 'ACTIVE' || e.status === 'PENDING_VERIFICATION') && (
                        <button onClick={() => handleCancel(e.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Cancel">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[11px] text-slate-500">Showing {enrollments.length} of {totalCount} filtered · {allEnrollments.length} loaded</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={pageSafe <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-600 px-2">{pageSafe} / {totalPages}</span>
            <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} disabled={pageSafe >= totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Detail slide-over ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
                <h3 className="font-bold text-slate-900">Enrollment Details</h3>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Hero: status + reference */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${statusMeta[selected.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {(selected.student_name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{selected.student_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{selected.student_email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusMeta[selected.status]?.color || ''}`}>
                    {statusMeta[selected.status]?.label || selected.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Class info cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <BookOpen className="w-3 h-3" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold">Class</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{selected.class_name || '—'}</p>
                    {selected.class_type && (
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selected.class_type === 'GROUP' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'}`}>
                        {selected.class_type}
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Building2 className="w-3 h-3" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{selected.branch_name || '—'}</p>
                  </div>
                </div>

                {/* Program card (full width) */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User className="w-3 h-3" />
                    <span className="text-[9px] uppercase tracking-wider font-semibold">Program</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{selected.program_name || selected.sub_program_name || '—'}</p>
                  {(() => {
                    const hint = getFeeHint(selected.sub_program_name);
                    return hint ? <p className="text-[10px] text-slate-500">{hint.replace('Suggested: ', '')}</p> : null;
                  })()}
                </div>

                {/* Reference section */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Reference</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Number</span>
                    <span className="text-xs font-mono font-bold text-brand-blue">{selected.pending_code || selected.enrollment_number || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Enrolled</span>
                    <span className="text-xs font-semibold text-slate-900">{selected.enrolled_at?.slice(0, 10) || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Created</span>
                    <span className="text-xs font-semibold text-slate-900">{selected.created_at?.slice(0, 10) || '—'}</span>
                  </div>
                </div>

                {/* Transfer info */}
                {selected.transferred_from && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold">Transferred From</span>
                    </div>
                    <p className="text-xs font-semibold text-amber-800">{selected.transferred_from}</p>
                  </div>
                )}

                {/* Status badges */}
                <div className="space-y-2.5">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Status</span>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusMeta[selected.status]?.color || 'border-slate-200 text-slate-600 bg-slate-50'}`}>
                      {statusMeta[selected.status]?.label || selected.status?.replace('_', ' ')}
                    </span>
                    {selected.verification_status && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${verificationMeta[selected.verification_status]?.color || 'bg-slate-100 text-slate-600'}`}>
                        {verificationMeta[selected.verification_status]?.label || selected.verification_status?.replace('_', ' ')}
                      </span>
                    )}
                    {selected.payment_status && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CreditCard className="w-2.5 h-2.5" />
                        {String(selected.payment_status).replace(/_/g, ' ')}
                        {selected.payment_method && <>({String(selected.payment_method).replace(/_/g, ' ')})</>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rejection */}
                {selected.rejection_reason && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-red-600">
                      <Ban className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold">Rejection Reason</span>
                    </div>
                    <p className="text-xs text-red-700">{selected.rejection_reason}</p>
                  </div>
                )}

                {/* Remarks */}
                {selected.remarks && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider font-semibold">Remarks</span>
                    </div>
                    <p className="text-xs text-slate-700">{selected.remarks}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Approve / Payment modal ── */}
      <AnimatePresence>
        {showPayment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPayment(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPayment(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                    <h3 className="font-bold text-slate-900">Verify & Approve</h3>
                  </div>
                  <button onClick={() => setShowPayment(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Recording payment will activate this enrollment. A confirmation email will be sent to <strong>{showPayment.student_email}</strong>.</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                    <p><span className="text-slate-500">Student:</span> <span className="font-medium text-slate-900">{showPayment.student_name || showPayment.student_email}</span></p>
                    <p><span className="text-slate-500">Class:</span> <span className="font-medium text-slate-900">{showPayment.class_name || '—'}</span></p>
                    <p><span className="text-slate-500">Reference:</span> <span className="font-mono text-brand-blue font-medium">{showPayment.pending_code || showPayment.enrollment_number || '—'}</span></p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                      Amount (Birr)
                      {(() => {
                        const hint = getFeeHint(showPayment.sub_program_name);
                        return hint ? (
                          <button type="button" onClick={() => {
                            const match = hint.match(/([\d.]+)/);
                            if (match) setPaymentForm(p => ({ ...p, amount: match[1] }));
                          }} className="ml-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors">
                            {hint}
                          </button>
                        ) : null;
                      })()}
                    </label>
                    <input type="number" step="0.01" min="0" value={paymentForm.amount}
                      onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                      placeholder="Enter fee amount" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Payment Date</label>
                    <input type="date" value={paymentForm.payment_date}
                      onChange={e => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Method</label>
                    <select value={paymentForm.payment_method}
                      onChange={e => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank transfer</option>
                      <option value="MOBILE_MONEY">Mobile money</option>
                    </select>
                  </div>
                  {paymentForm.payment_method !== 'CASH' && (
                    <>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Transaction reference</label>
                        <input value={paymentForm.transaction_reference}
                          onChange={e => setPaymentForm(p => ({ ...p, transaction_reference: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                          placeholder="Optional bank/TXN ref" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Transfer reference</label>
                        <input value={paymentForm.transfer_reference}
                          onChange={e => setPaymentForm(p => ({ ...p, transfer_reference: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                          placeholder="Optional transfer ref" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Bank name</label>
                        <input value={paymentForm.bank_name}
                          onChange={e => setPaymentForm(p => ({ ...p, bank_name: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                          placeholder="Optional" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setShowPayment(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleCashPayment} disabled={submitting || !paymentForm.amount}
                    className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Processing...' : 'Confirm & Approve'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Reject modal ── */}
      <AnimatePresence>
        {showReject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReject(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowReject(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><Ban className="w-4 h-4 text-red-600" /></div>
                    <h3 className="font-bold text-slate-900">Reject Enrollment</h3>
                  </div>
                  <button onClick={() => setShowReject(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>An email with this rejection reason will be sent to <strong>{showReject.student_email}</strong>.</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                    <p><span className="text-slate-500">Student:</span> <span className="font-medium text-slate-900">{showReject.student_name || showReject.student_email}</span></p>
                    <p><span className="text-slate-500">Class:</span> <span className="font-medium text-slate-900">{showReject.class_name || '—'}</span></p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Reason for rejection</label>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-600/10 min-h-[90px] resize-none"
                      placeholder="Explain why this enrollment is being rejected..." />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setShowReject(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleReject} disabled={submitting || !rejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Rejecting...' : 'Reject Enrollment'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Batch Approve modal ── */}
      <AnimatePresence>
        {showBatchApprove && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBatchApprove(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowBatchApprove(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                    <h3 className="font-bold text-slate-900">Batch Approve ({selectedIds.size})</h3>
                  </div>
                  <button onClick={() => setShowBatchApprove(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Records cash payment and activates enrollments that do not already have a payment slip. Online applications with a submitted payment are skipped.</span>
                  </div>
                  {(() => {
                    const approveCount = [...selectedIds].filter(id => {
                      const row = allEnrollments.find(e => e.id === id);
                      return row && canRecordApproval(row);
                    }).length;
                    return (
                      <p className="text-xs text-slate-500">
                        Will approve <strong>{approveCount}</strong> of {selectedIds.size} selected (same cash amount each).
                      </p>
                    );
                  })()}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Amount (Birr) per enrollment</label>
                    <input type="number" step="0.01" min="0" value={batchAmount}
                      onChange={e => setBatchAmount(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                      placeholder="e.g. 5000" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setShowBatchApprove(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleBatchApprove} disabled={submitting || !batchAmount}
                    className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Processing...' : 'Approve selected'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Batch Reject modal ── */}
      <AnimatePresence>
        {showBatchReject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBatchReject(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowBatchReject(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><Ban className="w-4 h-4 text-red-600" /></div>
                    <h3 className="font-bold text-slate-900">Batch Reject ({selectedIds.size})</h3>
                  </div>
                  <button onClick={() => setShowBatchReject(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Each student will receive an email with this rejection reason.</span>
                  </div>
                  <p className="text-xs text-slate-500">This will reject <strong>{selectedIds.size}</strong> enrollment{selectedIds.size > 1 ? 's' : ''} with the same reason.</p>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Rejection reason</label>
                    <textarea value={batchRejectReason} onChange={e => setBatchRejectReason(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-600/10 min-h-[90px] resize-none"
                      placeholder="Explain why these enrollments are being rejected..." />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setShowBatchReject(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleBatchReject} disabled={submitting || !batchRejectReason.trim()}
                    className="bg-red-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Rejecting...' : `Reject ${selectedIds.size} enrollment${selectedIds.size > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Move / Switch class modal ── */}
      <AnimatePresence>
        {classAction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setClassAction(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setClassAction(null)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {classAction.mode === 'move' ? <ArrowRightLeft className="w-4 h-4 text-blue-600" /> : <RefreshCw className="w-4 h-4 text-violet-600" />}
                    </div>
                    <h3 className="font-bold text-slate-900">
                      {classAction.mode === 'move' ? 'Move to class' : 'Switch sub-program'}
                    </h3>
                  </div>
                  <button onClick={() => setClassAction(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                    <p><span className="text-slate-500">Student:</span> <span className="font-medium text-slate-900">{classAction.enrollment.student_name || classAction.enrollment.student_email}</span></p>
                    <p><span className="text-slate-500">Current:</span> <span className="font-medium text-slate-900">{classAction.enrollment.class_name || '—'}</span></p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Target class</label>
                    {classes.length === 0 ? (
                      <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400">No classes available</div>
                    ) : (
                      <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                        <option value="">Select class...</option>
                        {classes
                          .filter(c => c.id !== (classAction.enrollment as { enrolled_class?: string }).enrolled_class)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name} · {c.sub_program_name || 'Program'} · {c.branch_name || 'Branch'}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setClassAction(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleClassAction} disabled={classActionBusy || !targetClassId}
                    className="bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {classActionBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                    {classActionBusy ? 'Saving...' : classAction.mode === 'move' ? 'Move' : 'Switch'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Enroll Student modal ── */}
      <AnimatePresence>
        {showEnroll && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEnroll(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowEnroll(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Plus className="w-4 h-4 text-blue-600" /></div>
                    <h3 className="font-bold text-slate-900">Enroll Student</h3>
                  </div>
                  <button onClick={() => setShowEnroll(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Student</label>
                    <div className="relative">
                      <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setForm(p => ({ ...p, student: '' })); }}
                        onFocus={() => { setSearchFocused(true); }} onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                        placeholder="Search by name or email..."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
                    </div>
                    {searchFocused && !form.student && (
                      <div className="mt-1.5 border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto shadow-sm">
                        {(studentSearch.trim().length === 0 ? allStudents : studentResults).map(s => {
                          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                          return (
                            <button key={s.id} type="button" onClick={() => {
                              setForm(p => ({ ...p, student: s.id }));
                              setStudentSearch(name);
                              setSearchFocused(false);
                            }} className="w-full text-left px-3 py-2.5 text-xs hover:bg-brand-blue/10 transition-colors flex items-center gap-2.5 border-b border-slate-50 last:border-0">
                              <div className="w-6 h-6 rounded-full bg-brand-blue/20 flex items-center justify-center text-[9px] font-bold text-brand-blue shrink-0">{name.charAt(0)}</div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 truncate">{name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{s.email}{s.branch_name ? ` · ${s.branch_name}` : ''}</p>
                              </div>
                            </button>
                          );
                        })}
                        {studentSearch.trim().length === 0 && allStudents.length === 0 && (
                          <p className="px-3 py-4 text-[11px] text-slate-400 text-center">Loading students...</p>
                        )}
                        {studentSearch.trim().length >= 2 && studentResults.length === 0 && (
                          <p className="px-3 py-4 text-[11px] text-slate-400 text-center">No students match</p>
                        )}
                      </div>
                    )}
                    {form.student && !searching && (
                      <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Student selected</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Class</label>
                    {classes.length === 0 ? (
                      <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400">Classes unavailable — check your permissions</div>
                    ) : (
                      <select value={form.enrolled_class} onChange={e => setForm(p => ({ ...p, enrolled_class: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                        <option value="">Select class...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {c.sub_program_name || 'Program'} · {c.branch_name || 'Branch'}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Remarks</label>
                    <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                      placeholder="Optional note" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100">
                  <button onClick={() => setShowEnroll(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleEnroll} disabled={submitting || !form.student || !form.enrolled_class}
                    className="bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Enrolling...' : 'Enroll'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-slate-900 truncate ${mono ? 'font-mono text-brand-blue' : 'font-medium'}`}>{value}</p>
      </div>
    </div>
  );
}
