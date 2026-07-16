import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, Package, Plus, Minus, Trash2,
  ShoppingCart as CartIcon,
  Loader2, ChevronRight, CheckCircle2, AlertTriangle, X,
} from 'lucide-react';
import { listProducts } from '@/domains/store/products/api/productApi';
import { listActiveCategories } from '@/domains/store/categories/api/categoriesApi';
import { getCart, addCartItem, updateCartItemQuantity, removeCartItem, clearCart } from '@/domains/store/cart/api/cartApi';
import { getUserOrders } from '@/domains/store/orders/api/orderApi';
import checkout from '@/domains/store/checkout/api/checkoutApi';
import type {
  Product, ProductCategory, ShoppingCart, ShoppingCartItem,
  Order, PendingOrder,
} from '@/shared/types';
import PageHeader from '../../../shared/ui/PageHeader';
import TabBar from '../../../shared/ui/TabBar';
import EmptyState from '../../../shared/ui/EmptyState';
import { GridSkeleton } from '../../../shared/ui/LoadingSkeleton';

interface Props {
  currentUser: { name?: string; email?: string; assignments?: { branch_id?: string | null; branch_name?: string | null; is_primary?: boolean }[] };
}

const TABS = [
  { id: 'shop', label: 'Shop' },
  { id: 'cart', label: 'Cart' },
  { id: 'orders', label: 'My Orders' },
];

export default function StoreModule({ currentUser }: Props) {
  const [tab, setTab] = useState('shop');

  const primaryAssignment = (currentUser.assignments || []).find(a => a.is_primary);
  const branchId = primaryAssignment?.branch_id || '';
  const branchName = primaryAssignment?.branch_name || '';

  return (
    <div>
      <PageHeader title="Store" subtitle="Browse products, manage cart, and track orders" icon={ShoppingBag} />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'shop' && <ShopPanel branchId={branchId} />}
      {tab === 'cart' && <CartPanel branchId={branchId} branchName={branchName} currentUser={currentUser} />}
      {tab === 'orders' && <OrdersPanel />}
    </div>
  );
}

function ShopPanel({ branchId }: { branchId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [prods, cats] = await Promise.all([
        listProducts().catch(() => [] as Product[]),
        listActiveCategories().catch(() => [] as ProductCategory[]),
      ]);
      if (cancelled) return;
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const addToCart = async (productId: string) => {
    if (!branchId) return;
    setAddingId(productId);
    try {
      await addCartItem({ product: productId, branch: branchId, quantity: 1 });
    } catch { /* ignore */ }
    setAddingId(null);
  };

  return (
    <div className="space-y-4">
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory(null)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${!selectedCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <GridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border">
          <EmptyState icon={Package} title="No products found" description="Check back later for new products." />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product, i) => {
            const primaryImg = product.primary_image?.image || product.images?.[0]?.image;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-4">
                  {primaryImg ? (
                    <img src={primaryImg} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-slate-500 font-medium truncate">{product.category_name}</p>
                  <h4 className="font-bold text-sm text-slate-900 truncate mt-0.5">{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-sm text-blue-600">{Number(product.price).toLocaleString()} ETB</span>
                    <button onClick={() => addToCart(product.id)} disabled={addingId === product.id || !branchId}
                      className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors">
                      {addingId === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartPanel({ branchId, branchName, currentUser }: { branchId: string; branchName: string; currentUser: Props['currentUser'] }) {
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [error, setError] = useState('');

  const loadCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch {
      setCart(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const handleUpdate = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    try {
      await updateCartItemQuantity(itemId, qty);
      await loadCart();
    } catch { /* ignore */ }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      await loadCart();
    } catch { /* ignore */ }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      await loadCart();
    } catch { /* ignore */ }
  };

  const handleCheckout = async () => {
    if (!branchId) { setError('No branch assignment found.'); return; }
    setCheckingOut(true);
    setError('');
    try {
      const order = await checkout({
        branch: branchId,
        ...(currentUser.name ? {} : { guest_name: currentUser.name, guest_email: currentUser.email }),
      });
      setPendingOrder(order);
    } catch (e: any) {
      setError(e.message || 'Checkout failed');
    }
    setCheckingOut(false);
  };

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>;

  if (pendingOrder) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-brand-border p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-1">Order Placed!</h3>
        <p className="text-sm text-slate-500 mb-4">Reference: {pendingOrder.payment_reference || 'N/A'}</p>
        <div className="text-left space-y-2 mb-4">
          {pendingOrder.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-slate-700">
              <span>{item.product_name} x{item.quantity}</span>
              <span className="font-semibold">{Number(item.subtotal).toLocaleString()} ETB</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>{Number(pendingOrder.total).toLocaleString()} ETB</span>
          </div>
        </div>
        <button onClick={() => setPendingOrder(null)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
          Continue Shopping
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border">
        <EmptyState icon={CartIcon} title="Cart is empty" description="Add products from the shop." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-2">
        {cart.items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 bg-white rounded-2xl border border-brand-border p-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-900 truncate">{item.product_name}</h4>
              <p className="text-xs text-slate-500">{item.branch_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleUpdate(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <Minus className="w-3 h-3 text-slate-600" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-slate-900">{item.quantity}</span>
              <button onClick={() => handleUpdate(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <Plus className="w-3 h-3 text-slate-600" />
              </button>
            </div>
            <div className="text-right min-w-[80px]">
              <p className="font-bold text-sm text-slate-900">{Number(item.subtotal).toLocaleString()} ETB</p>
              <p className="text-[10px] text-slate-400">@{Number(item.product_price).toLocaleString()}</p>
            </div>
            <button onClick={() => handleRemove(item.id)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-brand-border p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-slate-900">Total ({cart.item_count} items)</span>
          <span className="font-black text-lg text-blue-600">{Number(cart.total).toLocaleString()} ETB</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">
            Clear Cart
          </button>
          <button onClick={handleCheckout} disabled={checkingOut || !branchId}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
            {checkingOut ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
    PAID: 'bg-blue-100 text-blue-700',
    PREPARING: 'bg-purple-100 text-purple-700',
    READY_FOR_PICKUP: 'bg-cyan-100 text-cyan-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-slate-100 text-slate-700',
  };

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>;

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border">
        <EmptyState icon={Package} title="No orders yet" description="Your order history will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, i) => (
        <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white rounded-2xl border border-brand-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 font-mono">{order.order_number}</p>
              <p className="text-[11px] text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="space-y-1">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-xs text-slate-600">
                <span>{item.product_name} x{item.quantity}</span>
                <span>{Number(item.subtotal).toLocaleString()} ETB</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-border">
            <span className="text-[10px] text-slate-400">{order.branch_name}</span>
            <span className="font-bold text-sm text-slate-900">{Number(order.total).toLocaleString()} ETB</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
