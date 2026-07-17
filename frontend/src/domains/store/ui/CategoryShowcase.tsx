import type { ProductCategory } from '@/domains/store/model/types';
import { getCategoryIcon } from './CategoryChips';
import { cn } from '@/shared/utils/cn';

interface CategoryShowcaseProps {
  categories: ProductCategory[];
  loading?: boolean;
  onSelect: (categoryId: string) => void;
}

export function CategoryShowcase({ categories, loading, onSelect }: CategoryShowcaseProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[var(--radius-card)] bg-brand-surface border border-brand-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.name);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              'text-left p-4 rounded-[var(--radius-card)] border border-brand-border bg-white',
              'hover:border-brand-blue/30 hover:shadow-sm transition-all interactive-lift',
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-brand-ink truncate">{cat.name}</p>
            <p className="text-xs text-brand-muted mt-1">
              {cat.product_count} product{cat.product_count !== 1 ? 's' : ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}
