import { useState } from 'react';
import { Loader2, Eye, EyeOff, Archive } from 'lucide-react';

interface Props {
  id: string;
  status: string;
  onToggleActive: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  size?: 'sm' | 'md';
}

export function BranchStatusActions({ id, status, onToggleActive, onArchive, size = 'sm' }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const btnClass = size === 'sm' ? 'p-2' : 'p-2.5';

  const handleToggle = async () => {
    setBusy('toggle');
    try { await onToggleActive(id); } finally { setBusy(null); }
  };

  const handleArchive = async () => {
    setBusy('archive');
    try { await onArchive(id); } finally { setBusy(null); }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={busy !== null}
        title={status === 'Active' ? 'Deactivate' : 'Activate'}
        className={`${btnClass} rounded-lg transition-colors ${
          status === 'Active'
            ? 'text-amber-600 hover:bg-amber-50'
            : 'text-emerald-600 hover:bg-emerald-50'
        } disabled:opacity-50`}
      >
        {busy === 'toggle' ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'Active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      {status !== 'Archived' && (
        <button
          onClick={handleArchive}
          disabled={busy !== null}
          title="Archive"
          className={`${btnClass} rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50`}
        >
          {busy === 'archive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
