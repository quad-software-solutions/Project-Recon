import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2, Loader2, Plus, Landmark, Smartphone, Pencil, X, Check, Search,
  Trash2, MoreHorizontal, Copy, CheckCheck,
} from 'lucide-react';
import { formatApiError } from '@/shared/utils/formatApiError';
import { isForbiddenError } from '@/shared/api/http';
import {
  fetchBankAccountsApi,
  createBankAccountApi,
  updateBankAccountApi,
  deleteBankAccountApi,
  type BankAccount,
} from '@/domains/learning/academics/api/academicApi';
import { ToggleSwitch } from '@/shared/ui/ToggleSwitch';

interface Props {
  canManage?: boolean;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const INITIAL_FORM = {
  bank_name: '', account_holder: '', account_number: '',
  branch: '', swift_code: '', iban: '', notes: '',
};

type AccountKind = 'BANK' | 'MOBILE_MONEY';

const MOBILE_MONEY_PROVIDERS = ['TeleBirr', 'M-Pesa', 'CBEBirr', 'Amole'] as const;

function isMobileMoney(name: string): boolean {
  return MOBILE_MONEY_PROVIDERS.some(p => name.toLowerCase().includes(p.toLowerCase()));
}

function accountKindLabel(name: string): AccountKind {
  return isMobileMoney(name) ? 'MOBILE_MONEY' : 'BANK';
}

export default function BankAccountsPanel({ canManage = false, addToast }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [formKind, setFormKind] = useState<AccountKind>('BANK');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...INITIAL_FORM });
  const [editFormKind, setEditFormKind] = useState<AccountKind>('BANK');
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBankAccountsApi();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(isForbiddenError(err)
        ? 'You do not have permission to view bank accounts. Contact your administrator if you believe this is an error.'
        : formatApiError(err));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = accounts.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.bank_name.toLowerCase().includes(q)
      || a.account_holder.toLowerCase().includes(q)
      || a.account_number.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
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
      setForm({ ...INITIAL_FORM });
      setFormKind('BANK');
      await load();
    } catch (err) {
      addToast?.(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (acc: BankAccount) => {
    setEditingId(acc.id);
    setEditForm({
      bank_name: acc.bank_name || '',
      account_holder: acc.account_holder || '',
      account_number: acc.account_number || '',
      branch: acc.branch || '',
      swift_code: acc.swift_code || '',
      iban: acc.iban || '',
      notes: acc.notes || '',
    });
    setEditActive(acc.is_active);
    setEditFormKind(accountKindLabel(acc.bank_name));
    setEditError('');
    setMenuId(null);
  };

  const handleEditSave = async (id: string) => {
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
        is_active: editActive,
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteBankAccountApi(id);
      addToast?.('Bank account deleted', 'success');
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      addToast?.(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (acc: BankAccount) => {
    try {
      const text = `${acc.bank_name}\n${acc.account_holder}\n${acc.account_number}${acc.branch ? `\nBranch: ${acc.branch}` : ''}${acc.iban ? `\nIBAN: ${acc.iban}` : ''}${acc.swift_code ? `\nSWIFT: ${acc.swift_code}` : ''}`;
      await navigator.clipboard.writeText(text);
      setCopiedId(acc.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!menuId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu]')) setMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuId]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Bank Accounts
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage organization payment accounts</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => { setShowForm(v => !v); setEditingId(null); }}
            className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm self-start"
          >
            <Plus className="w-4 h-4" /> Add Bank Account
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-red-700 flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create form */}
      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800">New Bank Account</h4>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button type="button" onClick={() => { setFormKind('BANK'); setForm(p => ({ ...p, bank_name: '', account_number: '' })); }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                formKind === 'BANK' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              <Landmark className="w-4 h-4" /> Bank
            </button>
            <button type="button" onClick={() => { setFormKind('MOBILE_MONEY'); setForm(p => ({ ...p, bank_name: 'TeleBirr', account_number: '' })); }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                formKind === 'MOBILE_MONEY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              <Smartphone className="w-4 h-4" /> Mobile Money
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
              <span>Use Notes for payment instructions</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formKind === 'MOBILE_MONEY' ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Provider <span className="text-red-400">*</span></label>
                <select required value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  {MOBILE_MONEY_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Bank Name <span className="text-red-400">*</span></label>
                <input required value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                  placeholder="e.g. CBE, Awash, Dashen" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{formKind === 'MOBILE_MONEY' ? 'Merchant Name' : 'Account Holder'} <span className="text-red-400">*</span></label>
              <input required value={form.account_holder} onChange={e => setForm(p => ({ ...p, account_holder: e.target.value }))}
                placeholder={formKind === 'MOBILE_MONEY' ? 'Merchant or account name' : 'Full name or organization'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{formKind === 'MOBILE_MONEY' ? 'Phone Number' : 'Account Number'} <span className="text-red-400">*</span></label>
              <div className="relative">
                {formKind === 'MOBILE_MONEY' && <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />}
                <input required value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))}
                  placeholder={formKind === 'MOBILE_MONEY' ? 'e.g. 09XX XXX XXX' : 'Account number'}
                  className={`w-full ${formKind === 'MOBILE_MONEY' ? 'pl-9' : 'px-3'} pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Branch</label>
              <input value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
                placeholder="Branch (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">SWIFT Code</label>
              <input value={form.swift_code} onChange={e => setForm(p => ({ ...p, swift_code: e.target.value }))}
                placeholder="SWIFT (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">IBAN</label>
              <input value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))}
                placeholder="IBAN (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notes / Payment Instructions</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder='e.g. "Use your name as reference; send screenshot to secretary."'
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[76px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</span> : 'Save Account'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      {accounts.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search bank accounts..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            {search ? 'No bank accounts match your search' : 'No bank accounts configured'}
          </p>
          {canManage && !search && (
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Bank Account
            </button>
          )}
        </div>
      )}

      {/* Mobile/tablet cards */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="lg:hidden space-y-3">
            {filtered.map(acc => (
              <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-4">
                {editingId === acc.id ? (
                  <EditCardForm
                    editForm={editForm}
                    setEditForm={setEditForm}
                    editFormKind={editFormKind}
                    setEditFormKind={setEditFormKind}
                    editActive={editActive}
                    setEditActive={setEditActive}
                    editSaving={editSaving}
                    editError={editError}
                    onSave={() => handleEditSave(acc.id)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isMobileMoney(acc.bank_name) ? <Smartphone className="w-4 h-4 text-blue-500 shrink-0" /> : <Landmark className="w-4 h-4 text-blue-500 shrink-0" />}
                        <p className="font-bold text-sm text-slate-900 truncate">{acc.bank_name}</p>
                        <StatusBadge active={acc.is_active} />
                      </div>
                      <p className="text-xs text-slate-600 truncate">{acc.account_holder}</p>
                      <p className="font-mono text-xs text-slate-800 mt-0.5">{acc.account_number}</p>
                      {(acc.branch || acc.iban) && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {[acc.branch, acc.iban && `IBAN: ${acc.iban}`, acc.swift_code && `SWIFT: ${acc.swift_code}`].filter(Boolean).join(' \u00b7 ')}
                        </p>
                      )}
                      {acc.notes && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 whitespace-pre-line">{acc.notes}</p>}
                    </div>
                    {canManage ? (
                      <div className="relative shrink-0" data-menu>
                        <button onClick={() => setMenuId(menuId === acc.id ? null : acc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuId === acc.id && (
                          <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1">
                            <button onClick={() => handleCopy(acc)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                              {copiedId === acc.id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedId === acc.id ? 'Copied!' : 'Copy details'}
                            </button>
                            <button onClick={() => startEdit(acc)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => { setConfirmDeleteId(acc.id); setMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => handleCopy(acc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0" title="Copy details">
                        {copiedId === acc.id ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Bank</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Account Holder</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Account Number</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase hidden xl:table-cell">Details</th>
                    <th className="text-center px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-center px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                      {editingId === acc.id ? (
                        <td colSpan={6} className="px-5 py-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="col-span-2 flex gap-2">
                                <button type="button" onClick={() => setEditFormKind('BANK')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                    editFormKind === 'BANK' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}>
                                  <Landmark className="w-3.5 h-3.5" /> Bank
                                </button>
                                <button type="button" onClick={() => { setEditFormKind('MOBILE_MONEY'); setEditForm(p => ({ ...p, bank_name: p.bank_name || MOBILE_MONEY_PROVIDERS[0] })); }}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                    editFormKind === 'MOBILE_MONEY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}>
                                  <Smartphone className="w-3.5 h-3.5" /> Mobile Money
                                </button>
                              </div>
                              {editFormKind === 'MOBILE_MONEY' ? (
                                <select value={editForm.bank_name} onChange={e => setEditForm(p => ({ ...p, bank_name: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                                  {MOBILE_MONEY_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                  <option value="Other">Other</option>
                                </select>
                              ) : (
                                <input value={editForm.bank_name} onChange={e => setEditForm(p => ({ ...p, bank_name: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder="Bank name" />
                              )}
                              <input value={editForm.account_holder} onChange={e => setEditForm(p => ({ ...p, account_holder: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder={editFormKind === 'MOBILE_MONEY' ? 'Merchant name' : 'Account holder'} />
                              <input value={editForm.account_number} onChange={e => setEditForm(p => ({ ...p, account_number: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder={editFormKind === 'MOBILE_MONEY' ? 'Phone number' : 'Account number'} />
                              <input value={editForm.branch} onChange={e => setEditForm(p => ({ ...p, branch: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder="Branch" />
                              <input value={editForm.swift_code} onChange={e => setEditForm(p => ({ ...p, swift_code: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder="SWIFT" />
                              <input value={editForm.iban} onChange={e => setEditForm(p => ({ ...p, iban: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder="IBAN" />
                              <div className="col-span-2 flex items-center gap-2">
                                <span className="text-xs text-slate-600">Active</span>
                                <ToggleSwitch checked={editActive} onChange={setEditActive} />
                              </div>
                              <div className="col-span-2">
                                <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" placeholder="Notes / payment instructions" rows={2} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              {editError && <p className="text-[10px] text-red-600">{editError}</p>}
                              <button onClick={() => handleEditSave(acc.id)} disabled={editSaving}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                {isMobileMoney(acc.bank_name) ? <Smartphone className="w-4 h-4 text-blue-600" /> : <Landmark className="w-4 h-4 text-blue-600" />}
                              </div>
                              <p className="font-semibold text-slate-900">{acc.bank_name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-slate-800">{acc.account_holder}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-mono text-sm text-slate-800">{acc.account_number}</p>
                          </td>
                          <td className="px-5 py-4 hidden xl:table-cell">
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                              {acc.branch && <span>{acc.branch}</span>}
                              {acc.iban && <span className="font-mono">IBAN: {acc.iban}</span>}
                              {acc.swift_code && <span className="font-mono">SWIFT: {acc.swift_code}</span>}
                              {!acc.branch && !acc.iban && !acc.swift_code && <span className="text-slate-300 italic">&mdash;</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center"><StatusBadge active={acc.is_active} /></td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleCopy(acc)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Copy details">
                                {copiedId === acc.id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              {canManage && (
                                <>
                                  <button onClick={() => startEdit(acc)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(acc.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
            <h4 className="font-bold text-slate-900 mb-1">Delete Bank Account?</h4>
            <p className="text-xs text-slate-500 mb-6">This action cannot be undone. The account will be permanently removed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
                {deletingId === confirmDeleteId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Status badge */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* Edit form used inside mobile cards */
function EditCardForm({
  editForm, setEditForm, editFormKind, setEditFormKind,
  editActive, setEditActive, editSaving, editError, onSave, onCancel,
}: {
  editForm: typeof INITIAL_FORM;
  setEditForm: React.Dispatch<React.SetStateAction<typeof INITIAL_FORM>>;
  editFormKind: AccountKind; setEditFormKind: (v: AccountKind) => void;
  editActive: boolean; setEditActive: (v: boolean) => void;
  editSaving: boolean; editError: string;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      {editError && <p className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">{editError}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditFormKind('BANK')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${
            editFormKind === 'BANK' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}>
          <Landmark className="w-3 h-3" /> Bank
        </button>
        <button type="button" onClick={() => { setEditFormKind('MOBILE_MONEY'); setEditForm(p => ({ ...p, bank_name: p.bank_name || MOBILE_MONEY_PROVIDERS[0] })); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${
            editFormKind === 'MOBILE_MONEY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}>
          <Smartphone className="w-3 h-3" /> Mobile Money
        </button>
      </div>
      {editFormKind === 'MOBILE_MONEY' ? (
        <select value={editForm.bank_name} onChange={e => setEditForm(p => ({ ...p, bank_name: e.target.value }))}
          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
          {MOBILE_MONEY_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
          <option value="Other">Other</option>
        </select>
      ) : (
        <input value={editForm.bank_name} onChange={e => setEditForm(p => ({ ...p, bank_name: e.target.value }))}
          placeholder="Bank name" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
      )}
      <input value={editForm.account_holder} onChange={e => setEditForm(p => ({ ...p, account_holder: e.target.value }))}
        placeholder={editFormKind === 'MOBILE_MONEY' ? 'Merchant name' : 'Account holder'} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
      <input value={editForm.account_number} onChange={e => setEditForm(p => ({ ...p, account_number: e.target.value }))}
        placeholder={editFormKind === 'MOBILE_MONEY' ? 'Phone number' : 'Account number'} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
      <div className="flex gap-2">
        <input value={editForm.branch} onChange={e => setEditForm(p => ({ ...p, branch: e.target.value }))}
          placeholder="Branch" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
        <input value={editForm.swift_code} onChange={e => setEditForm(p => ({ ...p, swift_code: e.target.value }))}
          placeholder="SWIFT" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
      </div>
      <input value={editForm.iban} onChange={e => setEditForm(p => ({ ...p, iban: e.target.value }))}
        placeholder="IBAN" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600">Active</span>
        <ToggleSwitch checked={editActive} onChange={setEditActive} />
      </div>
      <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
        placeholder="Payment instructions" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs min-h-[56px]" />
      <div className="flex justify-end gap-1.5 pt-1">
        <button onClick={onCancel} className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 rounded transition-colors">Cancel</button>
        <button onClick={onSave} disabled={editSaving}
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {editSaving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
          Save
        </button>
      </div>
    </div>
  );
}
