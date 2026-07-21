import React, { useState, useEffect } from 'react';
import { Check, Loader2, ShieldOff, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchEnrollmentsApi, fetchAttendanceSessionsApi, downloadAttendanceReportPdf } from '@/domains/learning/academics/api/academicApi';
import type { AttendanceSession } from '@/shared/types';

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
    fetchEnrollmentsApi(studentId).then(async enr => {
      const all: AttendanceSession[] = [];
      for (const e of enr) {
        try {
          const s = await fetchAttendanceSessionsApi(e.enrolled_class);
          all.push(...s);
        } catch {}
      }
      setSessions(all);
    }).catch(() => {
      setPermissionDenied(true);
    }).finally(() => setLoading(false));
  }, [studentId]);

  const sessionsInView = sessions.filter(s => {
    const d = new Date(s.session_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const attendedDates = new Set(
    sessionsInView.map(s => new Date(s.session_date).getDate())
  );
  const presentCount = sessionsInView.length;
  const totalHours = sessionsInView.length * 2;
  const attendedHours = presentCount * 2;
  const pct = totalHours > 0 ? Math.round((attendedHours / totalHours) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-border-light/60 w-full">
        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border-light/60 w-full text-center">
        <ShieldOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="font-bold text-lg text-slate-900 mb-2">Attendance Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Attendance data requires staff-level access. Please contact your instructor or download the PDF report.
        </p>
        <button
          onClick={() => downloadAttendanceReportPdf(studentId)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download PDF Report
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-border-light/60 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-slate-900 text-lg">Attendance Tracker</h3>
        <button
          onClick={() => downloadAttendanceReportPdf(studentId)}
          className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
        >
          <Download className="w-3 h-3" /> PDF
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="font-semibold text-sm text-slate-700">{monthLabel}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map(d => <span key={d} className="text-[10px] text-brand-muted font-mono font-semibold">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
          <div key={d} className="flex items-center justify-center aspect-square">
            {attendedDates.has(d) ? (
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5" />
              </div>
            ) : (
              <span className="text-xs text-slate-600 font-medium">{d}</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-brand-border-light/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">
              <span className="font-bold text-slate-900">{presentCount}</span> session{presentCount !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-600">
              <span className="font-bold text-slate-900">{pct}%</span> rate
            </span>
          </div>
          <span className="text-xs text-slate-500">{attendedHours}h / {totalHours}h</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
