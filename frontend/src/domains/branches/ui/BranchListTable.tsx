import { motion } from 'motion/react';
import { Building, MapPin, Edit3, UserPlus, Search } from 'lucide-react';
import type { BranchResponse } from '@/src/domains/user/shared/api/adminApi';
import { BranchStatusActions } from './BranchStatusActions';

interface Props {
  branches: BranchResponse[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onEdit: (b: BranchResponse) => void;
  onAssignManager: (b: BranchResponse) => void;
  onToggleActive: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

const statusStyle = (s: string) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700',
    Inactive: 'bg-amber-50 text-amber-700',
    Archived: 'bg-slate-100 text-slate-500',
  };
  return map[s] || 'bg-slate-50 text-slate-600';
};

export function BranchListTable({ branches, loading, search, onSearchChange, onEdit, onAssignManager, onToggleActive, onArchive }: Props) {
  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    (b.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue/30"
            placeholder="Search branches..." />
        </div>
        <span className="text-xs text-slate-400">{filtered.length} of {branches.length} branches</span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading branches...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center">
          <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">{search ? 'No branches match your search' : 'No branches yet'}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 text-sm">{b.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{b.code}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle(b.status)}`}>{b.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {b.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city}{b.state_region ? `, ${b.state_region}` : ''}</span>}
                    {b.email && <span>{b.email}</span>}
                    {b.phone_number && <span>{b.phone_number}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onAssignManager(b)} title="Assign Manager"
                    className="p-2 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(b)} title="Edit"
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <BranchStatusActions id={b.id} status={b.status} onToggleActive={onToggleActive} onArchive={onArchive} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
