import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Filter, CheckCircle, Clock, XCircle, AlertCircle, Eye, X, Loader2, Shield, ShieldOff } from 'lucide-react';
import { fetchEnrollmentsApi, cancelEnrollmentApi, fetchStudentCertificatesApi, downloadEnrollmentReportPdf } from '@/src/domains/learning/academics/api/academicApi';
import type { Enrollment, StudentCertificate } from '@/src/shared/types';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  ACTIVE: CheckCircle,
  PENDING_PAYMENT: Clock,
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
                  <span key={c.id} className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-red/5 text-brand-red px-3 py-1.5 rounded-full border border-brand-red/10">
                    <Shield className="w-3.5 h-3.5" />
                    {c.certificate_title || c.sub_program_name || 'Certificate'}
                  </span>
                ))}
              </div>
              <button
                onClick={() => downloadEnrollmentReportPdf(studentId)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-red px-4 py-2 rounded-lg hover:bg-brand-red-dark transition-colors"
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
          { label: 'Pending', value: registrations.filter(r => r.status === 'PENDING_PAYMENT').length.toString(), color: 'text-amber-600' },
          { label: 'Completed', value: registrations.filter(r => r.status === 'COMPLETED').length.toString(), color: 'text-brand-red' },
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
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_PAYMENT">Pending</option>
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
                        {reg.status === 'PENDING_PAYMENT' ? 'Pending' : reg.status.charAt(0) + reg.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {reg.status === 'ACTIVE' || reg.status === 'PENDING_PAYMENT' ? (
                        <button onClick={() => cancelRegistration(reg.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Cancel">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
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
    </div>
  );
}