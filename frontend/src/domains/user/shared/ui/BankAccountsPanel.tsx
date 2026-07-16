import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Plus, Trash2, Smartphone, Landmark, StickyNote } from 'lucide-react';
import {
  fetchBankAccountsApi,
  createBankAccountApi,
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
      setError(err instanceof Error ? err.message : 'Failed to load bank accounts');
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
          <input
            required
            placeholder={kind === 'MOBILE_MONEY' ? 'Wallet / Phone number' : 'Account number'}
            value={form.account_number}
            onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
            className="form-input px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  {String(acc.bank_name || '').toLowerCase().includes('tele') ? <Smartphone className="w-4 h-4 text-blue-600" /> : <Landmark className="w-4 h-4 text-blue-600" />}
                  {acc.bank_name}
                </p>
                <p className="text-xs text-slate-600 mt-1">{acc.account_holder}</p>
                <p className="font-mono text-xs font-semibold text-slate-800 mt-1">{acc.account_number}</p>
                {acc.branch && <p className="text-[11px] text-slate-500 mt-1">{acc.branch}</p>}
                {acc.iban && <p className="text-[11px] text-slate-500 mt-1">IBAN: <span className="font-mono">{acc.iban}</span></p>}
                {acc.notes && <p className="text-[11px] text-slate-500 mt-2 whitespace-pre-line">{acc.notes}</p>}
              </div>
              {canManage && (
                <button type="button" onClick={() => onDelete(acc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" aria-label="Delete bank account">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
