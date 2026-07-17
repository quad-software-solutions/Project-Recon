import {
  Package, Cpu, Radio, Wrench, Shirt, BookOpen, Bot, ShoppingBag, LayoutGrid,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { ProductCategory } from '@/domains/store/model/types';

const CATEGORY_ICONS: Record<string, typeof Package> = {
  Microcontrollers: Cpu,
  Sensors: Radio,
  Accessories: Wrench,
  Apparel: Shirt,
  Bags: ShoppingBag,
  Stationery: BookOpen,
  'Robotics Kits': Bot,
  Robotics: Bot,
};

export function getCategoryIcon(name: string) {
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return Package;
}

interface CategoryChipsProps {
  categories: ProductCategory[];
  selectedId?: string;
  loading?: boolean;
  onSelect: (categoryId: string | undefined) => void;
  className?: string;
}

export function CategoryChips({
  categories,
  selectedId,
  loading,
  onSelect,
  className,
}: CategoryChipsProps) {
  return (
    <div className={cn('flex gap-2 min-w-max', className)}>
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          'flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
          !selectedId
            ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
            : 'bg-white text-brand-muted border border-brand-border hover:border-brand-blue/30 hover:text-brand-ink',
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        All Products
      </button>

      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 h-11 w-28 bg-brand-surface rounded-xl animate-pulse" />
          ))
        : categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const active = selectedId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={cn(
                  'flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
                    : 'bg-white text-brand-muted border border-brand-border hover:border-brand-blue/30 hover:text-brand-ink',
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
                {typeof cat.product_count === 'number' && (
                  <span className={cn('text-[10px] tabular-nums', active ? 'text-white/80' : 'text-brand-muted')}>
                    {cat.product_count}
                  </span>
                )}
              </button>
            );
          })}
    </div>
  );
}
