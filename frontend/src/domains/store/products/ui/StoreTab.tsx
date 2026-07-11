import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, ShoppingCart, CreditCard, Lock, Minus, Plus, Trash2, ShieldCheck, Star, X, CheckCircle2, Filter, Truck, BadgeCheck, Zap, Sparkles, Heart, Tag, Loader2 } from 'lucide-react';
import type { Product, CartItem } from '@/src/shared/types';
import { getProducts } from '../api/productApi';
import Robotics3DShowcase from './Robotics3DShowcase';

interface StoreTabProps {
  cart: CartItem[];
  onAddToCart: (p: Product) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
  cartTotal: number;
  onCheckout: () => void;
}

export default function StoreTab({ cart, onAddToCart, onUpdateQuantity, onRemoveFromCart, cartTotal, onCheckout }: StoreTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'chappa' | 'stripe'>('chappa');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'chappa_phone' | 'chappa_otp' | 'stripe_card' | 'processing' | 'success'>('idle');
  const [chappaMethod, setChappaMethod] = useState<'telebirr' | 'cbe'>('telebirr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [wishlist, setWishlist] = useState<string[]>([]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const tax = cartTotal * 0.0156;
  const grandTotal = cartTotal + tax;
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleAdd = (p: Product) => { onAddToCart(p); setAddedFeedback(p.id); setTimeout(() => setAddedFeedback(null), 1200); };
  const handleCheckout = () => { if (!cart.length) return; setCheckoutState(paymentMethod === 'chappa' ? 'chappa_phone' : 'stripe_card'); };
  const processPayment = () => {
    setCheckoutState('processing');
    setTimeout(() => { setCheckoutState('success'); onCheckout(); setTimeout(() => setCheckoutState('idle'), 3000); }, 2500);
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-76px)] bg-brand-paper relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-brand-red/5 pointer-events-none" />
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-brand-red/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex-1 overflow-y-auto relative z-10 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">

          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-full mb-3">
                <Sparkles className="w-3 h-3" />
                <span className="font-black text-[9px] uppercase tracking-[0.2em]">Shop</span>
              </div>
              <h1 className="font-black text-2xl md:text-3xl text-white tracking-tight">
                Robotics Gear <span className="text-brand-red">Hub</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
                Lab kits, sensors, bags, and tools ready for schools, teams, and builders.
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50" />
            </div>
          </div>

          {/* Hero */}
          <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5 mb-8 items-stretch">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 text-brand-red px-3 py-1 text-[10px] font-black uppercase tracking-wide mb-4">
                  <Zap className="w-3.5 h-3.5" />Featured Launch
                </div>
                <h2 className="font-black text-2xl md:text-4xl text-slate-900 leading-tight tracking-tight">
                  Equip your robotics team in one checkout.
                </h2>
                <p className="text-sm text-slate-500 mt-3 max-w-xl font-medium">
                  Browse STEM kits, accessories, and school-ready bundles with local payment support.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                {[
                  { icon: BadgeCheck, label: 'Verified Kits', text: 'Curated for STEM labs' },
                  { icon: Truck, label: 'Local Delivery', text: 'Built for Ethiopia' },
                  { icon: ShieldCheck, label: 'Secure Pay', text: 'Chappa or Stripe' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-100 p-3">
                    <item.icon className="w-4 h-4 text-brand-red mb-2" />
                    <p className="text-xs font-black text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <Robotics3DShowcase variant="store" onShop={() => document.getElementById('store-grid')?.scrollIntoView({ behavior: 'smooth' })} />
          </section>

          {/* Categories */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-brand-red/30'
                }`}
              >{cat}</button>
            ))}
          </div>

          {/* Product Grid */}
          <div id="store-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 scroll-mt-28">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
              </div>
            ) : filteredProducts.map(p => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 flex flex-col hover:border-brand-red/40 transition-all group"
              >
                <div onClick={() => setSelectedProduct(p)} className="aspect-square bg-slate-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center p-3 border border-slate-100 cursor-pointer relative">
                  <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  <button onClick={e => { e.stopPropagation(); setWishlist(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]); }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${wishlist.includes(p.id) ? 'bg-brand-red/20 text-brand-red' : 'bg-white/40 text-slate-600 hover:bg-slate-200'}`}
                  ><Heart className={`w-4 h-4 ${wishlist.includes(p.id) ? 'fill-brand-red' : ''}`} /></button>
                </div>
                <div className="flex-1">
                  <h4 onClick={() => setSelectedProduct(p)} className="font-bold text-sm text-slate-900 line-clamp-1 mb-1 cursor-pointer hover:text-brand-red transition-colors">{p.name}</h4>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(p.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-1">({p.reviewsCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-2"><Tag className="w-3 h-3" /><span>{p.category}</span></div>
                </div>
                <div className="flex flex-col mt-auto pt-3 border-t border-slate-100 gap-3">
                  <span className="font-black text-brand-red text-lg">{p.price.toLocaleString()} ETB</span>
                  <button onClick={() => handleAdd(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      addedFeedback === p.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40'
                    }`}
                  >
                    {addedFeedback === p.id ? <><CheckCircle2 className="w-3.5 h-3.5" />Added!</>
                      : <>Add to Cart <ShoppingCart className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <aside className="w-full xl:w-96 bg-white/95 backdrop-blur-xl border-t xl:border-t-0 xl:border-l border-slate-200 flex flex-col xl:h-[calc(100vh-76px)] xl:sticky xl:top-[76px] z-20 overflow-y-auto relative z-10">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2 uppercase tracking-tight">
            <ShoppingBag className="w-5 h-5 text-brand-red" /> Cart
            {cartCount > 0 && <span className="ml-auto bg-brand-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
          </h3>
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4 pr-1">
            {!cart.length ? (
              <div className="text-center py-8 bg-slate-100 rounded-xl border border-slate-100">
                <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold text-slate-500">Cart is empty.</p>
              </div>
            ) : cart.map(item => (
              <motion.div key={item.product.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 items-center border border-slate-200 rounded-xl p-2 bg-slate-100"
              >
                <img src={item.product.image} className="w-12 h-12 object-contain rounded-lg bg-slate-100 border border-slate-200 p-1" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-xs text-slate-900 line-clamp-1">{item.product.name}</p>
                  <p className="text-brand-red font-black text-xs">{(item.product.price * item.quantity).toLocaleString()} ETB</p>
                </div>
                <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                  <button onClick={() => onUpdateQuantity(item.product.id, -1)} className="p-1 text-slate-500 hover:text-slate-900"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-black w-5 text-center text-slate-900">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.product.id, 1)} className="p-1 text-slate-500 hover:text-slate-900"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => onRemoveFromCart(item.product.id)} className="p-1 text-slate-400 hover:text-brand-red transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 text-sm pt-4 border-t border-slate-100">
            <div className="flex justify-between text-slate-500"><span className="font-medium">Subtotal</span><span className="font-black text-slate-900">{cartTotal.toLocaleString()} ETB</span></div>
            <div className="flex justify-between text-slate-500"><span className="font-medium">Tax (1.56%)</span><span className="font-black text-slate-900">{tax.toFixed(0).toLocaleString()} ETB</span></div>
            <div className="flex justify-between mt-2 pt-3 border-t border-slate-200">
              <span className="font-black text-slate-900">Total</span>
              <span className="font-black text-xl text-brand-red">{grandTotal.toFixed(0).toLocaleString()} ETB</span>
            </div>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-red" /> Payment</h3>
          <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Method</label>
            {(['chappa', 'stripe'] as const).map(m => (
              <label key={m} onClick={() => setPaymentMethod(m)}
                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${paymentMethod === m ? 'border-brand-red/40 bg-brand-red/5' : 'border-slate-200 hover:border-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === m ? 'border-brand-red' : 'border-gray-500'}`}>
                  {paymentMethod === m && <div className="w-2 h-2 rounded-full bg-brand-red" />}
                </div>
                <span className="font-bold text-xs text-slate-900 capitalize flex-1">{m}</span>
                <div className={`h-4 w-12 rounded-sm flex items-center justify-center ${m === 'chappa' ? 'bg-gradient-to-r from-brand-blue to-brand-red' : 'bg-gray-800'}`}>
                  <span className="text-[7px] text-white font-black tracking-widest">{m === 'chappa' ? 'CHAPPA' : 'STRIPE'}</span>
                </div>
              </label>
            ))}
          </div>
          <button onClick={handleCheckout} disabled={!cart.length || checkoutState === 'success'}
            className={`mt-4 w-full px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              checkoutState === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-r from-brand-red to-brand-red-dark disabled:opacity-30 disabled:pointer-events-none text-white shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40'
            }`}
          >
            {checkoutState === 'success' ? <><CheckCircle2 className="w-4 h-4" />Paid!</>
              : <><Lock className="w-4 h-4" />Pay {cart.length ? `${grandTotal.toFixed(0).toLocaleString()} ETB` : ''}</>}
          </button>
        </div>
      </aside>

      {/* Checkout Modal */}
      <AnimatePresence>
        {['chappa_phone', 'chappa_otp', 'stripe_card', 'processing'].includes(checkoutState) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/30 backdrop-blur-sm" onClick={() => checkoutState !== 'processing' && setCheckoutState('idle')} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl z-10 p-6 md:p-8"
            >
              {checkoutState !== 'processing' && (
                <button onClick={() => setCheckoutState('idle')} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
              {checkoutState === 'processing' ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-brand-red animate-spin" />
                    <ShieldCheck className="w-6 h-6 text-brand-red absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-2">Processing Payment</h3>
                  <p className="text-sm text-slate-500">Securing with {paymentMethod === 'chappa' ? 'Chappa' : 'Stripe'}...</p>
                </div>
              ) : checkoutState === 'chappa_phone' ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brand-blue to-brand-red flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-slate-900" /></div>
                    <div><h3 className="font-black text-lg text-slate-900">Chappa</h3>
                    <p className="text-xs text-slate-500">{grandTotal.toFixed(0).toLocaleString()} ETB</p></div>
                  </div>
                  <div className="mb-5 flex gap-2">
                    {(['telebirr', 'cbe'] as const).map(m => (
                      <button key={m} onClick={() => setChappaMethod(m)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black uppercase tracking-wider transition-all ${
                          chappaMethod === m ? 'bg-brand-red/10 border-brand-red/40 text-brand-red' : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>{m === 'telebirr' ? 'Telebirr' : 'CBE Birr'}</button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Phone</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">+251</span>
                        <input type="tel" placeholder="911 23 45 67" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50" />
                      </div>
                    </div>
                    <button onClick={() => setCheckoutState('chappa_otp')} disabled={phoneNumber.length < 9}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25 disabled:opacity-50">Continue</button>
                  </div>
                </div>
              ) : checkoutState === 'chappa_otp' ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <ShieldCheck className="w-8 h-8 text-brand-red" /></div>
                  <h3 className="font-black text-xl text-slate-900 mb-2">Authorize Payment</h3>
                  <p className="text-sm text-slate-500 mb-8 max-w-[280px] mx-auto leading-relaxed font-medium">
                    Check your phone for a prompt on {chappaMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} for <span className="font-black text-slate-900">{grandTotal.toFixed(0).toLocaleString()} ETB</span>.
                  </p>
                  <button onClick={processPayment} className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25">I Authorized</button>
                  <button onClick={() => setCheckoutState('chappa_phone')} className="text-xs font-bold text-slate-400 hover:text-slate-900 mt-3">Change phone</button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                      <span className="text-[9px] text-white font-black tracking-widest">STRIPE</span></div>
                    <div><h3 className="font-black text-lg text-slate-900">Card Payment</h3>
                    <p className="text-xs text-slate-500">{grandTotal.toFixed(0).toLocaleString()} ETB</p></div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="4242 4242 4242 4242" className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50 font-mono" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Expiry</label>
                        <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">CVC</label>
                        <input type="text" placeholder="123" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50" />
                      </div>
                    </div>
                    <button onClick={processPayment} className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25 mt-4">
                      Pay {grandTotal.toFixed(0).toLocaleString()} ETB</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden"
            >
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-1000 border border-slate-200 flex items-center justify-center hover:bg-white/30">
                <X className="w-4 h-4 text-slate-600" />
              </button>
              <div className="aspect-video bg-slate-100 flex items-center justify-center p-8 border-b border-slate-100">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full object-contain" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">({selectedProduct.reviewsCount} reviews)</span>
                </div>
                <h2 className="font-black text-xl text-slate-900 mb-2">{selectedProduct.name}</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">{selectedProduct.description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {selectedProduct.features.map((f, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg">{f}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="font-black text-2xl text-brand-red">{selectedProduct.price.toLocaleString()} ETB</span>
                  <button onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                    className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 active:scale-95 transition-all">
                    <ShoppingCart className="w-4 h-4" />Add to Cart</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
