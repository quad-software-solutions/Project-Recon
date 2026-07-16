import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, AlertCircle, Users, CheckCircle, XCircle, Eye, Send, CreditCard, Trophy, GraduationCap, Calendar, BarChart3, TrendingUp, UserPlus, Clock, Shield } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendEventRegistration, RegistrationStatus } from '../api/eventsApi';

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
      const actions: Record<string, () => Promise<any>> = {
        approve: () => eventsApi.adminApproveRegistration(id),
        reject: () => eventsApi.adminRejectRegistration(id),
        cancel: () => eventsApi.adminCancelRegistration(id),
      };
      await actions[action]();
      load();
      if (selected?.id === id) {
        try { setSelected(await eventsApi.adminGetRegistration(id)); } catch {}
      }
    } catch (err: any) { setError(`${action} failed: ${err.message}`); }
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
    } catch (err: any) { setError(`Convert failed: ${err.message}`); }
  };

  const handleCashPayment = async () => {
    if (!selected || !cashAmount) return;
    try {
      await eventsApi.adminRecordCashPayment(selected.id, { amount: cashAmount, payment_date: new Date().toISOString() });
      setCashAmount('');
      const updated = await eventsApi.adminGetRegistration(selected.id);
      setSelected(updated);
      load();
    } catch (err: any) { setError(`Payment failed: ${err.message}`); }
  };

  const handleVerifyPayment = async () => {
    if (!selected) return;
    try {
      await eventsApi.adminVerifyPayment(selected.id, { verification_notes: verifyNotes || undefined });
      setVerifyNotes('');
      const updated = await eventsApi.adminGetRegistration(selected.id);
      setSelected(updated);
      load();
    } catch (err: any) { setError(`Verification failed: ${err.message}`); }
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
    } catch (err: any) { setError(`Rejection failed: ${err.message}`); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const payStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING_VERIFICATION: 'bg-amber-100 text-amber-700',
      VERIFIED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const typeBadge = (t?: string) => {
    const map: Record<string, string> = {
      TOURNAMENT: 'bg-purple-100 text-purple-700',
      WORKSHOP: 'bg-cyan-100 text-cyan-700',
      GENERAL: 'bg-slate-100 text-slate-600',
    };
    return map[t || ''] || 'bg-slate-100 text-slate-600';
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>)}

      {/* Dashboard stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Registrations', value: stats.total, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tournament Entries', value: stats.tournaments, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h3 className="font-black text-lg text-slate-900">Event Registrations</h3><p className="text-xs text-slate-500 mt-1">{registrations.length} total · {stats.pending} pending review</p></div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }} className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red">
            <option value="all">All</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl"><Users className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="font-bold text-slate-600">No registrations</p></div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-brand-border">
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Participant</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Event</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Type</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Payment</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 flex items-center justify-center">
                        <Users className="w-4 h-4 text-brand-blue" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900">{r.public_full_name || r.student_email || 'Anonymous'}</span>
                        {r.public_email && <span className="text-[10px] text-slate-500 block">{r.public_email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-600">{r.event_title || r.event}</td>
                  <td className="px-4 py-3 text-center">
                    {r.event_type && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeBadge(r.event_type)}`}>{r.event_type}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(r.registration_status)}`}>{r.registration_status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${payStatusBadge(r.payment_status)}`}>{r.payment_status}</span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue"><Eye className="w-3.5 h-3.5" /></button>
                      {r.registration_status === 'PENDING' && (
                        <>
                          <button onClick={() => handleAction(r.id, 'approve')} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleAction(r.id, 'reject')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {r.registration_status === 'APPROVED' && (
                        <button onClick={() => handleAction(r.id, 'convert')} className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50" title="Convert to Team"><Send className="w-3.5 h-3.5" /></button>
                      )}
                      {r.registration_status !== 'CANCELLED' && r.registration_status !== 'REJECTED' && (
                        <button onClick={() => handleAction(r.id, 'cancel')} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500" title="Cancel"><XCircle className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-slate-900">Registration Detail</h3>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase block">Name</label><p className="text-sm font-medium text-slate-900">{selected.public_full_name || selected.student_email || 'N/A'}</p></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase block">Email</label><p className="text-sm text-slate-900">{selected.public_email || selected.student_email || 'N/A'}</p></div>
                  {selected.public_phone && <div><label className="text-[10px] font-bold text-slate-500 uppercase block">Phone</label><p className="text-sm text-slate-900">{selected.public_phone}</p></div>}
                  {selected.public_organization && <div><label className="text-[10px] font-bold text-slate-500 uppercase block">Organization</label><p className="text-sm text-slate-900">{selected.public_organization}</p></div>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase block">Registration Status</label><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(selected.registration_status)}`}>{selected.registration_status}</span></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase block">Payment Status</label><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${payStatusBadge(selected.payment_status)}`}>{selected.payment_status}</span></div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Event</label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-slate-900">{selected.event_title || selected.event}</p>
                    {selected.event_type && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeBadge(selected.event_type)}`}>{selected.event_type}</span>}
                  </div>
                </div>

                {selected.registration_status === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => handleAction(selected.id, 'approve')} className="flex-1 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                    <button onClick={() => handleAction(selected.id, 'reject')} className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 flex items-center justify-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </div>
                )}

                {selected.registration_status === 'APPROVED' && selected.payment_status === 'PENDING_VERIFICATION' && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-bold text-xs text-slate-700 mb-3">Record Cash Payment</h4>
                    <div className="flex items-center gap-2">
                      <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="Amount" className="flex-1 px-3 py-2 bg-white border border-brand-border rounded-lg text-xs" />
                      <button onClick={handleCashPayment} className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-red-dark flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Pay Cash</button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={handleVerifyPayment} className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" /> Verify Payment
                      </button>
                      <button onClick={() => setShowRejectModal(true)} className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 flex items-center justify-center gap-1">
                        <XCircle className="w-3 h-3" /> Reject Payment
                      </button>
                    </div>
                  </div>
                )}

                {selected.registration_status === 'APPROVED' && (
                  <button onClick={() => { setPendingConvertId(selected.id); setTeamName(''); setShowTeamNameModal(true); }} className="px-4 py-2 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" /> Convert to Team</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTeamNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamNameModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 z-10">
              <h3 className="font-black text-lg text-slate-900 mb-2">Convert to Team</h3>
              <p className="text-xs text-slate-500 mb-4">Enter a name for the tournament team.</p>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red mb-4" />
              <div className="flex items-center gap-2">
                <button onClick={() => setShowTeamNameModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleConvertWithTeamName} disabled={!teamName.trim()}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Convert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRejectModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 z-10">
              <h3 className="font-black text-lg text-slate-900 mb-2">Reject Payment</h3>
              <p className="text-xs text-slate-500 mb-4">Provide a reason for rejecting this payment.</p>
              <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Rejection reason *" autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red mb-4" rows={3} />
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleRejectPayment} disabled={!rejectNotes.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Reject Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
