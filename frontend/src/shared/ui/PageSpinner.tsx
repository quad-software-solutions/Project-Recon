import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageSpinnerProps {
  label?: string;
  className?: string;
}

export default function PageSpinner({ label = 'Loading', className = '' }: PageSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}
