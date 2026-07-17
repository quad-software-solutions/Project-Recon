import { cn } from '@/shared/utils/cn';
import { stockLevel } from '@/domains/store/utils/inventoryDisplay';

interface StockBadgeProps {
  quantity?: number | null;
  minimum?: number | null;
  className?: string;
  /** When availability is still loading */
  loading?: boolean;
  /** When availability was not requested */
  unknown?: boolean;
}

export function StockBadge({
  quantity,
  minimum = 0,
  className,
  loading,
  unknown,
}: StockBadgeProps) {
  if (loading) {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-surface text-brand-muted border border-brand-border animate-pulse', className)}>
        Checking stock…
      </span>
    );
  }

  if (unknown || quantity == null) {
    return null;
  }

  const level = stockLevel(quantity, minimum ?? 0);
  const label =
    level === 'out' ? 'Out of stock' : level === 'low' ? 'Low stock' : 'In stock';
  const tone =
    level === 'out'
      ? 'bg-red-50 text-red-700 border-red-200'
      : level === 'low'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border', tone, className)}>
      {label}
      {level !== 'out' && quantity > 0 ? ` · ${quantity}` : ''}
    </span>
  );
}
