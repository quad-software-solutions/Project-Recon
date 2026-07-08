import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, X, Clock, CalendarDays, TrendingUp } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function useCalendar(month: number, year: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export default function AttendanceTracker() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year] = useState(today.getFullYear());
  const { firstDay, daysInMonth } = useCalendar(month, year);

  // Simulate attendance data for current month
  const presentDays = useMemo(() => {
    const active: number[] = [];
    const totalSessions = Math.min(22, daysInMonth - 1);
    for (let i = 0; i < totalSessions; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      if (!active.includes(day)) active.push(day);
    }
    return active.sort((a, b) => a - b).slice(0, Math.floor(daysInMonth * 0.75));
  }, [month, year, daysInMonth]);

  const attendanceRate = Math.round((presentDays.length / daysInMonth) * 100);
  const absentDays = Math.max(0, Math.floor(daysInMonth * 0.85) - presentDays.length);

  const prevMonth = () => setMonth(m => (m === 0 ? 11 : m - 1));
  const nextMonth = () => setMonth(m => (m === 11 ? 0 : m + 1));

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const isCurrentMonth = month === today.getMonth();

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-slate-900 text-lg">Attendance</h3>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3 text-slate-600">
        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-sans font-bold text-sm">{monthName}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
        {DAYS.map(d => <span key={d} className="text-[10px] text-slate-400 font-semibold py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const isPresent = presentDays.includes(d);
          const isToday = isCurrentMonth && d === today.getDate();
          const isFuture = isCurrentMonth && d > today.getDate();
          return (
            <div key={d} className="flex items-center justify-center aspect-square">
              {isPresent ? (
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              ) : isFuture ? (
                <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-300 text-[11px] font-medium flex items-center justify-center">
                  {d}
                </div>
              ) : (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  isToday ? 'bg-blue-50 text-blue-600 font-bold ring-2 ring-blue-200' : 'text-slate-500'
                }`}>
                  {d}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{presentDays.length}</p>
          <p className="text-[10px] text-emerald-500 font-semibold">Present</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-500">{absentDays}</p>
          <p className="text-[10px] text-red-400 font-semibold">Absent</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{attendanceRate}%</p>
          <p className="text-[10px] text-blue-500 font-semibold">Rate</p>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-600">Monthly Comparison</span>
        </div>
        <div className="flex items-end justify-between h-16 gap-1.5">
          {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => {
            const val = i <= 4 ? 65 + Math.floor(Math.random() * 30) : 70 + Math.floor(Math.random() * 25);
            const isCurrent = i === 8;
            return (
              <div key={m} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: `${val * 0.5}px` }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${val}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className={`absolute bottom-0 left-0 w-full rounded-t-md transition-all ${
                      isCurrent ? 'bg-blue-500' : 'bg-blue-300'
                    }`} />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">{m}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
