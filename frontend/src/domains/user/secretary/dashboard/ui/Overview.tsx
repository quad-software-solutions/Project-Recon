import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CheckCircle2, DollarSign, Award, Calendar, Shield, UserPlus, Loader2, RefreshCw, Search } from 'lucide-react';
import { Enrollment, EnrollmentPayment, StudentCertificate } from '@/shared/types';
import { fetchEnrollmentsApi, fetchPaymentsApi, fetchStudentsApi, fetchStudentCertificatesApi } from '@/domains/learning/academics/api/academicApi';

import type { SecretarySectionId } from '../secretaryCommandCenter';

export default function Overview({
  onNavigate,
}: {
  onNavigate?: (section: SecretarySectionId) => void;
} = {}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchStudentsApi(),
      fetchStudentCertificatesApi(),
    ]).then(([enr, pay, stu, cer]) => {
      setEnrollments(enr.status === 'fulfilled' && Array.isArray(enr.value) ? enr.value : []);
      setPayments(pay.status === 'fulfilled' && Array.isArray(pay.value) ? pay.value : []);
      setStudents(stu.status === 'fulfilled' && Array.isArray(stu.value) ? stu.value : []);
      setCerts(cer.status === 'fulfilled' && Array.isArray(cer.value) ? cer.value : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingPayments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');

  const statCards = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Active Enrollments', value: activeEnrollments.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Payments', value: pendingPayments.length, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Certificates Issued', value: certs.length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Overview</h2>
        <button onClick={loadData} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${s.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Recent Enrollments
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No enrollments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enrollments.slice(0, 6).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-xs">
                        {(e.student_name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{e.student_name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{e.class_name || e.sub_program_name || '—'}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : e.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {e.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-600" /> Recent Payments
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            ) : payments.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.student_name || 'Student'}</p>
                      <p className="text-[10px] text-slate-500">{p.payment_date?.slice(0, 10) || '—'} · {p.payment_method}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{Number(p.amount).toLocaleString()} Birr</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <Shield className="w-6 h-6 text-white/70 mb-2" />
            <p className="text-xs text-white/70">Your Role</p>
            <p className="font-bold text-lg">Secretary</p>
            <p className="text-[10px] text-white/60 mt-1">Academic Operations</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-blue-600" />Today's Summary</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">New Admissions</span><span className="font-semibold">{students.filter(s => (s.created_at || '')?.startsWith(new Date().toISOString().slice(0, 10))).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payments Today</span><span className="font-semibold">{payments.filter(p => p.payment_date?.startsWith(new Date().toISOString().slice(0, 10))).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Active Classes</span><span className="font-semibold">{new Set(enrollments.filter(e => e.status === 'ACTIVE').map(e => e.class_name)).size}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Certificates Today</span><span className="font-semibold">{certs.filter(c => c.issued_at?.startsWith(new Date().toISOString().slice(0, 10))).length}</span></div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-blue-600" />Quick Actions</h4>
            <div className="space-y-1.5">
              {[
                { label: 'New Admission', icon: UserPlus, color: 'text-blue-600', section: 'admissions' as const },
                { label: 'Record Payment', icon: DollarSign, color: 'text-emerald-600', section: 'payments' as const },
                { label: 'Issue Certificate', icon: Award, color: 'text-amber-600', section: 'certificates' as const },
                { label: 'Student Details', icon: Search, color: 'text-slate-600', section: 'students' as const },
              ].map((a) => {
                const AIcon = a.icon;
                return (
                  <button
                    key={a.section}
                    type="button"
                    onClick={() => onNavigate?.(a.section)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <AIcon className={`w-3.5 h-3.5 ${a.color}`} />{a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
