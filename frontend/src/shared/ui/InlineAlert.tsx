import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, X } from 'lucide-react';

type AlertTone = 'error' | 'warning' | 'info' | 'success';

interface InlineAlertProps {
  tone?: AlertTone;
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const toneStyles: Record<AlertTone, { wrap: string; icon: React.ElementType }> = {
  error: { wrap: 'border-red-200 bg-red-50 text-red-800', icon: AlertCircle },
  warning: { wrap: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
  info: { wrap: 'border-blue-200 bg-blue-50 text-blue-800', icon: Info },
  success: { wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
};

export default function InlineAlert({
  tone = 'warning',
  title,
  message,
  onRetry,
  onDismiss,
  className = '',
}: InlineAlertProps) {
  const { wrap, icon: Icon } = toneStyles[tone];

  return (
    <div
      role="alert"
      className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs ${wrap} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        {title && <p className="font-bold mb-0.5">{title}</p>}
        <p className="leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-black/5 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
