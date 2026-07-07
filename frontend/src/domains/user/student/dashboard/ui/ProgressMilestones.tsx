import React from 'react';
import { Check, Target } from 'lucide-react';

export default function ProgressMilestones() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-lg mb-8">Progress & Milestones</h3>
      <div className="relative px-2">
        <div className="absolute top-4 left-6 right-6 h-1 bg-brand-border-light rounded-full" />
        <div className="absolute top-4 left-6 w-1/2 h-1 bg-[#2563EB] rounded-full" />
        
        <div className="relative flex justify-between">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563EB] text-slate-900 flex items-center justify-center border-4 border-white shadow-sm z-10">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 text-center w-20 leading-tight">Completed Skills</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563EB] text-slate-900 flex items-center justify-center border-4 border-white shadow-sm z-10">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 text-center w-20 leading-tight">Project Submissions</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-4 border-white shadow-sm z-10">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 text-center w-20 leading-tight">Upcoming Milestones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
