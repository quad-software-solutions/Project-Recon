import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export interface DashboardSignal {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: 'red' | 'amber' | 'emerald' | 'blue' | 'slate';
}

interface DashboardCommandCenterProps {
  title: string;
  subtitle: string;
  signals: DashboardSignal[];
}

const toneClass = {
  red: 'bg-red-50 text-red-600 border-red-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
};

export default function DashboardCommandCenter({ title, subtitle, signals }: DashboardCommandCenterProps) {
  const riskCount = signals.filter(s => s.tone === 'red' || s.tone === 'amber').length;

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black uppercase tracking-wide text-slate-900">{title}</h2>
              <p className="truncate text-xs font-medium text-slate-500">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          {riskCount > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          <span className="text-xs font-bold text-slate-700">{riskCount > 0 ? `${riskCount} attention item${riskCount === 1 ? '' : 's'}` : 'All core queues steady'}</span>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-400">Live view</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {signals.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-slate-300 mx-auto mb-1" />
            No signals to display.
          </div>
        ) : signals.map((signal, index) => {
          const Icon = signal.icon;
          const tone = signal.tone ?? 'slate';
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg border ${toneClass[tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-lg font-black leading-none text-slate-900">{signal.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{signal.label}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{signal.detail}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
