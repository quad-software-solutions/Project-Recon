import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, Package, Building2, Plus, ArrowRight, TrendingUp,
  Download, ArrowUpDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { storeAdminApi, type InventoryPayload, type InventoryTransferPayload } from '../api/storeAdminApi';
import { branchesApi } from '@/domains/user/shared/api/adminApi';
import type { BranchInventory, Product } from '@/domains/store/model/types';
import {
  getInventoryProductName,
  getInventoryProductSku,
  isLowStock,
} from '@/domains/store/utils/inventoryDisplay';
import { cn } from '@/shared/utils/cn';
import { isSuperAdmin } from '@/shared/auth/permissions';
import type { UserProfile } from '@/shared/types';

const PAGE_SIZE = 25;

interface Props {
  addToast: (message: string, type: 'success' | 'error') => void;
  currentUser?: UserProfile;
}

interface BranchOption {
  id: string;
  name: string;
}

function assignmentsToBranches(user?: UserProfile): BranchOption[] {
  if (!user?.assignments) return [];
  const map = new Map<string, string>();
  for (const a of user.assignments) {
    if (a.branch_id && a.branch_name) map.set(a.branch_id, a.branch_name);
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

const emptyInventory = (): InventoryPayload => ({
  branch: '', product: '', quantity: 0, minimum_quantity: 0,
});

type ActionType = 'add' | 'reduce' | 'correct' | 'transfer';

interface ActionState {
  type: ActionType;
  inventoryId: string;
  branch: string;
  branchName: string;
  product: string;
  productName: string;
  quantity: string;
  newQuantity: string;
  toBranch: string;
}

const initialAction = (): ActionState => ({
  type: 'add',
  inventoryId: '',
  branch: '',
  branchName: '',
  product: '',
  productName: '',
  quantity: '',
  newQuantity: '',
  toBranch: '',
});

export default function InventoryManager({ addToast, currentUser }: Props) {
  const [items, setItems] = useState<BranchInventory[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortField, setSortField] = useState<'product' | 'branch' | 'quantity' | 'minQty'>('product');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<InventoryPayload>(emptyInventory());
  const [creating, setCreating] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState<ActionState>(initialAction());
  const [actioning, setActioning] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await storeAdminApi.inventory.list();
      setItems(data);
      if (isSuperAdmin(currentUser)) {
        const [branchData, productData] = await Promise.all([
          branchesApi.list(),
          storeAdminApi.products.list().catch(() => []),
        ]);
        setBranches(branchData.map((b: any) => ({ id: b.id || b.uuid, name: b.name })));
        setProducts(productData);
      } else {
        setBranches(assignmentsToBranches(currentUser));
        setProducts([]);
      }
    } catch (e: any) {
      addToast(e.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setCreateForm(emptyInventory());
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await storeAdminApi.inventory.create(createForm);
      addToast('Inventory record created', 'success');
      setShowCreateModal(false);
      fetchAll();
    } catch (e: any) {
      addToast(e.message || 'Failed to create inventory record', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openAction = (item: BranchInventory) => {
    setAction({
      ...initialAction(),
      inventoryId: item.id,
      product: item.product,
      productName: getInventoryProductName(item),
      branch: item.branch,
      branchName: item.branch_name || '',
    });
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (action.type === 'add' || action.type === 'reduce' || action.type === 'correct') {
      if (!action.inventoryId) {
        addToast('Select an inventory row before performing this action', 'error');
        return;
      }
    }

    const qty = parseInt(action.quantity, 10);
    if (action.type === 'add' || action.type === 'reduce' || action.type === 'transfer') {
      if (!Number.isFinite(qty) || qty < 1) {
        addToast('Quantity must be at least 1', 'error');
        return;
      }
    }

    if (action.type === 'transfer') {
      if (!action.toBranch || !action.product || !action.branch) {
        addToast('Transfer requires from branch, destination branch, and product', 'error');
        return;
      }
    }

    setActioning(true);
    try {
      switch (action.type) {
        case 'add':
          await storeAdminApi.inventory.adjust(action.inventoryId, { quantity: qty });
          break;
        case 'reduce':
          await storeAdminApi.inventory.reduce(action.inventoryId, { quantity: qty });
          break;
        case 'correct':
          await storeAdminApi.inventory.correct(action.inventoryId, {
            quantity: parseInt(action.newQuantity, 10) || 0,
          });
          break;
        case 'transfer': {
          const payload: InventoryTransferPayload = {
            from_branch: action.branch,
            to_branch: action.toBranch,
            product: action.product,
            quantity: qty,
          };
          await storeAdminApi.inventory.transfer(payload);
          break;
        }
      }
      addToast('Inventory action completed successfully', 'success');
      setShowActionModal(false);
      fetchAll();
    } catch (e: any) {
      addToast(e.message || 'Failed to perform action', 'error');
    } finally {
      setActioning(false);
    }
  };

  const lowStockItems = items.filter(isLowStock);
  const hasActiveFilters = Boolean(search || branchFilter || lowStockOnly);

  const filtered = useMemo(() => {
    let result = items.filter(i => {
      const name = getInventoryProductName(i).toLowerCase();
      const sku = getInventoryProductSku(i).toLowerCase();
      const branchName = (i.branch_name || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || sku.includes(q) || branchName.includes(q);
      const matchesBranch = !branchFilter || i.branch === branchFilter;
      const matchesLowStock = !lowStockOnly || isLowStock(i);
      return matchesSearch && matchesBranch && matchesLowStock;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'product':
          cmp = getInventoryProductName(a).localeCompare(getInventoryProductName(b));
          break;
        case 'branch':
          cmp = (a.branch_name || '').localeCompare(b.branch_name || '');
          break;
        case 'quantity':
          cmp = a.quantity - b.quantity;
          break;
        case 'minQty':
          cmp = a.minimum_quantity - b.minimum_quantity;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, search, branchFilter, lowStockOnly, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const exportCSV = () => {
    const header = 'Branch,Product,SKU,Quantity,Minimum Quantity,Status';
    const rows = filtered.map(i => {
      const name = getInventoryProductName(i);
      const sku = getInventoryProductSku(i);
      const status = isLowStock(i) ? (i.quantity === 0 ? 'OUT' : 'LOW') : 'OK';
      return `"${i.branch_name || ''}","${name}","${sku}",${i.quantity},${i.minimum_quantity},"${status}"`;
    });
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported', 'success');
  };

  const summaryTotalQty = items.reduce((s, i) => s + i.quantity, 0);
  const summaryBranches = new Set(items.map(i => i.branch)).size;

  const actionDisabled =
    actioning ||
    ((action.type === 'add' || action.type === 'reduce' || action.type === 'correct') && !action.inventoryId) ||
    ((action.type === 'add' || action.type === 'reduce' || action.type === 'transfer') &&
      (!(parseInt(action.quantity, 10) >= 1))) ||
    (action.type === 'correct' && action.newQuantity === '') ||
    (action.type === 'transfer' && (!action.toBranch || !action.product || !action.branch));

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <ArrowUpDown className={cn(
      'w-3 h-3 ml-1 transition-opacity',
      sortField === field ? 'opacity-100 text-brand-blue' : 'opacity-30',
    )} />
  );

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-brand-blue" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-ink">Branch Inventory</h3>
            <p className="text-xs text-brand-muted">
              {items.length} records
              {lowStockItems.length > 0 && (
                <span className="text-red-500 ml-1">&middot; {lowStockItems.length} low stock</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:text-brand-ink hover:bg-slate-50 disabled:opacity-40 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          {isSuperAdmin(currentUser) && (
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-dark transition-colors shadow-sm shadow-brand-blue/15">
              <Plus className="w-4 h-4" /> New Record
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-px bg-brand-border/30">
        {[
          { label: 'Total Records', value: items.length, color: 'text-brand-ink' },
          { label: 'Total Quantity', value: summaryTotalQty.toLocaleString(), color: 'text-brand-blue' },
          { label: 'Low Stock Items', value: lowStockItems.length, color: lowStockItems.length > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Branches', value: summaryBranches, color: 'text-brand-ink' },
        ].map(s => (
          <div key={s.label} className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted/70">{s.label}</p>
            <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-brand-border/30 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <input
              type="text"
              placeholder="Search by product, SKU, or branch..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue placeholder:text-brand-muted/60"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={branchFilter}
              onChange={e => { setBranchFilter(e.target.value); setPage(0); }}
              className="flex-1 sm:w-auto px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <label className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-brand-border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={e => { setLowStockOnly(e.target.checked); setPage(0); }}
                className="rounded border-brand-border text-brand-blue focus:ring-brand-blue/20"
              />
              <span className="text-xs font-medium text-brand-muted">Low stock only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              {hasActiveFilters ? (
                <Search className="w-6 h-6 text-slate-300" />
              ) : (
                <Package className="w-6 h-6 text-slate-300" />
              )}
            </div>
            <p className="text-sm font-medium text-brand-muted">
              {hasActiveFilters ? 'No matching inventory records' : 'No inventory records yet'}
            </p>
            {!hasActiveFilters && isSuperAdmin(currentUser) && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-dark transition-colors shadow-sm shadow-brand-blue/15"
              >
                <Plus className="w-4 h-4" /> Create first record
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted/70 border-b border-brand-border/30 mb-2">
              <button className="col-span-4 flex items-center text-left" onClick={() => toggleSort('product')}>
                Product <SortIcon field="product" />
              </button>
              <button className="col-span-3 flex items-center text-left" onClick={() => toggleSort('branch')}>
                Branch <SortIcon field="branch" />
              </button>
              <button className="col-span-2 flex items-center justify-end" onClick={() => toggleSort('quantity')}>
                Qty <SortIcon field="quantity" />
              </button>
              <button className="col-span-2 flex items-center justify-end" onClick={() => toggleSort('minQty')}>
                Min <SortIcon field="minQty" />
              </button>
              <div className="col-span-1" />
            </div>

            <div className="space-y-1">
              <AnimatePresence>
                {pageItems.map(item => {
                  const productName = getInventoryProductName(item);
                  const productSku = getInventoryProductSku(item);
                  const stockPercent = item.minimum_quantity > 0
                    ? Math.min((item.quantity / item.minimum_quantity) * 100, 200)
                    : 100;
                  const isLow = isLowStock(item);
                  const isCritical = item.quantity === 0;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border border-transparent hover:border-brand-border/50 hover:bg-slate-50/50 transition-all duration-150"
                    >
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-ink truncate">{productName}</span>
                          {isCritical && <span className="shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">OUT</span>}
                          {isLow && !isCritical && <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">LOW</span>}
                          {!isLow && <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">OK</span>}
                        </div>
                        {productSku && <p className="text-[11px] font-mono text-brand-muted/70 truncate">{productSku}</p>}
                      </div>
                      <div className="col-span-3 flex items-center gap-1.5 text-sm text-brand-muted">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.branch_name}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          isCritical ? "text-red-600" : isLow ? "text-amber-700" : "text-brand-ink"
                        )}>
                          {item.quantity}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm text-brand-muted tabular-nums">{item.minimum_quantity}</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => openAction(item)}
                          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-blue-50 transition-colors"
                          title="Action"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-brand-border/30">
              <p className="text-xs text-brand-muted">
                Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-ink hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i).slice(
                  Math.max(0, safePage - 2),
                  Math.min(totalPages, safePage + 3),
                ).map(i => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                      i === safePage ? 'bg-brand-blue text-white' : 'text-brand-muted hover:text-brand-ink hover:bg-slate-50',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-ink hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-md mx-auto"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-brand-blue" />
                  </div>
                  <h4 className="text-sm font-bold text-brand-ink">New Inventory Record</h4>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-brand-muted hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Branch</label>
                  <select
                    value={createForm.branch}
                    onChange={e => setCreateForm(p => ({ ...p, branch: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                  >
                    <option value="">Select branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Product</label>
                  <select
                    value={createForm.product}
                    onChange={e => setCreateForm(p => ({ ...p, product: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` (${p.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.quantity}
                      onChange={e => setCreateForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5">Min Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.minimum_quantity}
                      onChange={e => setCreateForm(p => ({ ...p, minimum_quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-brand-border/50 bg-slate-50/50 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createForm.branch || !createForm.product}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shadow-sm shadow-brand-blue/15 flex items-center gap-2"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create Record'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowActionModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-md mx-auto"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-ink">Stock Action</h4>
                    {action.productName && (
                      <p className="text-xs text-brand-muted">{action.productName}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowActionModal(false)} className="p-1.5 rounded-lg text-brand-muted hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Action Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['add', 'reduce', 'correct', 'transfer'] as ActionType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setAction(p => ({ ...p, type }))}
                        className={cn(
                          "px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all text-left",
                          action.type === type
                            ? "bg-brand-blue/5 border-brand-blue/30 text-brand-blue"
                            : "bg-white border-brand-border text-brand-muted hover:border-brand-blue/20"
                        )}
                      >
                        {type === 'add' && 'Add Stock'}
                        {type === 'reduce' && 'Reduce Stock'}
                        {type === 'correct' && 'Correct Qty'}
                        {type === 'transfer' && 'Transfer'}
                      </button>
                    ))}
                  </div>
                </div>

                {(action.type === 'add' || action.type === 'reduce' || action.type === 'transfer') && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={action.quantity}
                      onChange={e => setAction(p => ({ ...p, quantity: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                      placeholder="Enter quantity"
                    />
                  </div>
                )}

                {action.type === 'correct' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5">New Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={action.newQuantity}
                      onChange={e => setAction(p => ({ ...p, newQuantity: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                      placeholder="Set exact quantity"
                    />
                    <p className="text-[11px] text-brand-muted mt-1">This will override the current quantity</p>
                  </div>
                )}

                {action.type === 'transfer' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5">Destination Branch</label>
                    <div className="flex items-center gap-2 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Building2 className="w-4 h-4 text-brand-muted" />
                      <span className="text-sm text-brand-muted">From: <strong className="text-brand-ink">{action.branchName || 'Selected'}</strong></span>
                      <ArrowRight className="w-4 h-4 text-brand-muted" />
                    </div>
                    <select
                      value={action.toBranch}
                      onChange={e => setAction(p => ({ ...p, toBranch: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                    >
                      <option value="">Select destination</option>
                      {branches.filter(b => b.id !== action.branch).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-brand-border/50 bg-slate-50/50 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionDisabled}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shadow-sm shadow-brand-blue/15 flex items-center gap-2"
                >
                  {actioning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Execute'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
