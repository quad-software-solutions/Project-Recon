import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Enrollment, EnrollmentPayment } from '@/shared/types';
import { fetchEnrollmentsApi, fetchPaymentsApi } from '@/domains/learning/academics/api/academicApi';

export default function AdminRegistrationsPanel() {
  const [registrations, setRegistrations] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchEnrollmentsApi(), fetchPaymentsApi()])
      .then(([enrollmentData, paymentData]) => {
        setRegistrations(enrollmentData);
        setPayments(paymentData);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load enrollments.'))
      .finally(() => setLoading(false));
  }, []);

  const paymentByEnrollment = useMemo(() => {
    return payments.reduce<Record<string, EnrollmentPayment>>((map, payment) => {
      map[payment.enrollment] = payment;
      return map;
    }, {});
  }, [payments]);

  const statusClass = (status: string) => {
    if (status === 'ACTIVE' || status === 'COMPLETED') return 'bg-emerald-50 text-emerald-600';
    if (status === 'PENDING_VERIFICATION') return 'bg-amber-50 text-amber-600';
    return 'bg-red-50 text-red-600';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3 font-semibold text-slate-600">Student</th><th className="px-4 py-3 font-semibold text-slate-600">Program</th><th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Date</th><th className="px-4 py-3 font-semibold text-slate-600">Status</th><th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Amount</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            )}
            {!loading && registrations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No enrollments found.</td></tr>
            )}
            {registrations.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.student_name || r.student_email || 'Student'}</td>
                <td className="px-4 py-3 text-slate-600">{r.class_name || r.sub_program_name || 'Class'}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{r.enrolled_at?.slice(0, 10) || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusClass(r.status)}`}>{r.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">{paymentByEnrollment[r.id] ? `${Number(paymentByEnrollment[r.id].amount).toLocaleString()} Birr` : '—'}</td>
                <td className="px-4 py-3"><span className="text-xs text-slate-400">—</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
