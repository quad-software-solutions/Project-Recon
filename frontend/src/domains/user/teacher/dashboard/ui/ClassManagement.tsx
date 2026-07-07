import React, { useState } from 'react';
import { Users, Search, X, CheckCircle2, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

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

export default function ClassManagement({
  students, searchQuery, onSearchChange, filteredStudents,
  onToggleAttendance, totalCount, attendedCount,
}: Props) {
  const [selectedDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  const absentCount = totalCount - attendedCount;
  const attendancePct = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: totalCount, icon: Users, color: 'text-[#2563EB]', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Present Today', value: attendedCount, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Absent', value: absentCount, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Attendance Rate', value: `${attendancePct}%`, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border ${stat.border} flex items-center gap-3`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="font-display font-extrabold text-xl text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-brand-border-light/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Attendance Roster</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-sans text-xs text-slate-500">{selectedDate}</span>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search students..." value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-brand-border-light rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Track</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standing</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {filteredStudents.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">No students match your search.</td></tr>
              )}
              {filteredStudents.map((st, idx) => (
                <motion.tr
                  key={st.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`transition-colors ${st.attended ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}
                >
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        st.attended ? 'bg-emerald-500 text-slate-900' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
                      }`}>
                        {st.attended ? <CheckCircle2 className="w-4 h-4" /> : st.name.charAt(0)}
                      </div>
                      <span className="font-sans text-sm font-semibold text-slate-800">{st.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs font-semibold bg-blue-50 text-[#2563EB] px-2.5 py-1 rounded-md border border-blue-100">
                      {st.course}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
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
                      <span className="text-slate-400 font-mono text-[10px]">—</span>
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-brand-border-light/40 flex items-center justify-between">
          <span className="font-sans text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of {totalCount} students
          </span>
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${attendancePct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600">{attendedCount}/{totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
