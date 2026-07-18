import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, Loader2, Store, Calendar, Search, X, Plus, Eye, Banknote, BookOpen, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { fetchPaymentsApi, fetchEnrollmentsPaginatedApi, fetchVerificationQueueApi, recordPaymentApi, setUnderReviewApi, rejectPaymentApi } from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import PendingPaymentManager from '@/domains/store/admin/ui/PendingPaymentManager';
import { canManageStore } from '@/shared/auth/permissions';
import { getUserProfile } from '@/shared/utils/storage';
import * as eventsApi from '@/domains/competition/api/eventsApi';
import { formatApiError } from '@/shared/utils/formatApiError';

type Tab = 'enrollment' | 'store' | 'event';
type EnrollSubTab = 'payments' | 'verification-queue';

const PAGE_SIZE = 50;

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-blue-100 text-blue-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const VERIFICATION_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHEQUE', label: 'Cheque' },
];

export default function PaymentTracker() {
  const [tab, setTab] = useState<Tab>('enrollment');
  const [enrollSubTab, setEnrollSubTab] = useState<EnrollSubTab>('payments');
  const [payments, setPayments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const isSuper = canManageStore(getUserProfile());

  const [eventPayments, setEventPayments] = useState<eventsApi.BackendEventPayment[]>([]);
  const [eventPayLoading, setEventPayLoading] = useState(false);
  const [selectedPay, setSelectedPay] = useState<eventsApi.BackendEventPayment | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [paySearch, setPaySearch] = useState('');

  const [enrollPaySearch, setEnrollPaySearch] = useState('');
  const [enrollMethodFilter, setEnrollMethodFilter] = useState('all');
  const [enrollStatusFilter, setEnrollStatusFilter] = useState('all');
  const [selectedEnrollPayment, setSelectedEnrollPayment] = useState<any | null>(null);
  const [showRecordPay, setShowRecordPay] = useState(false);
  const [recordForm, setRecordForm] = useState({ enrollment: '', amount: '', payment_method: 'CASH', transaction_reference: '', transfer_reference: '', bank_name: '' });
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectQReason, setRejectQReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadEnrollmentData = () => {
    setLoading(true);
    Promise.allSettled([
      fetchPaymentsApi().catch(() => []),
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p)).catch(() => []),
      fetchVerificationQueueApi().catch(() => []),
    ]).then(([pay, enr, queue]) => {
      if (pay.status === 'fulfilled') setPayments(Array.isArray(pay.value) ? pay.value : []);
      if (enr.status === 'fulfilled') setEnrollments(Array.isArray(enr.value) ? enr.value : []);
      if (queue.status === 'fulfilled') setVerificationQueue(Array.isArray(queue.value) ? queue.value : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'enrollment') loadEnrollmentData();
  }, [tab]);

  const loadEventPayments = () => {
    setEventPayLoading(true);
    eventsApi.adminListPayments()
      .then(p => setEventPayments(Array.isArray(p) ? p : []))
      .catch(() => setEventPayments([]))
      .finally(() => setEventPayLoading(false));
  };

  useEffect(() => {
    if (tab === 'event') loadEventPayments();
  }, [tab]);

  if (loading && tab === 'enrollment') return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const paid = payments.filter(p => p.status === 'PAID');
  const totalRevenue = paid.reduce((s, p) => s + Number(p.amount), 0);
  const cashPayments = payments.filter(p => p.payment_method === 'CASH');
  const totalCash = cashPayments.reduce((s, p) => s + (p.status === 'PAID' ? Number(p.amount) : 0), 0);
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_VERIFICATION');
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const queueCount = verificationQueue.length;

  const filteredEnrollPayments = useMemo(() => {
    let list = [...payments];
    if (enrollPaySearch.trim()) {
      const q = enrollPaySearch.toLowerCase();
      list = list.filter(p =>
        (p.student_name || '').toLowerCase().includes(q)
        || (p.sub_program_name || '').toLowerCase().includes(q)
        || (p.class_name || '').toLowerCase().includes(q)
        || (p.transaction_reference || '').toLowerCase().includes(q)
      );
    }
    if (enrollMethodFilter !== 'all') list = list.filter(p => p.payment_method === enrollMethodFilter);
    if (enrollStatusFilter !== 'all') list = list.filter(p => p.status === enrollStatusFilter);
    return list;
  }, [payments, enrollPaySearch, enrollMethodFilter, enrollStatusFilter]);

  const handleEventVerify = async () => {
    if (!selectedPay) return;
    try {
      await eventsApi.adminVerifyPayment(selectedPay.registration, { verification_notes: verifyNotes || undefined });
      setVerifyNotes('');
      setSelectedPay(null);
      loadEventPayments();
      setToast({ message: 'Payment verified successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: `Verification failed: ${err.message}`, type: 'error' });
    }
  };

  const handleEventReject = async () => {
    if (!selectedPay || !rejectNotes.trim()) return;
    try {
      await eventsApi.adminRejectPayment(selectedPay.registration, { verification_notes: rejectNotes });
      setRejectNotes('');
      setShowRejectModal(false);
      setSelectedPay(null);
      loadEventPayments();
      setToast({ message: 'Payment rejected', type: 'success' });
    } catch (err: any) {
      setToast({ message: `Rejection failed: ${err.message}`, type: 'error' });
    }
  };

  const handleRecordPay = async () => {
    if (!recordForm.enrollment || !recordForm.amount || !recordForm.payment_method) return;
    setRecordSubmitting(true);
    setError(null);
    try {
      await recordPaymentApi({
        enrollment: recordForm.enrollment,
        amount: recordForm.amount,
        payment_method: recordForm.payment_method,
        transaction_reference: recordForm.transaction_reference || undefined,
        transfer_reference: recordForm.transfer_reference || undefined,
        bank_name: recordForm.bank_name || undefined,
      });
      setRecordForm({ enrollment: '', amount: '', payment_method: 'CASH', transaction_reference: '', transfer_reference: '', bank_name: '' });
      setShowRecordPay(false);
      loadEnrollmentData();
      setToast({ message: 'Payment recorded successfully', type: 'success' });
    } catch (e) {
      setError(formatApiError(e));
      setToast({ message: `Failed to record payment: ${formatApiError(e)}`, type: 'error' });
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleUnderReview = async (enrollmentId: string) => {
    try {
      await setUnderReviewApi(enrollmentId);
      loadEnrollmentData();
      setToast({ message: 'Marked as under review', type: 'success' });
    } catch (e) {
      setToast({ message: `Failed: ${formatApiError(e)}`, type: 'error' });
    }
  };

  const handleRejectFromQueue = async () => {
    if (!rejectTarget || !rejectQReason.trim()) return;
    try {
      await rejectPaymentApi(rejectTarget.enrollment, { rejection_reason: rejectQReason });
      setRejectTarget(null);
      setRejectQReason('');
      loadEnrollmentData();
      setToast({ message: 'Payment rejected', type: 'success' });
    } catch (e) {
      setToast({ message: `Rejection failed: ${formatApiError(e)}`, type: 'error' });
    }
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const payStatusBadge = (s?: string) => {
    const map: Record<string, string> = {
      PENDING_VERIFICATION: 'bg-amber-100 text-amber-700',
      VERIFIED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-500',
    };
    return map[s || ''] || 'bg-slate-100 text-slate-600';
  };

  const payMethodIcon = (m?: string) => {
    const map: Record<string, string> = { CASH: '💵', BANK_TRANSFER: '🏦', MOBILE_MONEY: '📱', CHEQUE: '📄' };
    return map[m || ''] || '💳';
  };

  const filteredEventPayments = eventPayments.filter(p => {
    if (!paySearch) return true;
    const q = paySearch.toLowerCase();
    return (p.student_name || '').toLowerCase().includes(q)
      || (p.event_title || '').toLowerCase().includes(q)
      || (p.student_email || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="flex items-center gap-1.5 bg-white border border-brand-border rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setTab('enrollment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'enrollment'
              ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
              : 'text-brand-muted hover:text-brand-ink hover:bg-brand-blue/5'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Enrollment Payments
        </button>
        {isSuper && (
          <button
            onClick={() => setTab('store')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'store'
                ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
                : 'text-brand-muted hover:text-brand-ink hover:bg-brand-blue/5'
            }`}
          >
            <Store className="w-4 h-4" />
            Store Payments
          </button>
        )}
        <button
          onClick={() => setTab('event')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'event'
              ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
              : 'text-brand-muted hover:text-brand-ink hover:bg-brand-blue/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Event Payments
        </button>
      </div>

      {tab === 'enrollment' ? (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-slate-900 text-xl">Enrollment Payment Tracker</h3>
            <button onClick={() => setShowRecordPay(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Record Payment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase">Total Revenue</p>
                <p className="font-display font-bold text-2xl text-slate-900">{totalRevenue.toLocaleString()} Birr</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{paid.length} paid transactions</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2563EB] uppercase">Cash Payments</p>
                <p className="font-display font-bold text-2xl text-slate-900">{totalCash.toLocaleString()} Birr</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{cashPayments.length} cash transactions</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Enrollments</p>
              <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{activeEnrollments.length}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${enrollments.length ? Math.round((activeEnrollments.length / enrollments.length) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pending Payment</p>
              <p className="font-display font-bold text-2xl text-amber-600 mt-0.5">{pendingEnrollments.length}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${enrollments.length ? Math.round((pendingEnrollments.length / enrollments.length) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Payments</p>
              <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{payments.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">{payments.filter(p => p.status === 'PAID').length} completed</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-brand-border mb-4">
            <button onClick={() => setEnrollSubTab('payments')} className={`pb-2 text-xs font-bold transition-colors ${enrollSubTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Payments List
            </button>
            <button onClick={() => setEnrollSubTab('verification-queue')} className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${enrollSubTab === 'verification-queue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <Shield className="w-3.5 h-3.5" /> Verification Queue
              {queueCount > 0 && <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{queueCount}</span>}
            </button>
          </div>

          {enrollSubTab === 'payments' && (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={enrollPaySearch} onChange={e => setEnrollPaySearch(e.target.value)}
                    placeholder="Search by student, program, class..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select value={enrollMethodFilter} onChange={e => setEnrollMethodFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">All Methods</option>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={enrollStatusFilter} onChange={e => setEnrollStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-brand-border">
                      <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Student</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Program</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Amount</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Method</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredEnrollPayments.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No enrollment payments found</td></tr>
                    ) : filteredEnrollPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-blue/5 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5 text-brand-blue" />
                            </div>
                            <span className="text-xs font-semibold text-slate-900">{p.student_name || p.id?.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span>{p.sub_program_name || '—'}</span>
                            {p.class_name && <span className="text-[10px] text-slate-400">{p.class_name}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-900">{Number(p.amount).toLocaleString()} <span className="text-[10px] text-slate-400">Birr</span></span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {p.payment_method === 'CASH' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                            {PAYMENT_METHODS.find(m => m.value === p.payment_method)?.label || p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setSelectedEnrollPayment(p)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors" title="View details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {enrollSubTab === 'verification-queue' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-brand-border">
                    <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Student</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Program</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Amount</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Method</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Verification</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {verificationQueue.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No pending verification requests</td></tr>
                  ) : verificationQueue.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-900">{p.student_name || p.id?.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{p.sub_program_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-900">{Number(p.amount).toLocaleString()} <span className="text-[10px] text-slate-400">Birr</span></span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {PAYMENT_METHODS.find(m => m.value === p.payment_method)?.label || p.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${VERIFICATION_STYLES[p.verification_status || p.status] || 'bg-slate-100 text-slate-500'}`}>
                          {p.verification_status || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleUnderReview(p.enrollment)}
                            className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Mark under review"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setRejectTarget(p); setRejectQReason(''); }}
                            className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'store' ? (
        <PendingPaymentManager addToast={addToast} />
      ) : (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-xl">Event Payments</h3>
              <p className="text-xs text-slate-500 mt-1">Manage event registration payments</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={paySearch} onChange={e => setPaySearch(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          {eventPayLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : filteredEventPayments.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="font-semibold text-sm">No event payments found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-brand-border">
                    <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Student</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Event</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Amount</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Method</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredEventPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-900">{p.student_name || p.student_email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-600">{p.event_title || '—'}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-900">{p.amount}</td>
                      <td className="px-4 py-3 text-center text-xs">{payMethodIcon(p.payment_method)} {p.payment_method?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${payStatusBadge(p.status)}`}>{p.status?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelectedPay(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue"><Eye className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedPay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedPay(null)} />
              <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg text-slate-900">Payment Detail</h3>
                  <button onClick={() => setSelectedPay(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Student</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedPay.student_name || selectedPay.student_email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Amount</p>
                      <p className="text-sm font-bold text-slate-900">{selectedPay.amount} Birr</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Event</p>
                    <p className="text-sm text-slate-900">{selectedPay.event_title || '—'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Method</p>
                      <p className="text-sm text-slate-900">{selectedPay.payment_method?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Reference</p>
                      <p className="text-sm text-slate-900">{selectedPay.transaction_reference || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${payStatusBadge(selectedPay.status)}`}>{selectedPay.status?.replace('_', ' ')}</span>
                  </div>

                  {selectedPay.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-xs text-slate-700">Actions</h4>
                      <input value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} placeholder="Verification notes (optional)" className="w-full px-3 py-2 bg-white border border-brand-border rounded-lg text-xs" />
                      <div className="flex gap-2">
                        <button onClick={handleEventVerify} className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" /> Verify
                        </button>
                        <button onClick={() => setShowRejectModal(true)} className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 flex items-center justify-center gap-1">
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showRejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
              <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 z-10">
                <h3 className="font-black text-lg text-slate-900 mb-2">Reject Payment</h3>
                <p className="text-xs text-slate-500 mb-4">Provide a reason for rejecting this payment.</p>
                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Rejection reason *" autoFocus className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red mb-4" rows={3} />
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                  <button onClick={handleEventReject} disabled={!rejectNotes.trim()} className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {selectedEnrollPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEnrollPayment(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-brand-border z-10">
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Payment Details</h3>
              </div>
              <button onClick={() => setSelectedEnrollPayment(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-semibold text-slate-900">{selectedEnrollPayment.student_name || '—'}</span></div>
              {selectedEnrollPayment.sub_program_name && <div className="flex justify-between"><span className="text-slate-500">Program</span><span className="font-semibold text-slate-900">{selectedEnrollPayment.sub_program_name}</span></div>}
              {selectedEnrollPayment.class_name && <div className="flex justify-between"><span className="text-slate-500">Class</span><span className="font-semibold text-slate-900">{selectedEnrollPayment.class_name}</span></div>}
              <div className="border-t border-brand-border pt-3" />
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-emerald-600 text-base">{Number(selectedEnrollPayment.amount).toLocaleString()} Birr</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Method</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                  {selectedEnrollPayment.payment_method === 'CASH' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                  {PAYMENT_METHODS.find(m => m.value === selectedEnrollPayment.payment_method)?.label || selectedEnrollPayment.payment_method}
                </span>
              </div>
              {selectedEnrollPayment.bank_name && <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-medium">{selectedEnrollPayment.bank_name}</span></div>}
              {selectedEnrollPayment.transaction_reference && <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="text-[10px] font-mono font-bold text-slate-700">{selectedEnrollPayment.transaction_reference}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{selectedEnrollPayment.payment_date?.slice(0, 10) || '—'}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[selectedEnrollPayment.status] || 'bg-slate-100 text-slate-500'}`}>{selectedEnrollPayment.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecordPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRecordPay(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm z-10">
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/5 flex items-center justify-center"><Banknote className="w-4 h-4 text-blue-600" /></div>
                <h3 className="font-bold text-base text-slate-900">Record Payment</h3>
              </div>
              <button onClick={() => setShowRecordPay(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Enrollment</label>
                <select value={recordForm.enrollment} onChange={e => setRecordForm(p => ({ ...p, enrollment: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                >
                  <option value="">Select enrollment...</option>
                  {enrollments.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.student_name || e.student_email || 'Unknown'} — {e.class_name || e.sub_program_name || 'Class'} ({e.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Amount (Birr)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Birr</span>
                  <input value={recordForm.amount} onChange={e => setRecordForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                    placeholder="e.g. 2500" type="number" min="0" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Payment Method</label>
                <select value={recordForm.payment_method} onChange={e => setRecordForm(p => ({ ...p, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                >
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {recordForm.payment_method !== 'CASH' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Transaction Reference</label>
                    <input value={recordForm.transaction_reference} onChange={e => setRecordForm(p => ({ ...p, transaction_reference: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      placeholder="e.g. TRX123456" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Transfer Reference (optional)</label>
                    <input value={recordForm.transfer_reference} onChange={e => setRecordForm(p => ({ ...p, transfer_reference: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      placeholder="Bank / mobile transfer slip number" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Bank Name (optional)</label>
                    <input value={recordForm.bank_name} onChange={e => setRecordForm(p => ({ ...p, bank_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      placeholder="e.g. Commercial Bank of Ethiopia" />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
              <button onClick={() => setShowRecordPay(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleRecordPay} disabled={recordSubmitting || !recordForm.enrollment || !recordForm.amount || !recordForm.payment_method}
                className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                {recordSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                {recordSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-brand-border z-10">
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h3 className="font-bold text-base text-slate-900">Reject Payment</h3>
              <button onClick={() => setRejectTarget(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500">Student: <strong>{rejectTarget.student_name || 'Unknown'}</strong></p>
              <p className="text-xs text-slate-500">Amount: <strong>{Number(rejectTarget.amount).toLocaleString()} Birr</strong></p>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Rejection Reason *</label>
                <textarea value={rejectQReason} onChange={e => setRejectQReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-red-500"
                  rows={3} placeholder="Explain why..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
              <button onClick={() => setRejectTarget(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleRejectFromQueue} disabled={!rejectQReason.trim()}
                className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
