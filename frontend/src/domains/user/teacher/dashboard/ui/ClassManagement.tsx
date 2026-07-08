import React, { useState } from 'react';
import { Users, Search, X, CheckCircle2, Clock, UserCheck, AlertCircle, Calendar, ChevronLeft, ChevronRight, Download, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Student {
  id: number; name: string; course: string; status: string; attended: boolean;
}

interface Props {
  students: Student[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filteredStudents: Student[];
  onToggleAttendance: (id: number) => void;
  totalCount: number;
  attendedCount: number;
}

const CLASS_GROUPS = ['VEX V5 Advanced', 'VEX IQ Beginner', 'STEM Foundation', 'Enjoy AI'];
const TRACKS = ['VEX', 'STEM', 'Enjoy AI'];

const ATTENDANCE_HISTORY = [
  { date: 'Mon', rate: 85 }, { date: 'Tue', rate: 90 }, { date: 'Wed', rate: 78 },
  { date: 'Thu', rate: 92 }, { date: 'Fri', rate: 88 }, { date: 'Sat', rate: 95 },
  { date: 'Sun', rate: 82 },
];

function getTrend(current: number, previous: number): { icon: React.ElementType; color: string; label: string } {
  if (current > previous) return { icon: TrendingUp, color: 'text-emerald-500', label: `+${Math.round(current - previous)}%` };
  if (current < previous) return { icon: TrendingDown, color: 'text-red-500', label: `-${Math.round(previous - current)}%` };
  return { icon: Minus, color: 'text-slate-400', label: '0%' };
}

export default function ClassManagement({
  students, searchQuery, onSearchChange, filteredStudents,
  onToggleAttendance, totalCount, attendedCount,
}: Props) {
  const [selectedClass, setSelectedClass] = useState(CLASS_GROUPS[0]);
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [dateIndex, setDateIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const today = new Date();
  const currentDate = new Date(today.getTime() + dateIndex * 86400000);
  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isToday = dateIndex === 0;

  const absentCount = totalCount - attendedCount;
  const attendancePct = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
  const prevAttendancePct = 80;
  const trend = getTrend(attendancePct, prevAttendancePct);

  const filtered = filteredStudents.filter(s => selectedTrack === 'all' || s.course === selectedTrack);

  const markAllPresent = () => {
    filtered.forEach(s => { if (!s.attended) onToggleAttendance(s.id); });
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Track', 'Standing', 'Status'],
      ...filtered.map(s => [s.name, s.course, s.status, s.attended ? 'Present' : 'Absent']),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${currentDate.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Class Management</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Track attendance and manage your classroom</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={exportData} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Class Group</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CLASS_GROUPS.map(c => (
                    <button key={c} onClick={() => setSelectedClass(c)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${selectedClass === c ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Track</label>
                <select value={selectedTrack} onChange={e => setSelectedTrack(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#2563EB]">
                  <option value="all">All Tracks</option>
                  {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5 py-3">
        <button onClick={() => setDateIndex(prev => prev - 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2563EB]" />
          <span className="font-sans text-sm font-semibold text-slate-800">{dateStr}</span>
          {isToday && <span className="text-[10px] font-bold bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded-full">Today</span>}
        </div>
        <button onClick={() => setDateIndex(prev => Math.min(prev + 1, 0))} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Students', value: totalCount, icon: Users, color: 'text-[#2563EB]', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Present', value: attendedCount, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Absent', value: absentCount, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Rate', value: `${attendancePct}%`, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'Trend', value: trend.label, icon: trend.icon, color: trend.color, bg: 'bg-slate-50', border: 'border-slate-200' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${stat.border} flex items-center gap-3`}
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <p className={`font-display font-extrabold text-lg ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Attendance Trend Mini Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h4 className="font-display font-bold text-sm text-slate-900">Last 7 Days</h4>
          </div>
          <span className="font-mono text-[10px] font-bold text-slate-400">Avg {Math.round(ATTENDANCE_HISTORY.reduce((a, b) => a + b.rate, 0) / ATTENDANCE_HISTORY.length)}%</span>
        </div>
        <div className="flex items-end gap-2 h-16">
          {ATTENDANCE_HISTORY.map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${day.rate}%` }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={`w-full rounded-lg ${
                  day.rate >= 90 ? 'bg-emerald-400' : day.rate >= 80 ? 'bg-blue-400' : day.rate >= 70 ? 'bg-amber-400' : 'bg-red-400'
                }`}
              />
              <span className="font-mono text-[8px] text-slate-400">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Attendance Roster</h3>
            <p className="font-sans text-xs text-slate-500 mt-1">{selectedClass}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search students..." value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {filtered.some(s => !s.attended) && (
              <button onClick={markAllPresent}
                className="text-[11px] font-bold px-3 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-sm active:scale-95 transition-all whitespace-nowrap">
                Mark All Present
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Track</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Standing</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">No students match your search.</p>
                  <button onClick={() => onSearchChange('')} className="text-xs font-bold text-[#2563EB] mt-2 hover:underline">Clear search</button>
                </td></tr>
              )}
              {filtered.map((st, idx) => (
                <motion.tr
                  key={st.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`transition-colors ${st.attended ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'}`}
                >
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        st.attended ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {st.attended ? <CheckCircle2 className="w-4 h-4" /> : st.name.charAt(0)}
                      </div>
                      <span className="font-sans text-sm font-semibold text-slate-800">{st.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    <span className="font-mono text-[10px] font-bold bg-blue-50 text-[#2563EB] px-2.5 py-1 rounded-md border border-blue-100">
                      {st.course}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      st.status === 'Good' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Good' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {st.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    {st.attended ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Present
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onToggleAttendance(st.id)}
                      className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-all active:scale-95 ${
                        st.attended
                          ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border border-slate-200'
                          : 'bg-[#2563EB] text-slate-900 hover:bg-blue-700 shadow-sm'
                      }`}
                    >
                      {st.attended ? 'Undo' : 'Mark Present'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-sans text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filtered.length}</strong> of {totalCount} students
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${attendancePct}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${attendancePct >= 80 ? 'bg-emerald-500' : attendancePct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              />
            </div>
            <span className={`font-mono text-xs font-bold whitespace-nowrap ${attendancePct >= 80 ? 'text-emerald-600' : attendancePct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {attendedCount}/{totalCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
