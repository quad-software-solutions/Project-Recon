import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-brand-border p-5 animate-pulse ${className}`}
      aria-hidden
    >
      <div className="h-4 w-1/3 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-4/5 bg-slate-100 rounded" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SignalSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-2 lg:grid-cols-4 animate-pulse ${className}`} aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200/70 bg-white p-3">
          <div className="mb-2 h-8 w-8 rounded-lg bg-slate-200" />
          <div className="h-5 w-12 bg-slate-200 rounded mb-2" />
          <div className="h-2.5 w-16 bg-slate-100 rounded mb-1" />
          <div className="h-2 w-20 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ rows = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-white rounded-xl border border-brand-border">
          <div className="h-full flex items-center gap-4 px-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-slate-200 rounded" />
              <div className="h-2 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
