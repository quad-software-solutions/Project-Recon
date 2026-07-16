export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusCode, OrderStatusCode[]> = {
  PENDING_PAYMENT: ['PAID'],
  PAID: ['PREPARING', 'CANCELLED', 'REFUNDED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const TONES: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-800 border-amber-200',
  PAID: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  PREPARING: 'bg-brand-blue/5 text-brand-blue-dark border-brand-border',
  READY_FOR_PICKUP: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-brand-surface text-brand-muted border-brand-border',
};

export function normalizeOrderStatus(status: string | undefined | null): string {
  return (status || '').toUpperCase();
}

export function getOrderStatusLabel(status: string | undefined | null): string {
  const key = normalizeOrderStatus(status);
  return LABELS[key] || status || 'Unknown';
}

export function getOrderStatusTone(status: string | undefined | null): string {
  const key = normalizeOrderStatus(status);
  return TONES[key] || 'bg-brand-surface text-brand-muted border-brand-border';
}

export function getNextOrderStatuses(status: string | undefined | null): OrderStatusCode[] {
  const key = normalizeOrderStatus(status) as OrderStatusCode;
  return ORDER_STATUS_TRANSITIONS[key] || [];
}

export function isTerminalOrderStatus(status: string | undefined | null): boolean {
  return getNextOrderStatuses(status).length === 0;
}
