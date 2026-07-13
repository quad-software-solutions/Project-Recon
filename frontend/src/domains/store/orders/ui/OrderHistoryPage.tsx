import { ShoppingBag, Clock, CheckCircle2, Package, Truck } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import EmptyState from '@/src/shared/ui/EmptyState';
import LoadingSkeleton from '@/src/shared/ui/LoadingSkeleton';

const statusConfig = {
  'pending': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
  'paid': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Paid' },
  'processing': { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Processing' },
  'shipped': { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Shipped' },
  'delivered': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Delivered' },
  'cancelled': { icon: ShoppingBag, color: 'text-red-500', bg: 'bg-red-50', label: 'Cancelled' },
};

export default function OrderHistoryPage() {
  const { orders, loading, error } = useOrders();

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={ShoppingBag}
          title="Failed to load orders"
          description="There was an error loading your order history. Please try again later."
        />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Start shopping to see your order history here."
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map((order) => {
          const config = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
          const StatusIcon = config.icon;

          return (
            <button
              type="button"
              key={order.id}
              onClick={() => navigateTo(`/store/orders/${order.id}`)}
              className="block w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-blue transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">Order #{order.order_number}</p>
                  <p className="text-xs text-slate-500">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
                <p className="font-bold text-brand-blue">
                  Birr {order.total.toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
