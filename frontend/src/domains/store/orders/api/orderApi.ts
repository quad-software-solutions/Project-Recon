import { http } from '@/shared/api/http';
import type { Order } from '../../model/types';

const BASE = '/store/orders';

export async function getUserOrders(): Promise<Order[]> {
  return await http.get<Order[]>(`${BASE}/`);
}

export async function getOrder(id: string): Promise<Order> {
  return await http.get<Order>(`${BASE}/${id}/`);
}
