import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export const NA = 'Not Available';

export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return NA;
  const s = String(value).trim();
  return s ? s : NA;
}

export function formatDate(value?: string | null): string {
  if (!value) return NA;
  const d = value.slice(0, 10);
  return d || NA;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return NA;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return displayValue(value);
  }
}

export function labelize(value?: string | null): string {
  if (!value) return NA;
  return value.replace(/_/g, ' ');
}

export const ENROLLMENT_STATUS_META: Record<string, { color: string; dot: string; label: string }> = {
  ACTIVE: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  PENDING_VERIFICATION: { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Pending Verification' },
  COMPLETED: { color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'Completed' },
  CANCELLED: { color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Cancelled' },
  REJECTED: { color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
};

export const VERIFICATION_META: Record<string, { color: string; label: string }> = {
  SUBMITTED: { color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Under Review' },
  VERIFIED: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Verified' },
  REJECTED: { color: 'text-red-700 bg-red-50 border-red-200', label: 'Rejected' },
};

export const PAYMENT_STATUS_META: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-600',
  REFUNDED: 'bg-blue-100 text-blue-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHEQUE', label: 'Cheque' },
] as const;

export function StatusBadge({ status, map }: { status?: string | null; map: Record<string, { color: string; label: string }> }) {
  if (!status) return <span className="text-[10px] font-semibold text-slate-400">{NA}</span>;
  const meta = map[status];
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta?.color || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
      {meta?.label || labelize(status)}
    </span>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

export function FieldItem({ label, value, mono }: { label: string; value: unknown; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm text-slate-900 break-words ${mono ? 'font-mono text-brand-blue text-xs' : 'font-medium'}`}>
        {displayValue(value)}
      </p>
    </div>
  );
}

export function SectionCard({ title, icon, children, actions }: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate">{title}</h4>
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export type TimelineItem = {
  key: string;
  label: string;
  detail?: string;
  active?: boolean;
  done?: boolean;
};

export function SimpleTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return <p className="text-xs text-slate-400">{NA}</p>;
  }
  return (
    <ol className="space-y-0">
      {items.map((item, i) => (
        <li key={item.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                item.done || item.active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-300'
              }`}
            >
              {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </span>
            {i < items.length - 1 && <span className={`w-px flex-1 min-h-[16px] ${item.done ? 'bg-blue-200' : 'bg-slate-200'}`} />}
          </div>
          <div className="pb-4 min-w-0">
            <p className={`text-xs font-semibold ${item.active ? 'text-blue-700' : 'text-slate-800'}`}>{item.label}</p>
            {item.detail && <p className="text-[11px] text-slate-500 mt-0.5 break-words">{item.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary' | 'success';
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  const btn =
    tone === 'success'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : tone === 'primary'
        ? 'bg-blue-600 hover:bg-blue-700'
        : 'bg-red-600 hover:bg-red-700';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40" onClick={onCancel}>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <h4 className="font-bold text-base text-slate-900 mb-1">{title}</h4>
        <p className="text-xs text-slate-500 mb-4">{description}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`flex-1 px-3 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50 ${btn}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
