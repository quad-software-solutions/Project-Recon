import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Users, Loader2,
  BarChart3, TrendingUp, Search, UserCheck, UserX,
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
  const [view, setView] = useState<'calendar' | 'students' | 'trend'>('calendar');
  const [studentSearch, setStudentSearch] = useState('');

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
  const totalCapacity = monthSessions.reduce((sum, s) => sum + (s.records_count || s.students_present || 0) + (s.absent_count || 0), 0);

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
    <div className="flex flex-col gap-6">
      {/* View Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 self-start">
        {(['calendar', 'trend', 'students'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-[11px] font-bold px-4 py-2 rounded-lg capitalize transition-colors
              ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {v === 'calendar' ? 'Calendar' : v === 'trend' ? 'Trend' : 'Students'}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sessions</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{monthSessions.length}</p>
          <p className="text-[10px] text-slate-500">{monthName}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Present</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{avgAttendance}</p>
          <p className="text-[10px] text-slate-500">per session</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Range</span>
          </div>
          <p className="text-xl font-bold text-purple-600">{minAttendance}–{maxAttendance}</p>
          <p className="text-[10px] text-slate-500">min–max present</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Days</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{uniqueDays.length}</p>
          <p className="text-[10px] text-slate-500">class days</p>
        </div>
      </div>

      {/* Weekly Summary */}
      {view === 'calendar' && weeklyBreakdown.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {weeklyBreakdown.map((week, i) => {
            const rate = week.total > 0 ? Math.round((week.present / week.total) * 100) : 0;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Week {i + 1}</p>
                <p className="text-lg font-bold text-slate-900">{rate}%</p>
                <p className="text-[9px] text-slate-500">{week.present}/{week.total} present</p>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                    className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-blue-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trend View */}
      {view === 'trend' && trendData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Daily Attendance Rate
          </h3>
          <div className="flex items-end justify-between gap-1 h-36">
            {trendData.map((d, i) => {
              const h = Math.max(4, d.rate);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date}: {Math.round(d.rate)}% ({d.present}/{d.total})
                  </div>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className={`w-full rounded-t-md cursor-pointer
                      ${d.rate >= 80 ? 'bg-emerald-400' : d.rate >= 60 ? 'bg-blue-400' : d.rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}
                      hover:opacity-80 transition-opacity`}
                    style={{ minHeight: 4 }}
                  />
                  <span className="text-[7px] text-slate-400 -rotate-45 origin-left whitespace-nowrap">{d.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-[9px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> 80%+</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" /> 60-79%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> 40-59%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> &lt;40%</span>
            </div>
            <span className="text-[9px] text-slate-400">
              Avg: {monthSessions.length > 0 ? Math.round(trendData.reduce((s, d) => s + d.rate, 0) / trendData.length) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Student View */}
      {view === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="p-5">
            {monthSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No attendance data for this month</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 mb-3">
                  {monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''} recorded in {monthName}
                </p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {[...monthSessions].sort((a, b) => String(b.session_date).localeCompare(String(a.session_date))).slice(0, 20).map((s, i) => {
                    const dateStr = String(s.session_date || '').slice(5, 10);
                    const present = s.records_count || s.students_present || 0;
                    const absent = s.absent_count || 0;
                    const total = present + absent;
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                    return (
                      <motion.div key={s.id || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                        onClick={() => setSelectedSession(s)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold
                            ${rate >= 80 ? 'bg-emerald-100 text-emerald-600' : rate >= 60 ? 'bg-blue-100 text-blue-600' : rate >= 40 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                            {Math.round(rate)}%
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{s.topic || 'Session'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-500">{dateStr}</span>
                              <span className="text-[10px] text-emerald-600 font-medium">{present} present</span>
                              {absent > 0 && <span className="text-[10px] text-red-500">{absent} absent</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full
                            ${rate >= 80 ? 'bg-emerald-100 text-emerald-700' : rate >= 60 ? 'bg-brand-blue/10 text-brand-blue' : rate >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                            {Math.round(rate)}%
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar + Month Nav */}
      {view === 'calendar' && (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-slate-900">{monthName}</h3>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase bg-slate-50">{d}</div>
              ))}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : (
              <AttendanceCalendar month={currentMonth} sessions={monthSessions} onSelect={setSelectedSession} />
            )}
          </div>
        </>
      )}

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
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSession(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
              <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                  <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{s.topic || 'Attendance Session'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">{String(s.session_date || '').slice(0, 10) || '—'}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedSession(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Rate Circle */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                          <motion.circle cx="18" cy="18" r="15.5" fill="none"
                            initial={{ strokeDashoffset: 97.4 }}
                            animate={{ strokeDashoffset: 97.4 - (rate / 100) * 97.4 }}
                            transition={{ duration: 1 }}
                            stroke={rate >= 80 ? '#10b981' : rate >= 60 ? '#3b82f6' : rate >= 40 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="3" strokeDasharray="97.4" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-slate-900">{Math.round(rate)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <UserCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-emerald-600">{present}</p>
                        <p className="text-[9px] text-slate-500">Present</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <UserX className="w-4 h-4 text-red-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-red-600">{absent}</p>
                        <p className="text-[9px] text-slate-500">Absent</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-600">{total}</p>
                        <p className="text-[9px] text-slate-500">Total</p>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600">Session Details</p>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium">{String(s.session_date || '').slice(0, 10) || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <span className="text-slate-500">Topic</span>
                        <span className="font-medium">{s.topic || 'Daily Attendance'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <span className="text-slate-500">Attendance Rate</span>
                        <span className={`font-bold ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>{Math.round(rate)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2">
                        <span className="text-slate-500">Status</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rate >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {rate >= 60 ? 'Good' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] text-slate-400">
                      Session recorded in {monthName}
                    </span>
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
    <div className="grid grid-cols-7">
      {days.map((day, i) => {
        if (day === null) return <div key={`e${i}`} className="aspect-square p-1" />;

        const daySessions = getDaySessions(day);
        const hasSession = daySessions.length > 0;
        const isToday = day === today && new Date().getMonth() + 1 === mon && new Date().getFullYear() === year;
        const s = daySessions[0];
        const present = s ? (s.records_count || s.students_present || 0) : 0;
        const absent = s ? (s.absent_count || 0) : 0;
        const total = present + absent;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        return (
          <button key={day} onClick={() => hasSession && onSelect(daySessions[0])}
            className={`aspect-square p-1 flex flex-col items-center justify-center text-xs relative transition-colors
              ${isToday ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-slate-50'}
              ${hasSession ? 'cursor-pointer' : 'cursor-default'}
              rounded-lg`}
          >
            <span className={`font-semibold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {day}
            </span>
            {hasSession && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${rate >= 80 ? 'bg-emerald-400' : rate >= 60 ? 'bg-blue-400' : rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className="text-[7px] text-slate-400">{present}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
