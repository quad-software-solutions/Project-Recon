import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ShoppingCart, Store, ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/shared/context/CartContext';
import { listProducts } from '@/domains/store/products/api/productApi';
import { listActiveCategories } from '@/domains/store/categories/api/categoriesApi';
import type { Product, ProductCategory, BranchInventory } from '@/domains/store/model/types';
import { getProductAvailability } from '@/domains/store/inventory/api/inventoryApi';
import { Button } from '@/shared/ui/Button';
import EmptyState from '@/shared/ui/EmptyState';
import { CategoryChips } from '@/domains/store/ui/CategoryChips';
import { CategoryShowcase } from '@/domains/store/ui/CategoryShowcase';
import { ProductGrid } from '@/domains/store/ui/ProductGrid';
import { SectionHeader } from '@/domains/store/ui/SectionHeader';
import { SearchInput } from '@/domains/store/ui/SearchInput';
import { ErrorBanner } from '@/domains/store/ui/ErrorBanner';
import {
  CatalogSort,
  filterAndSortProducts,
  navigateStore,
  paginate,
  parseStorePath,
  storeCategoryPath,
  storeProductPath,
  type StoreView,
} from '@/domains/store/utils/catalog';
import { ProductDetailView } from '@/domains/store/products/ui/ProductDetailView';
import { StoreCategoryView } from '@/domains/store/products/ui/StoreCategoryView';
import PendingOrderView from '@/domains/store/checkout/ui/PendingOrderView';
import { DesktopCartSidebar } from '@/domains/store/cart/ui/DesktopCartSidebar';
import { getUserProfile } from '@/shared/utils/storage';

const PAGE_SIZE = 12;

interface StoreTabProps {
  openCart: () => void;
}

export default function StoreTab({ openCart }: StoreTabProps) {
  const [view, setView] = useState<StoreView>(() => parseStorePath(window.location.pathname));
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<CatalogSort>('newest');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);
  const currentUser = getUserProfile();

  const {
    cart, loading: cartLoading, error: cartError,
    handleAddToCart, handleUpdateQuantity, handleRemoveFromCart,
    clearCartError,
  } = useCartContext();

  useEffect(() => {
    const sync = () => setView(parseStorePath(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, sort]);

  useEffect(() => {
    if (view.kind === 'category') setSelectedCategory(view.categoryId);
  }, [view]);

  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        setCategories(await listActiveCategories());
      } catch { /* non-fatal */ }
      finally { setCategoriesLoading(false); }
    })();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setError(null);
      setProducts(await listProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filtered = useMemo(
    () => filterAndSortProducts(products, {
      categoryId: selectedCategory, search: debouncedSearch, sort,
    }),
    [products, selectedCategory, debouncedSearch, sort],
  );

  const pageData = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  const cartItemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart],
  );

  const goHomeBrowse = useCallback(() => {
    navigateStore('/store');
    setView({ kind: 'home' });
  }, []);

  const openProduct = useCallback((product: Product) => {
    navigateStore(storeProductPath(product.id));
    setView({ kind: 'product', productId: product.id });
  }, []);

  const openCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    navigateStore(storeCategoryPath(categoryId));
    setView({ kind: 'category', categoryId });
  }, []);

  const handleCategoryChip = useCallback((categoryId: string | undefined) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      navigateStore(storeCategoryPath(categoryId));
      setView({ kind: 'category', categoryId });
    } else {
      goHomeBrowse();
    }
  }, [goHomeBrowse]);

  const addProductToCart = useCallback(async (product: Product, branchId?: string, quantity = 1) => {
    setAddingToCart(product.id);
    setCartErrorMessage(null);
    clearCartError();
    try {
      let branch = branchId;
      if (!branch) {
        const availability: BranchInventory[] = await getProductAvailability(product.id);
        const inStock = availability.find((a) => a.quantity > 0) || availability[0];
        if (!inStock) {
          setCartErrorMessage('This product has no inventory at any branch.');
          return;
        }
        branch = inStock.branch;
      }
      await handleAddToCart({ product: product.id, branch, quantity });
      setAddedToCart(product.id);
      setTimeout(() => setAddedToCart((id) => (id === product.id ? null : id)), 1800);
    } catch (err: unknown) {
      setCartErrorMessage(err instanceof Error ? err.message : 'Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  }, [handleAddToCart, clearCartError, openCart]);

  if (view.kind === 'product') {
    return (
      <ProductDetailView
        productId={view.productId}
        catalog={products}
        onBack={goHomeBrowse}
        onViewProduct={openProduct}
        onAddToCart={addProductToCart}
        adding={addingToCart === view.productId}
        cartError={cartErrorMessage || cartError}
        onClearError={() => { setCartErrorMessage(null); clearCartError(); }}
      />
    );
  }

  if (view.kind === 'pending-order') {
    return <PendingOrderView orderId={view.orderId} onBack={goHomeBrowse} />;
  }

  if (view.kind === 'category') {
    const category = categories.find((c) => c.id === view.categoryId);
    return (
      <StoreCategoryView
        category={category}
        categoryId={view.categoryId}
        products={filterAndSortProducts(products, { categoryId: view.categoryId, sort })}
        loading={productsLoading || categoriesLoading}
        error={error}
        onRetry={loadProducts}
        onBack={goHomeBrowse}
        onViewProduct={openProduct}
        onAddToCart={(p) => addProductToCart(p)}
        addingId={addingToCart}
        addedId={addedToCart}
        sort={sort}
        onSortChange={setSort}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper overflow-x-hidden">
      {/* ─── Sticky header (mobile) ─── */}
      <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-brand-blue via-brand-blue-dark to-[#0a1028] shadow-lg shadow-black/10">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-white font-bold text-sm shrink-0">
            <Store className="w-4 h-4 text-brand-cyan" />
            Store
          </span>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-3 h-9 rounded-xl bg-white/15 text-white text-sm placeholder:text-white/50 border border-white/10 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all"
              aria-label="Search products"
            />
          </div>
          <button
            type="button"
            onClick={openCart}
            className="relative shrink-0 w-9 h-9 flex items-center justify-center text-white"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-blue-bright text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none border-2 border-brand-blue-dark">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Hero / promo banner ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue-dark to-[#0a1028] text-white">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,rgba(87,223,254,0.3),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(37,99,235,0.35),transparent_40%)]" />

        <div className="hidden lg:block absolute inset-0 z-[1] bg-gradient-to-r from-[#0a1028]/90 via-[#0a1028]/50 to-transparent" />
        <div className="hidden lg:block absolute inset-x-0 bottom-0 h-[35%] z-[1] bg-gradient-to-t from-[#0a1028]/85 to-transparent" />
        <div className="block lg:hidden absolute inset-x-0 bottom-0 h-[70%] z-[1] bg-gradient-to-t from-[#0a1028]/90 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-8 sm:pb-12 pt-3 sm:pt-8 lg:py-16">
          <div className="max-w-xl text-left flex flex-col gap-2 sm:gap-4">
            <p className="eyebrow text-brand-cyan flex items-center gap-2 text-xs sm:text-sm">
              <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Ethio Robotics Store
            </p>
            <h1 className="font-display text-lg sm:text-4xl lg:text-5xl font-bold tracking-tight leading-snug sm:leading-[1.15]">
              Parts, kits, and gear for your next build
            </h1>
            <p className="text-xs sm:text-base text-white/70 leading-relaxed hidden sm:block">
              Browse products, check branch stock, and pick up your order after payment.
            </p>
            <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
              <Button
                variant="secondary"
                onClick={openCart}
                className="border-white/20 text-white bg-white/10 hover:bg-white/15 backdrop-blur-md w-full sm:w-auto"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2 inline" />
                Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
              </Button>
              {currentUser && (
                <Button
                  variant="ghost"
                  className="text-white/60 bg-white/[0.06] backdrop-blur-md border border-white/15 hover:bg-white/15 hover:text-white w-full sm:w-auto"
                  onClick={() => navigateStore('/store/orders')}
                >
                  My orders
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mobile category chips (scrollable, snap) ─── */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-3 px-3 py-2 bg-white border-b border-brand-border/60">
        <CategoryChips
          categories={categories}
          selectedId={selectedCategory}
          loading={categoriesLoading}
          onSelect={handleCategoryChip}
        />
      </div>

      {/* ─── Category Showcase (desktop only) ─── */}
      {!selectedCategory && !debouncedSearch && categories.length > 0 && (
        <section className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
          <SectionHeader
            eyebrow="Departments"
            title="Browse by Category"
            description={`${categories.length} product categories`}
          />
          <CategoryShowcase categories={categories} loading={categoriesLoading} onSelect={handleCategoryChip} />
        </section>
      )}

      {/* ─── Mobile cart FAB ─── */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40 bottom-safe">
        <button
          type="button"
          onClick={openCart}
          className="relative w-14 h-14 bg-brand-blue text-white rounded-full shadow-lg shadow-brand-blue/25 flex items-center justify-center hover:bg-brand-blue-dark transition-colors active:scale-95"
          aria-label="Open cart"
        >
          <ShoppingBag className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-blue-bright text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 leading-none border-2 border-white">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Catalog ─── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            {/* Section header + sort (desktop) */}
            <div className="hidden sm:block">
              <SectionHeader
                eyebrow="Catalog"
                title="Products"
                description={!productsLoading ? `${pageData.total} product${pageData.total !== 1 ? 's' : ''}` : undefined}
              />
            </div>

            {/* Search + Sort (desktop) + Sort (mobile) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="hidden sm:block flex-1 w-full sm:w-auto">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search products, SKU…"
                  className="sm:w-72 w-full"
                />
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <p className="text-xs text-brand-muted sm:hidden">
                  <span className="font-medium text-brand-ink">{pageData.total}</span> product{pageData.total !== 1 ? 's' : ''}
                </p>
                <label className="text-xs sm:text-sm text-brand-muted flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as CatalogSort)}
                    className="min-h-[36px] sm:min-h-[44px] sm:h-9 px-2 sm:px-3 rounded-lg border border-brand-border bg-white text-xs sm:text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
                  >
                    <option value="newest">Newest</option>
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Desktop category chips */}

            {/* Result count + clear filters (desktop) */}
            <div className="hidden sm:flex items-center justify-between">
              <p className="text-sm text-brand-muted">
                Showing <span className="font-medium text-brand-ink">{pageData.total}</span> product{pageData.total !== 1 ? 's' : ''}
              </p>
              {(selectedCategory || debouncedSearch) && (
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(undefined); setSearchQuery(''); goHomeBrowse(); }}
                  className="text-sm text-brand-blue hover:text-brand-blue-dark font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Errors */}
            {(error || cartError || cartErrorMessage) && (
              <ErrorBanner
                message={error ?? cartError ?? cartErrorMessage ?? ''}
                title={error ? 'Failed to load products' : 'Cart error'}
                onRetry={error ? loadProducts : undefined}
                onDismiss={!error ? () => { clearCartError(); setCartErrorMessage(null); } : undefined}
              />
            )}

            {/* Product grid */}
            {productsLoading ? (
              <ProductGrid products={[]} loading skeletonCount={12} />
            ) : pageData.total === 0 ? (
              <EmptyState
                icon={Search}
                title="No products found"
                description={debouncedSearch ? `No results for "${debouncedSearch}". Try a different search term.` : 'No products yet in this selection.'}
                action={
                  (selectedCategory || debouncedSearch) ? (
                    <Button variant="secondary" onClick={() => { setSelectedCategory(undefined); setSearchQuery(''); goHomeBrowse(); }}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ProductGrid
                  products={pageData.items}
                  onView={openProduct}
                  onAdd={(p) => addProductToCart(p)}
                  addingId={addingToCart}
                  addedId={addedToCart}
                />
                {pageData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pageData.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: pageData.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-all ${
                            p === pageData.page
                              ? 'bg-brand-blue text-white'
                              : 'text-brand-muted hover:text-brand-ink hover:bg-brand-surface'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pageData.page >= pageData.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop Cart Sidebar */}
          <DesktopCartSidebar
            cart={cart}
            loading={cartLoading}
            itemCount={cartItemCount}
            onOpenCart={openCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
          />
        </div>
      </div>
    </div>
  );
}
