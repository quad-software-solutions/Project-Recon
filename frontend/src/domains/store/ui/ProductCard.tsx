import { ImageOff, ShoppingCart, Check, Eye, Star, Clock, Ban } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { Product } from '@/domains/store/model/types';
import { PriceDisplay } from './PriceDisplay';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onAdd?: (product: Product) => void;
  adding?: boolean;
  added?: boolean;
  stockQuantity?: number | null;
  className?: string;
  featured?: boolean;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isNewProduct(product: Product): boolean {
  const created = new Date(product.created_at).getTime();
  return Date.now() - created < THIRTY_DAYS_MS;
}

export function ProductCard({
  product,
  onView,
  onAdd,
  adding,
  added,
  stockQuantity,
  className,
  featured,
}: ProductCardProps) {
  const outOfStock = stockQuantity != null && stockQuantity <= 0;
  const isNew = isNewProduct(product);

  return (
    <article
      className={cn(
        'group flex flex-col bg-white rounded-[var(--radius-card)] border border-brand-border/80 overflow-hidden transition-all duration-200',
        'hover:shadow-premium-md hover:border-brand-blue/20 hover:-translate-y-1',
        featured && 'ring-1 ring-brand-blue/10',
        outOfStock && 'opacity-75',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onView?.(product)}
        className="relative aspect-[4/3] bg-brand-surface overflow-hidden text-left"
        aria-label={`View ${product.name}`}
      >
        {(() => {
          const imgSrc = product.primary_image?.image || product.images?.[0]?.image;
          const imgAlt = product.primary_image?.alt_text || product.images?.[0]?.alt_text || product.name;
          return imgSrc ? (
            <img
              src={imgSrc}
              alt={imgAlt}
              loading="lazy"
              className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : null;
        })()}
        {!product.primary_image?.image && !product.images?.length && (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-brand-border" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.category_name && (
            <span className="inline-flex items-center px-2 py-0.5 bg-white/95 text-[10px] font-semibold text-brand-muted rounded-md border border-brand-border/60 backdrop-blur-sm shadow-xs">
              {product.category_name}
            </span>
          )}
          {featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50/95 text-[10px] font-semibold text-amber-700 rounded-md border border-amber-200/60 backdrop-blur-sm">
              <Star className="w-2.5 h-2.5" />
              Featured
            </span>
          )}
          {isNew && !featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50/95 text-[10px] font-semibold text-emerald-700 rounded-md border border-emerald-200/60 backdrop-blur-sm">
              <Clock className="w-2.5 h-2.5" />
              New
            </span>
          )}
        </div>

        {/* Out-of-stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50/95 border border-red-200 rounded-lg text-[11px] font-bold text-red-600 shadow-sm">
              <Ban className="w-3.5 h-3.5" />
              Out of stock
            </span>
          </div>
        )}

        {stockQuantity != null && !outOfStock && (
          <span className="absolute bottom-2.5 left-2.5">
            <StockBadge quantity={stockQuantity} />
          </span>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors rounded-[inherit]" />
      </button>

      <div className="flex flex-1 flex-col p-4 gap-2">
        <button type="button" onClick={() => onView?.(product)} className="text-left">
          <h3 className="text-sm font-semibold text-brand-ink leading-snug line-clamp-2 group-hover:text-brand-blue transition-colors">
            {product.name}
          </h3>
        </button>

        {product.short_description && (
          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <PriceDisplay amount={product.price} size="sm" />
          <div className="flex items-center gap-1">
            {onView && (
              <button
                type="button"
                onClick={() => onView(product)}
                className="h-9 w-9 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 border border-transparent hover:border-brand-blue/20 transition-all flex items-center justify-center"
                aria-label={`View ${product.name}`}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onAdd && (
              <button
                type="button"
                onClick={() => onAdd(product)}
                disabled={adding || outOfStock}
                className={cn(
                  'h-9 px-3 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5',
                  added
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-brand-blue text-white hover:bg-brand-blue-dark shadow-sm shadow-brand-blue/15',
                  'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
                )}
              >
                {adding ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : added ? (
                  <><Check className="w-3.5 h-3.5" /> Added</>
                ) : (
                  <><ShoppingCart className="w-3.5 h-3.5" /> Add</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[var(--radius-card)] border border-brand-border/60 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-brand-surface" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-brand-surface rounded w-1/3" />
        <div className="h-4 bg-brand-surface rounded w-full" />
        <div className="h-4 bg-brand-surface rounded w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-brand-surface rounded w-20" />
          <div className="h-9 bg-brand-surface rounded w-20" />
        </div>
      </div>
    </div>
  );
}
