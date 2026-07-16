import { http } from '@/shared/api/http';
import { getStoreRequestHeaders } from '@/domains/store/utils/session';
import type { CheckoutPayload, PendingOrder } from '@/domains/store/model/types';

const BASE = '/store';

export async function checkout(payload: CheckoutPayload): Promise<PendingOrder> {
  const headers = getStoreRequestHeaders();
  return await http.post<PendingOrder>(`${BASE}/cart/checkout/`, payload, { headers });
}

export async function getPendingOrder(id: string): Promise<PendingOrder> {
  const headers = getStoreRequestHeaders();
  return await http.get<PendingOrder>(`${BASE}/pending-orders/${id}/`, { headers });
}

export default checkout;
