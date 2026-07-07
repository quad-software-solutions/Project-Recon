import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings: Record<string, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = 'md', className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-white rounded-card border border-brand-border-light/45 shadow-premium-sm ${
        hover ? 'hover:shadow-premium-lg transition-all duration-500' : ''
      } ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
