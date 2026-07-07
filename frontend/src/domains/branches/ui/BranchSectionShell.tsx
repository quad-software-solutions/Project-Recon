import { useState, useEffect, useCallback } from 'react';
import { Building, RefreshCw, Plus } from 'lucide-react';
import { branchesApi, assignmentsApi, type BranchResponse } from '@/src/domains/user/shared/api/adminApi';
import { BranchListTable } from './BranchListTable';
import { BranchFormModal, type BranchFormData } from './BranchFormModal';
import { BranchDetailPanel } from './BranchDetailPanel';
import { AssignManagerModal } from './AssignManagerModal';

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

export function BranchSectionShell() {
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchResponse | null>(null);
  const [assignTarget, setAssignTarget] = useState<BranchResponse | null>(null);
  const [managerUsers, setManagerUsers] = useState<UserOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchesApi.list();
      setBranches(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadManagers = useCallback(async () => {
    try {
      const data = await assignmentsApi.list();
      const mapped: UserOption[] = [];
      data.forEach(a => {
        if (a.user && a.role === 'branch_manager' && a.is_active) {
          mapped.push({ id: a.user.id, full_name: a.user.full_name, email: a.user.email });
        }
      });
      const unique = mapped.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setManagerUsers(unique);
    } catch { /* users can still select from empty list */ }
  }, []);

  useEffect(() => { if (assignTarget) loadManagers(); }, [assignTarget, loadManagers]);

  const handleCreate = async (data: BranchFormData) => {
    await branchesApi.create(data);
    await load();
  };

  const handleUpdate = async (data: BranchFormData) => {
    if (!editingBranch) return;
    await branchesApi.update(editingBranch.id, data);
    setEditingBranch(null);
    await load();
  };

  const handleToggleActive = async (id: string) => {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    await branchesApi.toggleActive(id, branch.status === 'Active');
    await load();
  };

  const handleArchive = async (id: string) => {
    await branchesApi.archive(id);
    setSelectedBranch(p => p?.id === id ? null : p);
    await load();
  };

  const handleAssignManager = async (userId: string) => {
    if (!assignTarget) return;
    await branchesApi.assignManager(assignTarget.id, userId);
    setAssignTarget(null);
    await load();
  };

  const handleFormSubmit = async (data: BranchFormData) => {
    if (editingBranch) await handleUpdate(data);
    else await handleCreate(data);
  };

  const openForm = (b?: BranchResponse) => {
    setEditingBranch(b || null);
    setShowForm(true);
  };

  const stats = {
    total: branches.length,
    active: branches.filter(b => b.status === 'Active').length,
    inactive: branches.filter(b => b.status === 'Inactive').length,
    archived: branches.filter(b => b.status === 'Archived').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: stats.inactive, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Archived', value: stats.archived, color: 'text-slate-500', bg: 'bg-slate-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-200`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-slate-600" />
          <h2 className="font-bold text-slate-900">Branches</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => openForm()}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark transition-colors">
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={selectedBranch ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <BranchListTable
            branches={branches}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onEdit={openForm}
            onAssignManager={setAssignTarget}
            onToggleActive={handleToggleActive}
            onArchive={handleArchive}
          />
        </div>

        {selectedBranch && (
          <div className="xl:col-span-1">
            <BranchDetailPanel
              branch={selectedBranch}
              onClose={() => setSelectedBranch(null)}
              onEdit={(b) => { setSelectedBranch(null); openForm(b); }}
              onAssignManager={(b) => { setSelectedBranch(null); setAssignTarget(b); }}
              onToggleActive={handleToggleActive}
              onArchive={handleArchive}
            />
          </div>
        )}
      </div>

      <BranchFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingBranch(null); }} onSubmit={handleFormSubmit} initial={editingBranch} />
      <AssignManagerModal isOpen={!!assignTarget} onClose={() => setAssignTarget(null)} onAssign={handleAssignManager} users={managerUsers} branchName={assignTarget?.name || ''} />
    </div>
  );
}
