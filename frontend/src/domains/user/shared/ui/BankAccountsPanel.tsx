import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Plus, Trash2, Smartphone, Landmark, StickyNote, Pencil, X, Check } from 'lucide-react';
import { formatApiError } from '@/shared/utils/formatApiError';
import {
  fetchBankAccountsApi,
  createBankAccountApi,
  updateBankAccountApi,
  deleteBankAccountApi,
  type BankAccount,
} from '@/domains/learning/academics/api/academicApi';

interface Props {
  canManage?: boolean;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type AccountKind = 'BANK' | 'MOBILE_MONEY';

const MOBILE_MONEY_PROVIDERS = [
  'TeleBirr',
  'M-Pesa',
  'CBEBirr',
  'Amole',
] as const;

export default function BankAccountsPanel({ canManage = false, addToast }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKind, setEditKind] = useState<AccountKind>('BANK');
  const [editForm, setEditForm] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    branch: '',
    swift_code: '',
    iban: '',
    notes: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [kind, setKind] = useState<AccountKind>('BANK');
  const [form, setForm] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    branch: '',
    swift_code: '',
    iban: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBankAccountsApi();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(formatApiError(err));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bank_name.trim() || !form.account_holder.trim() || !form.account_number.trim()) return;
    setSaving(true);
    try {
      await createBankAccountApi({
        bank_name: form.bank_name.trim(),
        account_holder: form.account_holder.trim(),
        account_number: form.account_number.trim(),
        branch: form.branch.trim() || undefined,
        swift_code: form.swift_code.trim() || undefined,
        iban: form.iban.trim() || undefined,
        notes: form.notes.trim() || undefined,
        is_active: true,
      });
      addToast?.('Bank account created', 'success');
      setShowForm(false);
      setKind('BANK');
      setForm({ bank_name: '', account_holder: '', account_number: '', branch: '', swift_code: '', iban: '', notes: '' });
      await load();
    } catch (err) {
      addToast?.(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!canManage) return;
    try {
      await deleteBankAccountApi(id);
      addToast?.('Bank account deleted', 'success');
      await load();
    } catch (err) {
      addToast?.(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const startEdit = (acc: BankAccount) => {
    setEditingId(acc.id);
    const isMm = String(acc.bank_name).toLowerCase().includes('tele') || String(acc.bank_name).toLowerCase().includes('m-pesa') || String(acc.bank_name).toLowerCase().includes('cbe') || String(acc.bank_name).toLowerCase().includes('amole');
    setEditKind(isMm ? 'MOBILE_MONEY' : 'BANK');
    setEditForm({
      bank_name: acc.bank_name || '',
      account_holder: acc.account_holder || '',
      account_number: acc.account_number || '',
      branch: acc.branch || '',
      swift_code: acc.swift_code || '',
      iban: acc.iban || '',
      notes: acc.notes || '',
    });
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const onEditSave = async (id: string) => {
    if (!editForm.bank_name.trim() || !editForm.account_holder.trim() || !editForm.account_number.trim()) return;
    setEditSaving(true);
    setEditError('');
    try {
      await updateBankAccountApi(id, {
        bank_name: editForm.bank_name.trim(),
        account_holder: editForm.account_holder.trim(),
        account_number: editForm.account_number.trim(),
        branch: editForm.branch.trim() || undefined,
        swift_code: editForm.swift_code.trim() || undefined,
        iban: editForm.iban.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      addToast?.('Bank account updated', 'success');
      setEditingId(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Bank accounts
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Accounts used for manual payment instructions</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add account
          </button>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}

      {showForm && canManage && (
        <form onSubmit={onCreate} className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setKind('BANK')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                kind === 'BANK' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Bank
            </button>
            <button
              type="button"
              onClick={() => {
                setKind('MOBILE_MONEY');
                setForm((p) => ({ ...p, bank_name: p.bank_name.trim() ? p.bank_name : 'TeleBirr' }));
              }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                kind === 'MOBILE_MONEY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile money
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
              <StickyNote className="w-4 h-4 text-slate-400" />
              Use “Notes” for payment instructions
            </div>
          </div>

          {kind === 'MOBILE_MONEY' ? (
            <select
              required
              value={form.bank_name}
              onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
              className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              {MOBILE_MONEY_PROVIDERS.map((p) => (<option key={p} value={p}>{p}</option>))}
              <option value={form.bank_name || 'Other'}>{form.bank_name && !MOBILE_MONEY_PROVIDERS.includes(form.bank_name as any) ? form.bank_name : 'Other'}</option>
            </select>
          ) : (
            <input
              required
              placeholder="Bank name (e.g., CBE, Awash, Dashen)"
              value={form.bank_name}
              onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
              className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          )}
          <input
            required
            placeholder={kind === 'MOBILE_MONEY' ? 'Merchant / Account name' : 'Account holder'}
            value={form.account_holder}
            onChange={(e) => setForm((p) => ({ ...p, account_holder: e.target.value }))}
            className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          {kind === 'MOBILE_MONEY' ? (
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input
                required
                placeholder="Phone number"
                value={form.account_number}
                onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                className="form-input w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          ) : (
            <input
              required
              placeholder="Account number"
              value={form.account_number}
              onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
              className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          )}
          <input placeholder="Branch (optional)" value={form.branch} onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))} className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <input placeholder="SWIFT (optional)" value={form.swift_code} onChange={(e) => setForm((p) => ({ ...p, swift_code: e.target.value }))} className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <input placeholder="IBAN (optional)" value={form.iban} onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))} className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <textarea
            placeholder="Notes / payment instructions (optional). Example: “Use your name as reference; send screenshot to secretary.”"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm md:col-span-2 min-h-[84px]"
          />
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No bank accounts configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const seen = new Set<string>();
            const byBank: [string, typeof accounts][] = [];
            accounts.filter(a => { const k = a.account_number; if (seen.has(k)) return false; seen.add(k); return true; }).forEach(a => {
              let g = byBank.find(([b]) => b === a.bank_name);
              if (!g) { g = [a.bank_name, []]; byBank.push(g); }
              g[1].push(a);
            });
            return byBank.map(([bank, accs]) => (
              <div key={bank}>
                <p className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  {String(bank).toLowerCase().includes('tele') ? <Smartphone className="w-4 h-4 text-blue-600" /> : <Landmark className="w-4 h-4 text-blue-600" />}
                  {bank}
                  <span className="text-[10px] font-normal text-slate-400">({accs.length} account{accs.length > 1 ? 's' : ''})</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {accs.map(acc => (
                    <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-3">
                      {editingId === acc.id ? (
                        <div className="space-y-2">
                          {editError && <p className="text-[10px] text-red-600">{editError}</p>}
                          {editKind === 'MOBILE_MONEY' ? (
                            <select value={editForm.bank_name} onChange={e => setEditForm(p => ({ ...p, bank_name: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                              {[...MOBILE_MONEY_PROVIDERS, 'Other'].map(p => (<option key={p} value={p}>{p}</option>))}
                            </select>
                          ) : (
                            <input value={editForm.bank_name} onChange={e => setEditForm(p => ({ ...p, bank_name: e.target.value }))}
                              placeholder="Bank name" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                          )}
                          <input value={editForm.account_holder} onChange={e => setEditForm(p => ({ ...p, account_holder: e.target.value }))}
                            placeholder="Account holder" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                          <input value={editForm.account_number} onChange={e => setEditForm(p => ({ ...p, account_number: e.target.value }))}
                            placeholder="Account number" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                          <div className="flex gap-2">
                            <input value={editForm.branch} onChange={e => setEditForm(p => ({ ...p, branch: e.target.value }))}
                              placeholder="Branch" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                            <input value={editForm.swift_code} onChange={e => setEditForm(p => ({ ...p, swift_code: e.target.value }))}
                              placeholder="SWIFT" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                          </div>
                          <input value={editForm.iban} onChange={e => setEditForm(p => ({ ...p, iban: e.target.value }))}
                            placeholder="IBAN" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                          <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Payment instructions" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs min-h-[56px]" />
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button onClick={cancelEdit} className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                            <button onClick={() => onEditSave(acc.id)} disabled={editSaving}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
                              {editSaving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {String(acc.bank_name).toLowerCase().includes('tele') ? (
                                <Smartphone className="w-3 h-3 text-blue-500 shrink-0" />
                              ) : (
                                <Landmark className="w-3 h-3 text-blue-500 shrink-0" />
                              )}
                              <p className="font-mono text-xs font-bold text-slate-800">{acc.account_number}</p>
                            </div>
                            <p className="text-xs text-slate-600 truncate">{acc.account_holder}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {acc.branch && <p className="text-[10px] text-slate-500 truncate">{acc.branch}</p>}
                              {acc.iban && <p className="text-[10px] text-slate-500">IBAN: <span className="font-mono">{acc.iban}</span></p>}
                            </div>
                            {acc.notes && <p className="text-[10px] text-slate-500 mt-1 whitespace-pre-line line-clamp-2">{acc.notes}</p>}
                          </div>
                          <div className="flex items-start gap-1 shrink-0">
                            <button type="button" onClick={() => navigator.clipboard.writeText(acc.account_number)}
                              className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Copy account number">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                            {canManage && (
                              <>
                                <button type="button" onClick={() => startEdit(acc)} className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg" title="Edit">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => onDelete(acc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
