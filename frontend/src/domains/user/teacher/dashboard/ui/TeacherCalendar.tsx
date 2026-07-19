import { useState, useEffect, useMemo } from 'react';
import { Calendar, BookOpen, Loader2, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import type { TeacherClassOption } from '../../api/teacherData';
import { fetchAttendanceSessionsApi } from '@/domains/learning/academics/api/academicApi';

interface Props {
  classes: TeacherClassOption[];
  loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarSession {
  id: string;
  date: string;
  topic: string;
  className: string;
}

export default function TeacherCalendar({ classes, loading }: Props) {
  const [today] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    if (classes.length === 0) return;
    let cancelled = false;
    setLoadingSessions(true);
    setSessionsError(null);
    fetchAttendanceSessionsApi()
      .then(data => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const classMap = new Map(classes.map(c => [c.id, c.name]));
        const mapped: CalendarSession[] = [];
        for (const s of list) {
          const className = s.enrolled_class ? classMap.get(s.enrolled_class) || 'Class' : 'Class';
          mapped.push({ id: s.id, date: s.session_date, topic: s.topic || 'Session', className });
        }
        setSessions(mapped);
      })
      .catch(() => { if (!cancelled) setSessionsError('Could not load sessions'); })
      .finally(() => { if (!cancelled) setLoadingSessions(false); });
    return () => { cancelled = true; };
  }, [classes]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, CalendarSession[]>();
    for (const s of sessions) {
      const key = s.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [sessions]);

  const todayKey = today.toISOString().slice(0, 10);

  const upcomingSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.filter(s => s.date >= todayKey).slice(0, 5);
  }, [sessions, todayKey]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); } else setViewMonth(m => m + 1); };

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>;
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-lg text-slate-900">My Schedule</h3>
        </div>
        <div className="py-12 text-center text-sm text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No classes assigned yet.
        </div>
      </div>
    );
  }

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function dateKey(day: number) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${dd}`;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="font-bold text-base text-slate-900">{MONTHS[viewMonth]} {viewYear}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {sessionsError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-500 mb-2">{sessionsError}</p>
            <button onClick={() => window.location.reload()} className="text-xs font-bold text-blue-600 hover:underline">Retry</button>
          </div>
        ) : loadingSessions ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAYS.map(d => (
                <div key={d} className="px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square p-1" />;
                const key = dateKey(day);
                const daySessions = sessionsByDate.get(key);
                const isToday = key === todayKey;
                return (
                  <div key={key} className={`aspect-square p-1 border-b border-r border-slate-50 relative ${isToday ? 'bg-blue-50' : ''}`}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {daySessions && (
                      <div className="mt-0.5 space-y-0.5">
                        {daySessions.slice(0, 2).map(s => (
                          <div key={s.id} className="text-[8px] leading-tight bg-blue-100 text-blue-700 rounded px-1 py-0.5 truncate font-medium">
                            {s.topic}
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-[8px] text-slate-400 font-medium px-1">+{daySessions.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Upcoming Sidebar */}
      <div className="lg:w-80 bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-base text-slate-900">Upcoming</h3>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No upcoming sessions
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-center min-w-[36px]">
                  <p className="text-lg font-black text-slate-900 leading-none">{new Date(s.date).getDate()}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{MONTHS[new Date(s.date).getMonth()].slice(0, 3)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{s.topic}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {s.className}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {classes.length} classes</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {sessions.length} sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
