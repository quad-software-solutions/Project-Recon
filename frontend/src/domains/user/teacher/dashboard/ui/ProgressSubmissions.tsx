import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Search, Clock, ChevronDown, Loader2, RotateCcw, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchStudentProgressApi, updateStudentProgressApi } from '@/domains/learning/academics/api/academicApi';

import { StudentProfile, Enrollment, StudentProgress, ProgressStatus } from '@/shared/types';

interface Props {
  students: StudentProfile[];
  enrollments: Enrollment[];
}

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-blue-50 text-blue-600',
  COMPLETED: 'bg-emerald-50 text-emerald-600',
};

export default function ProgressSubmissions({ students, enrollments }: Props) {
  const [progressSearch, setProgressSearch] = useState('');
  const [progressMap, setProgressMap] = useState<Record<string, StudentProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    if (enrollments.length === 0) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      const map: Record<string, StudentProgress[]> = {};
      const chunkSize = 3;
      for (let i = 0; i < enrollments.length; i += chunkSize) {
        const chunk = enrollments.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(e => fetchStudentProgressApi(e.id)));
        chunk.forEach((e, j) => { map[e.id] = Array.isArray(chunkResults[j]) ? chunkResults[j] : []; });
      }
      setProgressMap(map);
    })().catch(() => setProgressMap({})).finally(() => setLoading(false));
  }, [enrollments]);

  const updateStatus = async (progressId: string, newStatus: ProgressStatus) => {
    setUpdating(progressId);
    try {
      await updateStudentProgressApi(progressId, { status: newStatus });
      setProgressMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          next[key] = next[key].map(p => p.id === progressId ? { ...p, status: newStatus as ProgressStatus } : p);
        });
        return next;
      });
    } catch (e) {
      console.error('Failed to update progress', e);
    } finally {
      setUpdating(null);
    }
  };

  const allProgressEntries: StudentProgress[] = useMemo(() => {
    const entries: StudentProgress[] = [];
    const vals: StudentProgress[][] = Object.values(progressMap);
    vals.forEach((arr: StudentProgress[]) => entries.push(...arr));
    return entries;
  }, [progressMap]);

  const stats = useMemo(() => {
    const total = allProgressEntries.length;
    const completed = allProgressEntries.filter(p => p.status === 'COMPLETED').length;
    const inProgress = allProgressEntries.filter(p => p.status === 'IN_PROGRESS').length;
    const notStarted = allProgressEntries.filter(p => p.status === 'NOT_STARTED').length;
    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      inProgressRate: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      notStartedRate: total > 0 ? Math.round((notStarted / total) * 100) : 0,
    };
  }, [allProgressEntries]);

  const enrollmentRows = enrollments.map(e => {
    const student = students.find(s => s.id === e.student);
    const name = e.student_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || student?.email || 'Student';
    return { enrollmentId: e.id, studentId: e.student, name, email: student?.email || '' };
  });

  const filtered = enrollmentRows.filter(row => {
    if (progressSearch.trim()) {
      const q = progressSearch.toLowerCase();
      if (!row.name.toLowerCase().includes(q) && !row.email.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all') {
      const prog = progressMap[row.enrollmentId] || [];
      const hasWithStatus = prog.some(p => p.status === statusFilter);
      if (!hasWithStatus) return false;
    }
    return true;
  });

  const getProgress = (enrollmentId: string) => progressMap[enrollmentId] || [];
  const completedCount = (enrollmentId: string) => getProgress(enrollmentId).filter(p => p.status === 'COMPLETED').length;
  const inProgressCount = (enrollmentId: string) => getProgress(enrollmentId).filter(p => p.status === 'IN_PROGRESS').length;
  const totalCount = (enrollmentId: string) => getProgress(enrollmentId).length;

  const nextStatus = (current: string) => {
    if (current === 'NOT_STARTED') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'COMPLETED';
    return 'COMPLETED';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Stats Overview */}
      {allProgressEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-[10px] text-slate-500">milestones</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-[10px] text-slate-500">{stats.completionRate}% rate</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">In Progress</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.inProgressRate}%` }} className="h-full bg-blue-400 rounded-full" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Not Started</span>
            </div>
            <p className="text-xl font-bold text-slate-600">{stats.notStarted}</p>
            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.notStartedRate}%` }} className="h-full bg-slate-400 rounded-full" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border-light/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Student Progress Overview</h3>
            <p className="font-sans text-xs text-slate-500 mt-1">Track and update individual student milestone progress</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search students..." value={progressSearch}
                onChange={e => setProgressSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-brand-border-light rounded-xl text-sm focus:outline-none focus:border-brand-blue-bright focus:ring-2 focus:ring-brand-blue-bright/10 transition-all"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-bright">
              <option value="all">All Stages</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestones</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">No students found.</td></tr>
              ) : filtered.map((row, idx) => {
                const total = totalCount(row.enrollmentId);
                const completed = completedCount(row.enrollmentId);
                const inProg = inProgressCount(row.enrollmentId);
                const pending = total - completed - inProg;
                const isExpanded = expandedStudent === row.enrollmentId;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const name = row.name;
                return (
                  <React.Fragment key={row.enrollmentId}>
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedStudent(isExpanded ? null : row.enrollmentId)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue-bright/20 to-purple-200 flex items-center justify-center font-bold text-xs text-brand-blue-bright">
                            {name.charAt(0)}
                          </div>
                          <span className="font-sans text-sm font-semibold text-slate-800">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-display font-bold text-sm text-slate-800">{total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-bold text-emerald-600">{completed}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs font-bold text-blue-600">{inProg}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-blue-bright' : 'bg-amber-500'}`} />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-blue-bright transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <td colSpan={6} className="px-6 py-4 bg-slate-50/50">
                            <div className="space-y-2">
                              {getProgress(row.enrollmentId).length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No progress records yet</p>
                              ) : getProgress(row.enrollmentId).map((p, pi) => (
                                <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : p.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                    <span className="text-[13px] font-medium text-slate-700">{p.milestone_title || 'Milestone'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] || ''}`}>
                                      {p.status.replace('_', ' ')}
                                    </span>
                                    {p.status !== 'COMPLETED' && (
                                      <button onClick={() => updateStatus(p.id, nextStatus(p.status))}
                                        disabled={updating === p.id}
                                        className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {updating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                        {p.status === 'NOT_STARTED' ? 'Start' : 'Complete'}
                                      </button>
                                    )}
                                  </div>
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

        {enrollmentRows.length > 0 && (
          <div className="px-6 py-3 border-t border-brand-border-light/40 flex items-center justify-between text-[10px] text-slate-400">
            <span>{filtered.length} enrollment{filtered.length !== 1 ? 's' : ''} shown</span>
            <span>Class progress: {stats.completionRate}% complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
