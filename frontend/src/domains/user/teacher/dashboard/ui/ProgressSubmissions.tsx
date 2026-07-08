import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle2, Search, FileText, Clock, Eye, ChevronDown, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchStudentProgressApi, fetchMilestonesApi } from '@/src/domains/learning/academics/api/academicApi';

interface Props {
  students: any[];
  enrollments: any[];
}

export default function ProgressSubmissions({ students, enrollments }: Props) {
  const [progressSearch, setProgressSearch] = useState('');
  const [progressMap, setProgressMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (enrollments.length === 0) { setLoading(false); return; }
    setLoading(true);
    Promise.all(enrollments.map(e => fetchStudentProgressApi(e.id)))
      .then(results => {
        const map: Record<string, any[]> = {};
        enrollments.forEach((e, i) => { map[e.student] = Array.isArray(results[i]) ? results[i] : []; });
        setProgressMap(map);
      }).finally(() => setLoading(false));
  }, [enrollments]);

  const filtered = progressSearch.trim()
    ? students.filter(s =>
        `${s.first_name || ''} ${s.last_name || ''} ${s.email || ''}`.toLowerCase().includes(progressSearch.toLowerCase())
      )
    : students;

  const getProgress = (studentId: string) => progressMap[studentId] || [];
  const completedCount = (studentId: string) => getProgress(studentId).filter(p => p.status === 'COMPLETED').length;
  const totalCount = (studentId: string) => getProgress(studentId).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border-light/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Student Progress Overview</h3>
            <p className="font-sans text-xs text-slate-500 mt-1">Track individual student performance and skill completion</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search students..." value={progressSearch}
              onChange={e => setProgressSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-brand-border-light rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestones</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">No students found.</td></tr>
              ) : filtered.map((s, idx) => {
                const total = totalCount(s.id);
                const completed = completedCount(s.id);
                const isExpanded = expandedStudent === s.id;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                return (
                  <React.Fragment key={s.id}>
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedStudent(isExpanded ? null : s.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-purple-200 flex items-center justify-center font-bold text-xs text-[#2563EB]">
                            {name.charAt(0)}
                          </div>
                          <span className="font-sans text-sm font-semibold text-slate-800">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-display font-bold text-sm text-slate-800">{total}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[#2563EB]' : 'bg-amber-500'}`} />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-bold text-amber-600">{total - completed} pending</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#2563EB] transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <td colSpan={5} className="px-6 py-4 bg-slate-50/50">
                            <div className="space-y-2">
                              {getProgress(s.id).length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No progress records yet</p>
                              ) : getProgress(s.id).map((p, pi) => (
                                <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : p.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                    <span className="text-[13px] font-medium text-slate-700">{p.milestone_title || 'Milestone'}</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                    p.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                  }`}>{p.status.replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
