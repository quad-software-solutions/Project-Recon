import React, { useState } from 'react';
import { BookOpen, ChevronDown, Save, Star, Download, TrendingUp, TrendingDown, Search, X } from 'lucide-react';
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

const WEIGHTS = { practical: 0.3, theory: 0.25, project: 0.3, participation: 0.15 };
const CATEGORIES = [
  { key: 'practical' as const, label: 'Practical', weight: '30%' },
  { key: 'theory' as const, label: 'Theory', weight: '25%' },
  { key: 'project' as const, label: 'Project', weight: '30%' },
  { key: 'participation' as const, label: 'Participation', weight: '15%' },
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

const DISTRIBUTION = [
  { range: 'A (90-100)', count: 1, color: 'bg-emerald-500' },
  { range: 'B (80-89)', count: 2, color: 'bg-blue-500' },
  { range: 'C (70-79)', count: 1, color: 'bg-amber-500' },
  { range: 'D (<70)', count: 1, color: 'bg-red-500' },
];

export default function GradeBook() {
  const [grades, setGrades] = useState(INITIAL_GRADES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'avg'>('name');
  const [showStats, setShowStats] = useState(false);

  const updateGrade = (studentId: number, field: keyof Omit<GradeEntry, 'studentId' | 'name'>, value: number) => {
    setGrades(prev => prev.map(g => g.studentId === studentId ? { ...g, [field]: Math.min(100, Math.max(0, value)) } : g));
  };

  const handleSave = () => {
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const calcAvg = (g: GradeEntry) => Math.round(g.practical * WEIGHTS.practical + g.theory * WEIGHTS.theory + g.project * WEIGHTS.project + g.participation * WEIGHTS.participation);

  const classAvg = Math.round(grades.reduce((sum, g) => sum + calcAvg(g), 0) / grades.length);
  const maxAvg = Math.max(...grades.map(calcAvg));
  const minAvg = Math.min(...grades.map(calcAvg));

  const exportGrades = () => {
    const csv = [
      ['Student', 'Practical (30%)', 'Theory (25%)', 'Project (30%)', 'Participation (15%)', 'Weighted Avg', 'Grade'],
      ...grades.map(g => {
        const avg = calcAvg(g);
        return [g.name, String(g.practical), String(g.theory), String(g.project), String(g.participation), String(avg), getLetterGrade(avg).grade];
      }),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gradebook.csv`;
    a.click();
  };

  const sorted = [...grades]
    .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : calcAvg(b) - calcAvg(a));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Grade Book</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Record and manage student scores across categories</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              ✓ Saved
            </motion.span>
          )}
          <button onClick={exportGrades} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-xs font-bold text-slate-700">Avg: {classAvg}%</span>
          </div>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search students..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/30 transition-all" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'avg')}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500/30">
          <option value="name">Sort: Name</option>
          <option value="avg">Sort: Grade</option>
        </select>
        <button onClick={() => setShowStats(!showStats)}
          className={`p-2.5 rounded-xl border transition-all ${showStats ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'}`}>
          <TrendingUp className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Grade Distribution</p>
                <div className="space-y-2">
                  {DISTRIBUTION.map(d => (
                    <div key={d.range} className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-slate-500 w-24">{d.range}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.count / grades.length) * 100}%` }} />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-600 w-4 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 content-start">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="font-mono text-[9px] font-bold text-slate-400 uppercase">Class Avg</p>
                  <p className="font-display font-extrabold text-xl text-blue-600">{classAvg}%</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                  <p className="font-mono text-[9px] font-bold text-emerald-500 uppercase">Highest</p>
                  <p className="font-display font-extrabold text-xl text-emerald-600">{maxAvg}%</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="font-mono text-[9px] font-bold text-amber-500 uppercase">Lowest</p>
                  <p className="font-display font-extrabold text-xl text-amber-600">{minAvg}%</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                  <p className="font-mono text-[9px] font-bold text-purple-500 uppercase">Students</p>
                  <p className="font-display font-extrabold text-xl text-purple-600">{grades.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grade Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                {CATEGORIES.map(c => (
                  <th key={c.key} className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {c.label}<br /><span className="text-[8px] font-normal">{c.weight}</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weighted Avg</th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">No students match this search.</p>
                </td></tr>
              ) : sorted.map((g, idx) => {
                const avg = calcAvg(g);
                const { grade, color } = getLetterGrade(avg);
                const isEditing = editingId === g.studentId;
                return (
                  <motion.tr key={g.studentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className={`transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">{g.name.charAt(0)}</div>
                        <span className="font-sans text-sm font-semibold text-slate-800">{g.name}</span>
                      </div>
                    </td>
                    {CATEGORIES.map(c => (
                      <td key={c.key} className="px-4 py-4 text-center">
                        {isEditing ? (
                          <input type="number" min={0} max={100} value={g[c.key]}
                            onChange={e => updateGrade(g.studentId, c.key, parseInt(e.target.value) || 0)}
                            className="w-14 text-center bg-white border border-blue-500/30 rounded-lg py-1 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        ) : (
                          <span className={`font-mono text-xs font-bold ${g[c.key] >= 80 ? 'text-slate-800' : g[c.key] >= 60 ? 'text-slate-600' : 'text-red-500'}`}>{g[c.key]}</span>
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
                        <button onClick={handleSave}
                          className="text-[11px] font-bold px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1 ml-auto shadow-sm">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <button onClick={() => setEditingId(g.studentId)}
                          className="text-[11px] font-bold px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all">
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
