import React, { useState } from 'react';
import { FileText, Download, Users, BookOpen, CheckCircle2, BarChart3, Loader2, Printer, Award, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import {
  downloadStudentReportPdf, downloadEnrollmentReportPdf, downloadAttendanceReportPdf,
  downloadProgressReportPdf, downloadClassReportPdf
} from '@/domains/learning/academics/api/academicApi';

interface Props {
  classId?: string;
}

const REPORTS = [
  { id: 'student-roster', label: 'Student Roster', desc: 'Complete list of all enrolled students with contact info', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'enrollment', label: 'Enrollment Summary', desc: 'Overview of all enrollments by status and class', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'attendance', label: 'Attendance Report', desc: 'Attendance records by session date and student', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'progress', label: 'Progress Report', desc: 'Student milestone completion and progress tracking', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'class', label: 'Class Report', desc: 'Class-wise summary with enrollment and performance data', icon: Award, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function Reports({ classId = '' }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId);
    setError(null);
    try {
      switch (reportId) {
        case 'student-roster': await downloadStudentReportPdf(''); break;
        case 'enrollment': await downloadEnrollmentReportPdf(''); break;
        case 'attendance': await downloadAttendanceReportPdf(''); break;
        case 'progress': await downloadProgressReportPdf(''); break;
        case 'class': await downloadClassReportPdf(classId); break;
      }
    } catch (e) {
      setError(`Failed to download ${reportId} report`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display font-bold text-lg text-slate-900">Reports</h3>
        <p className="font-sans text-xs text-slate-500 mt-1">Download class and student reports in PDF format</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report, i) => {
          const RIcon = report.icon;
          const isDownloading = downloading === report.id;
          return (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${report.bg} flex items-center justify-center shrink-0`}>
                  <RIcon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{report.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{report.desc}</p>
                </div>
                <button onClick={() => handleDownload(report.id)} disabled={isDownloading}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {isDownloading ? '...' : 'PDF'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-white/70" />
          <h4 className="font-bold text-sm">Generate Reports</h4>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          Download detailed PDF reports for your classes. Reports include student rosters,
          attendance summaries, enrollment data, and progress tracking. Share with
          administrators or keep for your records.
        </p>
      </div>
    </div>
  );
}
