import { useState, useEffect, useCallback, useMemo } from 'react';
import { Building, Plus } from 'lucide-react';
import { branchesApi, assignmentsApi, type BranchResponse } from '@/domains/user/shared/api/adminApi';
import { BranchListTable } from './BranchListTable';
import { BranchFormModal, type BranchFormData } from './BranchFormModal';
import { BranchDetailPanel } from './BranchDetailPanel';
import { AssignManagerModal } from './AssignManagerModal';
import type { UserProfile } from '@/shared/types';
import { isSuperAdmin } from '@/shared/auth/permissions';
import { AdminOfflineBanner, AdminRefreshButton, AdminQueryError } from '@/domains/user/shared/ui/adminQueryState';

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  currentUser: UserProfile;
}

export function BranchSectionShell({ currentUser }: Props) {
  const canManage = isSuperAdmin(currentUser);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchResponse | null>(null);
  const [assignTarget, setAssignTarget] = useState<BranchResponse | null>(null);
  const [managerUsers, setManagerUsers] = useState<UserOption[]>([]);
  const [assignMode, setAssignMode] = useState<'assign' | 'change'>('assign');
  const [branchManagers, setBranchManagers] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSuperAdmin(currentUser)) {
        const [data, assigns] = await Promise.all([
          branchesApi.list(),
          assignmentsApi.list().catch(() => []),
        ]);
        setBranches(data);
        const mgrMap: Record<string, string> = {};
        assigns.forEach((a) => {
          if (a.role === 'branch_manager' && a.is_active && a.branch?.id && a.user?.id) {
            mgrMap[a.branch.id] = a.user.id;
          }
        });
        setBranchManagers(mgrMap);
      } else {
        const map = new Map<string, BranchResponse>();
        for (const a of currentUser.assignments ?? []) {
          if (a.branch_id && a.branch_name && !map.has(a.branch_id)) {
            map.set(a.branch_id, { id: a.branch_id, name: a.branch_name, status: 'Active', code: '' } as BranchResponse);
          }
        }
        setBranches(Array.from(map.values()));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

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

  useEffect(() => { if (assignTarget || showForm) loadManagers(); }, [assignTarget, showForm, loadManagers]);

  const handleCreate = useCallback(async (data: BranchFormData) => {
    if (data.manager_user_id) {
      const { manager_user_id, ...branchFields } = data;
      await branchesApi.createWithManager({ ...branchFields, manager_user_id });
    } else {
      const { manager_user_id: _, ...branchFields } = data;
      await branchesApi.create(branchFields);
    }
    await load();
  }, [load]);

  const handleUpdate = useCallback(async (data: BranchFormData) => {
    if (!editingBranch) return;
    await branchesApi.update(editingBranch.id, data);
    setEditingBranch(null);
    await load();
  }, [editingBranch, load]);

  const handleToggleActive = useCallback(async (id: string) => {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    await branchesApi.toggleActive(id, branch.status === 'Active');
    await load();
  }, [branches, load]);

  const handleArchive = useCallback(async (id: string) => {
    await branchesApi.archive(id);
    setSelectedBranch(p => p?.id === id ? null : p);
    await load();
  }, [load]);

  const handleAssignManager = useCallback(async (userId: string): Promise<string | null> => {
    if (!assignTarget) return 'No branch selected.';
    try {
      if (assignMode === 'change' || branchManagers[assignTarget.id]) {
        await branchesApi.changeManager(assignTarget.id, userId);
      } else {
        await branchesApi.assignManager(assignTarget.id, userId);
      }
      setAssignTarget(null);
      await load();
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign manager.';
      return msg;
    }
  }, [assignTarget, assignMode, branchManagers, load]);

  const openAssign = useCallback((b: BranchResponse) => {
    setAssignMode(branchManagers[b.id] ? 'change' : 'assign');
    setAssignTarget(b);
  }, [branchManagers]);

  const handleFormSubmit = useCallback(async (data: BranchFormData) => {
    if (editingBranch) await handleUpdate(data);
    else await handleCreate(data);
  }, [editingBranch, handleUpdate, handleCreate]);

  const openForm = useCallback((b?: BranchResponse) => {
    setEditingBranch(b || null);
    setShowForm(true);
  }, []);

  const stats = useMemo(() => ({
    total: branches.length,
    active: branches.filter(b => b.status === 'Active').length,
    inactive: branches.filter(b => b.status === 'Inactive').length,
    archived: branches.filter(b => b.status === 'Archived').length,
  }), [branches]);

  return (
    <div className="space-y-4">
      <AdminOfflineBanner />
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
          <AdminRefreshButton onClick={load} loading={loading} />
          {canManage && (
            <button onClick={() => openForm()}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark transition-colors">
              <Plus className="w-4 h-4" /> Add Branch
            </button>
          )}
        </div>
      </div>

      {error && (
        <AdminQueryError error={error} onRetry={load} />
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={selectedBranch ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <BranchListTable
            branches={branches}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onSelect={setSelectedBranch}
            selectedId={selectedBranch?.id}
            onEdit={openForm}
            onAssignManager={openAssign}
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
              onAssignManager={(b) => { setSelectedBranch(null); openAssign(b); }}
              onToggleActive={handleToggleActive}
              onArchive={handleArchive}
            />
          </div>
        )}
      </div>

      <BranchFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingBranch(null); }}
        onSubmit={handleFormSubmit}
        initial={editingBranch}
        managerUsers={managerUsers}
      />
      <AssignManagerModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssignManager}
        users={managerUsers}
        branchName={assignTarget?.name || ''}
        mode={assignMode}
      />
    </div>
  );
}
