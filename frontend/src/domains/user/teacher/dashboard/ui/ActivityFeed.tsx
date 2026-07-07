import React from 'react';
import { Activity, CheckCircle2, Edit3, Award } from 'lucide-react';

const FEED_ITEMS = [
  { icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', bold: 'Abebe B.', text: 'submitted project assignments', time: 'Fri 21st' },
  { icon: Edit3, bg: 'bg-blue-100', color: 'text-blue-600', bold: 'Dr. Elias', text: 'reviewed submission batch 2', time: 'Fri 21st' },
  { icon: Award, bg: 'bg-purple-100', color: 'text-purple-600', bold: '', text: 'New educational achievements unlocked', time: 'Thu 20th' },
];

export default function ActivityFeed() {
  return (
    <div className="bg-white rounded-[24px] border border-brand-border-light p-6 shadow-sm" id="section-activity">
      <h3 className="font-display font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-[#2563EB]" /> Recent Activity
      </h3>
      <div className="flex flex-col gap-4">
        {FEED_ITEMS.map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className={`w-6 h-6 rounded-full ${item.bg} flex items-center justify-center ${item.color} shrink-0`}>
              <item.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-sans text-xs text-slate-800 leading-snug">
                {item.bold && <span className="font-bold">{item.bold} </span>}{item.text}
              </p>
              <span className="font-mono text-[9px] text-brand-muted mt-0.5 block">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
