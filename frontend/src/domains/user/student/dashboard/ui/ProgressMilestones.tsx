import React, { useState } from 'react';
import { Download, FileText, Target, Loader2 } from 'lucide-react';
import { downloadProgressReportPdf } from '@/src/domains/learning/academics/api/academicApi';

interface Props { studentId: string | null }

export default function ProgressMilestones({ studentId }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!studentId) return;
    setDownloading(true);
    try {
      await downloadProgressReportPdf(studentId);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border-light/60">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center">
          <Target className="w-6 h-6 text-brand-red" />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-900 text-xl">Progress & Milestones</h3>
          <p className="text-sm text-slate-500 mt-1">
            Milestone tracking is managed by your instructor. Download your official progress report as PDF.
          </p>
        </div>
      </div>

      {!studentId ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Academic profile not linked yet.</p>
          <p className="text-xs mt-1">Once you receive a certificate or complete enrollment, reports will be available.</p>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">Progress Report (PDF)</p>
            <p className="text-xs text-slate-500 mt-1">Generated from your enrollment milestone records.</p>
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
