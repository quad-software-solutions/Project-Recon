import React from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AttendanceTracker() {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({length: 30}, (_, i) => i + 1);
  const activeDates = [2, 3, 4, 9, 10]; // June 2023 dates

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-border-light/60 w-full max-w-sm mx-auto xl:max-w-none">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-slate-900 text-lg">Attendance Tracker</h3>
      </div>
      
      <div className="flex items-center justify-between mb-4 text-brand-muted-dark">
        <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-sans font-semibold text-sm">June 2023</span>
        <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map(d => <span key={d} className="text-[10px] text-brand-muted font-mono">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        <span/><span/><span/><span/>
        {dates.map(d => (
          <div key={d} className="flex items-center justify-center aspect-square">
            {activeDates.includes(d) ? (
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
          <span className="font-sans text-xs font-semibold text-slate-800">Total Hours %</span>
          <span className="font-sans text-xs font-semibold text-slate-800">Total Hours</span>
        </div>
        
        <div className="flex items-end justify-between h-28 gap-2">
          {[
            { month: 'Jan', value: 75 },
            { month: 'Feb', value: 80 },
            { month: 'Mar', value: 65 },
            { month: 'Apr', value: 80 },
            { month: 'May', value: 70 },
            { month: 'Jun', value: 25 },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-[9px] text-brand-muted font-mono font-medium">{item.value}%</span>
              <div className="w-full bg-[#f3f3fe] rounded-t-md relative flex-1 group hover:bg-[#e7e7f3] transition-colors">
                <div className="absolute bottom-0 left-0 w-full bg-[#2563EB] rounded-t-md transition-all group-hover:bg-[#004ac6]" style={{ height: `${item.value}%` }} />
              </div>
              <span className="text-[10px] text-slate-600 font-medium">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
