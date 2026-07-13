import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, ShoppingCart, Minus, Plus, Trash2, ShieldCheck, X, CheckCircle2, Filter, Truck, BadgeCheck, Zap, Sparkles, Heart, Loader2, ArrowRight } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import useCategories from '../../categories/hooks/useCategories';
import { useCart } from '@/src/shared/hooks/useCart';
import checkout from '../../checkout/api/checkoutApi';
import type { Product, CartAddPayload } from '../../model/types';
import Robotics3DShowcase from './Robotics3DShowcase';

export default function StoreTab() {
  const { products, loading: productsLoading, error: productsError, filters, setFilters } = useProducts();
  const { categories, error: categoriesError } = useCategories();
  const { 
    cart, loading: cartLoading, error: cartError, 
    handleAddToCart, handleUpdateQuantity, handleRemoveFromCart,
    fetchCart, openCart, cartOpen, setCartOpen
  } = useCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'checkout_form' | 'processing' | 'success'>('idle');
  const [checkoutForm, setCheckoutForm] = useState({
    branch: '',
    guest_name: '',
    guest_email: '',
    guest_phone: ''
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const cartItems = cart?.items ?? [];
  const cartItemCount = cart?.item_count ?? 0;
  const cartTotal = cart?.total ?? 0;

  const filteredProducts = products
    .filter(p => !filters.category_id || p.category === filters.category_id)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAdd = async (product: Product) => {
    try {
      // For now, use a dummy branch ID (replace with actual branch selection later)
      const payload: CartAddPayload = {
        product: product.id,
        branch: '00000000-0000-0000-0000-000000000000',
        quantity: 1
      };
      await handleAddToCart(payload);
      setAddedFeedback(product.id);
      setTimeout(() => setAddedFeedback(null), 1200);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;
    setCheckoutState('checkout_form');
  };

  const processCheckout = async () => {
    if (!checkoutForm.branch) {
      setCheckoutError('Please select a branch');
      return;
    }
    try {
      setCheckoutState('processing');
      setCheckoutError(null);
      const payload = {
        branch: checkoutForm.branch,
        guest_name: checkoutForm.guest_name || undefined,
        guest_email: checkoutForm.guest_email || undefined,
        guest_phone: checkoutForm.guest_phone || undefined
      };
      const order = await checkout(payload);
      setCheckoutState('success');
      await fetchCart();
      setTimeout(() => {
        setCheckoutState('idle');
        setCartOpen(false);
      }, 3000);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutState('checkout_form');
    }
  };

  if (productsError || categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-76px)] bg-brand-paper p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
          <p className="text-slate-400 mb-4">{productsError || categoriesError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-brand-red text-white rounded-xl font-bold hover:bg-brand-red-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50" 
              />
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
            <button 
              onClick={() => setFilters({ ...filters, category_id: undefined })}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap uppercase tracking-wider transition-all ${
                !filters.category_id
                  ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-brand-red/30'
              }`}
            >
              All
            </button>
                {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setFilters({ ...filters, category_id: cat.id })}
                className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap uppercase tracking-wider transition-all ${
                  filters.category_id === cat.id
                    ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-brand-red/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div id="store-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 scroll-mt-28">
            {productsLoading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
              </div>
            ) : filteredProducts.map((p) => (
              <motion.div 
                key={p.id} 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 flex flex-col hover:border-brand-red/40 transition-all group"
              >
                <div 
                  onClick={() => setSelectedProduct(p)} 
                  className="aspect-square bg-slate-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center p-3 border border-slate-100 cursor-pointer relative"
                >
                  {p.primary_image?.image ? (
                    <img 
                      src={p.primary_image.image} 
                      alt={p.name} 
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <ShoppingCart className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <button 
                    onClick={e => { 
                      e.stopPropagation(); 
                      setWishlist(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]); 
                    }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${wishlist.includes(p.id) ? 'bg-brand-red/20 text-brand-red' : 'bg-white/40 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(p.id) ? 'fill-brand-red' : ''}`} />
                  </button>
                </div>
                <div className="flex-1">
                  <h4 
                    onClick={() => setSelectedProduct(p)} 
                    className="font-bold text-sm text-slate-900 line-clamp-1 mb-1 cursor-pointer hover:text-brand-red transition-colors"
                  >
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-2">
                    <span>{p.category_name}</span>
                  </div>
                </div>
                <div className="flex flex-col mt-auto pt-3 border-t border-slate-100 gap-3">
                  <span className="font-black text-brand-red text-lg">{Number(p.price).toLocaleString()} Birr</span>
                  <button 
                    onClick={() => handleAdd(p)}
                    disabled={cartLoading}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      addedFeedback === p.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40'
                    } disabled:opacity-50`}
                  >
                    {addedFeedback === p.id ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" />Added!</>
                    ) : (
                      <><ShoppingCart className="w-3.5 h-3.5" />Add to Cart</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <aside className="fixed inset-y-0 right-0 w-full xl:w-96 bg-white/95 backdrop-blur-xl border-l border-slate-200 flex flex-col z-50 shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2 uppercase tracking-tight">
                <ShoppingBag className="w-5 h-5 text-brand-red" /> Cart
                {cartItemCount > 0 && (
                  <span className="bg-brand-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </h3>
              <button 
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cartLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                </div>
              ) : cartError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500 font-medium">{cartError}</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-8 bg-slate-100 rounded-xl border border-slate-100">
                  <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-bold text-slate-500">Cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 items-center border border-slate-200 rounded-xl p-2 bg-slate-100"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-xs text-slate-900 line-clamp-1">{item.product_name}</p>
                        <p className="text-brand-red font-black text-xs">{(Number(item.product_price) * item.quantity).toLocaleString()} Birr</p>
                      </div>
                      <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black w-5 text-center text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-brand-red transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-100">
                <div className="flex justify-between mb-3">
                  <span className="font-medium text-slate-500">Total</span>
                  <span className="font-black text-xl text-brand-red">{Number(cartTotal).toLocaleString()} Birr</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 transition-all flex items-center justify-center gap-2"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </aside>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutState !== 'idle' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/30 backdrop-blur-sm" 
              onClick={() => checkoutState !== 'processing' && setCheckoutState('idle')} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl z-10 p-6 md:p-8"
            >
              {checkoutState !== 'processing' && checkoutState !== 'success' && (
                <button 
                  onClick={() => setCheckoutState('idle')}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}

              {checkoutState === 'processing' ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-brand-red animate-spin" />
                    <ShieldCheck className="w-6 h-6 text-brand-red absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-2">Processing Checkout</h3>
                  <p className="text-sm text-slate-500">Please wait...</p>
                </div>
              ) : checkoutState === 'success' ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-2">Checkout Complete!</h3>
                  <p className="text-sm text-slate-500 mb-4">Your order has been placed successfully.</p>
                  <p className="text-xs text-slate-400">Closing in 3 seconds...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 mb-2">Checkout</h3>
                    <p className="text-sm text-slate-500">Complete your order details below.</p>
                  </div>

                  {checkoutError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                      {checkoutError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Branch</label>
                      <select
                        value={checkoutForm.branch}
                        onChange={e => setCheckoutForm({ ...checkoutForm, branch: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-red/50"
                      >
                        <option value="">Select a branch</option>
                        <option value="00000000-0000-0000-0000-000000000000">Main Branch (Default)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Full Name (Optional)</label>
                      <input
                        type="text"
                        value={checkoutForm.guest_name}
                        onChange={e => setCheckoutForm({ ...checkoutForm, guest_name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Email (Optional)</label>
                      <input
                        type="email"
                        value={checkoutForm.guest_email}
                        onChange={e => setCheckoutForm({ ...checkoutForm, guest_email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={checkoutForm.guest_phone}
                        onChange={e => setCheckoutForm({ ...checkoutForm, guest_phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red/50"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between mb-4">
                      <span className="font-medium text-slate-500">Total</span>
                      <span className="font-black text-xl text-brand-red">{Number(cart?.total || 0).toLocaleString()} Birr</span>
                    </div>
                    <button 
                      onClick={processCheckout}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 transition-all"
                    >
                      Place Order
                    </button>
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
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)} 
              className="absolute inset-0 bg-white/30 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
              <div className="aspect-video bg-slate-100 flex items-center justify-center p-8 border-b border-slate-100">
                {selectedProduct.primary_image?.image ? (
                  <img 
                    src={selectedProduct.primary_image.image} 
                    alt={selectedProduct.name} 
                    className="max-h-full object-contain" 
                  />
                ) : (
                  <ShoppingCart className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <div className="p-6">
                <h2 className="font-black text-xl text-slate-900 mb-2">{selectedProduct.name}</h2>
                <p className="text-sm text-slate-500 mb-1">{selectedProduct.category_name}</p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">
                  {selectedProduct.short_description || selectedProduct.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="font-black text-2xl text-brand-red">
                    {Number(selectedProduct.price).toLocaleString()} Birr
                  </span>
                  <button 
                    onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                    disabled={cartLoading}
                    className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      <div className="xl:hidden fixed bottom-6 right-6 z-40">
        <button 
          onClick={openCart}
          className="w-14 h-14 bg-gradient-to-r from-brand-red to-brand-red-dark rounded-full shadow-xl shadow-brand-red/30 flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-brand-red text-xs font-black rounded-full flex items-center justify-center border-2 border-brand-red">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
