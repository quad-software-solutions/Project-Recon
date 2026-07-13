import React, { useState } from 'react';
import { Download, Users, BookOpen, CheckCircle2, BarChart3, Loader2, Award, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import {
  downloadStudentReportPdf, downloadEnrollmentReportPdf, downloadAttendanceReportPdf,
  downloadProgressReportPdf, downloadClassReportPdf
} from '@/src/domains/learning/academics/api/academicApi';

interface Props {
  classId?: string;
  sampleStudentId?: string;
  staffMode?: boolean;
}

type ReportDef = {
  id: string;
  label: string;
  desc: string;
  icon: typeof Users;
  color: string;
  bg: string;
  requiresStudent?: boolean;
  requiresClass?: boolean;
  staffOnly?: boolean;
};

const REPORTS: ReportDef[] = [
  { id: 'student-roster', label: 'Student Academic Report', desc: 'PDF academic summary for a student', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', requiresStudent: true, staffOnly: true },
  { id: 'enrollment', label: 'Enrollment History', desc: 'PDF enrollment history for a student', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', requiresStudent: true, staffOnly: true },
  { id: 'attendance', label: 'Attendance Report', desc: 'PDF attendance summary for a student', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50', requiresStudent: true, staffOnly: true },
  { id: 'progress', label: 'Progress Report', desc: 'PDF milestone progress for a student', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50', requiresStudent: true, staffOnly: true },
  { id: 'class', label: 'Class Report', desc: 'Class summary with enrollments and performance', icon: Award, color: 'text-rose-600', bg: 'bg-rose-50', requiresClass: true },
];

export default function Reports({ classId = '', sampleStudentId, staffMode = false }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleReports = REPORTS.filter(r => !r.staffOnly || staffMode);

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId);
    setError(null);
    try {
      switch (reportId) {
        case 'student-roster':
          if (!sampleStudentId) throw new Error('Select a class with enrolled students');
          await downloadStudentReportPdf(sampleStudentId);
          break;
        case 'enrollment':
          if (!sampleStudentId) throw new Error('Select a class with enrolled students');
          await downloadEnrollmentReportPdf(sampleStudentId);
          break;
        case 'attendance':
          if (!sampleStudentId) throw new Error('Select a class with enrolled students');
          await downloadAttendanceReportPdf(sampleStudentId);
          break;
        case 'progress':
          if (!sampleStudentId) throw new Error('Select a class with enrolled students');
          await downloadProgressReportPdf(sampleStudentId);
          break;
        case 'class':
          if (!classId) throw new Error('Select a class first');
          await downloadClassReportPdf(classId);
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to download ${reportId} report`);
    } finally {
      setDownloading(null);
    }
  };

  const isDisabled = (report: ReportDef) => {
    if (report.requiresClass && !classId) return true;
    if (report.requiresStudent && !sampleStudentId) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display font-bold text-lg text-slate-900">Reports</h3>
        <p className="font-sans text-xs text-slate-500 mt-1">
          Download PDF reports from the academic API. Class report is available for instructors; student reports require staff access.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleReports.map((report, i) => {
          const RIcon = report.icon;
          const isDownloading = downloading === report.id;
          const disabled = isDisabled(report);
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
                <button onClick={() => handleDownload(report.id)} disabled={isDownloading || disabled}
                  className="flex items-center gap-1.5 text-xs font-bold bg-brand-red text-white px-3 py-2 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 transition-colors shrink-0"
                >
                  {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {isDownloading ? '...' : 'PDF'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-white/70" />
          <h4 className="font-bold text-sm">Academic PDF Reports</h4>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          Reports are generated server-side from enrollment, attendance, and progress data.
          Select a class in Class Management before downloading the class report.
        </p>
      </div>
    </div>
  );
}
