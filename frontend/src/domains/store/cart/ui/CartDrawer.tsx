import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, X, Plus, Minus, Trash2, CheckCircle2, Loader, Building2, Package, AlertCircle,
  CreditCard, Upload, Landmark,
} from 'lucide-react';
import type { PendingOrder, ShoppingCart, StorePaymentMethod, BankAccount } from '@/domains/store/model/types';
import { UserProfile } from '@/shared/types';
import checkout from '@/domains/store/checkout/api/checkoutApi';
import { listBankAccounts } from '@/domains/store/bank/api/bankAccountApi';
import { Button } from '@/shared/ui/Button';
import { PriceDisplay } from '@/domains/store/ui/PriceDisplay';
import { formatMoney } from '@/domains/store/utils/formatMoney';
import { navigateStore, storePendingOrderPath } from '@/domains/store/utils/catalog';

const PAYMENT_METHODS: { value: StorePaymentMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CASH', label: 'Cash (pay at branch)' },
  { value: 'CHEQUE', label: 'Cheque' },
];

interface CartDrawerProps {
  cartOpen: boolean;
  cart: ShoppingCart | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onCheckoutSuccess: (pendingOrder: PendingOrder) => void;
  loading?: boolean;
}

function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl border border-brand-border animate-pulse">
      <div className="w-14 h-14 bg-brand-border/40 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-brand-border/40 rounded w-3/4" />
        <div className="h-3 bg-brand-border/40 rounded w-1/3" />
      </div>
      <div className="w-24 h-8 bg-brand-border/40 rounded-lg" />
    </div>
  );
}

export default function CartDrawer({
  cartOpen, cart, currentUser, onClose, onUpdateQuantity, onRemoveFromCart, onCheckoutSuccess, loading = false,
}: CartDrawerProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>('BANK_TRANSFER');
  const [bankName, setBankName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [includePayment, setIncludePayment] = useState(true);
  const [paymentAttachment, setPaymentAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const total = cart?.total || 0;
  const items = cart?.items || [];
  const itemCount = cart?.item_count || items.reduce((s, i) => s + i.quantity, 0);

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.branch) map.set(item.branch, item.branch_name || 'Branch');
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  useEffect(() => {
    if (branchOptions.length === 1) setBranchId(branchOptions[0].id);
    else if (branchOptions.length > 0 && !branchOptions.some((b) => b.id === branchId)) {
      setBranchId(branchOptions[0].id);
    }
  }, [branchOptions, branchId]);

  useEffect(() => {
    if (paymentMethod === 'CASH') {
      setPaymentAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (checkoutStep === 'checkout' && includePayment && paymentMethod !== 'CASH') {
      setBankAccountsLoading(true);
      listBankAccounts()
        .then(setBankAccounts)
        .catch(() => setBankAccounts([]))
        .finally(() => setBankAccountsLoading(false));
    }
  }, [checkoutStep, includePayment, paymentMethod]);

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!branchId) {
      setFormError('Select a pickup branch. Cart items must belong to one branch.');
      return;
    }
    const uniqueBranches = new Set(items.map((i) => i.branch));
    if (uniqueBranches.size > 1) {
      setFormError('Your cart has items from multiple branches. Checkout supports one branch per order.');
      return;
    }
    if (!currentUser) {
      if (!guestName.trim()) {
        setFormError('Full name is required for guest checkout.');
        return;
      }
      if (!guestEmail.trim()) {
        setFormError('Email is required for guest checkout.');
        return;
      }
    }
    if (includePayment && paymentMethod !== 'CASH') {
      if (!transactionRef.trim()) {
        setFormError('Transaction reference is required for this payment method.');
        return;
      }
    }
    setCheckoutLoading(true);
    try {
      const order = await checkout({
        branch: branchId,
        ...(!currentUser && {
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim() || undefined,
        }),
        ...(includePayment && {
          payment: {
            amount: total,
            payment_method: paymentMethod,
            transaction_reference: transactionRef.trim() || undefined,
            bank_name: bankName.trim() || undefined,
          },
        }),
      }, paymentAttachment, senderName.trim() || undefined);
      setPendingOrder(order);
      setCheckoutStep('success');
      onCheckoutSuccess(order);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setPaymentMethod('BANK_TRANSFER');
    setBankName('');
    setSenderName('');
    setTransactionRef('');
    setIncludePayment(true);
    setPaymentAttachment(null);
    setBankAccounts([]);
    setFormError(null);
    setPendingOrder(null);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { onClose(); resetCheckout(); }}
            className="absolute inset-0 bg-brand-ink/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col z-10"
          >
            <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-brand-ink">Cart</h3>
                  {itemCount > 0 && checkoutStep === 'cart' && (
                    <p className="text-xs font-semibold text-brand-muted">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); resetCheckout(); }}
                className="p-2.5 rounded-xl text-brand-muted hover:bg-brand-surface hover:text-brand-ink transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {checkoutStep === 'success' && pendingOrder ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-xl text-brand-ink mb-1 text-center">Checkout created</h3>
                  <p className="text-sm text-brand-muted mb-6 text-center leading-relaxed max-w-xs mx-auto">
                    {includePayment
                      ? 'Payment evidence submitted. Staff will verify and confirm your order.'
                      : 'You chose to pay later. Submit payment at the branch with your order reference. This pending checkout expires after 30 minutes.'}
                  </p>
                  <div className="space-y-3 rounded-[var(--radius-card)] border border-brand-border bg-brand-surface/60 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-brand-muted">Branch</span>
                      <span className="font-bold text-brand-ink text-right">{pendingOrder.branch_name}</span>
                    </div>
                    <div className="flex justify-between gap-3 items-center">
                      <span className="font-semibold text-brand-muted">Total</span>
                      <PriceDisplay amount={pendingOrder.total} size="sm" />
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-brand-muted">Items</span>
                      <span className="font-bold text-brand-ink">{pendingOrder.items.length}</span>
                    </div>
                    {pendingOrder.payment_reference && (
                      <div className="pt-2 border-t border-brand-border">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-ink mb-1">Payment reference</p>
                        <p className="font-mono text-xs font-bold text-brand-ink break-all">{pendingOrder.payment_reference}</p>
                      </div>
                    )}
                    {pendingOrder.expires_at && (
                      <p className="text-xs font-medium text-brand-muted">
                        Expires {new Date(pendingOrder.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        resetCheckout();
                        onClose();
                        navigateStore(storePendingOrderPath(pendingOrder.id));
                      }}
                      size="lg"
                      variant="secondary"
                      className="w-full font-bold"
                    >
                      View details
                    </Button>
                    {currentUser && (
                      <Button
                        onClick={() => {
                          resetCheckout();
                          onClose();
                          navigateStore('/store/orders');
                        }}
                        size="lg"
                        className="w-full font-bold"
                      >
                        View my orders
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => { resetCheckout(); onClose(); }}
                      size="lg"
                      className="w-full font-bold"
                    >
                      Continue shopping
                    </Button>
                  </div>
                </motion.div>
              ) : checkoutLoading ? (
                <div className="text-center py-16">
                  <Loader className="w-10 h-10 animate-spin text-brand-blue mx-auto mb-4" />
                  <p className="text-sm text-brand-muted">Creating your pending order…</p>
                </div>
              ) : checkoutStep === 'checkout' ? (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleCheckoutSubmit}
                  className="space-y-4"
                >
                  <h4 className="font-bold text-lg text-brand-ink">Checkout</h4>

                  <div className="p-4 bg-brand-surface rounded-xl border border-brand-border space-y-3">
                    <div className="flex items-center gap-2 text-sm text-brand-ink">
                      <Building2 className="w-4 h-4" />
                      <span className="font-bold">Pickup branch</span>
                    </div>
                    {branchOptions.length === 0 ? (
                      <p className="text-sm text-brand-muted">No branch on cart items.</p>
                    ) : branchOptions.length === 1 ? (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-brand-border">
                        <Building2 className="w-4 h-4 text-brand-blue" />
                        <span className="text-sm font-bold text-brand-ink">{branchOptions[0].name}</span>
                      </div>
                    ) : (
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="form-input w-full font-semibold"
                        required
                      >
                        {branchOptions.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                    <p className="text-[11px] font-medium text-brand-ink/70 leading-relaxed">
                      One order belongs to one branch. Items should share the same pickup location.
                    </p>
                  </div>

                  {!currentUser && (
                    <>
                      <div className="p-3 bg-brand-blue/5 rounded-xl border border-brand-blue/15">
                        <p className="text-xs font-semibold text-brand-blue leading-relaxed">
                          Guest checkout available. Sign in afterward to track confirmed orders.
                        </p>
                      </div>
                      <input
                        placeholder="Full name *"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="form-input"
                        required
                        aria-required
                      />
                      <input
                        placeholder="Email *"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="form-input"
                        required
                        aria-required
                      />
                      <input
                        placeholder="Phone (optional)"
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="form-input"
                      />
                    </>
                  )}

                  <div className="rounded-xl border border-brand-border p-4 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-ink flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" /> Order summary
                    </p>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-sm">
                        <span className="font-semibold text-brand-ink truncate">{item.product_name} × {item.quantity}</span>
                        <span className="tabular-nums font-semibold text-brand-ink shrink-0">{formatMoney(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-brand-border flex justify-between items-center gap-3">
                      <span className="font-bold text-brand-ink">Total</span>
                      <PriceDisplay amount={total} size="md" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-brand-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePayment}
                        onChange={(e) => setIncludePayment(e.target.checked)}
                        className="rounded border-brand-border"
                      />
                      Submit payment evidence now
                    </label>
                    {includePayment && (
                      <>
                        <div>
                          <label className="text-[11px] font-bold text-brand-ink uppercase tracking-wide mb-1.5 block">Payment method</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as StorePaymentMethod)}
                            className="form-input w-full font-semibold"
                            required
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        {paymentMethod !== 'CASH' && (
                          <>
                            <div>
                              <label className="text-[11px] font-bold text-brand-ink uppercase tracking-wide mb-1.5 block">Your name / sender</label>
                              <input
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                className="form-input w-full"
                                placeholder="Your full name"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-brand-ink uppercase tracking-wide mb-1.5 block">Your bank / provider</label>
                              <input
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="form-input w-full"
                                placeholder="e.g. Commercial Bank of Ethiopia"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-brand-ink uppercase tracking-wide mb-1.5 block">Transaction reference</label>
                              <input
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                className="form-input w-full"
                                placeholder="Transfer / receipt reference"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-brand-ink uppercase tracking-wide mb-1.5 block">Upload receipt (optional)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => setPaymentAttachment(e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="font-bold"
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5 inline" />
                                  {paymentAttachment ? paymentAttachment.name : 'Choose file'}
                                </Button>
                                {paymentAttachment && (
                                  <button
                                    type="button"
                                    onClick={() => { setPaymentAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="p-2 text-brand-muted hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="border-t border-brand-border/50 pt-3">
                              <label className="text-[11px] font-bold text-brand-ink uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5" /> Company bank accounts
                              </label>
                              {bankAccountsLoading ? (
                                <div className="space-y-2">
                                  {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-12 bg-brand-border/20 rounded-lg animate-pulse" />
                                  ))}
                                </div>
                              ) : bankAccounts.length === 0 ? (
                                <p className="text-xs font-medium text-brand-muted">No bank accounts available.</p>
                              ) : (
                                (() => {
                                  const seen = new Set<string>();
                                  const uniq = bankAccounts.filter(a => { const k = a.account_number; if (seen.has(k)) return false; seen.add(k); return a.is_active; });
                                  const byBank: [string, typeof uniq][] = [];
                                  uniq.forEach(a => {
                                    let g = byBank.find(([b]) => b === a.bank_name);
                                    if (!g) { g = [a.bank_name, []]; byBank.push(g); }
                                    g[1].push(a);
                                  });
                                  return <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {byBank.map(([bank, accs]) => (
                                      <div key={bank}>
                                        <p className="font-bold text-brand-ink text-xs mb-1.5">{bank}</p>
                                        <div className="space-y-1.5">
                                          {accs.map(acc => (
                                            <div key={acc.account_number} className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-brand-border/60 text-xs">
                                              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                                <span className="font-mono font-bold text-brand-ink">{acc.account_number}</span>
                                                <span className="text-brand-muted text-[10px] font-medium truncate">{acc.account_holder}{acc.branch ? ` • ${acc.branch}` : ''}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => navigator.clipboard.writeText(acc.account_number)}
                                                className="shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-colors"
                                                title="Copy account number"
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>;
                                })()
                              )}
                            </div>
                          </>
                        )}
                        <p className="text-[11px] font-medium text-brand-ink/70 leading-relaxed">
                          Amount submitted: <span className="font-bold text-brand-ink">{formatMoney(total)}</span>. Staff will verify before fulfilling the order.
                        </p>
                      </>
                    )}
                  </div>

                  {formError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <Button type="submit" disabled={checkoutLoading || !branchId} className="w-full font-bold" size="lg">
                    {checkoutLoading ? (
                      <><Loader className="w-4 h-4 animate-spin mr-2 inline" /> Processing…</>
                    ) : (
                      <><CreditCard className="w-4 h-4 mr-2 inline" /> Place order — {formatMoney(total)}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setCheckoutStep('cart');
                      setGuestName('');
                      setGuestEmail('');
                      setGuestPhone('');
                      setPaymentMethod('BANK_TRANSFER');
                      setBankName('');
                      setSenderName('');
                      setTransactionRef('');
                      setIncludePayment(true);
                      setPaymentAttachment(null);
                      setBankAccounts([]);
                      setFormError(null);
                    }}
                    className="w-full font-bold"
                  >
                    Back to cart
                  </Button>
                </motion.form>
              ) : loading ? (
                <div className="space-y-3 pt-2">
                  <CartItemSkeleton />
                  <CartItemSkeleton />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-7 h-7 text-brand-border" />
                  </div>
                  <p className="text-sm font-bold text-brand-ink mb-1">Your cart is empty</p>
                  <p className="text-xs font-medium text-brand-muted max-w-[200px] mx-auto leading-relaxed">
                    Browse the store and add items to get started
                  </p>
                  <div className="mt-6">
                    <Button onClick={onClose} variant="secondary" size="sm" className="font-bold">Browse products</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3.5 bg-brand-surface rounded-xl border border-brand-border">
                      <div className="w-14 h-14 bg-white rounded-lg border border-brand-border flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-brand-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-brand-ink truncate">{item.product_name}</h4>
                        <p className="text-[11px] font-medium text-brand-muted truncate">{item.branch_name}</p>
                        <PriceDisplay amount={item.product_price} size="sm" className="text-brand-blue text-xs font-bold mt-0.5" />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-white border border-brand-border rounded-lg overflow-hidden">
                          <button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-ink transition-colors" disabled={item.quantity <= 1}>
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-2.5 min-w-[24px] text-center tabular-nums text-brand-ink">{item.quantity}</span>
                          <button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-ink transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button type="button" onClick={() => onRemoveFromCart(item.id)} className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && checkoutStep === 'cart' && !loading && (
              <div className="px-5 py-4 border-t border-brand-border/50 bg-brand-surface/80 shrink-0">
                <div className="flex items-center justify-between mb-3.5 gap-3">
                  <span className="text-sm font-bold text-brand-ink">Subtotal</span>
                  <PriceDisplay amount={total} size="md" />
                </div>
                <Button onClick={() => setCheckoutStep('checkout')} className="w-full font-bold" size="lg">
                  Proceed to checkout
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
