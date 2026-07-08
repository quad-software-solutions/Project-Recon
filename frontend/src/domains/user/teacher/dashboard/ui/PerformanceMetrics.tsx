import React from 'react';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  students: any[];
  enrollments: any[];
}

export default function PerformanceMetrics({ students, enrollments }: Props) {
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');

  const summaryCards = [
    { label: 'Total Students', value: students.length, icon: TrendingUp, color: 'text-[#2563EB]', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Active Enrollments', value: activeEnrollments.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Completed', value: completedEnrollments.length, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border ${stat.border} flex items-center gap-3`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="font-display font-extrabold text-2xl text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
        <h3 className="font-display font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#2563EB]" /> Enrollment Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Pending Payment', count: pendingEnrollments.length, pct: enrollments.length ? Math.round((pendingEnrollments.length / enrollments.length) * 100) : 0, color: 'bg-amber-500' },
            { label: 'Active', count: activeEnrollments.length, pct: enrollments.length ? Math.round((activeEnrollments.length / enrollments.length) * 100) : 0, color: 'bg-emerald-500' },
            { label: 'Completed', count: completedEnrollments.length, pct: enrollments.length ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0, color: 'bg-blue-500' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">{item.label}</p>
              <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{item.count}</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1 }}
                  className={`h-full rounded-full ${item.color}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{item.pct}% of total</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
