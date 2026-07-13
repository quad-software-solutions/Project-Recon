import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, CheckCircle, Clock, XCircle, AlertCircle, Loader2, ShieldOff } from 'lucide-react';
import { getMyRegistrations, cancelMyRegistration } from '@/src/domains/competition/api/eventsApi';
import type { BackendEventRegistration } from '@/src/domains/competition/api/eventsApi';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  CANCELLED: AlertCircle,
};

export default function MyRegistrations() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [registrations, setRegistrations] = useState<BackendEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getMyRegistrations()
      .then(data => setRegistrations(Array.isArray(data) ? data : []))
      .catch(() => setError('Unable to load event registrations.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const [cancelError, setCancelError] = useState<string | null>(null);

  const cancelRegistration = async (id: string) => {
    setCancelError(null);
    try {
      await cancelMyRegistration(id);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, registration_status: 'CANCELLED' as const } : r));
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel registration.');
    }
  };

  const filtered = registrations.filter(r => {
    const title = r.event_title || r.event || '';
    const status = r.registration_status;
    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>;
  }

  if (error) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center">
        <ShieldOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-bold text-xl text-slate-900">Event Registrations</h3>
        <p className="text-xs text-slate-500 mt-1">Tournaments, workshops, and competitions from the events API.</p>
      </div>

      {cancelError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {cancelError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: registrations.length, color: 'text-brand-blue' },
          { label: 'Approved', value: registrations.filter(r => r.registration_status === 'APPROVED').length, color: 'text-emerald-600' },
          { label: 'Pending', value: registrations.filter(r => r.registration_status === 'PENDING').length, color: 'text-amber-600' },
          { label: 'Cancelled', value: registrations.filter(r => r.registration_status === 'CANCELLED').length, color: 'text-slate-500' },
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
            <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs">
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Event</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Registered</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(reg => {
                const status = reg.registration_status;
                const StatusIcon = STATUS_ICONS[status] || Clock;
                return (
                  <tr key={reg.id} className="border-b border-brand-border last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{reg.event_title || reg.event}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {reg.registered_at?.slice(0, 10) || reg.created_at?.slice(0, 10) || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || 'bg-slate-100'}`}>
                        <StatusIcon className="w-3 h-3" /> {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(status === 'PENDING' || status === 'APPROVED') && (
                        <button onClick={() => cancelRegistration(reg.id)} className="text-[10px] font-bold text-red-600 hover:underline">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-xs text-slate-400">No event registrations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
