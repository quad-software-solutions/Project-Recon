import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

type SelectableCardProps = {
  key?: string | number;
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
};

export function SelectableCard({
  selected,
  onSelect,
  title,
  subtitle,
  meta,
  icon,
  disabled,
  'aria-label': ariaLabel,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={ariaLabel || title}
      className={`group relative w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
        selected
          ? 'border-brand-blue bg-brand-blue/[0.04] shadow-md shadow-brand-blue/10'
          : 'border-slate-200 bg-white hover:border-brand-blue/40 hover:shadow-sm hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              selected ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'
            }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-sm leading-snug">{title}</h3>
            <span
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected ? 'border-brand-blue bg-brand-blue text-white' : 'border-slate-300'
              }`}
              aria-hidden
            >
              {selected && <Check className="w-3 h-3" />}
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{subtitle}</p>}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
      </div>
    </button>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
