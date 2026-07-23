import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Users, Loader2,
  BarChart3, TrendingUp, UserCheck, UserX,
  ChevronDown, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAttendanceSessionsApi } from '@/domains/learning/academics/api/academicApi';
import { AttendanceSession } from '@/shared/types';

interface AttendanceSessionExtended extends AttendanceSession {
  records_count?: number;
  students_present?: number;
  absent_count?: number;
}

interface Props { classId?: string; }

export default function AttendanceHistory({ classId = '' }: Props) {
  const [sessions, setSessions] = useState<AttendanceSessionExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionExtended | null>(null);
  const [view, setView] = useState<'calendar' | 'list' | 'trend'>('calendar');

  const loadSessions = () => {
    setLoading(true);
    fetchAttendanceSessionsApi(classId).then(res => {
      const arr = Array.isArray(res) ? res : [];
      setSessions(arr);
    }).catch(() => setSessions([])).finally(() => setLoading(false));
  };

  useEffect(() => { loadSessions(); }, [classId]);

  const monthSessions = sessions.filter(s =>
    String(s.session_date || '').startsWith(currentMonth)
  );

  const monthDays: number[] = monthSessions.map(s => {
    const dateStr: string = String(s.session_date || '');
    return parseInt(dateStr.slice(8, 10), 10) || 0;
  });
  const uniqueDays = [...new Set(monthDays)].sort((a: number, b: number) => a - b);

  const totalPresent = monthSessions.reduce((sum, s) => sum + (s.records_count || s.students_present || 0), 0);
  const totalEnrolled = monthSessions.reduce((sum, s) => sum + (s.records_count || s.students_present || 0) + (s.absent_count || 0), 0);

  const avgAttendance = monthSessions.length > 0
    ? Math.round(totalPresent / monthSessions.length) : 0;
  const maxAttendance = monthSessions.length > 0
    ? Math.max(...monthSessions.map(s => s.records_count || s.students_present || 0)) : 0;
  const minAttendance = monthSessions.length > 0
    ? Math.min(...monthSessions.map(s => s.records_count || s.students_present || 0)) : 0;

  const weeklyBreakdown = useMemo(() => {
    const weeks: { week: string; sessions: AttendanceSessionExtended[]; present: number; total: number }[] = [];
    const sorted = [...monthSessions].sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)));
    sorted.forEach(s => {
      const date = String(s.session_date || '');
      const d = new Date(date);
      const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}`;
      let week = weeks.find(w => w.week === weekKey);
      if (!week) { week = { week: weekKey, sessions: [], present: 0, total: 0 }; weeks.push(week); }
      week.sessions.push(s);
      week.present += s.records_count || s.students_present || 0;
      week.total += (s.records_count || s.students_present || 0) + (s.absent_count || 0);
    });
    return weeks;
  }, [monthSessions]);

  const trendData = useMemo(() => {
    return [...monthSessions]
      .sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)))
      .map(s => ({
        date: String(s.session_date || '').slice(5, 10),
        present: s.records_count || s.students_present || 0,
        total: (s.records_count || s.students_present || 0) + (s.absent_count || 0),
        rate: ((s.records_count || s.students_present || 0) / Math.max(1, (s.records_count || s.students_present || 0) + (s.absent_count || 0))) * 100,
      }));
  }, [monthSessions]);

  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthName = new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column (Main View) */}
      <div className="xl:col-span-2 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* View Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl inline-flex self-start border border-slate-200/60 shadow-sm">
            {(['calendar', 'trend', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`text-xs font-bold px-5 py-2 rounded-lg capitalize transition-all duration-200
                  ${view === v ? 'bg-white text-brand-blue shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                {v === 'calendar' ? 'Calendar' : v === 'trend' ? 'Trend' : 'Sessions'}
              </button>
            ))}
          </div>

          {/* Month Navigation */}
          {view !== 'list' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm">
              <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-sm text-slate-800 min-w-[120px] text-center tracking-tight">{monthName}</h3>
              <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main View Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {view === 'calendar' && (
            <div className="flex flex-col h-full bg-slate-50">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="px-2 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-20 flex-1 bg-white"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : (
                <AttendanceCalendar month={currentMonth} sessions={monthSessions} onSelect={setSelectedSession} />
              )}
            </div>
          )}

          {view === 'trend' && (
            <div className="p-6 h-full flex flex-col">
              <h3 className="font-bold text-sm text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-blue" /> Daily Attendance Rate
              </h3>
              {trendData.length > 0 ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-end justify-between gap-1.5 h-48 sm:h-64 mt-auto">
                    {trendData.map((d, i) => {
                      const h = Math.max(4, d.rate);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap z-10 shadow-lg after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                            {d.date}: {Math.round(d.rate)}% ({d.present}/{d.total})
                          </div>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: i * 0.04 }}
                            className={`w-full rounded-t-md cursor-pointer
                              ${d.rate >= 80 ? 'bg-emerald-400' : d.rate >= 60 ? 'bg-brand-blue' : d.rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}
                              hover:opacity-80 transition-opacity`}
                            style={{ minHeight: 4 }}
                          />
                          <span className="text-[9px] text-slate-400 -rotate-45 origin-left whitespace-nowrap mt-2">{d.date}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 80%+ Excellent</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-blue" /> 60-79% Good</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> 40-59% Low</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> &lt;40% Poor</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      Avg: {monthSessions.length > 0 ? Math.round(trendData.reduce((s, d) => s + d.rate, 0) / trendData.length) : 0}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No trend data available for this month</p>
                </div>
              )}
            </div>
          )}

          {view === 'list' && (
            <div className="p-0">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Recorded Sessions</h3>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                  <button onClick={() => changeMonth(-1)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs text-slate-800 min-w-[100px] text-center tracking-tight">{monthName}</span>
                  <button onClick={() => changeMonth(1)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {monthSessions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No sessions recorded in {monthName}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {[...monthSessions].sort((a, b) => String(b.session_date).localeCompare(String(a.session_date))).map((s, i) => {
                    const dateStr = String(s.session_date || '').slice(5, 10);
                    const present = s.records_count || s.students_present || 0;
                    const absent = s.absent_count || 0;
                    const total = present + absent;
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                    return (
                      <motion.div key={s.id || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSession(s)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black
                            ${rate >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : rate >= 60 ? 'bg-blue-50 text-blue-600 border border-blue-100' : rate >= 40 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {Math.round(rate)}%
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{s.topic || 'Daily Attendance'}</p>
                            <div className="flex items-center gap-2.5 mt-1">
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                <Clock className="w-3.5 h-3.5" /> {dateStr}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[11px] text-slate-600"><strong className="text-emerald-600">{present}</strong> present</span>
                              {absent > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span className="text-[11px] text-slate-600"><strong className="text-red-500">{absent}</strong> absent</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Monthly Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Sessions</span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{monthSessions.length}</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Present</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{avgAttendance}</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Range</span>
              </div>
              <p className="text-xl font-black text-purple-600 tracking-tight mt-1">{minAttendance} <span className="text-slate-400 font-medium text-sm mx-0.5">to</span> {maxAttendance}</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Class Days</span>
              </div>
              <p className="text-2xl font-black text-amber-600 tracking-tight">{uniqueDays.length}</p>
            </div>
          </div>
        </div>

        {weeklyBreakdown.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Weekly Breakdown</h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
              {weeklyBreakdown.map((week, i) => {
                const rate = week.total > 0 ? Math.round((week.present / week.total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-bold text-slate-700">Week {i + 1}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{rate}%</span>
                        <span className="text-[10px] font-medium text-slate-400 ml-1.5">({week.present}/{week.total})</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                        className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-brand-blue' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (() => {
          const s = selectedSession;
          const present = s.records_count || s.students_present || 0;
          const absent = s.absent_count || 0;
          const total = present + absent;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          return (
            <>
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSession(null)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              >
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col max-h-full">
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 relative border-b border-slate-200">
                    <button onClick={() => setSelectedSession(null)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="relative w-32 h-32 mb-4">
                      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                        <motion.circle cx="18" cy="18" r="15.5" fill="none"
                          initial={{ strokeDashoffset: 97.4 }}
                          animate={{ strokeDashoffset: 97.4 - (rate / 100) * 97.4 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          stroke={rate >= 80 ? '#10b981' : rate >= 60 ? '#2563eb' : rate >= 40 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="2.5" strokeDasharray="97.4" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{Math.round(rate)}<span className="text-lg text-slate-400 ml-0.5">%</span></span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-slate-900 text-center">{s.topic || 'Daily Attendance'}</h3>
                    <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">{String(s.session_date || '').slice(0, 10) || '—'}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-xl font-black text-emerald-600">{present}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Present</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-xl font-black text-red-600">{absent}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Absent</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-xl font-black text-slate-900">{total}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Details</h4>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Topic</span>
                          <span className="text-xs font-bold text-slate-900">{s.topic || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Recorded By</span>
                          <span className="text-xs font-bold text-slate-900">{s.recorded_by_name || 'System'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Status</span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${rate >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {rate >= 60 ? 'Satisfactory' : 'Needs Attention'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function AttendanceCalendar({ month, sessions, onSelect }: { month: string; sessions: AttendanceSessionExtended[]; onSelect: (s: AttendanceSessionExtended) => void }) {
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const firstDay = new Date(year, mon - 1, 1).getDay();
  const today = new Date().getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getDaySessions = (day: number) => {
    const dayStr = `${month}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => String(s.session_date || '').startsWith(dayStr));
  };

  return (
    <div className="grid grid-cols-7 gap-px bg-slate-200">
      {days.map((day, i) => {
        if (day === null) return <div key={`e${i}`} className="bg-white min-h-[80px] sm:min-h-[100px]" />;

        const daySessions = getDaySessions(day);
        const hasSession = daySessions.length > 0;
        const isToday = day === today && new Date().getMonth() + 1 === mon && new Date().getFullYear() === year;
        const s = daySessions[0];
        const present = s ? (s.records_count || s.students_present || 0) : 0;
        const absent = s ? (s.absent_count || 0) : 0;
        const total = present + absent;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        return (
          <div key={day} onClick={() => hasSession && onSelect(daySessions[0])}
            className={`bg-white min-h-[80px] sm:min-h-[100px] p-2 flex flex-col transition-colors group relative
              ${isToday ? 'bg-blue-50/30' : ''}
              ${hasSession ? 'cursor-pointer hover:bg-slate-50' : ''}`}
          >
            <div className="flex justify-between items-start w-full mb-2">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors
                ${isToday ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-500 group-hover:text-slate-900'}
              `}>
                {day}
              </span>
            </div>
            
            {hasSession && (
              <div className="mt-auto w-full">
                <div className={`w-full rounded-md border px-1.5 py-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors
                  ${rate >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-700 group-hover:bg-emerald-100' : rate >= 60 ? 'bg-blue-50 border-blue-100 text-blue-700 group-hover:bg-blue-100' : rate >= 40 ? 'bg-amber-50 border-amber-100 text-amber-700 group-hover:bg-amber-100' : 'bg-red-50 border-red-100 text-red-700 group-hover:bg-red-100'}`}>
                  <span className="text-[10px] font-bold">{Math.round(rate)}%</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
