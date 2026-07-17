import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Loader2, Store, Calendar, CheckCircle, XCircle, Shield, Search, ExternalLink } from 'lucide-react';
import { fetchPaymentsApi, fetchEnrollmentsApi } from '@/domains/learning/academics/api/academicApi';
import PendingPaymentManager from '@/domains/store/admin/ui/PendingPaymentManager';
import { canManageStore } from '@/shared/auth/permissions';
import { getUserProfile } from '@/shared/utils/storage';
import * as eventsApi from '@/domains/competition/api/eventsApi';

type Tab = 'enrollment' | 'store' | 'event';

export default function PaymentTracker() {
  const [tab, setTab] = useState<Tab>('enrollment');
  const [payments, setPayments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
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

  useEffect(() => {
    Promise.all([
      fetchPaymentsApi().catch(() => []),
      fetchEnrollmentsApi().catch(() => []),
    ]).then(([pay, enr]) => {
      setPayments(Array.isArray(pay) ? pay : []);
      setEnrollments(Array.isArray(enr) ? enr : []);
    }).finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const paid = payments.filter(p => p.status === 'PAID');
  const totalRevenue = paid.reduce((s, p) => s + Number(p.amount), 0);
  const cashPayments = payments.filter(p => p.payment_method === 'CASH');
  const totalCash = cashPayments.reduce((s, p) => s + (p.status === 'PAID' ? Number(p.amount) : 0), 0);
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_VERIFICATION');
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');

  const handleVerify = async () => {
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

  const handleReject = async () => {
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
      {/* Tab bar */}
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
          <h3 className="font-display font-bold text-slate-900 text-xl mb-6">Enrollment Payment Tracker</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <button onClick={() => setSelectedPay(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue"><ExternalLink className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment detail modal */}
          {selectedPay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedPay(null)} />
              <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg text-slate-900">Payment Detail</h3>
                  <button onClick={() => setSelectedPay(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><XCircle className="w-5 h-5" /></button>
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
                        <button onClick={handleVerify} className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" /> Verify
                        </button>
                        <button onClick={() => setShowRejectModal(true)} className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {showRejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
              <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 z-10">
                <h3 className="font-black text-lg text-slate-900 mb-2">Reject Payment</h3>
                <p className="text-xs text-slate-500 mb-4">Provide a reason for rejecting this payment.</p>
                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Rejection reason *" autoFocus className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red mb-4" rows={3} />
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                  <button onClick={handleReject} disabled={!rejectNotes.trim()} className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
