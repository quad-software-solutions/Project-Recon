import React, { useState } from 'react';
import { Edit3, CheckCircle2, Search, FileText, Clock, Eye, ChevronDown, Star, X, Filter, AlertCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Student { id: number; name: string; }
interface Assignment { id: number; student: string; assign: string; confirmed: boolean; }

interface Props {
  progressSearch: string;
  onProgressSearchChange: (q: string) => void;
  filteredForProgress: Student[];
  assignments: Assignment[];
  onConfirmAssignment: (id: number) => void;
}

const STUDENT_PROGRESS: Record<number, { skills: number; projects: number; grade: string; lastActive: string; quizzes: number; attendance: number }> = {
  1: { skills: 85, projects: 12, grade: 'A', lastActive: '2 hours ago', quizzes: 92, attendance: 95 },
  2: { skills: 72, projects: 8, grade: 'B+', lastActive: '1 day ago', quizzes: 78, attendance: 88 },
  3: { skills: 90, projects: 14, grade: 'A+', lastActive: '30 min ago', quizzes: 96, attendance: 100 },
  4: { skills: 45, projects: 3, grade: 'C+', lastActive: '3 days ago', quizzes: 52, attendance: 65 },
  5: { skills: 68, projects: 7, grade: 'B', lastActive: '5 hours ago', quizzes: 71, attendance: 82 },
};

const SUBMISSION_HISTORY: Record<number, { name: string; score: number; date: string }[]> = {
  1: [
    { name: 'PID Controller Demo', score: 94, date: 'Today' },
    { name: 'Line Follower v2', score: 88, date: '3 days ago' },
    { name: 'Obstacle Course', score: 91, date: '1 week ago' },
  ],
  2: [
    { name: 'Sensor Calibration', score: 75, date: '2 days ago' },
    { name: 'Basic Movement', score: 80, date: '1 week ago' },
  ],
  3: [
    { name: 'Autonomous Navigation', score: 97, date: '1 day ago' },
    { name: 'Mechanical Design', score: 93, date: '4 days ago' },
    { name: 'Team Challenge', score: 95, date: '2 weeks ago' },
  ],
  4: [
    { name: 'Intro to Programming', score: 55, date: '1 week ago' },
  ],
  5: [
    { name: 'Gear Ratio Lab', score: 72, date: '5 days ago' },
    { name: 'Structural Analysis', score: 68, date: '2 weeks ago' },
  ],
};

const gradeColor = (g: string) => {
  if (g.startsWith('A')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (g.startsWith('B')) return 'bg-blue-50 text-blue-600 border-blue-200';
  if (g.startsWith('C')) return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
};

export default function ProgressSubmissions({
  progressSearch, onProgressSearchChange, filteredForProgress,
  assignments, onConfirmAssignment,
}: Props) {
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = filteredForProgress.filter(s => {
    if (gradeFilter === 'all') return true;
    const prog = STUDENT_PROGRESS[s.id];
    if (!prog) return false;
    if (gradeFilter === 'A') return prog.grade.startsWith('A');
    if (gradeFilter === 'B') return prog.grade.startsWith('B');
    if (gradeFilter === 'C') return prog.grade.startsWith('C');
    return true;
  });

  const exportProgress = () => {
    const csv = [
      ['Student', 'Skills %', 'Projects', 'Quizzes %', 'Attendance %', 'Grade', 'Last Active'],
      ...filtered.map(s => {
        const p = STUDENT_PROGRESS[s.id] || { skills: 0, projects: 0, grade: '-', lastActive: '-', quizzes: 0, attendance: 0 };
        return [s.name, `${p.skills}%`, String(p.projects), `${p.quizzes}%`, `${p.attendance}%`, p.grade, p.lastActive];
      }),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `student-progress.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Student Progress</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Track individual student performance and skill completion</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={exportProgress} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">Grade</span>
              {['all', 'A', 'B', 'C'].map(g => (
                <button key={g} onClick={() => setGradeFilter(g)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all capitalize ${gradeFilter === g ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{g === 'all' ? 'All' : g}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Avg Skills', value: `${Math.round(Object.values(STUDENT_PROGRESS).reduce((a, b) => a + b.skills, 0) / Object.values(STUDENT_PROGRESS).length)}%`, icon: Star, color: 'text-[#2563EB]', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Total Projects', value: String(Object.values(STUDENT_PROGRESS).reduce((a, b) => a + b.projects, 0)), icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'Avg Quizzes', value: `${Math.round(Object.values(STUDENT_PROGRESS).reduce((a, b) => a + b.quizzes, 0) / Object.values(STUDENT_PROGRESS).length)}%`, icon: Edit3, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Pending', value: String(assignments.filter(a => !a.confirmed).length), icon: Clock, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${stat.border} flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="font-display font-extrabold text-lg text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Student Progress Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-display font-bold text-lg text-slate-900">Progress Overview</h3>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search students..." value={progressSearch}
              onChange={e => onProgressSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Projects</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Quizzes</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Attendance</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Last Active</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s, idx) => {
                const prog = STUDENT_PROGRESS[s.id] || { skills: 0, projects: 0, grade: '-', lastActive: '-', quizzes: 0, attendance: 0 };
                const isExpanded = expandedStudent === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <motion.tr
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`}
                      onClick={() => setExpandedStudent(isExpanded ? null : s.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-200 flex items-center justify-center font-bold text-xs text-blue-600">
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-sans text-sm font-semibold text-slate-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${prog.skills}%` }} transition={{ duration: 0.6, delay: idx * 0.08 }}
                              className={`h-full rounded-full ${prog.skills >= 80 ? 'bg-emerald-500' : prog.skills >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 w-8 text-right">{prog.skills}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <span className="font-display font-bold text-sm text-slate-800">{prog.projects}</span>
                        <span className="text-[10px] text-slate-400 ml-0.5">done</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className={`font-mono text-xs font-bold ${prog.quizzes >= 80 ? 'text-emerald-600' : prog.quizzes >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{prog.quizzes}%</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <span className={`font-mono text-xs font-bold ${prog.attendance >= 90 ? 'text-emerald-600' : prog.attendance >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{prog.attendance}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-3 py-1 rounded-full border ${gradeColor(prog.grade)}`}>
                          {prog.grade.startsWith('A') && <Star className="w-3 h-3 fill-emerald-500" />}
                          {prog.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-sans text-xs">{prog.lastActive}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={8} className="px-6 py-4 bg-slate-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-2">Skill Breakdown</p>
                                {['Mechanical Assembly', 'Programming Logic', 'Sensor Integration'].map((skill, si) => (
                                  <div key={si} className="flex items-center justify-between mb-2 last:mb-0">
                                    <span className="text-[11px] text-slate-600">{skill}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${Math.max(30, prog.skills - si * 12) >= 70 ? 'bg-emerald-500' : Math.max(30, prog.skills - si * 12) >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                          style={{ width: `${Math.max(30, prog.skills - si * 12)}%` }} />
                                      </div>
                                      <span className="font-mono text-[10px] font-bold text-slate-600 w-8 text-right">{Math.max(30, prog.skills - si * 12)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-2">Recent Submissions</p>
                                {(SUBMISSION_HISTORY[s.id] || []).map((sub, si) => (
                                  <div key={si} className="flex items-center justify-between mb-2 last:mb-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                                      <span className="text-[11px] text-slate-600 truncate">{sub.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`text-[10px] font-bold ${sub.score >= 90 ? 'text-emerald-600' : sub.score >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>{sub.score}%</span>
                                      <span className="text-[9px] text-slate-400">{sub.date}</span>
                                    </div>
                                  </div>
                                ))}
                                {(!SUBMISSION_HISTORY[s.id] || SUBMISSION_HISTORY[s.id].length === 0) && (
                                  <p className="text-[11px] text-slate-400">No submissions yet</p>
                                )}
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-2">Quick Actions</p>
                                <div className="space-y-2">
                                  <button className="w-full bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                                    <Eye className="w-3.5 h-3.5" /> View Full Report
                                  </button>
                                  <button className="w-full bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-200">
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Scores
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">No students match this filter.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Submissions */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-900">Assignment Submissions</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Review and approve student project submissions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assignments.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
                  <p className="text-sm font-medium text-slate-400">All caught up! No pending submissions.</p>
                </td></tr>
              )}
              {assignments.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className={`transition-colors ${a.confirmed ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{a.student.charAt(0)}</div>
                      <span className="font-sans text-sm font-semibold text-slate-800">{a.student}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">{a.assign}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {a.confirmed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.confirmed ? (
                      <span className="text-xs text-slate-400 font-medium">Reviewed</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onConfirmAssignment(a.id)}
                          className="text-[11px] font-bold px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 hover:bg-emerald-600 transition-colors shadow-sm active:scale-95">
                          Approve
                        </button>
                        <button className="text-[11px] font-bold px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200">
                          Review
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {assignments.filter(a => !a.confirmed).length > 0 && (
          <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{assignments.filter(a => !a.confirmed).length} submission{assignments.filter(a => !a.confirmed).length !== 1 ? 's' : ''} awaiting review</span>
          </div>
        )}
      </div>
    </div>
  );
}
