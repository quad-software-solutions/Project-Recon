import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen, Save, Star, Search, X, Loader2, BarChart3, CheckCircle2, TrendingUp, TrendingDown,
  Trophy, Download, Settings, Sliders, MessageSquare, History, Clock, ArrowUpDown, Users, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubScores {
  scores: number[];
}

interface StudentGrade {
  practical: SubScores;
  theory: SubScores;
  project: SubScores;
  participation: SubScores;
  comments: string;
}

interface GradeSnapshot {
  date: string;
  avg: number;
  grade: string;
}

const DEFAULT_WEIGHTS = { practical: 0.25, theory: 0.25, project: 0.25, participation: 0.25 };
const CATEGORY_LABELS: Record<string, string> = { practical: 'Practical', theory: 'Theory', project: 'Project', participation: 'Participation' };
const CATEGORY_MAX_SUB = 5;

const STORAGE_GRADES = 'teacher_gradebook';
const STORAGE_WEIGHTS = 'teacher_gradebook_weights';
const STORAGE_HISTORY = 'teacher_gradebook_history';

function loadGrades(): Record<string, StudentGrade> {
  try { return JSON.parse(localStorage.getItem(STORAGE_GRADES) || '{}'); } catch { return {}; }
}
function saveGrades(g: Record<string, StudentGrade>) {
  try { localStorage.setItem(STORAGE_GRADES, JSON.stringify(g)); } catch {}
}

interface Props { students: any[]; }

export default function GradeBook({ students }: Props) {
  const [grades, setGrades] = useState<Record<string, StudentGrade>>(loadGrades);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showWeights, setShowWeights] = useState(false);
  const [passThreshold, setPassThreshold] = useState(60);
  const [history, setHistory] = useState<GradeSnapshot[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showWeightsModal, setShowWeightsModal] = useState(false);

  const getDefaultGrade = (): StudentGrade => ({
    practical: { scores: [0] },
    theory: { scores: [0] },
    project: { scores: [0] },
    participation: { scores: [0] },
    comments: '',
  });

  const getGrade = useCallback((id: string): StudentGrade => grades[id] || getDefaultGrade(), [grades]);

  const updateScore = (id: string, category: keyof Omit<StudentGrade, 'comments'>, subIdx: number, value: number) => {
    setGrades(prev => {
      const existing = prev[id];
      const g: StudentGrade = existing ? { ...existing } : getDefaultGrade();
      const cat = { ...g[category], scores: [...g[category].scores] };
      cat.scores[subIdx] = Math.min(100, Math.max(0, Number(value)));
      return { ...prev, [id]: { ...g, [category]: cat } };
    });
    setSaved(false);
  };

  const addSubScore = (id: string, category: keyof Omit<StudentGrade, 'comments'>) => {
    setGrades(prev => {
      const existing = prev[id];
      const g: StudentGrade = existing ? { ...existing } : getDefaultGrade();
      const cat = { ...g[category], scores: [...g[category].scores, 0] };
      if (cat.scores.length > CATEGORY_MAX_SUB) return prev;
      return { ...prev, [id]: { ...g, [category]: cat } };
    });
  };

  const removeSubScore = (id: string, category: keyof Omit<StudentGrade, 'comments'>, subIdx: number) => {
    setGrades(prev => {
      const existing = prev[id];
      const g: StudentGrade = existing ? { ...existing } : getDefaultGrade();
      const cat = { ...g[category], scores: g[category].scores.filter((_: number, i: number) => i !== subIdx) };
      if (cat.scores.length === 0) cat.scores = [0];
      return { ...prev, [id]: { ...g, [category]: cat } };
    });
  };

  const setComment = (id: string, text: string) => {
    setGrades(prev => {
      const existing = prev[id];
      const g: StudentGrade = existing ? { ...existing } : getDefaultGrade();
      return { ...prev, [id]: { ...g, comments: text } };
    });
  };

  const catAvg = (grade: StudentGrade, cat: keyof Omit<StudentGrade, 'comments'>): number => {
    const s = grade[cat].scores;
    return s.length > 0 ? s.reduce((a: number, b: number) => a + b, 0) / s.length : 0;
  };

  const weightedAverage = (grade: StudentGrade): number => {
    return Math.round(
      catAvg(grade, 'practical') * weights.practical +
      catAvg(grade, 'theory') * weights.theory +
      catAvg(grade, 'project') * weights.project +
      catAvg(grade, 'participation') * weights.participation
    );
  };

  const letterGrade = (avg: number) => {
    if (avg >= 90) return { grade: 'A+', color: 'bg-emerald-100 text-emerald-700', star: true };
    if (avg >= 80) return { grade: 'A', color: 'bg-emerald-100 text-emerald-700', star: false };
    if (avg >= 75) return { grade: 'B+', color: 'bg-blue-100 text-blue-700', star: false };
    if (avg >= 70) return { grade: 'B', color: 'bg-blue-100 text-blue-700', star: false };
    if (avg >= 65) return { grade: 'C+', color: 'bg-amber-100 text-amber-700', star: false };
    if (avg >= 60) return { grade: 'C', color: 'bg-amber-100 text-amber-700', star: false };
    if (avg >= 50) return { grade: 'D', color: 'bg-red-100 text-red-600', star: false };
    return { grade: 'F', color: 'bg-red-200 text-red-800', star: false };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const allAvgs = students.map(s => weightedAverage(getGrade(s.id)));
      const classAvg = allAvgs.length > 0 ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0;
      const snapshot: GradeSnapshot = { date: now, avg: classAvg, grade: letterGrade(classAvg).grade };

      const newHistory = [...history, snapshot].slice(-20);
      setHistory(newHistory);
      try { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(newHistory)); } catch {}
      saveGrades(grades);
      localStorage.setItem(STORAGE_WEIGHTS, JSON.stringify(weights));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { } finally { setSaving(false); }
  };

  const exportCsv = () => {
    const headers = ['Student', 'Practical Avg', 'Theory Avg', 'Project Avg', 'Participation Avg', 'Weighted Avg', 'Grade', 'Comments'];
    const rows = students.map(s => {
      const g = getGrade(s.id);
      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
      const avg = weightedAverage(g);
      return [name, catAvg(g, 'practical'), catAvg(g, 'theory'), catAvg(g, 'project'), catAvg(g, 'participation'), avg, letterGrade(avg).grade, g.comments];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gradebook_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    let list = searchQuery.trim()
      ? students.filter(s => `${s.first_name || ''} ${s.last_name || ''} ${s.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))
      : students;

    list = [...list]; // create mutable copy
    if (sortField === 'name') {
      list.sort((a, b) => {
        const na = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        const nb = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
      });
    } else if (sortField === 'avg') {
      list.sort((a, b) => sortDir === 'asc'
        ? weightedAverage(getGrade(a.id)) - weightedAverage(getGrade(b.id))
        : weightedAverage(getGrade(b.id)) - weightedAverage(getGrade(a.id))
      );
    }
    return list;
  }, [students, searchQuery, sortField, sortDir, grades, weights]);

  const allAvgs = students.map(s => weightedAverage(getGrade(s.id)));
  const gradeDistribution: Record<string, number> = useMemo(() => {
    const dist: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, D: 0, F: 0 };
    allAvgs.forEach(avg => {
      const g = letterGrade(avg).grade;
      if (g in dist) dist[g]++;
    });
    return dist;
  }, [allAvgs]);

  const classAvg = allAvgs.length > 0 ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0;
  const maxAvg = allAvgs.length > 0 ? Math.max(...allAvgs) : 0;
  const minAvg = allAvgs.length > 0 ? Math.min(...allAvgs) : 0;
  const passCount = allAvgs.filter(a => a >= passThreshold).length;
  const failCount = allAvgs.length - passCount;
  const passRate = allAvgs.length > 0 ? Math.round((passCount / allAvgs.length) * 100) : 0;

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const dropGrade = (avg: number) => {
    if (avg >= passThreshold) return 'text-slate-800';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Grade Distribution + Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(gradeDistribution).map(([grade, count]) => {
          const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
          return (
            <div key={grade} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-900">{grade}</p>
              <p className="text-xs text-slate-500">{count}</p>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${grade === 'F' || grade === 'D' ? 'bg-red-500' : grade === 'C' || grade === 'C+' ? 'bg-amber-500' : grade === 'B' || grade === 'B+' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Stats + Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Avg</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{classAvg}%</p>
          <div className="flex items-center gap-1 mt-0.5">
            {maxAvg > classAvg ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
            <span className="text-[10px] text-slate-500">Range: {minAvg}-{maxAvg}%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Passing</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{passRate}%</p>
          <p className="text-[10px] text-slate-500">{passCount} of {allAvgs.length} students</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Top</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{maxAvg}%</p>
          <p className="text-[10px] text-slate-500">highest score</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Threshold</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-purple-600">{passThreshold}%</p>
            <button onClick={() => setShowWeightsModal(true)} className="p-1 rounded hover:bg-purple-50"><Settings className="w-3.5 h-3.5 text-purple-400" /></button>
          </div>
        </div>
      </div>

      {/* History Trend */}
      {history.length > 0 && (
        <button onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-200 transition-all">
          <History className="w-4 h-4" />
          <span>View grade history ({history.length} snapshot{history.length !== 1 ? 's' : ''})</span>
          <span className="ml-auto text-[10px] text-slate-400">Last: {history[history.length - 1].date} ({history[history.length - 1].avg}%)</span>
        </button>
      )}

      {/* Weight Config */}
      {showWeights && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Sliders className="w-4 h-4 text-blue-500" /> Grade Weights</h4>
            <button onClick={() => setShowWeights(false)} className="text-xs text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(DEFAULT_WEIGHTS) as Array<keyof typeof DEFAULT_WEIGHTS>).map(cat => (
              <div key={cat}>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{CATEGORY_LABELS[cat]}</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="range" min={0} max={100} value={Math.round(weights[cat] * 100)}
                    onChange={e => setWeights(prev => ({ ...prev, [cat]: Number(e.target.value) / 100 }))}
                    className="flex-1" />
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{Math.round(weights[cat] * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> Grades saved successfully
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border-light/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Grade Book</h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Weighted: Practical {Math.round(weights.practical * 100)}% · Theory {Math.round(weights.theory * 100)}% · Project {Math.round(weights.project * 100)}% · Participation {Math.round(weights.participation * 100)}%
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowWeights(!showWeights)}
              className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${showWeights ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Sliders className="w-3 h-3" /> Weights
            </button>
            <button onClick={exportCsv} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 flex items-center gap-1">
              <Download className="w-3 h-3" /> CSV
            </button>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue-bright" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-4 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-slate-700" onClick={() => toggleSort('name')}>
                  <span className="flex items-center gap-1">Student {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>
                {(['practical', 'theory', 'project', 'participation'] as const).map(cat => (
                  <th key={cat} className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">{CATEGORY_LABELS[cat]}</th>
                ))}
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-slate-700" onClick={() => toggleSort('avg')}>
                  <span className="flex items-center justify-center gap-1">Avg {sortField === 'avg' && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>
                <th className="px-4 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">No students found</td></tr>
              )}
              {filtered.map((s, idx) => {
                const g = getGrade(s.id);
                const avg = weightedAverage(g);
                const lg = letterGrade(avg);
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                const isTop = avg === maxAvg && avg > 0;
                const isLow = avg === minAvg && avg > 0;
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${avg < passThreshold ? 'bg-red-50/30' : ''}`}
                    onClick={() => setSelectedStudent(s)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                          ${isTop ? 'bg-amber-100 text-amber-600' : isLow ? 'bg-red-100 text-red-600' : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600'}`}>
                          {isTop ? <Trophy className="w-3.5 h-3.5" /> : name.charAt(0)}
                        </div>
                        <span className={`text-sm font-semibold ${dropGrade(avg)}`}>
                          {name}
                          {isTop && <span className="text-[9px] text-amber-500 ml-1">#1</span>}
                        </span>
                      </div>
                    </td>
                    {(['practical', 'theory', 'project', 'participation'] as const).map(cat => {
                      const avgCat = catAvg(g, cat);
                      return (
                        <td key={cat} className="px-4 py-3 text-center">
                          <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedStudent(s); }}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border
                              ${avgCat >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                avgCat >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                avgCat >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-600 border-red-200'}`}>
                            {Math.round(avgCat)}
                          </button>
                          <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden max-w-[40px] mx-auto">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${avgCat}%` }}
                              className={`h-full rounded-full ${avgCat >= 80 ? 'bg-emerald-400' : avgCat >= 60 ? 'bg-blue-400' : avgCat >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                          </div>
                        </td>
                      );
                    })}
                    <td className={`px-4 py-3 text-center font-display font-bold text-sm ${dropGrade(avg)}`}>{avg}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${lg.color}`}>
                        {lg.star && <Star className="w-3 h-3 fill-emerald-500" />}{lg.grade}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-brand-border-light/40 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            {searchQuery && ` (matching "${searchQuery}")`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (() => {
          const s = selectedStudent;
          const g = getGrade(s.id);
          const avg = weightedAverage(g);
          const lg = letterGrade(avg);
          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
          return (
            <>
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedStudent(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
              <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                        ${avg === maxAvg && avg > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600'}`}>
                        {avg === maxAvg && avg > 0 ? <Trophy className="w-5 h-5" /> : name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lg.color}`}>{lg.grade}</span>
                          <span className="text-xs text-slate-500">{avg}% average</span>
                          {avg < passThreshold && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Failing</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Category breakdown */}
                    {(['practical', 'theory', 'project', 'participation'] as const).map(cat => {
                      const catScores = g[cat].scores;
                      const avgCat = catAvg(g, cat);
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700 capitalize">{CATEGORY_LABELS[cat]} ({Math.round(weights[cat] * 100)}%)</span>
                            <span className="text-xs font-bold text-slate-500">{Math.round(avgCat)} avg</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {catScores.map((score: number, si: number) => (
                              <div key={si} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <input type="number" min={0} max={100} value={score}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScore(s.id, cat, si, Number(e.target.value))}
                                  className={`w-12 text-center text-xs font-bold bg-transparent border-none focus:outline-none p-0
                                    ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'}`} />
                                <button onClick={() => removeSubScore(s.id, cat, si)}
                                  className="text-slate-300 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                            {catScores.length < CATEGORY_MAX_SUB && (
                              <button onClick={() => addSubScore(s.id, cat)}
                                className="text-[10px] font-bold text-brand-blue hover:bg-brand-blue/10 px-3 py-1.5 rounded-lg border border-dashed border-brand-blue-bright/30 transition-colors">
                                + Add
                              </button>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${avgCat}%` }}
                              className={`h-full rounded-full ${avgCat >= 80 ? 'bg-emerald-400' : avgCat >= 60 ? 'bg-blue-400' : avgCat >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                          </div>
                        </div>
                      );
                    })}

                    {/* Comment */}
                    <div>
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" /> Comment
                      </label>
                      <textarea value={g.comments} onChange={e => setComment(s.id, e.target.value)}
                        placeholder="Add feedback or notes for this student..."
                        rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-brand-blue-bright" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-xs text-slate-400">Weighted Score</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-900">{avg}%</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lg.color}`}>{lg.grade}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Weights Settings Modal */}
      <AnimatePresence>
        {showWeightsModal && (
          <>
            <motion.div key="w-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWeightsModal(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div key="w-modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</h3>
                  <button onClick={() => setShowWeightsModal(false)} className="p-1 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-2 block">Passing Threshold</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={30} max={90} value={passThreshold} onChange={e => setPassThreshold(Number(e.target.value))} className="flex-1" />
                      <span className="text-sm font-bold text-slate-800 w-10 text-right">{passThreshold}%</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-600 mb-3">Grade Weights</p>
                    {(Object.keys(DEFAULT_WEIGHTS) as Array<keyof typeof DEFAULT_WEIGHTS>).map(cat => (
                      <div key={cat} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{CATEGORY_LABELS[cat]}</span>
                          <span className="text-xs font-bold text-slate-800">{Math.round(weights[cat] * 100)}%</span>
                        </div>
                        <input type="range" min={0} max={100} value={Math.round(weights[cat] * 100)}
                          onChange={e => setWeights(prev => ({ ...prev, [cat]: Number(e.target.value) / 100 }))}
                          className="w-full" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowWeightsModal(false)} className="text-xs font-medium text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100">Done</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <>
            <motion.div key="h-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div key="h-modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2"><History className="w-4 h-4" /> Grade History</h3>
                  <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4">
                  <div className="flex items-end justify-between gap-1 h-28 mb-4">
                    {history.map((h, i) => {
                      const maxH = Math.max(...history.map(x => x.avg));
                      const ht = maxH > 0 ? (h.avg / maxH) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] font-bold text-slate-500">{h.avg}%</span>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${ht}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className={`w-full rounded-t ${h.avg >= 80 ? 'bg-emerald-400' : h.avg >= 60 ? 'bg-blue-400' : 'bg-amber-400'}`} />
                          <span className="text-[8px] text-slate-400 truncate w-full text-center">{h.date}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    {[...history].reverse().slice(0, 10).map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-slate-500">{h.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{h.avg}%</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${h.avg >= 80 ? 'bg-emerald-100 text-emerald-700' : h.avg >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{h.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
