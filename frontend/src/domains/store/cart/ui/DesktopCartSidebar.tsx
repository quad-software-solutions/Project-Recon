import { Minus, Plus, Trash2, ShoppingCart, ShoppingBag, Package } from 'lucide-react';
import type { ShoppingCart as Cart } from '@/domains/store/model/types';
import { PriceDisplay } from '@/domains/store/ui/PriceDisplay';
import { Button } from '@/shared/ui/Button';

interface DesktopCartSidebarProps {
  cart: Cart | null;
  loading?: boolean;
  itemCount: number;
  onOpenCart: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function DesktopCartSidebar({
  cart,
  loading,
  itemCount,
  onOpenCart,
  onUpdateQuantity,
  onRemove,
}: DesktopCartSidebarProps) {
  return (
    <aside className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-24 space-y-3">
        <div className="bg-white rounded-[var(--radius-card)] border border-brand-border/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-blue" />
              <h3 className="font-bold text-sm text-brand-ink">
                Cart {itemCount > 0 && <span className="text-brand-muted font-semibold">({itemCount})</span>}
              </h3>
            </div>
            {itemCount > 0 && (
              <button type="button" onClick={onOpenCart} className="text-xs font-bold text-brand-blue hover:text-brand-blue-dark">
                View full cart
              </button>
            )}
          </div>

          <div className="px-5 py-3 max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-brand-surface rounded-xl">
                    <div className="w-12 h-12 bg-brand-border/40 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-brand-border/40 rounded w-3/4" />
                      <div className="h-3 bg-brand-border/40 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-brand-border" />
                </div>
                <p className="text-sm font-bold text-brand-ink mb-1">Your cart is empty</p>
                <p className="text-xs font-medium text-brand-muted/70">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 bg-brand-surface rounded-xl border border-brand-border/60">
                    <div className="w-11 h-11 bg-white rounded-lg border border-brand-border flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-brand-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-brand-ink truncate">{item.product_name}</h4>
                      <p className="text-[11px] font-medium text-brand-muted truncate">{item.branch_name}</p>
                      <div className="mt-0.5">
                        <PriceDisplay amount={item.product_price} size="sm" className="text-brand-blue text-xs font-bold" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex items-center bg-white border border-brand-border rounded-md overflow-hidden">
                          <button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-brand-muted hover:bg-brand-surface hover:text-brand-ink" disabled={item.quantity <= 1}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-bold px-1.5 min-w-[18px] text-center tabular-nums text-brand-ink">{item.quantity}</span>
                          <button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-brand-muted hover:bg-brand-surface hover:text-brand-ink">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button type="button" onClick={() => onRemove(item.id)} className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-md">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart && cart.items.length > 0 && (
            <div className="px-5 py-4 border-t border-brand-border/50 bg-brand-surface/50">
              <div className="flex items-center justify-between mb-3.5 gap-3">
                <span className="text-xs font-bold text-brand-ink">Subtotal</span>
                <PriceDisplay amount={cart.total} size="sm" />
              </div>
              <Button onClick={onOpenCart} className="w-full font-bold" size="sm">
                View full cart
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 px-4 py-3 bg-white rounded-[var(--radius-card)] border border-brand-border">
          <Package className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-brand-ink">Branch pickup</p>
            <p className="text-[11px] font-medium text-brand-ink/70 leading-relaxed">
              Choose a branch at checkout. Paid orders are prepared for pickup.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
