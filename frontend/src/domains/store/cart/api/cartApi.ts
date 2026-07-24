import { http } from '@/shared/api/http';
import { getToken } from '@/shared/utils/auth';
import { getCartToken, getStoreRequestHeaders, setCartToken } from '@/domains/store/utils/session';
import type { ShoppingCart, CartAddPayload } from '../../model/types';

const BASE = '/store/cart';

function captureCartToken(headers: Headers): void {
  const token = headers.get('X-Cart-Token');
  if (token) setCartToken(token);
}

export async function getCart(): Promise<ShoppingCart> {
  const { data, headers } = await http.getWithHeaders<ShoppingCart>(`${BASE}/`, {
    headers: getStoreRequestHeaders(),
  });
  captureCartToken(headers);
  return data;
}

export async function addCartItem(payload: CartAddPayload): Promise<void> {
  if (!getToken() && !getCartToken()) await getCart();
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
