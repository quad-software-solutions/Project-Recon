import React, { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Loader2 } from 'lucide-react';

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string) => Promise<string | null>;
  users: UserOption[];
  branchName: string;
}

export function AssignManagerModal({ isOpen, onClose, onAssign, users, branchName }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const userId = data.get('user_id') as string;
    if (!userId) return;
    setSubmitting(true);
    const err = await onAssign(userId);
    setSubmitting(false);
    if (err) {
      setError(err);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Assign Manager — ${branchName}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Manager</label>
          <select name="user_id" required disabled={submitting}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white disabled:opacity-50">
            <option value="">Select a manager...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={submitting}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={submitting}
            className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
