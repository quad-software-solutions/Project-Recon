import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Target, Code, BookOpen, Cpu, ChevronRight, Zap, Award, TrendingUp } from 'lucide-react';

interface Milestone {
  id: number;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'locked';
  description: string;
}

interface SkillBreakdown {
  skill: string;
  progress: number;
  icon: React.ElementType;
  color: string;
}

const MILESTONES: Milestone[] = [
  { id: 1, title: 'VEX IQ Basics', date: 'Completed Apr 2025', status: 'completed', description: 'Fundamentals of robot design and programming' },
  { id: 2, title: 'Intermediate Coding', date: 'Completed May 2025', status: 'completed', description: 'Advanced autonomous routines and sensors' },
  { id: 3, title: 'Team Collaboration', date: 'Completed Jun 2025', status: 'completed', description: 'Worked on group project for regional qualifier' },
  { id: 4, title: 'Advanced Mechanics', date: 'In Progress', status: 'current', description: 'Complex gear systems, drivetrains, and lift mechanisms' },
  { id: 5, title: 'Competition Prep', date: 'Starting Jul 2025', status: 'locked', description: 'Match strategy, driver practice, and pit management' },
  { id: 6, title: 'National Qualifier', date: 'Aug 2025', status: 'locked', description: 'Represent the academy at the national level' },
];

const SKILLS: SkillBreakdown[] = [
  { skill: 'Programming', progress: 85, icon: Code, color: 'text-blue-500' },
  { skill: 'Mechanical Design', progress: 72, icon: Cpu, color: 'text-emerald-500' },
  { skill: 'Problem Solving', progress: 90, icon: Zap, color: 'text-amber-500' },
  { skill: 'Teamwork', progress: 78, icon: Award, color: 'text-purple-500' },
];

export default function ProgressMilestones() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-lg">Progress & Milestones</h3>
          <p className="text-xs text-slate-500 mt-1">Track your learning journey step by step</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-slate-50 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600">Overall Progress</span>
          <span className="text-xs font-bold text-blue-500">60%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-sm" />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">3 of 6 milestones completed</p>
      </div>

      {/* Milestones Timeline */}
      <div className="space-y-3 mb-8">
        {MILESTONES.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            className={`relative pl-8 cursor-pointer ${
              m.status === 'locked' ? 'opacity-50' : ''
            } ${i < MILESTONES.length - 1 ? 'pb-3' : ''}`}
          >
            {/* Connector Line */}
            {i < MILESTONES.length - 1 && (
              <div className={`absolute left-[9px] top-[18px] w-0.5 h-full rounded-full ${
                m.status === 'completed' ? 'bg-emerald-400' : m.status === 'current' ? 'bg-blue-400' : 'bg-slate-200'
              }`} />
            )}

            {/* Dot */}
            <div className={`absolute left-0 top-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
              m.status === 'completed'
                ? 'bg-emerald-500 border-emerald-500'
                : m.status === 'current'
                ? 'bg-blue-500 border-blue-500 animate-pulse'
                : 'bg-white border-slate-300'
            }`}>
              {m.status === 'completed' && <Check className="w-3 h-3 text-white" />}
              {m.status === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>

            <div className={`bg-white rounded-xl p-3 border transition-all ${
              expanded === m.id ? 'border-blue-200 shadow-sm' : 'border-transparent'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-sans font-bold text-sm text-slate-900">{m.title}</span>
                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : m.status === 'current'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {m.status === 'completed' ? 'Done' : m.status === 'current' ? 'Active' : 'Upcoming'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.date}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded === m.id ? 'rotate-90' : ''}`} />
              </div>
              {expanded === m.id && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  {m.description}
                </motion.p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skill Breakdown */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="font-sans font-bold text-sm text-slate-700 mb-3">Skill Breakdown</h4>
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((sk, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <sk.icon className={`w-3.5 h-3.5 ${sk.color}`} />
                <span className="text-xs font-bold text-slate-600">{sk.skill}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${sk.progress}%` }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${sk.color.replace('text', 'bg')}`} />
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-500">{sk.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
