import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, AlertCircle, Users, CheckCircle, XCircle, Send, CreditCard, Trophy, Clock, Shield, User, Mail, Phone, Building2, Ban } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendEventRegistration } from '../api/eventsApi';
import { formatApiError } from '@/shared/utils/formatApiError';

const STATUS_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  PENDING: { dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
  APPROVED: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
  REJECTED: { dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
  CANCELLED: { dot: 'bg-slate-400', bg: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Cancelled' },
};

const PAY_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  PENDING_VERIFICATION: { dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending verification' },
  VERIFIED: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Verified' },
  REJECTED: { dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
  CANCELLED: { dot: 'bg-slate-400', bg: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Cancelled' },
};

const TYPE_STYLES: Record<string, string> = {
  TOURNAMENT: 'bg-purple-50 text-purple-700 border-purple-200',
  WORKSHOP: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

function StatCard({ icon: Icon, label, value, color, delay }: { icon: any; label: string; value: number; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${color}/10`} />
      <div className={`w-9 h-9 rounded-xl ${color}/15 flex items-center justify-center mb-2.5`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

function Badge({ children, style }: { children: string; style: { dot: string; bg: string; label: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export default function RegistrationManager() {
  const [registrations, setRegistrations] = useState<BackendEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<BackendEventRegistration | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showTeamNameModal, setShowTeamNameModal] = useState(false);
  const [pendingConvertId, setPendingConvertId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = (status?: string) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status && status !== 'all') params.status = status;
    eventsApi.adminGetRegistrations(params)
      .then(r => setRegistrations(Array.isArray(r) ? r : []))
      .catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'cancel' | 'convert') => {
    try {
      if (action === 'convert') {
        setPendingConvertId(id);
        setTeamName('');
        setShowTeamNameModal(true);
        return;
      }
      if (action === 'reject' || action === 'cancel') {
        if (!window.confirm(`Are you sure you want to ${action === 'reject' ? 'reject' : 'cancel'} this registration?`)) return;
      }
      setActionLoading(id);
      const actions: Record<string, () => Promise<any>> = {
        approve: () => eventsApi.adminApproveRegistration(id),
        reject: () => eventsApi.adminRejectRegistration(id),
        cancel: () => eventsApi.adminCancelRegistration(id),
      };
      await actions[action]();
      if (selected?.id === id) {
        const updated = await eventsApi.adminGetRegistration(id);
        setSelected(updated);
      }
      load();
    } catch (err: any) { setError(`${action} failed: ${formatApiError(err)}`); }
    finally { setActionLoading(null); }
  };

  const handleConvertWithTeamName = async () => {
    if (!pendingConvertId || !teamName.trim()) return;
    try {
      await eventsApi.adminConvertRegistrationToTeam(pendingConvertId, teamName.trim());
      setShowTeamNameModal(false);
      setPendingConvertId(null);
      setTeamName('');
      load();
      if (selected?.id === pendingConvertId) {
        try { setSelected(await eventsApi.adminGetRegistration(pendingConvertId)); } catch {}
      }
    } catch (err: any) { setError(`Convert failed: ${formatApiError(err)}`); }
  };

  const handleCashPayment = async () => {
    if (!selected || !cashAmount) return;
    try {
      await eventsApi.adminRecordCashPayment(selected.id, { amount: cashAmount, payment_date: new Date().toISOString() });
      setCashAmount('');
      const updated = await eventsApi.adminGetRegistration(selected.id);
      setSelected(updated);
      load();
    } catch (err: any) { setError(`Payment failed: ${formatApiError(err)}`); }
  };

  const handleVerifyPayment = async () => {
    if (!selected) return;
    try {
      await eventsApi.adminVerifyPayment(selected.id, { verification_notes: verifyNotes || undefined });
      setVerifyNotes('');
      const updated = await eventsApi.adminGetRegistration(selected.id);
      setSelected(updated);
      load();
    } catch (err: any) { setError(`Verification failed: ${formatApiError(err)}`); }
  };

  const handleRejectPayment = async () => {
    if (!selected || !rejectNotes.trim()) return;
    try {
      await eventsApi.adminRejectPayment(selected.id, { verification_notes: rejectNotes });
      setRejectNotes('');
      setShowRejectModal(false);
      const updated = await eventsApi.adminGetRegistration(selected.id);
      setSelected(updated);
      load();
    } catch (err: any) { setError(`Rejection failed: ${formatApiError(err)}`); }
  };

  const filtered = registrations.filter(r => {
    const name = r.public_full_name || r.student_email || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.registration_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: registrations.length,
    pending: registrations.filter(r => r.registration_status === 'PENDING').length,
    approved: registrations.filter(r => r.registration_status === 'APPROVED').length,
    tournaments: registrations.filter(r => r.event_type === 'TOURNAMENT').length,
  }), [registrations]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 rounded-lg hover:bg-red-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total registrations" value={stats.total} color="text-blue-600" delay={0} />
        <StatCard icon={Clock} label="Pending review" value={stats.pending} color="text-amber-600" delay={0.05} />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="text-emerald-600" delay={0.1} />
        <StatCard icon={Trophy} label="Tournament entries" value={stats.tournaments} color="text-purple-600" delay={0.15} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Event Registrations</h3>
          <p className="text-xs text-slate-500 mt-0.5">{registrations.length} total &middot; {stats.pending} pending</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-44 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400">
            <option value="all">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">No registrations found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Participant</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Event</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Type</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Payment</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{r.public_full_name || r.student_email || 'Anonymous'}</p>
                        {r.public_email && <p className="text-[10px] text-slate-500 truncate">{r.public_email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-slate-600 truncate max-w-[180px]">{r.event_title || r.event}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.event_type && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${TYPE_STYLES[r.event_type] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {r.event_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge style={STATUS_STYLES[r.registration_status] || STATUS_STYLES.CANCELLED}>{r.registration_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge style={PAY_STYLES[r.payment_status] || PAY_STYLES.CANCELLED}>{r.payment_status}</Badge>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {r.registration_status === 'PENDING' && (
                        <>
                          <button onClick={() => handleAction(r.id, 'approve')} disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors" title="Approve">
                            {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleAction(r.id, 'reject')} disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors" title="Reject">
                            {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                      {r.registration_status === 'APPROVED' && (
                        <button onClick={() => handleAction(r.id, 'convert')} disabled={actionLoading === r.id}
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 disabled:opacity-40 transition-colors" title="Convert to Team">
                          {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {r.registration_status !== 'CANCELLED' && r.registration_status !== 'REJECTED' && (
                        <button onClick={() => handleAction(r.id, 'cancel')} disabled={actionLoading === r.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors" title="Cancel">
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

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Registration Detail</h3>
                    <p className="text-[10px] text-slate-500">{selected.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Participant</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-900">{selected.public_full_name || selected.student_email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700">{selected.public_email || selected.student_email || 'N/A'}</span>
                    </div>
                    {selected.public_phone && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{selected.public_phone}</span>
                      </div>
                    )}
                    {selected.public_organization && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{selected.public_organization}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event</h4>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Trophy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-900">{selected.event_title || selected.event}</span>
                      {selected.event_type && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold border ${TYPE_STYLES[selected.event_type] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {selected.event_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Registration</h4>
                    <Badge style={STATUS_STYLES[selected.registration_status] || STATUS_STYLES.CANCELLED}>{selected.registration_status}</Badge>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment</h4>
                    <Badge style={PAY_STYLES[selected.payment_status] || PAY_STYLES.CANCELLED}>{selected.payment_status}</Badge>
                  </div>
                </div>

                {selected.registration_status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(selected.id, 'approve')} disabled={actionLoading === selected.id}
                      className="flex-1 px-4 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                      {actionLoading === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    <button onClick={() => handleAction(selected.id, 'reject')} disabled={actionLoading === selected.id}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                      {actionLoading === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Reject
                    </button>
                  </div>
                )}

                {selected.payment_status === 'PENDING_VERIFICATION' && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-xs text-slate-700">
                      {selected.registration_status === 'PENDING' ? 'Payment requires review before approval' : 'Payment actions'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="Amount" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400" />
                      <button onClick={handleCashPayment} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shrink-0">
                        <CreditCard className="w-3.5 h-3.5" /> Cash
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleVerifyPayment} className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-1 transition-colors">
                        <Shield className="w-3 h-3" /> Verify
                      </button>
                      <button onClick={() => setShowRejectModal(true)} className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 flex items-center justify-center gap-1 transition-colors">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {selected.registration_status === 'APPROVED' && (
                  <button onClick={() => { setPendingConvertId(selected.id); setTeamName(''); setShowTeamNameModal(true); }}
                    className="w-full px-4 py-2.5 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 flex items-center justify-center gap-1.5 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Convert to Team
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Convert to Team modal */}
      <AnimatePresence>
        {showTeamNameModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTeamNameModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10">
              <h3 className="font-bold text-lg text-slate-900 mb-1">Convert to Team</h3>
              <p className="text-sm text-slate-500 mb-4">Enter a name for the tournament team.</p>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 mb-4" />
              <div className="flex items-center gap-2">
                <button onClick={() => setShowTeamNameModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={handleConvertWithTeamName} disabled={!teamName.trim()}
                  className="flex-1 px-4 py-2.5 bg-purple-500 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                  <Send className="w-4 h-4" /> Convert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Payment modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRejectModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10">
              <h3 className="font-bold text-lg text-slate-900 mb-1">Reject Payment</h3>
              <p className="text-sm text-slate-500 mb-4">Provide a reason for rejecting this payment.</p>
              <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Rejection reason *" autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 mb-4" rows={3} />
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={handleRejectPayment} disabled={!rejectNotes.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                  <XCircle className="w-4 h-4" /> Reject Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
