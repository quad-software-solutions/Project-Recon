import { ArrowLeft, Package, Search } from 'lucide-react';
import type { Product, ProductCategory } from '@/domains/store/model/types';
import type { CatalogSort } from '@/domains/store/utils/catalog';
import { ProductGrid } from '@/domains/store/ui/ProductGrid';
import { Button } from '@/shared/ui/Button';
import EmptyState from '@/shared/ui/EmptyState';
import { SectionHeader } from '@/domains/store/ui/SectionHeader';

interface StoreCategoryViewProps {
  category?: ProductCategory;
  categoryId: string;
  products: Product[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBack: () => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  addingId?: string | null;
  addedId?: string | null;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
}

export function StoreCategoryView({
  category,
  categoryId,
  products,
  loading,
  error,
  onRetry,
  onBack,
  onViewProduct,
  onAddToCart,
  addingId,
  addedId,
  sort,
  onSortChange,
}: StoreCategoryViewProps) {
  const title = category?.name || 'Category';
  const description = category?.description;

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="border-b border-brand-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-ink mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All products
          </button>
          <p className="eyebrow mb-1">Category</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-brand-muted max-w-2xl leading-relaxed">{description}</p>
          )}
          {!loading && (
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="text-brand-muted">
                <span className="font-medium text-brand-ink">{products.length}</span> product{products.length !== 1 ? 's' : ''}
              </span>
              {category && typeof category.product_count === 'number' && (
                <span className="text-brand-muted/60">
                  &middot; {category.product_count} total in catalog
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div />
          <label className="text-sm text-brand-muted flex items-center gap-2 whitespace-nowrap">
            Sort by
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as CatalogSort)}
              className="h-9 px-3 rounded-lg border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue"
            >
              <option value="newest">Newest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>
            )}
          </div>
        )}

        {loading ? (
          <ProductGrid products={[]} loading skeletonCount={8} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={category ? Package : Search}
            title="No products in this category"
            description={category ? `There are no products in "${title}" yet. Check back soon.` : 'This category could not be found.'}
            action={<Button variant="secondary" onClick={onBack}>Browse all products</Button>}
          />
        ) : (
          <ProductGrid
            products={products}
            onView={onViewProduct}
            onAdd={onAddToCart}
            addingId={addingId}
            addedId={addedId}
          />
        )}

        {!category && !loading && (
          <p className="mt-6 text-xs text-brand-muted">Category id: {categoryId}</p>
        )}
      </div>
    </div>
  );
}
