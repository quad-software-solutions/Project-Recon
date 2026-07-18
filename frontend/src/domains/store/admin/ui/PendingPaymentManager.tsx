import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, Clock, Building2, User, Hash, CheckCircle2, XCircle,
  Ban, Eye, AlertCircle, Loader2, FileText, Banknote, ShieldCheck, RefreshCw,
  Download, ArrowUpDown, Calendar,
} from 'lucide-react';
import {
  listPayments, verifyPayment, rejectPayment, recordCashPayment,
} from '../../payments/api/paymentApi';
import type { StorePayment } from '../../model/types';
import { cn } from '@/shared/utils/cn';
import { formatApiError } from '@/shared/utils/formatApiError';

interface Props {
  addToast: (message: string, type: 'success' | 'error') => void;
}

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'PENDING_VERIFICATION', label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'VERIFIED', label: 'Verified', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'REJECTED', label: 'Rejected', color: 'text-red-600 bg-red-50 border-red-200' },
];

const PAYMENT_METHOD_MAP: Record<string, { label: string; color: string }> = {
  CASH: { label: 'Cash', color: 'text-emerald-600 bg-emerald-50' },
  BANK_TRANSFER: { label: 'Bank Transfer', color: 'text-blue-600 bg-blue-50' },
  MOBILE_MONEY: { label: 'Mobile Money', color: 'text-purple-600 bg-purple-50' },
  CHEQUE: { label: 'Cheque', color: 'text-amber-600 bg-amber-50' },
};

function formatMoney(n: number | string): string {
  const val = typeof n === 'string' ? parseFloat(n) : n;
  return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`;
}

export default function PendingPaymentManager({ addToast }: Props) {
  const [payments, setPayments] = useState<StorePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<'amount' | 'date' | 'order'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detail, setDetail] = useState<StorePayment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<StorePayment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cashModal, setCashModal] = useState<StorePayment | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashDate, setCashDate] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPayments(statusFilter ? { status: statusFilter } : undefined);
      setPayments(data);
    } catch (e: unknown) {
      addToast(formatApiError(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleVerify = async (p: StorePayment) => {
    setActionLoading(p.id);
    try {
      const updated = await verifyPayment(p.pending_order);
      addToast(`Payment verified — order created`, 'success');
      setPayments(prev => prev.map(x => x.id === p.id ? updated : x));
      if (detail?.id === p.id) setDetail(updated);
    } catch (e: unknown) {
      addToast(formatApiError(e), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    try {
      const updated = await rejectPayment(rejectModal.pending_order, rejectReason);
      addToast('Payment rejected', 'success');
      setPayments(prev => prev.map(x => x.id === rejectModal.id ? updated : x));
      if (detail?.id === rejectModal.id) setDetail(updated);
      setRejectModal(null);
      setRejectReason('');
    } catch (e: unknown) {
      addToast(formatApiError(e), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCash = async () => {
    if (!cashModal || !cashAmount) return;
    setActionLoading(cashModal.id);
    try {
      const updated = await recordCashPayment(cashModal.pending_order, {
        amount: cashAmount,
        payment_date: cashDate || undefined,
      });
      addToast('Cash payment recorded — order created', 'success');
      setPayments(prev => prev.map(x => x.id === cashModal.id ? updated : x));
      if (detail?.id === cashModal.id) setDetail(updated);
      setCashModal(null);
      setCashAmount('');
      setCashDate('');
    } catch (e: unknown) {
      addToast(formatApiError(e), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = payments.filter(p => {
      if (q && !(
        p.pending_order.toLowerCase().includes(q) ||
        (p.transaction_reference || '').toLowerCase().includes(q) ||
        (p.bank_name || '').toLowerCase().includes(q) ||
        p.payment_method.toLowerCase().includes(q)
      )) return false;

      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setDate(end.getDate() + 1);
        if (new Date(p.created_at) >= end) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'amount':
          cmp = Number(a.amount) - Number(b.amount);
          break;
        case 'date':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'order':
          cmp = a.pending_order.localeCompare(b.pending_order);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [payments, search, dateFrom, dateTo, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const header = 'Order ID,Amount,Method,Status,Bank,Transaction Ref,Created Date,Verification Notes';
    const rows = filtered.map(p => {
      const methodInfo = PAYMENT_METHOD_MAP[p.payment_method];
      return `"${p.pending_order}",${p.amount},"${methodInfo?.label || p.payment_method}","${p.status_display || p.status}","${p.bank_name || ''}","${p.transaction_reference || ''}","${new Date(p.created_at).toISOString()}","${(p.verification_notes || '').replace(/"/g, '""')}"`;
    });
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported', 'success');
  };

  const summary = useMemo(() => {
    const pending = payments.filter(p => p.status === 'PENDING_VERIFICATION');
    const verified = payments.filter(p => p.status === 'VERIFIED');
    const rejected = payments.filter(p => p.status === 'REJECTED');
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + Number(p.amount), 0),
      verifiedCount: verified.length,
      verifiedAmount: verified.reduce((s, p) => s + Number(p.amount), 0),
      rejectedCount: rejected.length,
      rejectedAmount: rejected.reduce((s, p) => s + Number(p.amount), 0),
      methodBreakdown: payments.reduce<Record<string, number>>((acc, p) => {
        const key = PAYMENT_METHOD_MAP[p.payment_method]?.label || p.payment_method;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [payments]);

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <ArrowUpDown className={cn(
      'w-3 h-3 ml-1 transition-opacity',
      sortField === field ? 'opacity-100 text-brand-blue' : 'opacity-30',
    )} />
  );

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-ink">Payment Management</h3>
            <p className="text-xs text-brand-muted">
              {filtered.length === payments.length
                ? `${payments.length} payment${payments.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${payments.length}`}
            </p>
          </div>
        </div>
        <button onClick={exportCSV} disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:text-brand-ink hover:bg-slate-50 disabled:opacity-40 transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-px bg-brand-border/30">
        <div className="bg-amber-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pending</p>
          <p className="text-lg font-bold text-amber-700">{summary.pendingCount}</p>
          <p className="text-xs text-amber-600 tabular-nums">{formatMoney(summary.pendingAmount)}</p>
        </div>
        <div className="bg-emerald-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Verified</p>
          <p className="text-lg font-bold text-emerald-700">{summary.verifiedCount}</p>
          <p className="text-xs text-emerald-600 tabular-nums">{formatMoney(summary.verifiedAmount)}</p>
        </div>
        <div className="bg-red-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700">Rejected</p>
          <p className="text-lg font-bold text-red-700">{summary.rejectedCount}</p>
          <p className="text-xs text-red-600 tabular-nums">{formatMoney(summary.rejectedAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-brand-border/30 bg-brand-surface/50">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {STATUS_CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setStatusFilter(chip.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                statusFilter === chip.value
                  ? chip.color + ' shadow-sm'
                  : 'bg-white border-brand-border text-brand-muted hover:border-brand-blue/20',
              )}
            >
              {chip.label}
              {chip.value && (
                <span className="ml-1 opacity-60">
                  ({payments.filter(p => p.status === chip.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <input
              type="text"
              placeholder="Search by order ID, reference, bank..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue placeholder:text-brand-muted/60"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-muted" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-2.5 py-2 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                title="From date"
              />
            </div>
            <span className="text-xs text-brand-muted">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-brand-surface border border-brand-border/60 animate-pulse">
                <div className="h-4 bg-brand-border/80 rounded w-1/3 mb-2" />
                <div className="h-3 bg-brand-border/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-brand-muted/40" />
            </div>
            <p className="text-sm font-medium text-brand-muted">
              {search || statusFilter || dateFrom || dateTo ? 'No matching payments' : 'No pending payments'}
            </p>
            {!search && !statusFilter && !dateFrom && !dateTo && (
              <p className="text-xs text-brand-muted/60 mt-1">All payments have been processed.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted/70 border-b border-brand-border/30 mb-2">
              <button className="col-span-3 flex items-center text-left" onClick={() => toggleSort('order')}>
                Order <SortIcon field="order" />
              </button>
              <div className="col-span-2">Method</div>
              <button className="col-span-2 flex items-center justify-end" onClick={() => toggleSort('amount')}>
                Amount <SortIcon field="amount" />
              </button>
              <div className="col-span-2">Status</div>
              <button className="col-span-2 flex items-center justify-end" onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </button>
              <div className="col-span-1" />
            </div>

            <div className="space-y-1">
              <AnimatePresence>
                {filtered.map(p => {
                  const methodInfo = PAYMENT_METHOD_MAP[p.payment_method] || { label: p.payment_method, color: 'text-slate-600 bg-slate-50' };
                  const isPending = p.status === 'PENDING_VERIFICATION';
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border border-transparent hover:border-brand-border/50 hover:bg-slate-50/50 transition-all duration-150"
                    >
                      <div className="col-span-3 min-w-0">
                        <span className="text-sm font-mono font-bold text-brand-ink">
                          #{p.pending_order.slice(0, 8)}
                        </span>
                        {p.transaction_reference && (
                          <p className="text-[11px] text-brand-muted/70 truncate">{p.transaction_reference}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold', methodInfo.color)}>
                          {methodInfo.label}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-semibold text-brand-ink tabular-nums">{formatMoney(p.amount)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                          p.status === 'PENDING_VERIFICATION' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                          p.status === 'VERIFIED' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                          'text-red-600 bg-red-50 border-red-200',
                        )}>
                          {p.status_display || p.status}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs text-brand-muted">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetail(p)}
                          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleVerify(p)}
                            disabled={actionLoading === p.id}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                            title="Verify"
                          >
                            {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Method breakdown mini-bar */}
            <div className="flex items-center gap-3 pt-4 mt-4 border-t border-brand-border/30">
              <span className="text-[11px] font-semibold text-brand-muted/70 uppercase tracking-wider">Methods:</span>
              {Object.entries(summary.methodBreakdown).map(([method, count]) => (
                <span key={method} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-brand-border/50 text-xs text-brand-muted">
                  {method}
                  <span className="font-bold text-brand-ink">{count}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/20 backdrop-blur-sm overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-lg mx-auto mb-12"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-ink">Payment Details</h4>
                    <p className="text-xs text-brand-muted font-mono">#{detail.pending_order.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard icon={DollarSign} label="Amount" value={formatMoney(detail.amount)} highlight />
                  <InfoCard icon={Hash} label="Order ID" value={`#${detail.pending_order.slice(0, 8)}`} mono />
                  <InfoCard icon={Banknote} label="Method" value={PAYMENT_METHOD_MAP[detail.payment_method]?.label || detail.payment_method} />
                  <InfoCard icon={detail.status === 'VERIFIED' ? CheckCircle2 : detail.status === 'REJECTED' ? XCircle : Clock}
                    label="Status" value={detail.status_display || detail.status}
                    valueClass={detail.status === 'VERIFIED' ? 'text-emerald-600' : detail.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'} />
                  {detail.bank_name && <InfoCard icon={Building2} label="Bank" value={detail.bank_name} />}
                  {detail.transaction_reference && <InfoCard icon={Hash} label="Transaction Ref" value={detail.transaction_reference} mono />}
                </div>

                {detail.attachment && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5">Attachment</label>
                    <a href={detail.attachment} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-blue bg-brand-blue/5 border border-brand-blue/20 rounded-lg hover:bg-brand-blue/10 transition-all">
                      <FileText className="w-3.5 h-3.5" /> View Receipt
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs text-brand-muted">
                  <div>
                    <span className="font-semibold">Created</span>
                    <p className="font-medium text-brand-ink">{new Date(detail.created_at).toLocaleString()}</p>
                  </div>
                  {detail.verified_at && (
                    <div>
                      <span className="font-semibold">Verified at</span>
                      <p className="font-medium text-brand-ink">{new Date(detail.verified_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {detail.verification_notes && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{detail.verification_notes}</p>
                  </div>
                )}

                {detail.status === 'PENDING_VERIFICATION' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-border/50">
                    <button
                      type="button"
                      onClick={() => { handleVerify(detail); setDetail(null); }}
                      disabled={actionLoading === detail.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all"
                    >
                      {actionLoading === detail.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDetail(null); setRejectModal(detail); setRejectReason(''); }}
                      disabled={actionLoading === detail.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDetail(null); setCashModal(detail); setCashAmount(String(detail.amount)); setCashDate(''); }}
                      disabled={actionLoading === detail.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all"
                    >
                      <Banknote className="w-4 h-4" />
                      Record Cash
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setRejectModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-sm mx-auto"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h4 className="text-sm font-bold text-brand-ink">Reject Payment</h4>
                </div>
                <button onClick={() => setRejectModal(null)} className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-brand-muted">This will cancel the pending order and mark the payment as rejected.</p>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Reason for rejection *</label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 resize-none"
                    placeholder="Enter the reason..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-brand-border/50 bg-brand-surface/50 flex items-center justify-end gap-2.5">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-brand-surface transition-colors">Cancel</button>
                <button onClick={handleReject} disabled={actionLoading === rejectModal.id || !rejectReason.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-2">
                  {actionLoading === rejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Cash modal */}
      <AnimatePresence>
        {cashModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setCashModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-sm mx-auto"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Banknote className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-brand-ink">Record Cash Payment</h4>
                </div>
                <button onClick={() => setCashModal(null)} className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-brand-muted">Record a cash payment — the order will be created immediately.</p>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Amount *</label>
                  <input type="number" step="0.01" value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Payment date (optional)</label>
                  <input type="datetime-local" value={cashDate} onChange={e => setCashDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-brand-border/50 bg-brand-surface/50 flex items-center justify-end gap-2.5">
                <button onClick={() => setCashModal(null)} className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-brand-surface transition-colors">Cancel</button>
                <button onClick={handleCash} disabled={actionLoading === cashModal.id || !cashAmount}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2">
                  {actionLoading === cashModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                  Record Cash
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({
  icon: Icon, label, value, highlight, mono, valueClass,
}: {
  icon: React.ElementType; label: string; value: string; highlight?: boolean; mono?: boolean; valueClass?: string;
}) {
  return (
    <div className="p-3 bg-brand-surface rounded-xl border border-brand-border/60">
      <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={cn('text-sm break-all font-semibold', highlight && 'font-bold', mono && 'font-mono text-xs', valueClass || 'text-brand-ink')}>
        {value}
      </p>
    </div>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
