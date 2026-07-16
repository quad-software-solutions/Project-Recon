import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, LayoutGrid, Package, Archive, ShoppingCart,
  X, CheckCircle, AlertCircle, Lock, DollarSign, AlertTriangle, RefreshCw,
  TrendingUp, Clock,
} from 'lucide-react';
import CategoryManager from './CategoryManager';
import ProductManager from './ProductManager';
import InventoryManager from './InventoryManager';
import OrderManager from './OrderManager';
import { storeAdminApi, type LowStockReportRow } from '../api/storeAdminApi';
import type { Order } from '@/domains/store/model/types';
import type { UserProfile } from '@/shared/types';
import { canManageStore, canManageStoreInventory } from '@/shared/auth/permissions';
import { formatMoney } from '@/domains/store/utils/formatMoney';
import { getOrderStatusLabel, getOrderStatusTone } from '@/domains/store/utils/orderStatus';
import { cn } from '@/shared/utils/cn';

type Section = 'overview' | 'categories' | 'products' | 'inventory' | 'orders';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

interface OverviewData {
  totalProducts: number;
  activeProducts: number;
  revenue: number;
  orderCount: number;
  lowStockCount: number;
  lowStock: LowStockReportRow[];
  recentOrders: Order[];
}

const FULL_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'categories', label: 'Categories', icon: LayoutGrid },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Archive },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
];

const BRANCH_NAV: NavItem[] = [
  { id: 'inventory', label: 'Inventory', icon: Archive },
];

let toastCounter = 0;

interface Props {
  currentUser: UserProfile;
}

function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + (Number(pick(row)) || 0), 0);
}

export default function StoreDashboard({ currentUser }: Props) {
  const canManageFull = canManageStore(currentUser);
  const canInventory = canManageStoreInventory(currentUser);
  const visibleNav = canManageFull ? FULL_NAV : BRANCH_NAV;

  const [section, setSection] = useState<Section>(canManageFull ? 'overview' : 'inventory');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = `st-toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadOverview = useCallback(async () => {
    if (!canManageFull) return;
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [productStats, sales, lowStock, ordersReport, orders] = await Promise.all([
        storeAdminApi.reports.products(),
        storeAdminApi.reports.sales(),
        storeAdminApi.reports.lowStock(),
        storeAdminApi.reports.orders(),
        storeAdminApi.orders.list(),
      ]);

      const revenue = sumBy(sales, r => r.total_revenue);
      const salesOrderCount = sumBy(sales, r => r.order_count);
      const reportOrderCount = sumBy(ordersReport, r => r.order_count);

      setOverview({
        totalProducts: productStats.summary.total_products,
        activeProducts: productStats.summary.active_products,
        revenue,
        orderCount: salesOrderCount || reportOrderCount,
        lowStockCount: lowStock.length,
        lowStock: lowStock.slice(0, 5),
        recentOrders: orders.slice(0, 5),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load overview';
      setOverviewError(message);
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [canManageFull]);

  useEffect(() => {
    if (canManageFull && section === 'overview') {
      void loadOverview();
    }
  }, [canManageFull, section, loadOverview]);

  if (!canInventory) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold text-amber-800">Access Restricted</p>
            <p className="mt-1 text-sm text-amber-700">
              Store administration requires Super Admin or Branch Manager role.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!canManageFull && (
        <div className="bg-brand-paper border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-muted">
          Branch Managers can manage branch inventory. Catalog, products, and orders require Super Admin.
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide bg-white border border-brand-border rounded-xl p-1.5">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200',
                isActive
                  ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
                  : 'text-brand-muted hover:text-brand-ink hover:bg-brand-blue/5',
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {canManageFull && section === 'overview' && (
              <OverviewPanel
                loading={overviewLoading}
                error={overviewError}
                data={overview}
                onRetry={loadOverview}
                onOpenSection={setSection}
              />
            )}
            {canManageFull && section === 'categories' && <CategoryManager addToast={addToast} />}
            {canManageFull && section === 'products' && <ProductManager addToast={addToast} />}
            {section === 'inventory' && <InventoryManager addToast={addToast} />}
            {canManageFull && section === 'orders' && <OrderManager addToast={addToast} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={cn(
                'flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border backdrop-blur-sm',
                toast.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                  : 'bg-red-50/95 border-red-200 text-red-800',
              )}
            >
              {toast.type === 'success'
                ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OverviewPanel({
  loading,
  error,
  data,
  onRetry,
  onOpenSection,
}: {
  loading: boolean;
  error: string | null;
  data: OverviewData | null;
  onRetry: () => void;
  onOpenSection: (section: Section) => void;
}) {
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-brand-border bg-white animate-pulse p-4">
              <div className="w-9 h-9 rounded-lg bg-brand-surface mb-3" />
              <div className="h-4 bg-brand-surface rounded w-1/2 mb-2" />
              <div className="h-3 bg-brand-surface/50 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-56 rounded-xl border border-brand-border bg-white animate-pulse" />
          <div className="h-56 rounded-xl border border-brand-border bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-red-800">Failed to load overview</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      label: 'Products',
      value: data.totalProducts.toLocaleString(),
      hint: `${data.activeProducts.toLocaleString()} active`,
      icon: Package,
      onClick: () => onOpenSection('products'),
    },
    {
      label: 'Revenue (30d)',
      value: formatMoney(data.revenue),
      hint: 'Sum of paid sales',
      icon: TrendingUp,
      onClick: () => onOpenSection('orders'),
    },
    {
      label: 'Orders (30d)',
      value: data.orderCount.toLocaleString(),
      hint: 'From sales report',
      icon: ShoppingCart,
      onClick: () => onOpenSection('orders'),
    },
    {
      label: 'Low stock',
      value: data.lowStockCount.toLocaleString(),
      hint: 'Below minimum quantity',
      icon: AlertTriangle,
      onClick: () => onOpenSection('inventory'),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Latest refresh failed: {error}
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, hint, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="text-left p-4 rounded-xl border border-brand-border bg-white hover:border-brand-blue/30 hover:shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-lg bg-brand-blue/10 border border-brand-blue/15">
                <Icon className="w-4 h-4 text-brand-blue" />
              </div>
              <p className="text-xs font-medium text-brand-muted">{label}</p>
            </div>
            <p className="text-xl font-bold text-brand-ink font-display tracking-tight">{value}</p>
            <p className="text-[11px] text-brand-muted mt-1">{hint}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Low stock */}
        <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-brand-ink">Low stock alerts</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection('inventory')}
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark"
            >
              Manage inventory
            </button>
          </div>
          {data.lowStock.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-brand-muted">All stock levels are healthy.</p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {data.lowStock.map(row => (
                <li key={`${row.branch_id}-${row.product_id}`} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-ink truncate">{row.product_name}</p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {row.branch_name} · SKU {row.sku}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-ink tabular-nums">{row.quantity}</p>
                    <p className="text-[11px] text-brand-muted">min {row.minimum_quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-bold text-brand-ink">Recent orders</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection('orders')}
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark"
            >
              View all
            </button>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <ShoppingCart className="w-8 h-8 text-brand-border mx-auto mb-2" />
              <p className="text-sm text-brand-muted">No orders yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {data.recentOrders.map(order => (
                <li key={order.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-ink truncate font-mono">#{order.order_number}</p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {new Date(order.created_at).toLocaleString()} · {order.branch_name}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-bold text-brand-blue tabular-nums">{formatMoney(order.total)}</p>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        getOrderStatusTone(order.status),
                      )}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
