import React, { useState, useEffect } from 'react';
import {
  Check,
  Loader2,
  ShieldOff,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Clock3,
} from 'lucide-react';
import {
  fetchMyEnrollmentsApi,
  fetchAttendanceSessionsApi,
  downloadAttendanceReportPdf,
} from '@/domains/learning/academics/api/academicApi';
import type { AttendanceSession } from '@/shared/types';
import { isForbiddenError } from '@/shared/api/http';

interface Props { studentId: string }

export default function AttendanceTracker({ studentId }: Props) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    setLoading(true);
    setPermissionDenied(false);

    fetchMyEnrollmentsApi().then(async enrollments => {
      const rows = await Promise.all(
        enrollments
          .filter(e => e.enrolled_class)
          .map(e => fetchAttendanceSessionsApi(e.enrolled_class).catch(err => {
            if (isForbiddenError(err)) throw err;
            return [] as AttendanceSession[];
          })),
      );
      setSessions(rows.flat());
    }).catch(err => {
      if (isForbiddenError(err)) setPermissionDenied(true);
      setSessions([]);
    }).finally(() => setLoading(false));
  }, [studentId]);

  const sessionsInView = sessions.filter(s => {
    const d = new Date(s.session_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const attendedDates = new Set(sessionsInView.map(s => new Date(s.session_date).getDate()));
  const presentCount = sessionsInView.length;
  const totalHours = sessionsInView.length * 2;
  const attendedHours = presentCount * 2;
  const pct = totalHours > 0 ? Math.round((attendedHours / totalHours) * 100) : 0;
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 ? day : null;
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">Attendance Unavailable</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Attendance records are not available for student self-service yet. You can still download the report.
        </p>
        <button
          onClick={() => downloadAttendanceReportPdf(studentId)}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-blue-dark"
        >
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">Attendance</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Monthly Overview</h3>
          </div>
          <button
            onClick={() => downloadAttendanceReportPdf(studentId)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 sm:w-auto"
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Sessions', value: presentCount, icon: CalendarCheck },
            { label: 'Hours', value: attendedHours, icon: Clock3 },
            { label: 'Rate', value: `${pct}%`, icon: Check },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand-blue shadow-sm">
                <item.icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-black leading-none text-slate-900">{item.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setViewDate(new Date(year, month - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-black text-slate-800">{monthLabel}</span>
          <button
            onClick={() => setViewDate(new Date(year, month + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200 bg-white text-center">
          {days.map(day => (
            <div key={day} className="border-b border-slate-200 bg-slate-50 px-1 py-2 text-[10px] font-black uppercase text-slate-400">
              {day}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const attended = day !== null && attendedDates.has(day);
            return (
              <div
                key={`${monthLabel}-${i}`}
                className="flex min-h-12 items-center justify-center border-b border-r border-slate-100 p-1 text-xs sm:min-h-14 lg:min-h-16"
              >
                {day === null ? null : attended ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="font-semibold text-slate-500">{day}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Attendance rate</span>
            <span className="font-black text-slate-800">{attendedHours}h / {totalHours}h</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
