import { http } from '@/src/shared/api/http';
import type { Order } from '@/src/domains/store/model/types';

export async function getUserOrders(): Promise<Order[]> {
  return await http.get<Order[]>('/store/orders/');
}

export async function getOrder(id: string): Promise<Order> {
  return await http.get<Order>(`/store/orders/${id}/`);
}
