import { http } from '@/src/shared/api/http';
import { getStoreRequestHeaders } from '@/src/domains/store/utils/session';
import type { ShoppingCart, ShoppingCartItem, CartAddPayload } from '@/src/domains/store/model/types';

const BASE = '/store/cart';

export async function getCart(): Promise<ShoppingCart> {
  const headers = getStoreRequestHeaders();
  return await http.get<ShoppingCart>(`${BASE}/`, { headers });
}

export async function addCartItem(payload: CartAddPayload): Promise<ShoppingCartItem> {
  const headers = getStoreRequestHeaders();
  return await http.post<ShoppingCartItem>(`${BASE}/`, payload, { headers });
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<ShoppingCartItem> {
  const headers = getStoreRequestHeaders();
  return await http.patch<ShoppingCartItem>(`${BASE}/items/${itemId}/`, { quantity }, { headers });
}

export async function removeCartItem(itemId: string): Promise<void> {
  const headers = getStoreRequestHeaders();
  await http.delete<void>(`${BASE}/items/${itemId}/`, { headers });
}

export async function clearCart(): Promise<void> {
  const headers = getStoreRequestHeaders();
  await http.delete<void>(`${BASE}/clear/`, { headers });
}
