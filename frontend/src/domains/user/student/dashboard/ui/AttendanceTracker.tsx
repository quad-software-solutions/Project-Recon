import React, { useState, useEffect } from 'react';
import { Check, Loader2, ShieldOff, Download } from 'lucide-react';
import { fetchEnrollmentsApi, fetchAttendanceSessionsApi, downloadAttendanceReportPdf } from '@/domains/learning/academics/api/academicApi';
import type { AttendanceSession } from '@/shared/types';

interface Props { studentId: string }

export default function AttendanceTracker({ studentId }: Props) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year] = useState(new Date().getFullYear());

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

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDay = new Date(year, month, 1).getDay();

  const attendedDates = new Set(
    sessions.map(s => new Date(s.session_date).getDate())
  );
  const presentCount = sessions.filter(s => s.session_date).length;
  const totalHours = sessions.length * 2;
  const attendedHours = presentCount * 2;
  const pct = totalHours > 0 ? Math.round((attendedHours / totalHours) * 100) : 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      </div>

      <div className="flex items-center justify-between mb-4 text-brand-muted-dark">
        <button onClick={() => setMonth(m => m - 1)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-xs">←</button>
        <span className="font-sans font-semibold text-sm">{monthNames[month]} {year}</span>
        <button onClick={() => setMonth(m => m + 1)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-xs">→</button>
      </div>

      <>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {days.map(d => <span key={d} className="text-[10px] text-brand-muted font-mono">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
          {dates.map(d => (
            <div key={d} className="flex items-center justify-center aspect-square">
              {attendedDates.has(d) ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
              ) : (
                <span className="text-xs text-slate-600 font-medium">{d}</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-brand-border-light/50">
          <div className="flex items-center justify-between mb-6">
            <span className="font-sans text-xs font-semibold text-slate-800">{pct}%</span>
            <span className="font-sans text-xs font-semibold text-slate-800">{attendedHours}h / {totalHours}h</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </>
    </div>
  );
}