import { http } from '@/shared/api/http';
import type { PaymentEvidencePayload, StorePayment } from '@/domains/store/model/types';

const ADMIN_BASE = '/store/admin';
const STORE_BASE = '/store';

export async function listPayments(filters?: { status?: string; pending_order_id?: string }): Promise<StorePayment[]> {
  const params: Record<string, string> = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.pending_order_id) params.pending_order_id = filters.pending_order_id;
  return await http.get<StorePayment[]>(`${ADMIN_BASE}/payments/`, { params });
}

export async function verifyPayment(pendingOrderPk: string, verificationNotes?: string): Promise<StorePayment> {
  return await http.post<StorePayment>(
    `${ADMIN_BASE}/pending-orders/${pendingOrderPk}/verify/`,
    verificationNotes ? { verification_notes: verificationNotes } : {},
  );
}

export async function rejectPayment(pendingOrderPk: string, verificationNotes: string): Promise<StorePayment> {
  return await http.post<StorePayment>(
    `${ADMIN_BASE}/pending-orders/${pendingOrderPk}/reject/`,
    { verification_notes: verificationNotes },
  );
}

export async function recordCashPayment(
  pendingOrderPk: string,
  data: { amount: string; payment_date?: string },
): Promise<StorePayment> {
  return await http.post<StorePayment>(
    `${ADMIN_BASE}/pending-orders/${pendingOrderPk}/cash/`,
    { amount: data.amount, payment_date: data.payment_date || undefined },
  );
}

/** Submit payment evidence for a pending order (authenticated; backend permission applies). */
export async function submitPaymentEvidence(
  pendingOrderPk: string,
  data: PaymentEvidencePayload,
): Promise<StorePayment> {
  const form = new FormData();
  form.append('amount', String(data.amount));
  form.append('payment_method', data.payment_method);
  if (data.transaction_reference) form.append('transaction_reference', data.transaction_reference);
  if (data.bank_name) form.append('bank_name', data.bank_name);
  if (data.attachment) form.append('attachment', data.attachment);

  return await http.post<StorePayment>(
    `${STORE_BASE}/pending-orders/${pendingOrderPk}/evidence/`,
    form,
  );
}
