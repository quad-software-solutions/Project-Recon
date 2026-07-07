import React from 'react';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';
import { motion } from 'motion/react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const PERF_DATA = [40, 70, 50, 90, 60, 80];
const ATTEND_DATA = [80, 60, 90, 70, 100, 85];

export default function PerformanceMetrics() {
  const avgPerf = Math.round(PERF_DATA.reduce((a, b) => a + b, 0) / PERF_DATA.length);
  const avgAttend = Math.round(ATTEND_DATA.reduce((a, b) => a + b, 0) / ATTEND_DATA.length);
  const maxPerf = Math.max(...PERF_DATA);

  const summaryCards = [
    { label: 'Avg Performance', value: `${avgPerf}%`, icon: TrendingUp, color: 'text-[#2563EB]', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Avg Attendance', value: `${avgAttend}%`, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Best Month', value: `${MONTHS[PERF_DATA.indexOf(maxPerf)]}`, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border ${stat.border} flex items-center gap-3`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="font-display font-extrabold text-2xl text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <h4 className="font-display font-bold text-slate-900 text-base">Class Performance</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 mb-6">Average scores across months</p>
          <div className="flex items-end gap-3 h-40 mb-3">
            {PERF_DATA.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500">{h}%</span>
                <div className="w-full bg-slate-100 rounded-lg relative flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#2563EB] to-[#57dffe] rounded-lg"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-500" />
            <h4 className="font-display font-bold text-slate-900 text-base">Monthly Attendance</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 mb-6">Student attendance rates</p>
          <div className="flex items-end gap-3 h-40 mb-3">
            {ATTEND_DATA.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500">{h}%</span>
                <div className="w-full bg-slate-100 rounded-lg relative flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-lg"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
