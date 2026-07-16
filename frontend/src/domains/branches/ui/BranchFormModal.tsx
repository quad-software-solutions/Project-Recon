import React, { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import type { BranchResponse } from '@/domains/user/shared/api/adminApi';

export interface BranchFormData {
  name: string;
  code: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state_region: string;
  country: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchFormData) => Promise<void>;
  initial?: BranchResponse | null;
}

export function BranchFormModal({ isOpen, onClose, onSubmit, initial }: Props) {
  const [form, setForm] = useState<BranchFormData>({
    name: '', code: '', email: '', phone_number: '',
    address: '', city: '', state_region: '', country: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initial) {
      setForm({
        name: initial.name, code: initial.code,
        email: initial.email || '', phone_number: initial.phone_number || '',
        address: initial.address || '', city: initial.city || '',
        state_region: initial.state_region || '', country: initial.country,
      });
    } else if (isOpen && !initial) {
      setForm({ name: '', code: '', email: '', phone_number: '', address: '', city: '', state_region: '', country: '' });
    }
  }, [isOpen, initial]);

  const handleSubmit = async () => {
    setSaving(true);
    try { await onSubmit(form); onClose(); } finally { setSaving(false); }
  };

  const update = (k: keyof BranchFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: k === 'code' ? e.target.value.toUpperCase() : e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Branch' : 'New Branch'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required><input value={form.name} onChange={update('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. Addis Ababa Main" /></Field>
          <Field label="Code" required><input value={form.code} onChange={update('code')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. AAM" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><input value={form.email} onChange={update('email')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="branch@example.com" /></Field>
          <Field label="Phone"><input value={form.phone_number} onChange={update('phone_number')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="+251 911 000 000" /></Field>
        </div>
        <Field label="Address"><input value={form.address} onChange={update('address')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="e.g. Bole, Africa Avenue" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City"><input value={form.city} onChange={update('city')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="Addis Ababa" /></Field>
          <Field label="State"><input value={form.state_region} onChange={update('state_region')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" /></Field>
          <Field label="Country"><input value={form.country} onChange={update('country')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30" placeholder="Ethiopia" /></Field>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.name || !form.code || saving}
            className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Saving...' : initial ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}
