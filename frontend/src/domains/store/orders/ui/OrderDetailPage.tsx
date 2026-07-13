import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2, Package, Truck, Building2 } from 'lucide-react';
import { getOrder } from '../api/orderApi';
import { Order } from '@/src/domains/store/model/types';
import EmptyState from '@/src/shared/ui/EmptyState';
import LoadingSkeleton from '@/src/shared/ui/LoadingSkeleton';
import { Button } from '@/src/shared/ui/Button';

const statusConfig = {
  'pending': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
  'paid': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Paid' },
  'processing': { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Processing' },
  'shipped': { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Shipped' },
  'delivered': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Delivered' },
  'cancelled': { icon: ShoppingBag, color: 'text-red-500', bg: 'bg-red-50', label: 'Cancelled' },
};

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      const idSegment = window.location.pathname.split('/').filter(Boolean).pop();
      const orderId = idSegment ? idSegment : null;

      if (!orderId) {
        setError('Invalid order');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingSkeleton rows={1} />
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
        />
      </div>
    );
  }

  const config = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigateTo('/store/orders')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.order_number}</h1>
            <p className="text-sm text-slate-500">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg}`}>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900">Branch</h3>
          </div>
          <p className="text-sm text-slate-700">{order.branch_name}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">
                    {item.quantity} x Birr {item.unit_price.toLocaleString()}
                  </p>
                  <p className="text-sm font-bold text-brand-blue">
                    Birr {item.subtotal.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-bold text-brand-blue">
                Birr {order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {order.status_history && order.status_history.length > 0 && (
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Order History</h3>
            <div className="space-y-3">
              {order.status_history.map((history, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300 mt-2" />
                  <div>
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">{history.previous_status || 'Created'}</span>
                      {' → '}
                      <span className="font-bold text-brand-blue">{history.new_status}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(history.changed_at).toLocaleString()}
                    </p>
                    {history.notes && (
                      <p className="text-xs text-slate-600 mt-1">{history.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigateTo('/store')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
