import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Loader2 } from 'lucide-react';
import { fetchPaymentsApi, fetchEnrollmentsApi } from '@/src/domains/learning/academics/api/academicApi';

export default function PaymentTracker() {
  const [payments, setPayments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPaymentsApi(),
      fetchEnrollmentsApi(),
    ]).then(([pay, enr]) => {
      setPayments(Array.isArray(pay) ? pay : []);
      setEnrollments(Array.isArray(enr) ? enr : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const paid = payments.filter(p => p.status === 'PAID');
  const totalRevenue = paid.reduce((s, p) => s + Number(p.amount), 0);
  const cashPayments = payments.filter(p => p.payment_method === 'CASH');
  const totalCash = cashPayments.reduce((s, p) => s + (p.status === 'PAID' ? Number(p.amount) : 0), 0);
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-xl mb-6">Payment & Sales Tracker</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase">Total Revenue</p>
            <p className="font-display font-bold text-2xl text-slate-900">{totalRevenue.toLocaleString()} ETB</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{paid.length} paid transactions</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#2563EB] uppercase">Cash Payments</p>
            <p className="font-display font-bold text-2xl text-slate-900">{totalCash.toLocaleString()} ETB</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{cashPayments.length} cash transactions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Enrollments</p>
          <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{activeEnrollments.length}</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${enrollments.length ? Math.round((activeEnrollments.length / enrollments.length) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pending Payment</p>
          <p className="font-display font-bold text-2xl text-amber-600 mt-0.5">{pendingEnrollments.length}</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${enrollments.length ? Math.round((pendingEnrollments.length / enrollments.length) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Payments</p>
          <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{payments.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">{payments.filter(p => p.status === 'PAID').length} completed</p>
        </div>
      </div>
    </div>
  );
}
