import { useState, useEffect, useCallback } from 'react';
import { 
  getCart, 
  addCartItem, 
  updateCartItemQuantity, 
  removeCartItem, 
  clearCart as clearCartApi 
} from '@/domains/store/cart/api/cartApi';
import type { 
  ShoppingCart, 
  ShoppingCartItem, 
  CartAddPayload 
} from '@/domains/store/model/types';

export function useCart() {
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleAddToCart = async (payload: CartAddPayload) => {
    try {
      await addCartItem(payload);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      throw err;
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateCartItemQuantity(itemId, quantity);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi();
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  };

  const clearCartError = () => setError(null);

  const openCart = () => {
    setCartOpen(true);
  };

  const closeCart = () => {
    setCartOpen(false);
  };

  return {
    cart,
    loading,
    error,
    cartOpen,
    setCartOpen,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    clearCart,
    clearCartError,
    fetchCart,
    openCart,
    closeCart,
  };
}

