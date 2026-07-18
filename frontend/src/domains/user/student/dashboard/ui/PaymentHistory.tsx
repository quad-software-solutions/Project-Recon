import { useState, useEffect } from 'react';
import type { ElementType } from 'react';
import { CheckCircle, Clock, XCircle, Loader2, DollarSign } from 'lucide-react';
import { fetchEnrollmentsApi } from '@/domains/learning/academics/api/academicApi';
import type { Enrollment } from '@/shared/types';
import { isForbiddenError } from '@/shared/api/http';

interface Props { studentId: string }

const statusStyles: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-600',
  PENDING: 'bg-amber-100 text-amber-700',
  UNPAID: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const statusIcons: Record<string, ElementType> = {
  PAID: CheckCircle,
  PARTIALLY_PAID: Clock,
  PENDING: Clock,
  UNPAID: XCircle,
  CANCELLED: XCircle,
};

export default function PaymentHistory({ studentId }: Props) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    fetchEnrollmentsApi(studentId)
      .then((data) => setEnrollments(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isForbiddenError(err)) setPermissionDenied(true);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const paid = enrollments.filter(e => e.payment_status === 'PAID');
  const pending = enrollments.filter(e => e.payment_status === 'PENDING' || e.payment_status === 'PARTIALLY_PAID');
  const unpaid = enrollments.filter(e => !e.payment_status || e.payment_status === 'UNPAID');

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>;
  }

  if (permissionDenied) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="font-bold text-lg text-slate-900 mb-2">Payment History Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Payment details require staff-level access. Contact administration for your payment records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Enrollments', value: enrollments.length, color: 'text-slate-900' },
          { label: 'Paid', value: paid.length, color: 'text-emerald-600' },
          { label: 'Pending', value: pending.length, color: 'text-amber-600' },
          { label: 'Unpaid', value: unpaid.length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`font-black text-lg mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">Reference</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">Method</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => {
                const SIcon = statusIcons[enr.payment_status || 'UNPAID'] || XCircle;
                return (
                  <tr key={enr.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{enr.program_name || enr.sub_program_name || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-blue-600 hidden sm:table-cell">{enr.enrollment_number || enr.pending_code || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyles[enr.payment_status || 'UNPAID'] || 'bg-slate-100 text-slate-600'}`}>
                        <SIcon className="w-3 h-3" />
                        {enr.payment_status || 'UNPAID'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{enr.payment_method || '—'}</td>
                  </tr>
                );
              })}
              {enrollments.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-xs text-slate-400">No enrollments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
