import React, { useState } from 'react';
import { Download, CalendarDays, Loader2, FileText } from 'lucide-react';
import { downloadAttendanceReportPdf } from '@/src/domains/learning/academics/api/academicApi';

interface Props { studentId: string | null }

export default function AttendanceTracker({ studentId }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!studentId) return;
    setDownloading(true);
    try {
      await downloadAttendanceReportPdf(studentId);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border-light/60">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-900 text-xl">Attendance</h3>
          <p className="text-sm text-slate-500 mt-1">
            View your attendance summary via the official PDF report from the academic system.
          </p>
        </div>
      </div>

      {!studentId ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Academic profile not linked yet.</p>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">Attendance Report (PDF)</p>
            <p className="text-xs text-slate-500 mt-1">Session-by-session attendance for your enrollments.</p>
          </div>
          <button onClick={handleDownload} disabled={downloading}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-brand-red text-white px-5 py-2.5 rounded-xl hover:bg-brand-red-dark disabled:opacity-50">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
