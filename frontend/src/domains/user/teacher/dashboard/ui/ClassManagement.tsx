import React, { useState } from 'react';
import { Users, Search, X, CheckCircle2, Clock, UserCheck, AlertCircle, Calendar, Loader2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { createAttendanceSessionApi, recordBulkAttendanceApi, fetchAttendanceSessionsApi } from '@/domains/learning/academics/api/academicApi';

import { StudentProfile, Enrollment, AttendanceSession } from '@/shared/types';

interface AttendanceSessionExtended extends AttendanceSession {
  records_count?: number;
  students_present?: number;
}

interface Props {
  students: StudentProfile[];
  enrollments: Enrollment[];
  classes?: { id: string; name: string }[];
  selectedClassId?: string;
  onClassChange?: (id: string) => void;
  mode?: 'staff' | 'instructor';
}

export default function ClassManagement({
  students,
  enrollments,
  classes = [],
  selectedClassId = '',
  onClassChange,
  mode = 'staff',
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [attended, setAttended] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<AttendanceSessionExtended[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().slice(0, 10));

  const selectedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayStr = new Date().toISOString().slice(0, 10);

  const toggleAttendance = (id: string) => {
    setAttended(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const markAllPresent = () => {
    const enrolledIds = students.filter(s => enrollments.some(e => e.student === s.id)).map(s => s.id);
    setAttended(new Set(enrolledIds));
    setSaved(false);
  };

  const clearAttendance = () => {
    setAttended(new Set());
    setSaved(false);
  };

  const recordAttendance = async () => {
    const enrolledStudents = students.filter(s => enrollments.some(e => e.student === s.id));
    if (enrolledStudents.length === 0 || !selectedClassId) return;
    setSaving(true);
    try {
      const session = await createAttendanceSessionApi({
        enrolled_class: selectedClassId,
        session_date: todayStr,
        topic: 'Daily Attendance',
      });
      const records = Array.from(attended).map(studentId => {
        const enrollment = enrollments.find(e => e.student === studentId);
        return { enrollment: enrollment?.id || '', status: 'PRESENT' };
      }).filter(r => r.enrollment);
      if (records.length > 0) {
        await recordBulkAttendanceApi(session.id, records);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedClassId) return;
    setHistoryLoading(true);
    try {
      const sessions = await fetchAttendanceSessionsApi(selectedClassId);
      const arr = Array.isArray(sessions) ? sessions : [];
      setHistoryData(arr.filter(s => s.session_date?.startsWith(historyDate.slice(0, 7))));
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const viewHistory = async () => {
    setShowHistory(true);
    await loadHistory();
  };

  const displayList = students.map(s => ({
    id: s.id,
    name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
    course: enrollments.find(e => e.student === s.id)?.class_name || '—',
    status: s.is_active ? 'Active' : 'Inactive',
    attended: attended.has(s.id),
  }));

  const filtered = searchQuery.trim()
    ? displayList.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : displayList;

  const totalCount = displayList.length;
  const attendedCount = attended.size;
  const absentCount = totalCount - attendedCount;
  const attendancePct = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: totalCount, icon: Users, color: 'text-brand-blue', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Present Today', value: attendedCount, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Absent', value: absentCount, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Attendance Rate', value: `${attendancePct}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
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

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> Attendance recorded successfully
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border-light/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Attendance Roster</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-sans text-xs text-slate-500">{selectedDate}</span>
            </div>
            {classes.length > 0 && onClassChange && (
              <select
                value={selectedClassId}
                onChange={e => onClassChange(e.target.value)}
                className="mt-2 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {mode === 'instructor' && enrollments.length === 0 && selectedClassId && (
              <p className="text-[10px] text-amber-600 mt-1">No roster yet — record a first attendance session for this class.</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Actions */}
            <button onClick={markAllPresent} disabled={totalCount === 0}
              className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-200 disabled:opacity-50 transition-colors">
              All Present
            </button>
            <button onClick={clearAttendance} disabled={attendedCount === 0}
              className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors">
              Clear
            </button>
            <button onClick={viewHistory}
              className="text-[10px] font-bold bg-brand-blue/10 text-brand-blue px-3 py-2 rounded-lg hover:bg-brand-blue/20 transition-colors flex items-center gap-1">
              <Calendar className="w-3 h-3" /> History
            </button>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search students..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-brand-border-light rounded-xl text-sm focus:outline-none focus:border-brand-blue-bright focus:ring-2 focus:ring-brand-blue-bright/20 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={recordAttendance} disabled={saving || attendedCount === 0}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Record'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">#</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">No students found.</td></tr>
              )}
              {filtered.map((st, idx) => (
                <motion.tr key={st.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                  className={`transition-colors ${st.attended ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}
                >
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        st.attended ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
                      }`}>
                        {st.attended ? <CheckCircle2 className="w-4 h-4" /> : st.name.charAt(0)}
                      </div>
                      <span className="font-sans text-sm font-semibold text-slate-800">{st.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs font-semibold bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-md border border-blue-100">{st.course}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      st.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
                    <button onClick={() => toggleAttendance(st.id)}
                      className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-all active:scale-95 ${
                        st.attended
                          ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border border-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
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

        <div className="px-6 py-4 bg-slate-50/50 border-t border-brand-border-light/40 flex items-center justify-between">
          <span className="font-sans text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filtered.length}</strong> of {totalCount} students
          </span>
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${attendancePct}%` }} transition={{ duration: 0.8 }}
                className="h-full bg-emerald-500 rounded-full" />
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600">{attendedCount}/{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Attendance History Modal */}
      {showHistory && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowHistory(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-blue" /> Attendance History
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <input type="month" value={historyDate} onChange={e => { setHistoryDate(e.target.value); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue-bright" />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No attendance records for this month</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historyData.map((s: AttendanceSessionExtended, i: number) => (
                      <div key={s.id || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{s.topic || 'Attendance'}</p>
                          <p className="text-[10px] text-slate-500">{s.session_date?.slice(0, 10) || '—'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {(s.records_count || s.students_present || 0)} present
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 flex justify-end">
                <button onClick={loadHistory} disabled={historyLoading}
                  className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 flex items-center gap-1">
                  {historyLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
