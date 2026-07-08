import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Award, Target, BookOpen, Clock, ChevronDown, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const PERF_DATA = [40, 70, 50, 90, 60, 80];
const ATTEND_DATA = [80, 60, 90, 70, 100, 85];
const ENGAGEMENT_DATA = [65, 72, 58, 85, 78, 92];
const COMPLETION_DATA = [35, 55, 45, 78, 62, 88];

const STUDENT_RANKINGS = [
  { name: 'Radiom J.', avg: 94, trend: 'up', badge: 'Top Performer' },
  { name: 'Abebe B.', avg: 88, trend: 'up', badge: 'Excellent' },
  { name: 'Dr. Elias T.', avg: 82, trend: 'stable', badge: 'Good' },
  { name: 'Abebe L.', avg: 76, trend: 'up', badge: 'Improving' },
  { name: 'Skelos K.', avg: 62, trend: 'down', badge: 'Needs Support' },
];

const WEEKLY_GOALS = [
  { label: 'Lessons Completed', current: 4, target: 5, unit: 'lessons' },
  { label: 'Projects Graded', current: 8, target: 10, unit: 'projects' },
  { label: 'Feedback Given', current: 6, target: 8, unit: 'notes' },
  { label: 'Lab Hours', current: 14, target: 20, unit: 'hours' },
];

export default function PerformanceMetrics() {
  const [timeRange, setTimeRange] = useState<'6m' | '3m' | '1m'>('6m');
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [showRankings, setShowRankings] = useState(false);

  const data = timeRange === '6m' ? PERF_DATA : timeRange === '3m' ? PERF_DATA.slice(2) : PERF_DATA.slice(4);
  const labels = timeRange === '6m' ? MONTHS : timeRange === '3m' ? MONTHS.slice(2) : MONTHS.slice(4);

  const avgPerf = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  const avgAttend = Math.round(ATTEND_DATA.reduce((a, b) => a + b, 0) / ATTEND_DATA.length);
  const avgEngage = Math.round(ENGAGEMENT_DATA.reduce((a, b) => a + b, 0) / ENGAGEMENT_DATA.length);
  const maxPerf = Math.max(...PERF_DATA);
  const bestMonth = MONTHS[PERF_DATA.indexOf(maxPerf)];

  const summaryCards = [
    { label: 'Avg Performance', value: `${avgPerf}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', change: '+5%', changeColor: 'text-emerald-500' },
    { label: 'Attendance', value: `${avgAttend}%`, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', change: '+2%', changeColor: 'text-emerald-500' },
    { label: 'Engagement', value: `${avgEngage}%`, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', change: '+8%', changeColor: 'text-emerald-500' },
    { label: 'Best Month', value: bestMonth, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', change: `${maxPerf}%`, changeColor: 'text-amber-500' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Performance Metrics</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Track class performance, attendance, and engagement trends</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['6m', '3m', '1m'] as const).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all ${timeRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {r === '6m' ? '6 Months' : r === '3m' ? '3 Months' : '1 Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <div className="flex items-center gap-1.5">
                <p className="font-display font-extrabold text-xl text-slate-900">{stat.value}</p>
                <span className={`font-mono text-[10px] font-bold ${stat.changeColor}`}>{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h4 className="font-display font-bold text-slate-900 text-base">Class Performance</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 mb-6">Average scores across selected period</p>
          <div className="flex items-end gap-3 h-44 mb-3">
            {data.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500">{h}%</span>
                <div className="w-full bg-slate-100 rounded-lg relative flex-1 w-full">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-lg"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{labels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-500" />
            <h4 className="font-display font-bold text-slate-900 text-base">Student Engagement</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 mb-6">Class participation and involvement rates</p>
          <div className="flex items-end gap-3 h-44 mb-3">
            {ENGAGEMENT_DATA.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500">{h}%</span>
                <div className="w-full bg-slate-100 rounded-lg relative flex-1 w-full">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-pink-400 rounded-lg"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-500" />
            <h4 className="font-display font-bold text-slate-900 text-base">Monthly Attendance</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 mb-6">Student attendance rates over time</p>
          <div className="flex items-end gap-3 h-44 mb-3">
            {ATTEND_DATA.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500">{h}%</span>
                <div className="w-full bg-slate-100 rounded-lg relative flex-1 w-full">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-lg"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h4 className="font-display font-bold text-slate-900 text-base">Project Completion</h4>
          </div>
          <p className="font-sans text-xs text-slate-400 mb-6">Student project submission completion rates</p>
          <div className="flex items-end gap-3 h-44 mb-3">
            {COMPLETION_DATA.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500">{h}%</span>
                <div className="w-full bg-slate-100 rounded-lg relative flex-1 w-full">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-orange-300 rounded-lg"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Rankings */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <button onClick={() => setShowRankings(!showRankings)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h4 className="font-display font-bold text-slate-900">Student Rankings</h4>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRankings ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showRankings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {STUDENT_RANKINGS.map((s, i) => (
                  <div key={s.name} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${i < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-200 flex items-center justify-center text-xs font-bold text-blue-600">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-sans text-sm font-semibold text-slate-800">{s.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-2">{s.badge}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${s.avg}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-800 w-8 text-right">{s.avg}%</span>
                      <span className={`${s.trend === 'up' ? 'text-emerald-500' : s.trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                        {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weekly Goals */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-4 h-4 text-blue-500" />
          <h4 className="font-display font-bold text-slate-900">Weekly Goals</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEEKLY_GOALS.map((goal, i) => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
            return (
              <div key={goal.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{goal.label}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-display font-extrabold text-2xl text-slate-900">{goal.current}</span>
                  <span className="font-mono text-xs text-slate-400">/ {goal.target} {goal.unit}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  />
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-500 mt-1 block">{pct}% complete</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
