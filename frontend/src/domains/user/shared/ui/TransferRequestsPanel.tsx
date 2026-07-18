import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import {
  listTransferRequestsApi,
  approveTransferApi,
  rejectTransferApi,
  fetchBranchesApi,
  type BranchTransferRequest,
} from '@/domains/learning/academics/api/academicApi';
import { formatApiError } from '@/shared/utils/formatApiError';

interface Props {
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TransferRequestsPanel({ addToast }: Props) {
  const [items, setItems] = useState<BranchTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [branchMap, setBranchMap] = useState<Record<string, string>>({});

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
      const [data, branches] = await Promise.all([
        listTransferRequestsApi(),
        fetchBranchesApi().catch(() => [] as any[]),
      ]);
      setItems(Array.isArray(data) ? data : []);
      const map: Record<string, string> = {};
      (Array.isArray(branches) ? branches : []).forEach((b: any) => { map[b.id] = b.name; });
      setBranchMap(map);
    } catch (err) {
      setError(formatTransferError(err, 'Failed to load transfer requests'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 space-y-3 animate-pulse">
            {[1,2,3].map(k => (
              <div key={k} className="flex items-center gap-4">
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-40 bg-slate-200 rounded hidden md:block" />
                <div className="h-5 w-28 bg-slate-200 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
          <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No transfer requests</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Enrollment</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 hidden md:table-cell">From → To</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      t.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.enrollment.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">
                    {branchMap[t.from_branch] || t.from_branch.slice(0, 8)}… → {branchMap[t.to_branch] || t.to_branch.slice(0, 8)}…
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
                </tr>
              ))}
            </tbody>
          </table>
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
