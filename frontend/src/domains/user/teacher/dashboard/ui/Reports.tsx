import React, { useState } from 'react';
import { Download, Award, Loader2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadClassReportPdf } from '@/domains/learning/academics/api/academicApi';
import type { TeacherClassOption } from '@/domains/user/teacher/api/teacherData';

interface Props {
  classId?: string;
  classes?: TeacherClassOption[];
  onClassChange?: (id: string) => void;
}

export default function Reports({ classId = '', classes = [], onClassChange }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    if (!classId) { setError('No class selected. Select a class first.'); return; }
    setDownloading(true);
    setError(null);
    setSuccess(false);
    try {
      await downloadClassReportPdf(classId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to download Class Report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display font-bold text-lg text-slate-900">Reports</h3>
        <p className="font-sans text-xs text-slate-500 mt-1">Download class reports in PDF format</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-xs text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>Report downloaded successfully</span>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
      >
        {classes.length > 0 && onClassChange && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Class</label>
            <select value={classId} onChange={e => onClassChange(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900">Class Report</h4>
            <p className="text-xs text-slate-500 mt-0.5">Class-wise summary with enrollment and performance data</p>
          </div>
          <button onClick={handleDownload} disabled={downloading || !classId}
            className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? '...' : 'PDF'}
          </button>
        </div>
      </motion.div>

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
