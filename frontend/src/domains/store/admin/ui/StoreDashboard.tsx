import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Package, Archive, ShoppingCart, X, CheckCircle, AlertCircle, Lock,
} from 'lucide-react';
import CategoryManager from './CategoryManager';
import ProductManager from './ProductManager';
import InventoryManager from './InventoryManager';
import OrderManager from './OrderManager';
import { storeAdminApi } from '../api/storeAdminApi';
import type { UserProfile } from '@/shared/types';
import { canManageStore, canManageStoreInventory } from '@/shared/auth/permissions';

type Section = 'categories' | 'products' | 'inventory' | 'orders';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

interface SectionCounts {
  categories: number;
  products: number;
  inventory: number;
  orders: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'categories', label: 'Categories', icon: LayoutGrid },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Archive },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
];

const STAT_CARDS: { key: keyof SectionCounts; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'categories', label: 'Categories', icon: LayoutGrid, color: 'text-violet-500 bg-violet-50' },
  { key: 'products', label: 'Products', icon: Package, color: 'text-blue-500 bg-blue-50' },
  { key: 'inventory', label: 'Inventory Items', icon: Archive, color: 'text-amber-500 bg-amber-50' },
  { key: 'orders', label: 'Orders', icon: ShoppingCart, color: 'text-cyan-500 bg-cyan-50' },
];

let toastCounter = 0;

interface Props {
  currentUser: UserProfile;
}

export default function StoreDashboard({ currentUser }: Props) {
  const canManageFull = canManageStore(currentUser);
  const canInventory = canManageStoreInventory(currentUser);
  const visibleNav = canManageFull ? NAV_ITEMS : NAV_ITEMS.filter(n => n.id === 'inventory');
  const [section, setSection] = useState<Section>(canManageFull ? 'categories' : 'inventory');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [counts, setCounts] = useState<SectionCounts>({
    categories: -1, products: -1, inventory: -1, orders: -1,
  });

  useEffect(() => {
    (async () => {
      try {
        if (canManageFull) {
          const [categories, products, inventory, orders] = await Promise.all([
            storeAdminApi.categories.list(),
            storeAdminApi.products.list(),
            storeAdminApi.inventory.list(),
            storeAdminApi.orders.list(),
          ]);
          setCounts({
            categories: categories.length,
            products: products.length,
            inventory: inventory.length,
            orders: orders.length,
          });
        } else if (canInventory) {
          const inventory = await storeAdminApi.inventory.list();
          setCounts(prev => ({ ...prev, inventory: inventory.length }));
        }
      } catch { /* partial load ok */ }
    })();
  }, [canManageFull, canInventory]);

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

  if (!canInventory) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="mt-1 text-amber-700">Store administration is only available to Super Admin or Branch Manager users.</p>
          </div>
        </div>
      </div>
    );
  }

  const visibleStats = canManageFull
    ? STAT_CARDS
    : STAT_CARDS.filter(s => s.key === 'inventory');

  return (
    <div className="flex flex-col gap-3">
      {!canManageFull && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
          Branch Managers can manage branch inventory. Catalog, products, and orders require Super Admin.
        </div>
      )}

      <div className={`grid gap-2 ${canManageFull ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {visibleStats.map(({ key, label, icon: Icon, color }) => {
          const c = counts[key];
          return (
            <button key={key} type="button" onClick={() => setSection(key)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                section === key
                  ? 'border-blue-500/30 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
                <p className="text-sm font-bold text-slate-800">
                  {c < 0 ? <span className="text-slate-300">...</span> : c}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setSection(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {canManageFull && section === 'categories' && <CategoryManager addToast={addToast} />}
            {canManageFull && section === 'products' && <ProductManager addToast={addToast} />}
            {section === 'inventory' && <InventoryManager addToast={addToast} />}
            {canManageFull && section === 'orders' && <OrderManager addToast={addToast} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 100, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={`flex items-start gap-2 p-3 rounded-xl shadow-lg border ${
                toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
