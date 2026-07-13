import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, CheckCircle2, Loader, Award, Building2 } from 'lucide-react';
import { ShoppingCart, ShoppingCartItem } from '@/src/domains/store/model/types';
import { UserProfile } from '@/src/shared/types';
import checkout from '@/src/domains/store/checkout/api/checkoutApi';
import { Button } from '@/src/shared/ui/Button';

interface CartDrawerProps {
  cartOpen: boolean;
  cart: ShoppingCart | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onCheckoutSuccess: (pendingOrder: any) => void;
  loading?: boolean;
}

export default function CartDrawer({
  cartOpen, cart, currentUser, onClose, onUpdateQuantity, onRemoveFromCart, onCheckoutSuccess, loading = false
}: CartDrawerProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'submitting' | 'success'>('cart');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [branchId] = useState('1'); // TODO: Add proper branch selection

  const total = cart?.total || 0;
  const items = cart?.items || [];
  const itemCount = cart?.item_count || 0;

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    try {
      const pendingOrder = await checkout({
        branch: branchId,
        ...(!currentUser && {
          guest_name: guestName || undefined,
          guest_email: guestEmail || undefined,
          guest_phone: guestPhone || undefined,
        }),
      });
      setCheckoutStep('success');
      onCheckoutSuccess(pendingOrder);
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col z-10"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-blue" />
                <h3 className="font-bold text-lg text-slate-900">Cart ({itemCount})</h3>
              </div>
              <button
                onClick={() => { onClose(); resetCheckout(); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {checkoutStep === 'success' ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-1">Checkout Started!</h3>
                  <p className="text-sm text-slate-500 mb-4">Complete your payment to finish your order.</p>
                  {currentUser && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-amber-700 text-sm font-bold">
                      <Award className="w-4 h-4" /> +40 XP Earned!
                    </div>
                  )}
                  <button
                    onClick={() => { resetCheckout(); onClose(); }}
                    className="mt-6 px-6 py-2.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue-dark transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : checkoutStep === 'submitting' || checkoutLoading ? (
                <div className="text-center py-16">
                  <Loader className="w-10 h-10 animate-spin text-brand-blue mx-auto mb-4" />
                  <p className="text-sm text-slate-500">Processing your order...</p>
                </div>
              ) : checkoutStep === 'checkout' ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <h4 className="font-bold text-base text-slate-900">Checkout Details</h4>
                  
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">Branch</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">Main Branch</p>
                  </div>

                  {!currentUser && (
                    <>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs text-amber-700">
                          Guest checkout available. Log in to track your orders.
                        </p>
                      </div>
                      <input
                        placeholder="Full Name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                      <input
                        placeholder="Phone Number"
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                    </>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark"
                    >
                      {checkoutLoading ? (
                        <Loader className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        `Proceed to Payment — Birr ${total.toLocaleString()}`
                      )}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Back to Cart
                  </button>
                </form>
              ) : (
                items.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Your cart is empty</p>
                    <p className="text-xs text-slate-400 mt-1">Browse our store to add items</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{item.product_name}</h4>
                        <p className="text-xs font-bold text-brand-blue mt-0.5">
                          Birr {item.product_price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-slate-400 hover:text-slate-700"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-2 text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-slate-400 hover:text-slate-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveFromCart(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {items.length > 0 && checkoutStep === 'cart' && !loading && (
              <div className="p-5 border-t border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-slate-700">Total</span>
                  <span className="font-bold text-lg text-brand-blue">Birr {total.toLocaleString()}</span>
                </div>
                <Button
                  onClick={() => setCheckoutStep('checkout')}
                  className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark"
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
