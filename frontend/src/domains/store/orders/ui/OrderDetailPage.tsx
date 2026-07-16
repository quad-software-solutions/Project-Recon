import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Building2, Clock, Package, Hash, ArrowRight } from 'lucide-react';
import { getOrder } from '../api/orderApi';
import type { Order } from '@/domains/store/model/types';
import EmptyState from '@/shared/ui/EmptyState';
import { Button } from '@/shared/ui/Button';
import { formatMoney } from '@/domains/store/utils/formatMoney';
import { getOrderStatusLabel, getOrderStatusTone, normalizeOrderStatus } from '@/domains/store/utils/orderStatus';
import { navigateStore } from '@/domains/store/utils/catalog';
import { cn } from '@/shared/utils/cn';

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const orderId = parts[parts.length - 1];
      if (!orderId || orderId === 'orders') {
        setError('Invalid order');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setOrder(await getOrder(orderId));
      } catch {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-24 bg-brand-surface rounded" />
        <div className="h-8 w-48 bg-brand-surface rounded" />
        <div className="h-32 bg-brand-surface rounded-xl" />
        <div className="h-48 bg-brand-surface rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={ShoppingBag}
          title="Order not found"
          description="The order you're looking for doesn't exist or you don't have permission to view it."
          action={<Button variant="secondary" onClick={() => navigateStore('/store/orders')}>Back to orders</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigateStore('/store/orders')}
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-ink mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <p className="eyebrow mb-1">Order</p>
          <h1 className="font-display text-2xl font-bold text-brand-ink font-mono">#{order.order_number}</h1>
          <p className="text-sm text-brand-muted mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Placed {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border', getOrderStatusTone(order.status))}>
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid gap-4">
        {/* Branch & Payment Info */}
        <div className="p-5 bg-white rounded-[var(--radius-card)] border border-brand-border">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-brand-muted" />
                <h3 className="font-bold text-brand-ink text-sm">Pickup branch</h3>
              </div>
              <p className="text-sm text-brand-ink">{order.branch_name}</p>
            </div>
            {order.payment_reference && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-brand-muted" />
                  <h3 className="font-bold text-brand-ink text-sm">Payment reference</h3>
                </div>
                <p className="text-xs font-mono text-brand-ink break-all">{order.payment_reference}</p>
              </div>
            )}
          </div>
          {(order.paid_at || order.completed_at) && (
            <div className="mt-4 pt-4 border-t border-brand-border grid sm:grid-cols-2 gap-2 text-xs text-brand-muted">
              {order.paid_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Paid: {new Date(order.paid_at).toLocaleString()}
                </span>
              )}
              {order.completed_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Completed: {new Date(order.completed_at).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="p-5 bg-white rounded-[var(--radius-card)] border border-brand-border">
          <h3 className="font-bold text-brand-ink mb-4 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-muted" />
            Items ({order.items.length})
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-brand-surface rounded-xl">
                <div className="w-12 h-12 bg-white rounded-lg border border-brand-border flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-brand-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-ink truncate">{item.product_name}</p>
                  <p className="text-xs text-brand-muted">SKU: {item.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-brand-ink tabular-nums">
                    {item.quantity} × {formatMoney(item.unit_price)}
                  </p>
                  <p className="text-sm font-bold text-brand-blue tabular-nums">{formatMoney(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Subtotal</span>
              <span className="font-medium text-brand-ink tabular-nums">{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-brand-ink">Total</span>
              <span className="text-xl font-bold text-brand-blue tabular-nums">{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {order.status_history && order.status_history.length > 0 && (
          <div className="p-5 bg-white rounded-[var(--radius-card)] border border-brand-border">
            <h3 className="font-bold text-brand-ink mb-4 text-sm">Status timeline</h3>
            <div className="space-y-0">
              {[...order.status_history]
                .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                .map((h, idx, arr) => {
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={h.id} className="flex gap-3 relative">
                      {!isLast && (
                        <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-brand-border" />
                      )}
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 z-10 bg-white',
                        normalizeOrderStatus(h.new_status) === 'CANCELLED' ||
                          normalizeOrderStatus(h.new_status) === 'REFUNDED'
                          ? 'border-red-400'
                          : 'border-brand-blue'
                      )} />
                      <div className="flex-1 min-w-0 pb-4">
                        <p className="text-sm text-brand-ink">
                          <span className="font-medium">
                            {h.previous_status ? getOrderStatusLabel(h.previous_status) : 'Created'}
                          </span>
                          <ArrowRight className="w-3 h-3 inline mx-1 text-brand-muted" />
                          <span className="font-bold text-brand-blue">
                            {getOrderStatusLabel(h.new_status)}
                          </span>
                        </p>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {new Date(h.changed_at).toLocaleString()}
                        </p>
                        {h.notes && (
                          <p className="text-xs text-brand-muted/80 mt-1 italic bg-white/60 px-2 py-1 rounded border border-brand-border/50">
                            {h.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigateStore('/store')}>
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
