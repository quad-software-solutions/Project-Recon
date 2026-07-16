import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Clock, Package, Building2, XCircle, AlertCircle } from 'lucide-react';
import { getPendingOrder } from '../api/checkoutApi';
import type { PendingOrder } from '@/domains/store/model/types';
import { formatMoney } from '@/domains/store/utils/formatMoney';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui/Button';
import { navigateStore } from '@/domains/store/utils/catalog';

interface Props {
  orderId: string;
  onBack: () => void;
}

export default function PendingOrderView({ orderId, onBack }: Props) {
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPendingOrder(orderId);
        setOrder(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load pending order');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-brand-ink mb-1">Order not found</h3>
        <p className="text-sm text-brand-muted mb-6">{error || 'This pending order could not be found.'}</p>
        <Button onClick={onBack} variant="secondary">Back to store</Button>
      </div>
    );
  }

  const isExpired = order.expires_at && new Date(order.expires_at) < new Date();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-ink transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className={cn(
        'rounded-2xl border p-6 mb-6',
        isExpired ? 'bg-red-50/50 border-red-200' : 'bg-amber-50/50 border-amber-200',
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center',
            isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
          )}>
            {isExpired ? <XCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-amber-600" />}
          </div>
          <div>
            <h2 className="font-bold text-brand-ink">Pending Order</h2>
            <p className="text-xs text-brand-muted">Reference: <span className="font-mono font-semibold">{order.id.slice(0, 8)}</span></p>
          </div>
        </div>

        {isExpired && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            This order has expired. Please create a new checkout.
          </div>
        )}

        {!isExpired && order.expires_at && (
          <p className="text-xs text-amber-700 mb-4 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Expires {new Date(order.expires_at).toLocaleString()}
          </p>
        )}

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-muted">Branch</span>
            <span className="font-semibold text-brand-ink flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-muted" /> {order.branch_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Items</span>
            <span className="font-semibold text-brand-ink">{order.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Subtotal</span>
            <span className="font-semibold text-brand-ink">{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-brand-border/50">
            <span className="font-semibold text-brand-ink">Total</span>
            <span className="font-bold text-brand-blue">{formatMoney(order.total)}</span>
          </div>
          {order.payment_reference && (
            <div className="pt-2 border-t border-brand-border/50">
              <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Payment Reference</p>
              <p className="font-mono text-xs font-semibold">{order.payment_reference}</p>
            </div>
          )}
          {order.guest_name && (
            <div className="pt-2 border-t border-brand-border/50">
              <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Customer</p>
              <p className="font-semibold text-brand-ink">{order.guest_name}</p>
              {order.guest_email && <p className="text-xs text-brand-muted">{order.guest_email}</p>}
              {order.guest_phone && <p className="text-xs text-brand-muted">{order.guest_phone}</p>}
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-sm text-brand-ink mb-3">Items</h3>
      <div className="space-y-2 mb-6">
        {order.items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-brand-border/60">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-ink truncate">{item.product_name}</p>
              <p className="text-xs text-brand-muted">{item.quantity} &times; {formatMoney(item.unit_price)}</p>
            </div>
            <span className="text-sm font-bold text-brand-ink ml-3">{formatMoney(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {!isExpired && (
          <p className="text-xs text-brand-muted text-center">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
            Submit payment at the branch or contact staff with your reference.
          </p>
        )}
        <Button onClick={onBack} variant="secondary">Back to store</Button>
      </div>
    </div>
  );
}
