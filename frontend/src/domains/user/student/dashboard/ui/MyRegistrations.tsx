import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Filter, CheckCircle, Clock, XCircle, AlertCircle, Eye, X, Loader2, Shield, ShieldOff, ArrowRight } from 'lucide-react';
import { fetchEnrollmentsApi, cancelEnrollmentApi, fetchStudentCertificatesApi, downloadEnrollmentReportPdf, fetchBranchesApi, fetchClassesApi, requestTransferApi } from '@/domains/learning/academics/api/academicApi';
import type { Enrollment, StudentCertificate, AcademicClass } from '@/shared/types';

type Branch = { id: string; name: string; code?: string };

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  ACTIVE: CheckCircle,
  PENDING_VERIFICATION: Clock,
  COMPLETED: AlertCircle,
  CANCELLED: XCircle,
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

  useEffect(() => {
    fetchEnrollmentsApi(studentId).then(setRegistrations).catch(() => {
      setPermissionDenied(true);
      fetchStudentCertificatesApi(studentId).then(setCertificates).catch(() => {});
    }).finally(() => setLoading(false));
  }, [studentId]);

  const cancelRegistration = async (id: string) => {
    try {
      await cancelEnrollmentApi(id);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' as const } : r));
    } catch {}
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
      setTransferError(e instanceof Error ? e.message : 'Transfer request failed');
    } finally {
      setTransferring(false);
    }
  };

  const filtered = registrations.filter(r => {
    const matchSearch = (r.program_name || r.sub_program_name || r.class_name || '').toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalFee = 0;

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
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Class</th>
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
                        {reg.status === 'ACTIVE' && (
                          <button onClick={() => openTransfer(reg)} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Request transfer">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {reg.status === 'ACTIVE' || reg.status === 'PENDING_VERIFICATION' ? (
                          <button onClick={() => cancelRegistration(reg.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-xs text-slate-400">No registrations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
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