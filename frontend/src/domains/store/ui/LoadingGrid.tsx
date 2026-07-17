interface LoadingGridProps {
  count?: number;
  columns?: number;
}

export function LoadingGrid({ count = 8, columns = 4 }: LoadingGridProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  }[Math.min(columns, 4)] || 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-4`} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-[var(--radius-card)] border border-brand-border/60 overflow-hidden animate-pulse">
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
      ))}
    </div>
  );
}
