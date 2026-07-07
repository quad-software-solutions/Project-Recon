import { motion } from 'motion/react';
import { Building, MapPin, Mail, Phone, Calendar, Clock, UserPlus, X } from 'lucide-react';
import type { BranchResponse } from '@/src/domains/user/shared/api/adminApi';
import { BranchStatusActions } from './BranchStatusActions';

interface Props {
  branch: BranchResponse;
  onClose: () => void;
  onEdit: (b: BranchResponse) => void;
  onAssignManager: (b: BranchResponse) => void;
  onToggleActive: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    Active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    Inactive: 'text-amber-600 bg-amber-50 border-amber-200',
    Archived: 'text-slate-500 bg-slate-50 border-slate-200',
  };
  return map[s] || 'text-slate-600 bg-slate-50 border-slate-200';
};

export function BranchDetailPanel({ branch, onClose, onEdit, onAssignManager, onToggleActive, onArchive }: Props) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm">Branch Details</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/5 flex items-center justify-center"><Building className="w-5 h-5 text-brand-blue" /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{branch.name}</span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{branch.code}</span>
            </div>
            <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(branch.status)}`}>{branch.status}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {branch.email && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{branch.email}</span>
            </div>
          )}
          {branch.phone_number && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{branch.phone_number}</span>
            </div>
          )}
          {branch.address && (
            <div className="flex items-start gap-2.5 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{[branch.address, branch.city, branch.state_region, branch.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Created {new Date(branch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Updated {new Date(branch.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2">
          <button onClick={() => { onAssignManager(branch); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <UserPlus className="w-4 h-4" /> Assign Manager
          </button>
          <button onClick={() => { onEdit(branch); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-amber-50 transition-colors">
            <Building className="w-4 h-4" /> Edit Branch
          </button>
          <div className="flex justify-center pt-1">
            <BranchStatusActions id={branch.id} status={branch.status} onToggleActive={onToggleActive} onArchive={onArchive} size="md" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
