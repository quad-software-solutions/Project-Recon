export function statusBadge(status: string | undefined | null): string {
  if (!status) return 'bg-slate-100 text-slate-600 border-slate-200';

  const normalized = status.toUpperCase().trim();

  switch (normalized) {
    // Success / Active
    case 'ACTIVE':
    case 'COMPLETED':
    case 'APPROVED':
    case 'PAID':
    case 'VERIFIED':
    case 'SUCCESS':
    case 'PUBLISHED':
    case 'RESOLVED':
    case 'ISSUED':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    
    // Warning / Pending
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'PENDING_VERIFICATION':
    case 'SUBMITTED':
    case 'VERIFYING':
    case 'INACTIVE':
      return 'bg-amber-100 text-amber-700 border-amber-200';

    // Info / In Progress
    case 'IN_PROGRESS':
    case 'SCHEDULED':
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-700 border-blue-200';

    // Danger / Live / Cancelled
    case 'LIVE':
      return 'bg-red-100 text-red-700 border-red-200 animate-pulse';
    
    case 'CANCELLED':
    case 'FAILED':
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-200';

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function statusColor(status: string | undefined | null): string {
  return statusBadge(status);
}
