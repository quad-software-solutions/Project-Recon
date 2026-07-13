import { http } from '@/src/shared/api/http';
import type { StorePayment } from '@/src/domains/store/model/types';

export async function verifyPayment(reference: string): Promise<StorePayment> {
  return await http.post<StorePayment>('/store/payments/verify/', { reference });
}
