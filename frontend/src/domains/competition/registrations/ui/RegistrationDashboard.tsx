import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Search,
  Shield, Ban, ArrowUpRight, Mail,
} from 'lucide-react';
import { adminGetRegistrations, adminApproveRegistration, adminRejectRegistration, adminCancelRegistration } from '../../api/competitionApi';

export default function RegistrationDashboard() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    setActionLoading(id);
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
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><XCircle className="w-3.5 h-3.5" /></button>
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
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      r.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                      r.payment_status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{r.payment_status || '—'}</span>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
