import React, { useState } from 'react';
import { Edit3, CheckCircle2, Search, FileText, Clock, Eye, ChevronDown, Star } from 'lucide-react';
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

// Richer mock data for each student's progress
const STUDENT_PROGRESS: Record<number, { skills: number; projects: number; grade: string; lastActive: string }> = {
  1: { skills: 85, projects: 12, grade: 'A', lastActive: '2 hours ago' },
  2: { skills: 72, projects: 8, grade: 'B+', lastActive: '1 day ago' },
  3: { skills: 90, projects: 14, grade: 'A+', lastActive: '30 min ago' },
  4: { skills: 45, projects: 3, grade: 'C+', lastActive: '3 days ago' },
  5: { skills: 68, projects: 7, grade: 'B', lastActive: '5 hours ago' },
};

export default function ProgressSubmissions({
  progressSearch, onProgressSearchChange, filteredForProgress,
  assignments, onConfirmAssignment,
}: Props) {
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Student Progress Table */}
      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border-light/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Student Progress Overview</h3>
            <p className="font-sans text-xs text-slate-500 mt-1">Track individual student performance and skill completion</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search students..." value={progressSearch}
              onChange={e => onProgressSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-brand-border-light rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills Completed</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {filteredForProgress.map((s, idx) => {
                const prog = STUDENT_PROGRESS[s.id] || { skills: 50, projects: 5, grade: 'B', lastActive: 'Unknown' };
                const isExpanded = expandedStudent === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedStudent(isExpanded ? null : s.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-purple-200 flex items-center justify-center font-bold text-xs text-[#2563EB]">
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-sans text-sm font-semibold text-slate-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${prog.skills}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className={`h-full rounded-full ${
                                prog.skills >= 80 ? 'bg-emerald-500' : prog.skills >= 60 ? 'bg-[#2563EB]' : 'bg-amber-500'
                              }`}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-600 w-8 text-right">{prog.skills}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-display font-bold text-sm text-slate-800">{prog.projects}</span>
                        <span className="text-xs text-slate-400 ml-0.5">done</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-3 py-1 rounded-full ${
                          prog.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          prog.grade.startsWith('B') ? 'bg-blue-50 text-[#2563EB] border border-blue-200' :
                          'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {prog.grade.startsWith('A') && <Star className="w-3 h-3 fill-emerald-500" />}
                          {prog.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-sans text-xs">{prog.lastActive}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#2563EB] transition-colors">
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
                          <td colSpan={6} className="px-6 py-4 bg-slate-50/50">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-2">Skill Breakdown</p>
                                {['Mechanical Assembly', 'Programming Logic', 'Sensor Integration'].map((skill, si) => (
                                  <div key={si} className="flex items-center justify-between mb-2 last:mb-0">
                                    <span className="text-[11px] text-slate-600">{skill}</span>
                                    <span className="font-mono text-[10px] font-bold text-slate-800">{Math.max(30, prog.skills - si * 12)}%</span>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-2">Recent Submissions</p>
                                {['PID Controller Demo', 'Line Follower v2', 'Obstacle Course'].map((sub, si) => (
                                  <div key={si} className="flex items-center gap-2 mb-2 last:mb-0">
                                    <FileText className="w-3 h-3 text-[#2563EB]" />
                                    <span className="text-[11px] text-slate-600">{sub}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                                <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-2">Actions</p>
                                <button className="w-full bg-[#2563EB] text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 mb-2">
                                  <Eye className="w-3.5 h-3.5" /> View Full Report
                                </button>
                                <button className="w-full bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5" /> Edit Scores
                                </button>
                              </div>
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

      {/* Assignment Submissions Card */}
      <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border-light/40">
          <h3 className="font-display font-bold text-lg text-slate-900">Assignment Submissions</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Review and approve student project submissions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-brand-border-light/40">
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-center font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light/30">
              {assignments.map((a, i) => (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={`transition-colors ${a.confirmed ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}
                >
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
                      <span className="text-xs text-slate-400">Reviewed</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onConfirmAssignment(a.id)}
                          className="text-[11px] font-bold px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
                        >
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
      </div>
    </div>
  );
}
