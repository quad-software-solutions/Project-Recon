import { Modal } from '@/src/shared/ui/Modal';

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string) => Promise<void>;
  users: UserOption[];
  branchName: string;
}

export function AssignManagerModal({ isOpen, onClose, onAssign, users, branchName }: Props) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const userId = data.get('user_id') as string;
    if (userId) { await onAssign(userId); onClose(); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Manager — ${branchName}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Manager</label>
          <select name="user_id" required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30 bg-white">
            <option value="">Select a manager...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark">Assign</button>
        </div>
      </form>
    </Modal>
  );
}
