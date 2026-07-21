import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, CheckCircle, Clock, XCircle, AlertCircle, Eye, X, Loader2, Shield, ShieldOff, ArrowRight } from 'lucide-react';
import { fetchEnrollmentsApi, cancelEnrollmentApi, fetchStudentCertificatesApi, downloadEnrollmentReportPdf, fetchBranchesApi, fetchClassesApi, requestTransferApi } from '@/domains/learning/academics/api/academicApi';
import type { Enrollment, StudentCertificate, AcademicClass } from '@/shared/types';
import { isForbiddenError } from '@/shared/api/http';
import { formatApiError } from '@/shared/utils/formatApiError';

type Branch = { id: string; name: string; code?: string };

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-600',
  CANCELLED: 'bg-red-100 text-red-600',
  REJECTED: 'bg-red-100 text-red-600',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  ACTIVE: CheckCircle,
  PENDING_VERIFICATION: Clock,
  COMPLETED: AlertCircle,
  CANCELLED: XCircle,
  REJECTED: XCircle,
};

interface Props { studentId: string }

export default function MyRegistrations({ studentId }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [registrations, setRegistrations] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Enrollment | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [transferBranch, setTransferBranch] = useState('');
  const [transferClass, setTransferClass] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferDone, setTransferDone] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Enrollment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollmentsApi(studentId).then(setRegistrations).catch((err) => {
      if (isForbiddenError(err)) {
        setPermissionDenied(true);
        fetchStudentCertificatesApi(studentId).then(setCertificates).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [studentId]);

  const cancelRegistration = async (id: string) => {
    if (!window.confirm('Cancel this enrollment? This action may require staff review.')) return;
    setCancellingId(id);
    setActionError(null);
    try {
      await cancelEnrollmentApi(id);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' as const } : r));
      setSelectedRegistration(prev => prev?.id === id ? { ...prev, status: 'CANCELLED' as const } : prev);
    } catch (e: unknown) {
      setActionError(formatApiError(e) || 'Unable to cancel this enrollment.');
    } finally {
      setCancellingId(null);
    }
  };

  const openTransfer = async (reg: Enrollment) => {
    setTransferTarget(reg);
    setTransferBranch('');
    setTransferClass('');
    setTransferDone(false);
    setTransferError(null);
    try {
      const [b, c] = await Promise.all([fetchBranchesApi(), fetchClassesApi()]);
      setBranches(b);
      setClasses(c);
    } catch {}
  };

  const handleTransfer = async () => {
    if (!transferTarget || !transferBranch || !transferClass) return;
    setTransferring(true);
    setTransferError(null);
    try {
      await requestTransferApi({ enrollment: transferTarget.id, to_branch: transferBranch, target_class: transferClass });
      setTransferDone(true);
    } catch (e: unknown) {
      setTransferError(formatApiError(e) || 'Transfer request failed');
    } finally {
      setTransferring(false);
    }
  };

  const filtered = registrations.filter(r => {
    const haystack = `${r.program_name || ''} ${r.sub_program_name || ''} ${r.class_name || ''} ${r.pending_code || ''} ${r.enrollment_number || ''}`.toLowerCase();
    const matchSearch = haystack.includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusLabel = (value?: string | null) => value
    ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : 'Not Available';

  const dateLabel = (value?: string | null) => value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not Available';

  if (loading) {
    return (
      <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
    );
  }

  if (permissionDenied && registrations.length === 0) {
    return (
      <div>
        <div className="bg-white border border-brand-border rounded-2xl p-8 text-center">
          <ShieldOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="font-bold text-lg text-slate-900 mb-2">Enrollments Unavailable</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Student enrollment data requires staff-level access. If you recently enrolled, please contact the administration.
          </p>
          {certificates.length > 0 && (
            <div className="mt-4 pt-6 border-t border-brand-border">
              <p className="text-sm font-medium text-slate-700 mb-3">Your Certificates ({certificates.length})</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {certificates.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-600/5 text-blue-600 px-3 py-1.5 rounded-full border border-blue-600/10">
                    <Shield className="w-3.5 h-3.5" />
                    {c.certificate_title || c.sub_program_name || 'Certificate'}
                  </span>
                ))}
              </div>
              <button
                onClick={() => downloadEnrollmentReportPdf(studentId)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Report
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: registrations.length.toString(), color: 'text-brand-blue' },
          { label: 'Active', value: registrations.filter(r => r.status === 'ACTIVE').length.toString(), color: 'text-emerald-600' },
          { label: 'Pending', value: registrations.filter(r => r.status === 'PENDING_VERIFICATION').length.toString(), color: 'text-amber-600' },
          { label: 'Completed', value: registrations.filter(r => r.status === 'COMPLETED').length.toString(), color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`font-black text-lg mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-brand-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Class</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">Reference</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg) => {
                const StatusIcon = STATUS_ICONS[reg.status] || Clock;
                return (
                  <tr key={reg.id} className="border-b border-brand-border last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{reg.program_name || reg.sub_program_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{reg.class_name || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-blue hidden md:table-cell">{reg.pending_code || reg.enrollment_number || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{reg.branch_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {reg.enrolled_at?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[reg.status] || 'bg-slate-100 text-slate-600'}`}>
                        <StatusIcon className="w-3 h-3" />
                        {reg.status === 'PENDING_VERIFICATION' ? 'Pending' : reg.status.charAt(0) + reg.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedRegistration(reg)} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="View enrollment details" aria-label={`View details for ${reg.program_name || reg.sub_program_name || 'enrollment'}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {reg.status === 'ACTIVE' && (
                          <button onClick={() => openTransfer(reg)} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Request transfer">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {reg.status === 'ACTIVE' || reg.status === 'PENDING_VERIFICATION' ? (
                          <button onClick={() => cancelRegistration(reg.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Cancel">
                            {cancellingId === reg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                  {search || filterStatus !== 'all' ? 'No registrations matching your filters' : 'No registrations found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedRegistration(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-brand-border bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-brand-border px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Enrollment details</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">{selectedRegistration.program_name || selectedRegistration.sub_program_name || 'Program'}</h3>
                <p className="mt-1 text-xs text-slate-500">{selectedRegistration.class_name || 'Class not available'}</p>
              </div>
              <button onClick={() => setSelectedRegistration(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close details"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[selectedRegistration.status] || 'bg-slate-100 text-slate-600'}`}>{statusLabel(selectedRegistration.status)}</span>
                {selectedRegistration.verification_status && <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold text-violet-700">Verification: {statusLabel(selectedRegistration.verification_status)}</span>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Program', selectedRegistration.program_name || selectedRegistration.sub_program_name],
                  ['Class', selectedRegistration.class_name],
                  ['Class type', selectedRegistration.class_type],
                  ['Branch', selectedRegistration.branch_name],
                  ['Enrollment number', selectedRegistration.enrollment_number || selectedRegistration.pending_code],
                  ['Enrolled on', dateLabel(selectedRegistration.enrolled_at)],
                  ['Payment status', selectedRegistration.payment_status],
                  ['Payment method', selectedRegistration.payment_method],
                  ['Last updated', dateLabel(selectedRegistration.updated_at)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-brand-border bg-slate-50/70 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{value ? statusLabel(value) : 'Not Available'}</p>
                  </div>
                ))}
              </div>

              {(selectedRegistration.rejection_reason || selectedRegistration.remarks || selectedRegistration.transferred_from) && (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  {selectedRegistration.rejection_reason && <p><strong>Reason:</strong> {selectedRegistration.rejection_reason}</p>}
                  {selectedRegistration.remarks && <p><strong>Remarks:</strong> {selectedRegistration.remarks}</p>}
                  {selectedRegistration.transferred_from && <p><strong>Transferred from:</strong> {selectedRegistration.transferred_from}</p>}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-brand-border pt-4">
                <button onClick={() => downloadEnrollmentReportPdf(studentId)} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><Download className="h-3.5 w-3.5" /> Download report</button>
                {selectedRegistration.status === 'ACTIVE' && <button onClick={() => { setSelectedRegistration(null); openTransfer(selectedRegistration); }} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><ArrowRight className="h-3.5 w-3.5" /> Request transfer</button>}
                {(selectedRegistration.status === 'ACTIVE' || selectedRegistration.status === 'PENDING_VERIFICATION') && <button onClick={() => cancelRegistration(selectedRegistration.id)} disabled={cancellingId === selectedRegistration.id} className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Cancel enrollment</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {transferTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTransferTarget(null)}>
          <div className="bg-white rounded-2xl border border-brand-border max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-brand-border/50">
              <h3 className="font-bold text-brand-ink text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Transfer request</h3>
              <button onClick={() => setTransferTarget(null)} className="p-1 rounded-lg hover:bg-brand-surface transition-colors"><XCircle className="w-5 h-5 text-brand-muted" /></button>
            </div>
            <div className="p-4 space-y-3">
              {transferDone ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-brand-ink">Transfer requested</p>
                  <p className="text-xs text-brand-muted mt-1">Staff will review your request.</p>
                  <button onClick={() => setTransferTarget(null)} className="mt-4 px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-xl">Done</button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-brand-muted">Request transfer for <span className="font-semibold text-brand-ink">{transferTarget.program_name || transferTarget.sub_program_name}</span></p>
                  <div>
                    <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wide mb-1 block">To branch</label>
                    <select value={transferBranch} onChange={e => setTransferBranch(e.target.value)}
                      className="form-input w-full">
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wide mb-1 block">Target class</label>
                    <select value={transferClass} onChange={e => setTransferClass(e.target.value)}
                      className="form-input w-full">
                      <option value="">Select class...</option>
                      {classes.filter(c => !transferBranch || c.branch === transferBranch).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {transferBranch && classes.filter(c => c.branch === transferBranch).length === 0 && (
                    <p className="text-xs text-amber-600">No classes available at the selected branch.</p>
                  )}
                  {transferError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {transferError}
                    </div>
                  )}
                  <button onClick={handleTransfer} disabled={transferring || !transferBranch || !transferClass}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {transferring ? 'Requesting...' : 'Request transfer'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
