import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Search,
  Ban, Banknote, X,
} from 'lucide-react';
import { adminGetRegistrations, adminApproveRegistration, adminRejectRegistration, adminCancelRegistration } from '../../api/competitionApi';
import * as eventsApi from '../../api/eventsApi';

export default function RegistrationDashboard() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cashModal, setCashModal] = useState<any | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [verifyModal, setVerifyModal] = useState<any | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  const handlePaymentAction = async (action: 'cash' | 'verify' | 'reject') => {
    if (!cashModal && !verifyModal && !rejectModal) return;
    const reg = cashModal || verifyModal || rejectModal;
    setPaymentActionLoading(true);
    try {
      if (action === 'cash' && cashModal) {
        await eventsApi.adminRecordCashPayment(cashModal.id, { amount: cashAmount, payment_date: new Date().toISOString() });
      } else if (action === 'verify' && verifyModal) {
        await eventsApi.adminVerifyPayment(verifyModal.id, { verification_notes: verifyNotes || undefined });
      } else if (action === 'reject' && rejectModal) {
        await eventsApi.adminRejectPayment(rejectModal.id, { verification_notes: rejectNotes });
      }
      setCashModal(null);
      setVerifyModal(null);
      setRejectModal(null);
      setCashAmount('');
      setVerifyNotes('');
      setRejectNotes('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const load = () => {
    setLoading(true);
    setError(null);
    adminGetRegistrations()
      .then(setRegistrations)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = registrations.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.public_full_name || '').toLowerCase().includes(q) ||
      (r.public_email || '').toLowerCase().includes(q) ||
      (r.event_title || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.registration_status === 'PENDING').length,
    approved: registrations.filter(r => r.registration_status === 'APPROVED').length,
    rejected: registrations.filter(r => r.registration_status === 'REJECTED').length,
    cancelled: registrations.filter(r => r.registration_status === 'CANCELLED').length,
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'cancel') => {
    if ((action === 'reject' || action === 'cancel') && !window.confirm(`Are you sure you want to ${action === 'reject' ? 'reject' : 'cancel'} this registration?`)) return;
    setActionLoading(id);
    setError(null);
    try {
      if (action === 'approve') await adminApproveRegistration(id);
      else if (action === 'reject') await adminRejectRegistration(id);
      else await adminCancelRegistration(id);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <>
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Cancelled', value: stats.cancelled, icon: Ban, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <SIcon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or event..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">No registrations</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Event</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Type</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Payment</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-slate-900">{r.public_full_name || r.student_email || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.public_email || r.student_email || '—'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-700">{r.event_title || r.event}</td>
                  <td className="px-4 py-3">
                    <span className="text-[9px] font-bold text-slate-500">{r.event_type || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(r.registration_status)}`}>
                      {r.registration_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.payment_status === 'PENDING_VERIFICATION' ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          PENDING_VERIFICATION
                        </span>
                        <button onClick={() => setVerifyModal(r)} className="p-1 rounded hover:bg-amber-100 text-amber-600" title="Verify payment">
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setRejectModal(r)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Reject payment">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        r.payment_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        r.payment_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        r.payment_status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{r.payment_status || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {r.registration_status === 'PENDING' && (
                        <>
                          <button onClick={() => handleAction(r.id, 'approve')} disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40"
                            title="Approve">
                            {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleAction(r.id, 'reject')} disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40"
                            title="Reject">
                            {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                      {(r.registration_status === 'PENDING' || r.registration_status === 'APPROVED') && (
                        <button onClick={() => handleAction(r.id, 'cancel')} disabled={actionLoading === r.id}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                          title="Cancel">
                          {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {r.payment_status === 'PENDING_VERIFICATION' && (
                        <button onClick={() => setCashModal(r)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Record cash payment">
                          <Banknote className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Record Cash Modal */}
    <AnimatePresence>
      {cashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setCashModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900">Record Cash Payment</h4>
              </div>
              <button onClick={() => setCashModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500">Record cash payment for {cashModal?.public_full_name || cashModal?.student_email}</p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount *</label>
                <input type="number" step="0.01" value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-red" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button onClick={() => setCashModal(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handlePaymentAction('cash')} disabled={paymentActionLoading || !cashAmount}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                {paymentActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                Record Cash
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Verify Payment Modal */}
    <AnimatePresence>
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setVerifyModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900">Verify Payment</h4>
              </div>
              <button onClick={() => setVerifyModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500">This will mark the payment as verified and approve the registration.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes (optional)</label>
                <textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} rows={2}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-red resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button onClick={() => setVerifyModal(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handlePaymentAction('verify')} disabled={paymentActionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                {paymentActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verify Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Reject Payment Modal */}
    <AnimatePresence>
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setRejectModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-5 h-5 text-red-500" />
                <h4 className="text-sm font-bold text-slate-900">Reject Payment</h4>
              </div>
              <button onClick={() => setRejectModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500">This will mark the payment as rejected and reject the registration.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason *</label>
                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handlePaymentAction('reject')} disabled={paymentActionLoading || !rejectNotes.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
                {paymentActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
