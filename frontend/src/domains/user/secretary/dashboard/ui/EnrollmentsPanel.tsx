import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Eye, CheckCircle2, Download, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Enrollment, StudentProfile, AcademicClass, UserProfile } from '@/src/shared/types';
import { fetchEnrollmentsPaginatedApi, fetchStudentsApi, fetchClassesApi, enrollStudentApi, cancelEnrollmentApi, completeEnrollmentApi, searchStudentsApi, createCashPaymentApi } from '@/src/domains/learning/academics/api/academicApi';

const PAGE_SIZE = 20;

const statusBadge = (s: string) => {
  if (s === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
  if (s === 'PENDING_PAYMENT') return 'bg-amber-100 text-amber-700';
  if (s === 'CANCELLED') return 'bg-red-100 text-red-600';
  if (s === 'COMPLETED') return 'bg-brand-blue/10 text-brand-blue';
  return 'bg-slate-100 text-slate-500';
};

export default function EnrollmentsPanel({ currentUser }: { currentUser?: UserProfile }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showPayment, setShowPayment] = useState<Enrollment | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ student: '', enrolled_class: '', remarks: '' });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadData = useCallback((p = 1) => {
    setLoading(true);
    setError(null);
    const isSecretary = currentUser?.role === 'Secretary';
    Promise.allSettled([
      fetchEnrollmentsPaginatedApi(p, PAGE_SIZE),
      fetchStudentsApi(),
      isSecretary ? Promise.resolve([]) : fetchClassesApi(),
    ]).then(([enr, stu, cls]) => {
      if (enr.status === 'fulfilled') {
        setEnrollments(enr.value.results || []);
        setTotalCount(enr.value.count);
      } else {
        setError('Failed to load enrollments');
      }
      if (stu.status === 'fulfilled') {
        setStudents(Array.isArray(stu.value) ? stu.value : []);
      }
      if (cls.status === 'fulfilled') {
        setClasses((Array.isArray(cls.value) ? cls.value : []).filter(c => c.is_active !== false));
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(page); }, [page, loadData]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  useEffect(() => {
    if (studentSearch.trim().length < 2) { setStudentResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      searchStudentsApi(studentSearch).then(res => {
        setStudentResults(Array.isArray(res) ? res : []);
      }).catch(() => {}).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const handleCancel = async (id: string) => {
    try {
      await cancelEnrollmentApi(id);
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'CANCELLED' as any } : e));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel enrollment');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeEnrollmentApi(id);
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'COMPLETED' as any } : e));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete enrollment');
    }
  };

  const handleCashPayment = async () => {
    if (!showPayment || !paymentForm.amount) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCashPaymentApi({
        enrollment: showPayment.id,
        amount: paymentForm.amount,
        payment_date: paymentForm.payment_date || undefined,
      });
      setEnrollments(prev => prev.map(e =>
        e.id === showPayment.id ? { ...e, status: 'ACTIVE' as any, payment_status: 'PAID' as any, payment_method: 'CASH' as any } : e
      ));
      setShowPayment(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnroll = async () => {
    if (!form.student || !form.enrolled_class) return;
    setSubmitting(true);
    setError(null);
    try {
      const enrollment = await enrollStudentApi(form);
      setTotalCount(prev => prev + 1);
      setEnrollments(prev => [enrollment, ...prev]);
      setForm(prev => ({ ...prev, remarks: '', student: '' }));
      setStudentSearch('');
      setStudentResults([]);
      setShowEnroll(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() =>
    enrollments.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${e.student_name || ''} ${e.class_name || ''} ${e.sub_program_name || ''}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    }),
    [enrollments, statusFilter, searchQuery]
  );

  const statusCounts = useMemo(() => ({
    ACTIVE: enrollments.filter(e => e.status === 'ACTIVE').length,
    PENDING_PAYMENT: enrollments.filter(e => e.status === 'PENDING_PAYMENT').length,
    COMPLETED: enrollments.filter(e => e.status === 'COMPLETED').length,
    CANCELLED: enrollments.filter(e => e.status === 'CANCELLED').length,
  }), [enrollments]);

  const exportCsv = () => {
    const headers = ['Student', 'Class', 'Program', 'Branch', 'Date', 'Status'];
    const rows = filtered.map(e => [
      e.student_name || '', e.class_name || '', e.sub_program_name || '', e.branch_name || '',
      e.enrolled_at?.slice(0, 10) || '', e.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'enrollments.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Enrollments</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {classes.length > 0 && (
            <button onClick={() => setShowEnroll(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search enrollments..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active ({statusCounts.ACTIVE})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pending ({statusCounts.PENDING_PAYMENT})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-blue" /> Completed ({statusCounts.COMPLETED})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Cancelled ({statusCounts.CANCELLED})</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Class</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">No enrollments found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{e.student_name || e.student_email || 'Unknown'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{e.class_name || e.sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{e.enrolled_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(e.status)}`}>{e.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(e)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors" title="View details"><Eye className="w-3.5 h-3.5" /></button>
                      {e.status === 'PENDING_PAYMENT' && (
                        <button onClick={() => { setPaymentForm({ amount: '', payment_date: new Date().toISOString().slice(0, 10) }); setShowPayment(e); }} className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors" title="Record cash payment"><DollarSign className="w-3.5 h-3.5" /></button>
                      )}
                      {e.status === 'ACTIVE' && (
                        <button onClick={() => handleComplete(e.id)} className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors" title="Mark completed"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                      )}
                      {(e.status === 'ACTIVE' || e.status === 'PENDING_PAYMENT') && (
                        <button onClick={() => handleCancel(e.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Cancel enrollment"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[11px] text-slate-500">{totalCount} total enrollments</span>
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-600 px-2">
              {page} / {totalPages}
            </span>
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">{selected.student_name || 'Enrollment'}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-medium">{selected.student_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{selected.student_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Class</span><span>{selected.class_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Program</span><span>{selected.program_name || selected.sub_program_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Branch</span><span>{selected.branch_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Enrolled</span><span>{selected.enrolled_at?.slice(0, 10) || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(selected.status)}`}>{selected.status?.replace('_', ' ')}</span></div>
              {selected.payment_status && <div className="flex justify-between"><span className="text-slate-500">Payment</span><span>{selected.payment_status}</span></div>}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Cash Payment modal */}
      {showPayment && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setShowPayment(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Record Cash Payment</h3>
              <button onClick={() => setShowPayment(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Student: <span className="font-medium text-slate-700">{showPayment.student_name || showPayment.student_email}</span>
              <br />
              Class: <span className="font-medium text-slate-700">{showPayment.class_name || '—'}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Amount (Birr)</label>
                <input type="number" step="0.01" min="0" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                  placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Payment Date</label>
                <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setShowPayment(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleCashPayment} disabled={submitting || !paymentForm.amount}
                className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                {submitting ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Enroll Student modal */}
      <AnimatePresence>
        {showEnroll && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnroll(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Enroll Student</h3>
                  <button onClick={() => setShowEnroll(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Student</label>
                    <div className="relative">
                      <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setForm(p => ({ ...p, student: '' })); }}
                        placeholder="Search student by name or email..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
                    </div>
                    {studentResults.length > 0 && !form.student && (
                      <div className="mt-1 border border-slate-200 rounded-lg bg-white max-h-32 overflow-y-auto shadow-sm">
                        {studentResults.map(s => {
                          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                          return (
                            <button key={s.id} type="button" onClick={() => {
                              setForm(p => ({ ...p, student: s.id }));
                              setStudentSearch(name);
                              setStudentResults([]);
                            }} className="w-full text-left px-3 py-2 text-xs hover:bg-brand-blue/10 transition-colors flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-brand-blue/20 flex items-center justify-center text-[8px] font-bold text-brand-blue">{name.charAt(0)}</div>
                              {name} <span className="text-slate-400">— {s.email}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {form.student && !searching && (
                      <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Student selected</p>
                    )}
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Class</label>
                    {classes.length === 0 ? (
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-400">Classes unavailable — check your permissions</div>
                    ) : (
                      <select value={form.enrolled_class} onChange={e => setForm(p => ({ ...p, enrolled_class: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                        <option value="">Select class...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {c.sub_program_name || 'Program'} · {c.branch_name || 'Branch'}</option>)}
                      </select>
                    )}
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Remarks</label><input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Optional note" /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowEnroll(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleEnroll} disabled={submitting || !form.student || !form.enrolled_class}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
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
