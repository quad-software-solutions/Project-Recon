import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, Eye, ChevronRight, Clock, PackageCheck, Building2,
  User, Phone, Mail, Hash, ArrowRight,
} from 'lucide-react';
import { storeAdminApi } from '../api/storeAdminApi';
import type { Order } from '@/domains/store/model/types';
import { formatMoney } from '@/domains/store/utils/formatMoney';
import {
  ORDER_STATUSES,
  getOrderStatusLabel,
  getOrderStatusTone,
  getNextOrderStatuses,
  normalizeOrderStatus,
} from '@/domains/store/utils/orderStatus';
import { cn } from '@/shared/utils/cn';

interface Props {
  addToast: (message: string, type: 'success' | 'error') => void;
}

export default function OrderManager({ addToast }: Props) {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detail, setDetail] = useState<Order | null>(null);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storeAdminApi.orders.list();
      setItems(data);
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleStatusChange = async () => {
    if (!statusModal || !nextStatus) return;
    setStatusSaving(true);
    try {
      await storeAdminApi.orders.updateStatus(statusModal.id, {
        status: nextStatus,
        notes: statusNotes || undefined,
      });
      addToast(`Order status changed to ${getOrderStatusLabel(nextStatus)}`, 'success');
      setStatusModal(null);
      setStatusNotes('');
      setNextStatus('');
      if (detail?.id === statusModal.id) {
        try {
          const updated = await storeAdminApi.orders.get(statusModal.id);
          setDetail(updated);
        } catch { /* fine */ }
      }
      fetchItems();
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Failed to update status', 'error');
    } finally {
      setStatusSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((order) => {
      const status = normalizeOrderStatus(order.status);
      if (statusFilter && status !== normalizeOrderStatus(statusFilter)) return false;
      if (!q) return true;
      return (
        order.order_number.toLowerCase().includes(q) ||
        order.branch_name.toLowerCase().includes(q) ||
        (order.guest_name || '').toLowerCase().includes(q) ||
        (order.guest_email || '').toLowerCase().includes(q) ||
        (order.guest_phone || '').toLowerCase().includes(q) ||
        (order.payment_reference || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const statusCounts = useMemo(() => {
    return ORDER_STATUSES.reduce((acc, status) => {
      acc[status] = items.filter(
        (order) => normalizeOrderStatus(order.status) === status
      ).length;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <PackageCheck className="w-4 h-4 text-brand-blue" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-ink">Orders</h3>
            <p className="text-xs text-brand-muted">
              {filtered.length === items.length
                ? `${items.length} total`
                : `${filtered.length} of ${items.length}`}
            </p>
          </div>
        </div>
      </div>

      {/* Status chips + search */}
      <div className="px-5 py-3 border-b border-brand-border/30 bg-brand-surface/50">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ORDER_STATUSES.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(active ? '' : status)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                  active
                    ? cn(getOrderStatusTone(status), 'shadow-sm')
                    : 'bg-white border-brand-border text-brand-muted hover:border-brand-blue/20',
                )}
              >
                {getOrderStatusLabel(status)}
                <span className="ml-0.5 opacity-60">({statusCounts[status] || 0})</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by order number, branch, customer, or payment ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue placeholder:text-brand-muted/60"
          />
        </div>
      </div>

      {/* Orders list */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-brand-surface border border-brand-border/60 animate-pulse">
                <div className="h-4 bg-brand-border/80 rounded w-1/4 mb-2" />
                <div className="h-3 bg-brand-border/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-3">
              <PackageCheck className="w-6 h-6 text-brand-muted/40" />
            </div>
            <p className="text-sm font-medium text-brand-muted">
              {search || statusFilter ? 'No matching orders' : 'No orders yet'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-2 text-xs text-brand-blue hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((item) => {
                const next = getNextOrderStatuses(item.status);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl border border-brand-border hover:border-brand-blue/20 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <span className="text-sm font-bold text-brand-ink font-mono">
                            {item.order_number}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                              getOrderStatusTone(item.status)
                            )}
                          >
                            {getOrderStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {item.branch_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {item.guest_name || 'Walk-in'}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-brand-ink tabular-nums">
                            {formatMoney(item.total)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{' '}
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-brand-muted">
                            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                          </span>
                          {item.items.slice(0, 3).map((line) => (
                            <span
                              key={line.id}
                              className="text-[11px] text-brand-muted/60 truncate max-w-[120px]"
                            >
                              {line.product_name}
                            </span>
                          ))}
                          {item.items.length > 3 && (
                            <span className="text-[11px] text-brand-muted">
                              +{item.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-muted bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-surface/80 hover:text-brand-ink transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {next.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setStatusModal(item);
                              setNextStatus('');
                              setStatusNotes('');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-blue bg-brand-blue/5 border border-brand-blue/20 rounded-lg hover:bg-brand-blue/10 transition-all"
                          >
                            <ChevronRight className="w-3.5 h-3.5" /> Status
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/20 backdrop-blur-sm overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-2xl mx-auto mb-12"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <Hash className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-ink font-mono">
                      {detail.order_number}
                    </h4>
                    <p className="text-xs text-brand-muted">
                      Placed {new Date(detail.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border',
                      getOrderStatusTone(detail.status)
                    )}
                  >
                    {getOrderStatusLabel(detail.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InfoCard icon={Building2} label="Branch" value={detail.branch_name} />
                  <InfoCard icon={User} label="Customer" value={detail.guest_name || 'Walk-in'} />
                  <InfoCard icon={DollarSign} label="Total" value={formatMoney(detail.total)} highlight />

                  {(detail.guest_email || detail.guest_phone) && (
                    <InfoCard
                      icon={detail.guest_email ? Mail : Phone}
                      label="Contact"
                      value={detail.guest_email || detail.guest_phone || ''}
                      subValue={detail.guest_email && detail.guest_phone ? detail.guest_phone : undefined}
                    />
                  )}
                  {detail.payment_reference && (
                    <InfoCard icon={Hash} label="Payment Ref" value={detail.payment_reference} mono />
                  )}
                  {detail.paid_at && (
                    <InfoCard icon={Clock} label="Paid at" value={new Date(detail.paid_at).toLocaleString()} />
                  )}
                  {detail.completed_at && (
                    <InfoCard icon={Clock} label="Completed at" value={new Date(detail.completed_at).toLocaleString()} />
                  )}
                </div>

                {/* Items */}
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-2">
                    Items ({detail.items.length})
                  </label>
                  <div className="space-y-2">
                    {detail.items.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between p-3 bg-white border border-brand-border rounded-xl"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-brand-ink truncate">
                            {line.product_name}
                          </p>
                          <p className="text-xs text-brand-muted">SKU: {line.sku}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm text-brand-ink tabular-nums">
                            {line.quantity} &times; {formatMoney(line.unit_price)}
                          </p>
                          <p className="text-xs font-bold text-brand-ink tabular-nums">
                            {formatMoney(line.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-border flex justify-between text-sm">
                    <span className="text-brand-muted">Subtotal</span>
                    <span className="font-medium text-brand-ink tabular-nums">{formatMoney(detail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-semibold text-brand-ink">Total</span>
                    <span className="text-base font-bold text-brand-blue tabular-nums">
                      {formatMoney(detail.total)}
                    </span>
                  </div>
                </div>

                {/* Status history timeline */}
                {detail.status_history.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-3">
                      Status History
                    </label>
                    <div className="space-y-0">
                      {[...detail.status_history]
                        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                        .map((h, idx, arr) => {
                          const isLast = idx === arr.length - 1;
                          return (
                            <div key={h.id} className="flex gap-3 relative">
                              {/* Timeline line */}
                              {!isLast && (
                                <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-brand-border" />
                              )}
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 z-10 bg-white',
                                  normalizeOrderStatus(h.new_status) === 'CANCELLED' ||
                                    normalizeOrderStatus(h.new_status) === 'REFUNDED'
                                    ? 'border-red-400'
                                    : 'border-brand-blue'
                                )}
                              />
                              <div className="flex-1 min-w-0 pb-4">
                                <div className="flex items-center gap-1.5 text-sm flex-wrap">
                                  <span className="font-semibold text-brand-ink">
                                    {h.previous_status
                                      ? getOrderStatusLabel(h.previous_status)
                                      : 'Created'}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-brand-muted shrink-0" />
                                  <span
                                    className={cn(
                                      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                                      getOrderStatusTone(h.new_status)
                                    )}
                                  >
                                    {getOrderStatusLabel(h.new_status)}
                                  </span>
                                </div>
                                <p className="text-xs text-brand-muted mt-0.5">
                                  {h.changed_by && <>{h.changed_by} &middot; </>}
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

                {getNextOrderStatuses(detail.status).length > 0 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusModal(detail);
                        setNextStatus('');
                        setStatusNotes('');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-blue bg-brand-blue/5 border border-brand-blue/20 rounded-lg hover:bg-brand-blue/10 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" /> Update Status
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status update modal */}
      <AnimatePresence>
        {statusModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setStatusModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-sm mx-auto"
            >
              <div className="px-6 py-4 border-b border-brand-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-ink">Update Status</h4>
                    <p className="text-xs text-brand-muted font-mono">{statusModal.order_number}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-2 p-3 bg-brand-surface rounded-lg border border-brand-border/60">
                  <span className="text-xs text-brand-muted">Current:</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold border',
                      getOrderStatusTone(statusModal.status)
                    )}
                  >
                    {getOrderStatusLabel(statusModal.status)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-2">Move to</label>
                  <div className="flex flex-wrap gap-2">
                    {getNextOrderStatuses(statusModal.status).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNextStatus(status)}
                        className={cn(
                          'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all',
                          nextStatus === status
                            ? cn(getOrderStatusTone(status), 'shadow-sm')
                            : 'bg-white border-brand-border text-brand-muted hover:border-brand-blue/20'
                        )}
                      >
                        {getOrderStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                  {getNextOrderStatuses(statusModal.status).length === 0 && (
                    <p className="text-xs text-brand-muted mt-2">
                      No further transitions are available for this status.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1.5">Notes (optional)</label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue resize-none"
                    placeholder="Reason for status change..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-brand-border/50 bg-brand-surface/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-brand-muted bg-white border border-brand-border rounded-lg hover:bg-brand-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={statusSaving || !nextStatus}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 transition-colors shadow-sm shadow-brand-blue/15 flex items-center gap-2"
                >
                  {statusSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Update Status'
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

function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
  highlight,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="p-3 bg-brand-surface rounded-xl border border-brand-border/60">
      <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={cn(
        'text-sm break-all',
        highlight ? 'font-bold text-brand-ink' : 'font-semibold text-brand-ink',
        mono && 'font-mono text-xs',
      )}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-brand-muted mt-0.5">{subValue}</p>
      )}
    </div>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
