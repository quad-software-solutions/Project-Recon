import { http } from '@/src/shared/api/http';
import { getStoreRequestHeaders } from '@/src/domains/store/utils/session';
import type { CheckoutPayload, PendingOrder } from '@/src/domains/store/model/types';

export async function checkout(payload: CheckoutPayload): Promise<PendingOrder> {
  const headers = getStoreRequestHeaders();
  return await http.post<PendingOrder>('/store/cart/checkout/', payload, { headers });
}

export default checkout;
