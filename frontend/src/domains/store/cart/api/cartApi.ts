import { http } from '@/shared/api/http';
import { getStoreRequestHeaders } from '@/domains/store/utils/session';
import type { ShoppingCart, CartAddPayload } from '../../model/types';

const BASE = '/store/cart';

export async function getCart(): Promise<ShoppingCart> {
  return await http.get<ShoppingCart>(`${BASE}/`, { headers: getStoreRequestHeaders() });
}

export async function addCartItem(payload: CartAddPayload): Promise<ShoppingCartItem> {
  const headers = getStoreRequestHeaders();
  return await http.post<ShoppingCartItem>(`${BASE}/items/`, payload, { headers });
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  await http.patch<void>(`${BASE}/items/${itemId}/`, { quantity }, { headers: getStoreRequestHeaders() });
}

export async function removeCartItem(itemId: string): Promise<void> {
  const headers = getStoreRequestHeaders();
  await http.delete<void>(`${BASE}/items/${itemId}/remove/`, { headers });
}

export async function clearCart(): Promise<void> {
  await http.delete<void>(`${BASE}/clear/`, { headers: getStoreRequestHeaders() });
}
