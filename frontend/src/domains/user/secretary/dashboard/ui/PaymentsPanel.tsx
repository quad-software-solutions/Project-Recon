import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, DollarSign, Download, Eye, Filter, Calendar, BookOpen, CreditCard, Banknote, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { EnrollmentPayment, Enrollment } from '@/src/shared/types';
import { fetchPaymentsApi, fetchEnrollmentsPaginatedApi, createCashPaymentApi } from '@/src/domains/learning/academics/api/academicApi';

const PAGE_SIZE = 50;

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-blue-100 text-blue-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function PaymentsPanel() {
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState({ enrollment: '', amount: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<EnrollmentPayment | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    const errors: string[] = [];
    Promise.allSettled([
      fetchPaymentsApi(),
      fetchEnrollmentsPaginatedApi(1, PAGE_SIZE),
    ]).then(([pay, enr]) => {
      if (pay.status === 'fulfilled') {
        setPayments(Array.isArray(pay.value) ? pay.value : []);
      } else {
        errors.push('payments');
      }
      if (enr.status === 'fulfilled') {
        setEnrollments((enr.value.results || []).filter(e => e.status === 'ACTIVE' || e.status === 'PENDING_PAYMENT'));
      } else {
        errors.push('enrollments');
      }
      if (errors.length) setError(`Failed to load: ${errors.join(', ')}`);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleRecord = async () => {
    if (!form.enrollment || !form.amount) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCashPaymentApi({ enrollment: form.enrollment, amount: form.amount });
      setForm({ enrollment: '', amount: '' });
      setShowRecord(false);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...payments];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.student_name || '').toLowerCase().includes(q)
        || (p.class_name || '').toLowerCase().includes(q)
        || (p.sub_program_name || '').toLowerCase().includes(q)
        || (p.transaction_reference || '').toLowerCase().includes(q)
      );
    }
    if (methodFilter !== 'all') list = list.filter(p => p.payment_method === methodFilter);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    return list;
  }, [payments, searchQuery, methodFilter, statusFilter]);

  const totalAmount = filtered.reduce((sum, p) => sum + (p.status === 'PAID' ? Number(p.amount) : 0), 0);
  const paidCount = payments.filter(p => p.status === 'PAID').length;
  const pendingCount = payments.filter(p => p.status !== 'PAID').length;

  const exportCsv = () => {
    const headers = ['Student', 'Program', 'Class', 'Amount', 'Method', 'Date', 'Status', 'Reference'];
    const rows = filtered.map(p => [
      p.student_name || '', p.sub_program_name || '', p.class_name || '',
      String(p.amount), p.payment_method,
      p.payment_date?.slice(0, 10) || '', p.status, p.transaction_reference || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payments.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Payments</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-brand-border px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => setShowRecord(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Record Cash Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All Transactions', value: payments.length, icon: DollarSign, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Total Collected', value: `${payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0).toLocaleString()} Birr`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Paid', value: paidCount, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <div key={i} className="bg-white border border-brand-border rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <SIcon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="font-black text-lg text-slate-900 leading-tight">{s.value}</p>
              <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student, program, class..." 
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="ONLINE">Online</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery || methodFilter !== 'all' || statusFilter !== 'all' ? 'No payments match your filters' : 'No payments recorded yet'}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-blue/5 flex items-center justify-center">
                        <DollarSign className="w-3.5 h-3.5 text-brand-blue" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{p.student_name || p.id.slice(0, 8)}</span>
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
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.payment_date?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelectedPayment(p)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors" title="View details">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPayment(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-brand-blue" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Payment Details</h3>
                  </div>
                  <button onClick={() => setSelectedPayment(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-semibold text-slate-900">{selectedPayment.student_name || '—'}</span></div>
                  {selectedPayment.sub_program_name && <div className="flex justify-between"><span className="text-slate-500">Program</span><span className="font-semibold text-slate-900">{selectedPayment.sub_program_name}</span></div>}
                  {selectedPayment.class_name && <div className="flex justify-between"><span className="text-slate-500">Class</span><span className="font-semibold text-slate-900">{selectedPayment.class_name}</span></div>}
                  <div className="border-t border-brand-border pt-3" />
                  <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-emerald-600 text-base">{Number(selectedPayment.amount).toLocaleString()} Birr</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Method</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                      {selectedPayment.payment_method === 'CASH' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                      {selectedPayment.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">Provider</span><span className="font-medium">{selectedPayment.payment_provider || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="text-[10px] font-mono font-bold text-slate-700">{selectedPayment.transaction_reference || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{selectedPayment.payment_date?.slice(0, 10) || '—'}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[selectedPayment.status] || 'bg-slate-100 text-slate-500'}`}>{selectedPayment.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Record Cash Payment Modal */}
      <AnimatePresence>
        {showRecord && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecord(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/5 flex items-center justify-center"><Banknote className="w-4 h-4 text-blue-600" /></div>
                    <h3 className="font-bold text-base text-slate-900">Record Cash Payment</h3>
                  </div>
                  <button onClick={() => setShowRecord(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Enrollment</label>
                    <select value={form.enrollment} onChange={e => setForm(p => ({ ...p, enrollment: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    >
                      <option value="">Select enrollment...</option>
                      {enrollments.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.student_name || e.student_email || 'Unknown'} — {e.class_name || e.sub_program_name || 'Class'} ({e.status})
                        </option>
                      ))}
                    </select>
                    {form.enrollment && (() => {
                      const sel = enrollments.find(e => e.id === form.enrollment);
                      return sel?.sub_program_name ? (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {sel.sub_program_name}
                          {sel.class_name ? ` · ${sel.class_name}` : ''}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Amount (Birr)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Birr</span>
                      <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                        placeholder="e.g. 2500" type="number" min="0" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => setShowRecord(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleRecord} disabled={submitting || !form.enrollment || !form.amount}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Recording...' : 'Record Payment'}
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