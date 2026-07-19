import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, MapPin, Trophy, Rocket } from 'lucide-react';
import type { ActiveTab } from '@/shared/types';

interface Props { onNavigate: (tab: ActiveTab) => void }

const OUR_HISTORY = [
  { year: '2011', title: 'Foundation & Early Programs', detail: 'Founded Ethio Robo Robotics Center. Launched STEM education in Ethiopia.', tag: 'Founded' },
  { year: '2016', title: 'First International Participation', detail: 'First participation in USA VEX Robotics Competition.', tag: 'Global' },
  { year: '2020', title: 'Expansion & Structured Training', detail: 'Expanded robotics programs to schools and introduced structured VEX training.', tag: 'Growth' },
  { year: '2022', title: 'First African Robotics Championship', detail: 'Co-organized first ARC with MinT; hosted 40+ teams.', tag: 'ARC' },
  { year: '2023', title: 'Global Competitions & ARC 2023', detail: 'Held ARC 2023 (40+ teams, 500+ students). Represented Ethiopia in China. Won medals in USA VEX Competition.', tag: 'Medals' },
  { year: '2024', title: 'ARC 2024 & National Growth', detail: 'Held ARC 2024 (40+ teams, 700+ students). Achieved top awards in ENJOY AI Global and USA VEX Competitions. Expanded national STEM initiatives.', tag: 'Awards' },
  { year: '2026', title: 'Upcoming ARC 2026 Competition', detail: 'Will be held in Addis Ababa, Addis International Convention Center, Ethiopia, on 28th January 2026. Registration closes on December 30, 2025.', tag: 'Upcoming', upcoming: true },
];

export default function HistoryPage({ onNavigate }: Props) {
  const [activeYear, setActiveYear] = useState(OUR_HISTORY[OUR_HISTORY.length - 1].year);
  const active = OUR_HISTORY.find(h => h.year === activeYear) ?? OUR_HISTORY[OUR_HISTORY.length - 1];

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f4f6fb] via-white to-slate-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,51,141,0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14">
        <button
          onClick={() => onNavigate('about')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to About
        </button>

        <div className="text-center mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
            <Calendar className="w-3.5 h-3.5" /> Since 2011
          </span>
          <h1 className="font-display font-bold text-slate-900 tracking-tight text-4xl md:text-5xl">
            Our History
          </h1>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            From founding a robotics center in 2011 to hosting ARC 2026 in Addis Ababa — fifteen years of STEM, competition, and growth.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto mb-12">
          {[
            { icon: Rocket, label: 'Years', value: '15+' },
            { icon: Trophy, label: 'ARC Editions', value: '3+' },
            { icon: MapPin, label: 'Countries', value: '4+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-4 text-center">
              <Icon className="w-4 h-4 text-brand-blue mx-auto mb-2" />
              <p className="font-display font-bold text-slate-900 text-xl md:text-2xl">{value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Year scrubber */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin justify-start md:justify-center snap-x">
          {OUR_HISTORY.map((item) => {
            const isActive = activeYear === item.year;
            return (
              <button
                key={item.year}
                type="button"
                onClick={() => setActiveYear(item.year)}
                className={`snap-center shrink-0 px-4 py-2.5 rounded-xl font-mono text-sm font-bold transition-all border ${
                  isActive
                    ? item.upcoming
                      ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/25 scale-105'
                      : 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/25 scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-blue/40 hover:text-brand-blue'
                }`}
              >
                {item.year}
              </button>
            );
          })}
        </div>

        {/* Featured active milestone */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.year}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`mb-14 rounded-3xl border p-6 md:p-10 shadow-sm ${
              active.upcoming
                ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                active.upcoming ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-brand-blue'
              }`}>
                {active.tag}
              </span>
              <span className="font-mono text-sm font-bold text-slate-400">{active.year}</span>
            </div>
            <h2 className="font-display font-bold text-slate-900 text-2xl md:text-3xl tracking-tight mb-3">
              {active.title}
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl">
              {active.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Full timeline */}
        <div className="relative max-w-4xl mx-auto pb-8">
          <div className="absolute left-6 md:left-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-brand-blue via-slate-200 to-amber-400 md:-translate-x-1/2" />
          <div className="space-y-6">
            {OUR_HISTORY.map((item, idx) => {
              const isActive = activeYear === item.year;
              return (
                <motion.div
                  key={item.year}
                  layout
                  onClick={() => setActiveYear(item.year)}
                  className={`relative flex flex-col md:flex-row md:items-stretch gap-4 cursor-pointer ${
                    idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className={`md:w-1/2 pl-16 md:pl-0 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div
                      className={`rounded-2xl border p-5 transition-all duration-300 ${
                        isActive
                          ? item.upcoming
                            ? 'bg-amber-50 border-amber-300 shadow-xl shadow-amber-100 scale-[1.02]'
                            : 'bg-white border-brand-blue/30 shadow-xl shadow-blue-100/80 scale-[1.02]'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className={`flex items-center gap-2 mb-2 ${idx % 2 === 0 ? 'md:justify-end' : ''}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.upcoming ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-brand-blue'
                        }`}>
                          {item.tag}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-400">{item.year}</span>
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-lg leading-snug">{item.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mt-2">{item.detail}</p>
                    </div>
                  </div>
                  <div
                    className={`absolute left-6 md:left-1/2 w-4 h-4 rounded-full border-[3px] border-white shadow -translate-x-1/2 mt-6 z-10 transition-colors ${
                      isActive
                        ? item.upcoming ? 'bg-amber-500 ring-4 ring-amber-200' : 'bg-brand-blue ring-4 ring-blue-200'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
