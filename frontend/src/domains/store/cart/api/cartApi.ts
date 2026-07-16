import { http } from '@/shared/api/http';
import { getStoreRequestHeaders } from '@/domains/store/utils/session';
import type { ShoppingCart, CartAddPayload } from '../../model/types';

const BASE = '/store/cart';

export async function getCart(): Promise<ShoppingCart> {
  return await http.get<ShoppingCart>(`${BASE}/`, { headers: getStoreRequestHeaders() });
}

export async function addCartItem(payload: CartAddPayload): Promise<void> {
  await http.post<void>(`${BASE}/items/`, payload, { headers: getStoreRequestHeaders() });
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  await http.patch<void>(`${BASE}/items/${itemId}/`, { quantity }, { headers: getStoreRequestHeaders() });
}

export async function removeCartItem(itemId: string): Promise<void> {
  await http.delete<void>(`${BASE}/items/${itemId}/remove/`, { headers: getStoreRequestHeaders() });
}

export async function clearCart(): Promise<void> {
  await http.delete<void>(`${BASE}/clear/`, { headers: getStoreRequestHeaders() });
}
