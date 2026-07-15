import React from 'react';
import { BarChart3, TrendingUp, Users, Award, AlertTriangle, Zap, BookOpen, Target, Star } from 'lucide-react';
import { motion } from 'motion/react';

import { StudentProfile, Enrollment } from '@/shared/types';

interface Props {
  students: StudentProfile[];
  enrollments: Enrollment[];
}

export default function PerformanceMetrics({ students, enrollments }: Props) {
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
  const cancelledEnrollments = enrollments.filter(e => e.status === 'CANCELLED');

  const enrollmentCompletionRate = enrollments.length > 0
    ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0;
  const activeRate = enrollments.length > 0
    ? Math.round((activeEnrollments.length / enrollments.length) * 100) : 0;

  const summaryCards = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-brand-blue', bg: 'bg-blue-50', border: 'border-blue-200', trend: 'in selected class' },
    { label: 'Active Now', value: activeEnrollments.length, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', trend: `${activeRate}% of total` },
    { label: 'Completed', value: completedEnrollments.length, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', trend: `${enrollmentCompletionRate}% completion rate` },
    { label: 'In Progress', value: pendingEnrollments.length, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', trend: 'awaiting payment' },
  ];


  const now = new Date();
  const trendMonths: string[] = [];
  const trendData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMonths.push(d.toLocaleString('en', { month: 'short' }));
    const monthEnrollments = enrollments.filter(e => {
      if (!e.created_at) return false;
      const created = new Date(e.created_at);
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
    });
    const completed = monthEnrollments.filter(e => e.status === 'COMPLETED').length;
    const total = monthEnrollments.length;
    trendData.push(total > 0 ? Math.round((completed / total) * 100) : 0);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border ${stat.border} relative overflow-hidden`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="font-display font-extrabold text-2xl text-slate-900 mt-0.5">{stat.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{stat.trend}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enrollment breakdown only — grade tiers require backend grades API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
          <h3 className="font-display font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-blue" /> Enrollment Breakdown
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Active', count: activeEnrollments.length, pct: activeRate, color: 'bg-emerald-500', icon: Users },
              { label: 'Pending Payment', count: pendingEnrollments.length, pct: enrollments.length ? Math.round((pendingEnrollments.length / enrollments.length) * 100) : 0, color: 'bg-amber-500', icon: AlertTriangle },
              { label: 'Completed', count: completedEnrollments.length, pct: enrollmentCompletionRate, color: 'bg-blue-500', icon: Award },
              { label: 'Cancelled', count: cancelledEnrollments.length, pct: enrollments.length ? Math.round((cancelledEnrollments.length / enrollments.length) * 100) : 0, color: 'bg-red-400', icon: AlertTriangle },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    <span className="text-xs font-bold text-slate-900">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full rounded-full ${item.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
          <h3 className="font-display font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-blue" /> Performance Trend
          </h3>
          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {trendMonths.map((month, i) => {
              const heightPct = (trendData[i] / Math.max(...trendData)) * 100;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-500">{trendData[i]}%</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`w-full rounded-t-lg ${trendData[i] >= 60 ? 'bg-emerald-400' : trendData[i] >= 50 ? 'bg-blue-400' : 'bg-amber-400'} hover:opacity-80 transition-opacity`}
                  />
                  <span className="text-[9px] text-slate-400">{month}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 text-center">Average class performance over time</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Class Size</p>
            <p className="text-lg font-bold text-slate-900">
              {activeEnrollments.length > 0 ? Math.round(activeEnrollments.length / Math.max(1, new Set(activeEnrollments.map(e => e.enrolled_class)).size)) : 0}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Retention Rate</p>
            <p className="text-lg font-bold text-slate-900">{enrollments.length > 0 ? Math.round(((activeEnrollments.length + completedEnrollments.length) / enrollments.length) * 100) : 0}%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Star className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Completion</p>
            <p className="text-lg font-bold text-slate-900">{enrollmentCompletionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
