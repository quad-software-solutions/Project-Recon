import { cn } from '@/shared/utils/cn';
import { formatMoney } from '@/domains/store/utils/formatMoney';

interface PriceDisplayProps {
  amount: number | string | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-sm font-semibold',
  md: 'text-lg font-bold',
  lg: 'text-2xl font-bold tracking-tight',
};

export function PriceDisplay({ amount, className, size = 'md' }: PriceDisplayProps) {
  return (
    <span className={cn('text-brand-ink tabular-nums', sizes[size], className)}>
      {formatMoney(amount)}
    </span>
  );
}
