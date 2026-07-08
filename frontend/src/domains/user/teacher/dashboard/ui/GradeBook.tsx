import React, { useState } from 'react';
import { BookOpen, ChevronDown, Save, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  students: any[];
}

export default function GradeBook({ students }: Props) {
  const [grades, setGrades] = useState<Record<string, { practical: number; theory: number; project: number; participation: number }>>({});

  const getGrade = (id: string) => grades[id] || { practical: 0, theory: 0, project: 0, participation: 0 };

  const updateGrade = (id: string, field: string, value: number) => {
    setGrades(prev => ({ ...prev, [id]: { ...getGrade(id), [field]: value } }));
  };

  const average = (g: typeof grades[string]) => Math.round((g.practical + g.theory + g.project + g.participation) / 4);

  const letterGrade = (avg: number) => {
    if (avg >= 90) return { grade: 'A+', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (avg >= 80) return { grade: 'A', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (avg >= 75) return { grade: 'B+', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (avg >= 70) return { grade: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (avg >= 65) return { grade: 'C+', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (avg >= 60) return { grade: 'C', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { grade: 'D', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-border-light/40">
        <h3 className="font-display font-bold text-lg text-slate-900">Grade Book</h3>
        <p className="font-sans text-xs text-slate-500 mt-1">Practical, theory, project, and participation scores</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
              <th className="px-4 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase">Student</th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Practical</th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Theory</th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Project</th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Participation</th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Avg</th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border-light/30">
            {students.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">No students found</td></tr>
            )}
            {students.map((s, idx) => {
              const g = getGrade(s.id);
              const avg = average(g);
              const lg = letterGrade(avg);
              const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
              return (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-[10px] font-bold text-blue-600">{name.charAt(0)}</div>
                      <span className="text-sm font-semibold text-slate-800">{name}</span>
                    </div>
                  </td>
                  {(['practical', 'theory', 'project', 'participation'] as const).map(field => (
                    <td key={field} className="px-4 py-3 text-center">
                      <input type="number" min={0} max={100} value={g[field]}
                        onChange={e => updateGrade(s.id, field, Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-16 text-center text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:border-[#2563EB]"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-display font-bold text-sm text-slate-900">{avg}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${lg.color}`}>
                      {avg >= 90 && <Star className="w-3 h-3 fill-emerald-500" />}{lg.grade}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {students.length > 0 && (
        <div className="px-6 py-3 border-t border-brand-border-light/40 flex justify-end">
          <button className="flex items-center gap-1.5 text-xs font-bold bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Save className="w-3.5 h-3.5" /> Save Grades
          </button>
        </div>
      )}
    </div>
  );
}
