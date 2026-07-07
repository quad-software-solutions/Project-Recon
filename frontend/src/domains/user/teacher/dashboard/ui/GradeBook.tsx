import React, { useState } from 'react';
import { BookOpen, ChevronDown, Save, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GradeEntry {
  studentId: number;
  name: string;
  practical: number;
  theory: number;
  project: number;
  participation: number;
}

const INITIAL_GRADES: GradeEntry[] = [
  { studentId: 1, name: 'Abebe B.', practical: 88, theory: 75, project: 92, participation: 95 },
  { studentId: 2, name: 'Abebe L.', practical: 72, theory: 68, project: 80, participation: 85 },
  { studentId: 3, name: 'Radiom J.', practical: 95, theory: 90, project: 88, participation: 100 },
  { studentId: 4, name: 'Skelos K.', practical: 60, theory: 55, project: 65, participation: 70 },
  { studentId: 5, name: 'Dr. Elias T.', practical: 82, theory: 78, project: 85, participation: 90 },
];

function getLetterGrade(avg: number): { grade: string; color: string } {
  if (avg >= 90) return { grade: 'A+', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (avg >= 85) return { grade: 'A', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (avg >= 80) return { grade: 'B+', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (avg >= 75) return { grade: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (avg >= 70) return { grade: 'C+', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (avg >= 60) return { grade: 'C', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { grade: 'D', color: 'text-red-600 bg-red-50 border-red-200' };
}

export default function GradeBook() {
  const [grades, setGrades] = useState(INITIAL_GRADES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const updateGrade = (studentId: number, field: keyof Omit<GradeEntry, 'studentId' | 'name'>, value: number) => {
    setGrades(prev => prev.map(g => g.studentId === studentId ? { ...g, [field]: Math.min(100, Math.max(0, value)) } : g));
  };

  const handleSave = () => {
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const classAvg = Math.round(grades.reduce((sum, g) => sum + (g.practical + g.theory + g.project + g.participation) / 4, 0) / grades.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Grade Book</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Record and manage student scores across categories</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              ✓ Saved
            </motion.span>
          )}
          <div className="bg-white rounded-xl border border-brand-border-light px-4 py-2.5 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-xs font-bold text-slate-700">Class Avg: {classAvg}%</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Practical<br/><span className="text-[8px] font-normal">30%</span></th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Theory<br/><span className="text-[8px] font-normal">25%</span></th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project<br/><span className="text-[8px] font-normal">30%</span></th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participation<br/><span className="text-[8px] font-normal">15%</span></th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weighted Avg</th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {grades.map((g, idx) => {
                const avg = Math.round(g.practical * 0.3 + g.theory * 0.25 + g.project * 0.3 + g.participation * 0.15);
                const { grade, color } = getLetterGrade(avg);
                const isEditing = editingId === g.studentId;
                return (
                  <motion.tr key={g.studentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                    className={`transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">{g.name.charAt(0)}</div>
                        <span className="font-sans text-sm font-semibold text-slate-800">{g.name}</span>
                      </div>
                    </td>
                    {(['practical', 'theory', 'project', 'participation'] as const).map(field => (
                      <td key={field} className="px-4 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min={0} max={100} value={g[field]}
                            onChange={e => updateGrade(g.studentId, field, parseInt(e.target.value) || 0)}
                            className="w-14 text-center bg-white border border-[#2563EB]/30 rounded-lg py-1 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
                        ) : (
                          <span className={`font-mono text-xs font-bold ${g[field] >= 80 ? 'text-slate-800' : g[field] >= 60 ? 'text-slate-600' : 'text-red-500'}`}>{g[field]}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono text-sm font-extrabold text-slate-900">{avg}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center font-mono text-xs font-bold px-3 py-1 rounded-full border ${color}`}>{grade}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {isEditing ? (
                        <button onClick={handleSave} className="text-[11px] font-bold px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 hover:bg-emerald-600 transition-colors flex items-center gap-1 ml-auto">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <button onClick={() => setEditingId(g.studentId)} className="text-[11px] font-bold px-4 py-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB] hover:text-slate-900 transition-colors">
                          Edit
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
