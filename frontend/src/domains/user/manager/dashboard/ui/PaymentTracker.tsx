import React from 'react';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

export default function PaymentTracker() {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const SALES_DATA = [40, 70, 50, 90, 60, 80];
  const COURSE_DATA = [80, 60, 90, 70, 100, 85];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-xl mb-6">Payment & Sales Tracker</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase">Total Sales this Month</p>
            <p className="font-display font-bold text-2xl text-slate-900">$7,663</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#2563EB] uppercase">Registration Deposits</p>
            <p className="font-display font-bold text-2xl text-slate-900">$3,085</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <span className="font-mono text-[10px] font-bold text-brand-muted uppercase mb-2 block">Online Course Payments</span>
          <div className="h-24 flex items-end gap-1.5 mb-2">
            {COURSE_DATA.map((h, i) => (
              <div key={i} className="flex-1 bg-[#2563EB]/10 rounded-t relative">
                <div className="absolute bottom-0 left-0 right-0 bg-[#2563EB] rounded-t transition-all duration-700" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            {MONTHS.map(m => <span key={m} className="flex-1 text-center font-mono text-[8px] text-brand-muted">{m}</span>)}
          </div>
        </div>
        
        <div>
          <span className="font-mono text-[10px] font-bold text-brand-muted uppercase mb-2 block">Hardware & Gear Sales</span>
          <div className="h-24 flex items-end gap-1.5 mb-2">
            {SALES_DATA.map((h, i) => (
              <div key={i} className="flex-1 bg-emerald-500/10 rounded-t relative">
                <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t transition-all duration-700" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            {MONTHS.map(m => <span key={m} className="flex-1 text-center font-mono text-[8px] text-brand-muted">{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
