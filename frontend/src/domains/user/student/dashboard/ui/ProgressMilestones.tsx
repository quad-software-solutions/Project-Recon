import React, { useState, useEffect } from 'react';
import { Check, Target, Loader2, ShieldOff, Download } from 'lucide-react';
import { fetchEnrollmentsApi, fetchMilestonesApi, fetchStudentProgressApi, downloadProgressReportPdf } from '@/src/domains/learning/academics/api/academicApi';
import type { LearningMilestone, StudentProgress } from '@/src/shared/types';

interface Props { studentId: string }

export default function ProgressMilestones({ studentId }: Props) {
  const [milestones, setMilestones] = useState<LearningMilestone[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    fetchEnrollmentsApi(studentId).then(async enr => {
      const allMilestones: LearningMilestone[] = [];
      const allProgress: StudentProgress[] = [];
      for (const e of enr) {
        try {
          const m = await fetchMilestonesApi(e.enrolled_class);
          allMilestones.push(...m);
          const p = await fetchStudentProgressApi(e.id);
          allProgress.push(...p);
        } catch {}
      }
      setMilestones(allMilestones);
      setProgress(allProgress);
    }).catch(() => {
      setPermissionDenied(true);
    }).finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60">
        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border-light/60 text-center">
        <ShieldOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="font-bold text-lg text-slate-900 mb-2">Progress Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Progress tracking requires staff-level access. Contact your instructor to view your milestones or download the PDF report.
        </p>
        <button
          onClick={() => downloadProgressReportPdf(studentId)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download PDF Report
        </button>
      </div>
    );
  }

  const completedIds = new Set(progress.filter(p => p.status === 'COMPLETED').map(p => p.milestone));
  const inProgressIds = new Set(progress.filter(p => p.status === 'IN_PROGRESS').map(p => p.milestone));
  const completed = milestones.filter(m => completedIds.has(m.id));
  const inProgress = milestones.filter(m => inProgressIds.has(m.id));
  const remaining = milestones.filter(m => !completedIds.has(m.id) && !inProgressIds.has(m.id));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-lg mb-6">Progress & Milestones</h3>

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm font-medium">No milestones defined for your enrollments yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Completed', count: completed.length, icon: Check, color: 'bg-emerald-500 text-white' },
              { label: 'In Progress', count: inProgress.length, icon: Target, color: 'bg-blue-500 text-white' },
              { label: 'Remaining', count: remaining.length, icon: Target, color: 'bg-slate-200 text-slate-600' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 text-center border border-brand-border">
                <div className={`w-9 h-9 rounded-full ${s.color} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="font-black text-2xl text-slate-900">{s.count}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="relative px-2 mb-8">
            <div className="absolute top-4 left-6 right-6 h-1 bg-brand-border-light rounded-full" />
            <div className="absolute top-4 left-6 h-1 bg-emerald-500 rounded-full" style={{ width: milestones.length > 0 ? `${(completed.length / milestones.length) * 50}%` : '0%' }} />

            <div className="relative flex justify-between">
              {completed.length > 0 && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center border-4 border-white shadow-sm z-10">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 text-center w-20 leading-tight">Completed</span>
                </div>
              )}
              {inProgress.length > 0 && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center border-4 border-white shadow-sm z-10">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 text-center w-20 leading-tight">In Progress</span>
                </div>
              )}
              <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-4 border-white shadow-sm z-10">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500 text-center w-20 leading-tight">{remaining.length} Remaining</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 mb-3">Milestone Details</h4>
            {milestones.map(m => {
              const isCompleted = completedIds.has(m.id);
              const isActive = inProgressIds.has(m.id);
              return (
                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : isActive ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : isActive ? <Target className="w-3.5 h-3.5" /> : m.title.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-700' : 'text-slate-800'}`}>{m.title}</p>
                    {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}