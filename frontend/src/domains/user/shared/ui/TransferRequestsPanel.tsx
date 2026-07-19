import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRightLeft, CheckCircle2, Loader2, XCircle, Calendar,
  RefreshCw, Search, Clock, AlertTriangle, Ban, CheckCheck, Plus,
} from 'lucide-react';
import {
  listTransferRequestsApi,
  approveTransferApi,
  rejectTransferApi,
  fetchBranchesApi,
  fetchEnrollmentsApi,
  fetchClassesApi,
  requestTransferApi,
  type BranchTransferRequest,
} from '@/domains/learning/academics/api/academicApi';
import type { Enrollment, AcademicClass } from '@/domains/learning/model/types';
import type { Branch } from '@/domains/learning/academics/api/academicApi';
import type { UserProfile } from '@/shared/types';
import { formatApiError } from '@/shared/utils/formatApiError';
import { isSuperAdmin } from '@/shared/auth/permissions';

interface Props {
  currentUser?: UserProfile;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function assignmentsToBranches(user?: UserProfile): Branch[] {
  if (!user?.assignments) return [];
  const map = new Map<string, string>();
  for (const a of user.assignments) {
    if (a.is_active && a.branch_id) map.set(a.branch_id, a.branch_name || 'Unknown');
  }
  return [...map.entries()].map(([id, name]) => ({ id, name, code: '' }));
}

type FilterTab = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function TransferRequestsPanel({ currentUser, addToast }: Props) {
  const [items, setItems] = useState<BranchTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [branchMap, setBranchMap] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  /* ── New transfer modal state ── */
  const [showNew, setShowNew] = useState(false);
  const [newSubmitting, setNewSubmitting] = useState(false);
  const [newEnrollments, setNewEnrollments] = useState<Enrollment[]>([]);
  const [newEnrollLoading, setNewEnrollLoading] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedEnroll, setSelectedEnroll] = useState<Enrollment | null>(null);
  const [newBranches, setNewBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState('');
  const [newClasses, setNewClasses] = useState<AcademicClass[]>([]);
  const [newClass, setNewClass] = useState('');
  const [newError, setNewError] = useState('');

  const formatTransferError = (err: unknown, fallback: string) => {
    const msg = formatApiError(err);
    if (msg.includes('temporarily unavailable') || msg.includes('try again later') || msg.includes('Something went wrong on our side')) {
      return 'Transfer requests are temporarily unavailable. Please ask support to repair the transfer service, then try again.';
    }
    return msg || fallback;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const branchesPromise = isSuperAdmin(currentUser) ? fetchBranchesApi() : Promise.resolve(assignmentsToBranches(currentUser));
      const [data, branchesList] = await Promise.all([
        listTransferRequestsApi(),
        branchesPromise,
      ]);
      setItems(Array.isArray(data) ? data : []);
      const map: Record<string, string> = {};
      (Array.isArray(branchesList) ? branchesList : []).forEach((b: any) => { map[b.id] = b.name; });
      setBranchMap(map);
    } catch (err) {
      setError(formatTransferError(err, 'Failed to load transfer requests'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(t => t.status === 'PENDING').length;
    const approved = items.filter(t => t.status === 'APPROVED').length;
    const rejected = items.filter(t => t.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter(t => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (branchMap[t.from_branch] || '').toLowerCase().includes(q) ||
        (branchMap[t.to_branch] || '').toLowerCase().includes(q) ||
        t.enrollment.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search, branchMap]);

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'PENDING', label: 'Pending', count: stats.pending },
    { key: 'APPROVED', label: 'Approved', count: stats.approved },
    { key: 'REJECTED', label: 'Rejected', count: stats.rejected },
  ];

  const filteredEnrolls = useMemo(() => {
    if (!enrollSearch.trim()) return newEnrollments;
    const q = enrollSearch.toLowerCase();
    return newEnrollments.filter(e =>
      (e.student_name || '').toLowerCase().includes(q) ||
      (e.program_name || '').toLowerCase().includes(q) ||
      (e.branch_name || '').toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
  }, [newEnrollments, enrollSearch]);

  useEffect(() => {
    if (!showNew) return;
    setNewError('');
    setSelectedEnroll(null);
    setNewBranch('');
    setNewClass('');
    setEnrollSearch('');
    setNewEnrollLoading(true);
    const branches = isSuperAdmin(currentUser) ? fetchBranchesApi() : Promise.resolve(assignmentsToBranches(currentUser));
    Promise.all([
      fetchEnrollmentsApi(),
      branches,
    ]).then(([enrolls, b]) => {
      setNewEnrollments(enrolls.filter(e => e.status === 'ACTIVE'));
      setNewBranches(b);
    }).catch(err => {
      setNewError(formatApiError(err) || 'Failed to load enrollments');
    }).finally(() => setNewEnrollLoading(false));
  }, [showNew]);

  useEffect(() => {
    if (!newBranch) { setNewClasses([]); setNewClass(''); return; }
    fetchClassesApi().then(all => {
      setNewClasses(all.filter(c => c.branch === newBranch && c.is_active));
    }).catch(() => {});
  }, [newBranch]);

  const handleNewTransfer = async () => {
    if (!selectedEnroll || !newBranch || !newClass) return;
    setNewSubmitting(true);
    setNewError('');
    try {
      await requestTransferApi({
        enrollment: selectedEnroll.id,
        to_branch: newBranch,
        target_class: newClass,
      });
      addToast?.('Transfer request created', 'success');
      setShowNew(false);
      await load();
    } catch (err) {
      setNewError(formatTransferError(err, 'Failed to create transfer request'));
    } finally {
      setNewSubmitting(false);
    }
  };

  const onApprove = async (id: string) => {
    setActingId(id);
    setConfirmApproveId(null);
    try {
      await approveTransferApi(id);
      addToast?.('Transfer approved', 'success');
      await load();
    } catch (err) {
      addToast?.(formatTransferError(err, 'Approve failed'), 'error');
    } finally {
      setActingId(null);
    }
  };

  const onReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActingId(rejectId);
    try {
      await rejectTransferApi(rejectId, rejectReason.trim());
      addToast?.('Transfer rejected', 'success');
      setRejectId(null);
      setRejectReason('');
      await load();
    } catch (err) {
      addToast?.(formatTransferError(err, 'Reject failed'), 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            Branch transfers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Review and approve student branch transfer requests</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin(currentUser) && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Transfer
            </button>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-50', icon: ArrowRightLeft },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCheck },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50', icon: Ban },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500">{s.label}</span>
              <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5">
        {FILTER_TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              filter === t.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 opacity-60">({t.count})</span>}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search branches or enrollment..."
            className="w-52 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 space-y-3 animate-pulse">
            {[1,2,3].map(k => (
              <div key={k} className="flex items-center gap-4">
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
                <div className="h-4 w-24 bg-slate-200 rounded hidden sm:block" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-28 bg-slate-200 rounded hidden md:block" />
                <div className="h-5 w-28 bg-slate-200 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
          <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{search ? 'No matching transfers' : 'No transfer requests'}</p>
          {search && <button onClick={() => setSearch('')} className="text-xs text-blue-600 mt-1 underline">Clear search</button>}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Enrollment</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 hidden sm:table-cell">From → To</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Date</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <tbody>
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600" title={t.enrollment}>{t.enrollment.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">
                      <span className="font-medium" title={branchMap[t.from_branch] || t.from_branch}>
                        {branchMap[t.from_branch] || t.from_branch.slice(0, 8)}…
                      </span>
                      <span className="text-slate-300 mx-1">→</span>
                      <span className="font-medium" title={branchMap[t.to_branch] || t.to_branch}>
                        {branchMap[t.to_branch] || t.to_branch.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {t.created_at?.slice(0, 10) || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actingId === t.id}
                            onClick={() => setConfirmApproveId(t.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {actingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {actingId === t.id ? '' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={actingId === t.id}
                            onClick={() => { setRejectId(t.id); setRejectReason(''); }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </AnimatePresence>
          </table>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            {filtered.length} of {items.length} request{items.length !== 1 && 's'}
          </div>
        </div>
      )}

      {/* Approve confirm modal */}
      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <h4 className="font-bold text-base text-slate-900">Approve transfer</h4>
                <p className="text-xs text-slate-500">The enrollment will be moved to the target branch and the old enrollment cancelled.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setConfirmApproveId(null)} className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
              <button type="button" disabled={actingId === confirmApproveId} onClick={() => onApprove(confirmApproveId)}
                className="flex-1 px-3 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {actingId === confirmApproveId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {actingId === confirmApproveId ? '' : 'Confirm approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Transfer modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Plus className="w-4.5 h-4.5 text-blue-600" /></div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">New Branch Transfer</h4>
                  <p className="text-xs text-slate-500">Initiate a transfer for an active enrollment</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowNew(false)} className="p-1 rounded-lg hover:bg-slate-100"><XCircle className="w-4 h-4 text-slate-400" /></button>
            </div>

            {newError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 mb-4">{newError}</div>
            )}

            {newEnrollLoading ? (
              <div className="space-y-2 animate-pulse py-4">
                <div className="h-10 bg-slate-100 rounded-xl" />
                <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
                <div className="h-8 bg-slate-100 rounded-xl w-1/2" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step 1: select enrollment */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Select Enrollment</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={enrollSearch}
                      onChange={e => setEnrollSearch(e.target.value)}
                      placeholder={selectedEnroll ? selectedEnroll.student_name || 'Enrollment selected' : 'Search by student, program, or branch...'}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  {!selectedEnroll && (
                    <div className="mt-1.5 max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                      {filteredEnrolls.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400 text-center">No matching active enrollments</p>
                      ) : filteredEnrolls.slice(0, 20).map(e => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => { setSelectedEnroll(e); setEnrollSearch(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-xs font-semibold text-slate-800">{e.student_name || 'Unknown student'}</p>
                          <p className="text-[10px] text-slate-500">{e.program_name || ''} · {e.branch_name || ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedEnroll && (
                    <div className="mt-1.5 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{selectedEnroll.student_name || 'Unknown student'}</p>
                        <p className="text-[10px] text-slate-500">{selectedEnroll.program_name || ''} · {selectedEnroll.branch_name || ''}</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedEnroll(null); setNewBranch(''); setNewClass(''); }}
                        className="text-[10px] text-red-600 font-semibold hover:underline">Change</button>
                    </div>
                  )}
                </div>

                {/* Step 2: target branch */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Target Branch</label>
                  <select
                    value={newBranch}
                    onChange={e => setNewBranch(e.target.value)}
                    disabled={!selectedEnroll}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 disabled:opacity-50 bg-white"
                  >
                    <option value="">{selectedEnroll ? 'Select target branch...' : 'Select an enrollment first'}</option>
                    {newBranches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Step 3: target class */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Target Class</label>
                  <select
                    value={newClass}
                    onChange={e => setNewClass(e.target.value)}
                    disabled={!newBranch}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 disabled:opacity-50 bg-white"
                  >
                    <option value="">{newBranch ? 'Select target class...' : 'Select a branch first'}</option>
                    {newClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.sub_program_name ? ` — ${c.sub_program_name}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setShowNew(false)}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                  <button
                    type="button"
                    disabled={!selectedEnroll || !newBranch || !newClass || newSubmitting}
                    onClick={handleNewTransfer}
                    className="flex-1 px-3 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {newSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {newSubmitting ? 'Creating...' : 'Create Transfer Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-md shadow-xl">
            <h4 className="font-bold text-slate-900 mb-2">Reject transfer</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setRejectId(null)} className="px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button
                type="button"
                disabled={!rejectReason.trim() || actingId === rejectId}
                onClick={onReject}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl disabled:opacity-50"
              >
                {actingId === rejectId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {actingId === rejectId ? 'Rejecting...' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
