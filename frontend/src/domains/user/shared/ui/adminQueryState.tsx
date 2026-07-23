import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, WifiOff, ShieldOff, FileQuestion, ServerCrash } from 'lucide-react';
import { ApiError, isApiError } from '@/shared/api/http';
import PageSpinner from '@/shared/ui/PageSpinner';
import { GridSkeleton } from '@/shared/ui/LoadingSkeleton';
import EmptyState from '@/shared/ui/EmptyState';
import type { LucideIcon } from 'lucide-react';

export type QueryErrorKind = 'forbidden' | 'not_found' | 'server' | 'network' | 'unknown';

export function classifyQueryError(err: unknown): QueryErrorKind {
  if (isApiError(err)) {
    if (err.status === 403) return 'forbidden';
    if (err.status === 404) return 'not_found';
    if (err.status >= 500) return 'server';
    return 'unknown';
  }
  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number') {
    const status = (err as { status: number }).status;
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status >= 500) return 'server';
  }
  if (err instanceof TypeError || (err instanceof Error && /network|fetch|failed to fetch|connection/i.test(err.message))) {
    return 'network';
  }
  return 'unknown';
}

export function queryErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (isApiError(err)) return err.message || fallback;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

const KIND_META: Record<QueryErrorKind, { icon: LucideIcon; title: string; tone: string }> = {
  forbidden: { icon: ShieldOff, title: 'Permission denied', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  not_found: { icon: FileQuestion, title: 'Not found', tone: 'border-slate-200 bg-slate-50 text-slate-700' },
  server: { icon: ServerCrash, title: 'Server error', tone: 'border-red-200 bg-red-50 text-red-800' },
  network: { icon: WifiOff, title: 'Network error', tone: 'border-orange-200 bg-orange-50 text-orange-800' },
  unknown: { icon: AlertCircle, title: 'Unable to load', tone: 'border-red-200 bg-red-50 text-red-800' },
};

interface ErrorProps {
  error: unknown;
  onRetry?: () => void;
  fallbackMessage?: string;
}

export function AdminQueryError({ error, onRetry, fallbackMessage }: ErrorProps) {
  const kind = classifyQueryError(error);
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const message = queryErrorMessage(error, fallbackMessage);

  return (
    <div className={`border rounded-xl p-6 ${meta.tone}`} role="alert">
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon className="w-8 h-8 opacity-70" aria-hidden />
        <p className="text-sm font-bold">{meta.title}</p>
        <p className="text-xs opacity-80 max-w-md">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/80 border border-current/10 px-3 py-2 rounded-lg hover:bg-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

interface LoadingProps {
  label?: string;
  variant?: 'spinner' | 'skeleton';
  skeletonCount?: number;
}

export function AdminQueryLoading({ label = 'Loading', variant = 'spinner', skeletonCount = 3 }: LoadingProps) {
  if (variant === 'skeleton') return <GridSkeleton count={skeletonCount} />;
  return <PageSpinner label={label} />;
}

interface EmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AdminEmptyState({ icon, title, description, actionLabel, onAction }: EmptyProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <EmptyState icon={icon || AlertCircle} title={title} description={description} />
      {actionLabel && onAction && (
        <div className="pb-6 flex justify-center">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/** Offline banner — listens to browser online/offline events. */
export function AdminOfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 text-xs font-medium"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
      You appear to be offline. Some actions may fail until connectivity returns.
    </div>
  );
}

export function AdminRefreshButton({
  onClick,
  loading,
  label = 'Refresh',
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
      {label}
    </button>
  );
}

/** Filter selected users eligible for bulk activate (Pending or Suspended only). */
export function filterBulkActivateTargets<T extends { id: string; status: string }>(
  users: T[],
  selectedIds: Iterable<string>,
): T[] {
  const selected = new Set(selectedIds);
  return users.filter((u) => selected.has(u.id) && (u.status === 'Pending' || u.status === 'Suspended'));
}

export function toApiError(status: number, message: string): ApiError {
  return new ApiError(status, message);
}
