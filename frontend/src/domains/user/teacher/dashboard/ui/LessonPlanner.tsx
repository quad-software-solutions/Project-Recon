import React, { useState } from 'react';
import { ClipboardList, Plus, Clock, BookOpen, CheckCircle2, Circle, Trash2, GripVertical, Calendar, ChevronDown, Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LessonItem {
  id: number;
  title: string;
  track: string;
  date: string;
  duration: string;
  status: 'planned' | 'in-progress' | 'completed';
  topics: string[];
}

const INITIAL_LESSONS: LessonItem[] = [
  { id: 1, title: 'Introduction to PID Controllers', track: 'VEX V5', date: 'Mon, Jun 16', duration: '2h', status: 'completed', topics: ['Proportional Control', 'Integral Tuning', 'Derivative Dampening'] },
  { id: 2, title: 'Sensor Calibration Lab', track: 'VEX IQ', date: 'Mon, Jun 16', duration: '1.5h', status: 'in-progress', topics: ['Gyroscope Calibration', 'Ultrasonic Ranging', 'Color Sensor Thresholds'] },
  { id: 3, title: 'Autonomous Navigation Basics', track: 'Enjoy AI', date: 'Tue, Jun 17', duration: '2h', status: 'planned', topics: ['Line Following', 'Obstacle Detection', 'Path Planning'] },
  { id: 4, title: 'Mechanical Design Review', track: 'VEX V5', date: 'Tue, Jun 17', duration: '1h', status: 'planned', topics: ['Gear Ratios', 'Structural Integrity', 'Weight Distribution'] },
  { id: 5, title: 'Team Building Challenge', track: 'VEX IQ', date: 'Wed, Jun 18', duration: '2h', status: 'planned', topics: ['Collaboration', 'Problem Solving'] },
  { id: 6, title: 'Programming Logic Fundamentals', track: 'Enjoy AI', date: 'Wed, Jun 18', duration: '1.5h', status: 'planned', topics: ['Variables', 'Loops', 'Conditionals'] },
];

const TRACKS = ['VEX V5', 'VEX IQ', 'Enjoy AI', 'STEM'];

const statusStyles = {
  'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle2, label: 'Completed' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Clock, label: 'In Progress' },
  'planned': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: Circle, label: 'Planned' },
};

function groupByDate(lessons: LessonItem[]): { date: string; lessons: LessonItem[] }[] {
  const map = new Map<string, LessonItem[]>();
  const dateOrder = ['Mon, Jun 16', 'Tue, Jun 17', 'Wed, Jun 18', 'Thu, Jun 19', 'Fri, Jun 20'];
  lessons.forEach(l => {
    if (!map.has(l.date)) map.set(l.date, []);
    map.get(l.date)!.push(l);
  });
  return dateOrder.filter(d => map.has(d)).map(d => ({ date: d, lessons: map.get(d)! }));
}

const TOPIC_SUGGESTIONS = ['Proportional Control', 'Sensor Calibration', 'Line Following', 'Gear Ratios', 'PID Tuning', 'Autonomous Mode', 'Mechanical Design', 'Team Collaboration', 'Debugging', 'Documentation'];

export default function LessonPlanner() {
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTrack, setNewTrack] = useState('VEX V5');
  const [newDuration, setNewDuration] = useState('1h');
  const [newTopics, setNewTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set(['Mon, Jun 16']));

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  const addLesson = () => {
    if (!newTitle.trim()) return;
    setLessons(prev => [...prev, {
      id: Date.now(), title: newTitle.trim(), track: newTrack,
      date: 'Fri, Jun 20', duration: newDuration, status: 'planned', topics: newTopics,
    }]);
    setNewTitle('');
    setNewTopics([]);
    setTopicInput('');
    setShowAdd(false);
  };

  const cycleStatus = (id: number) => {
    const order: LessonItem['status'][] = ['planned', 'in-progress', 'completed'];
    setLessons(prev => prev.map(l => {
      if (l.id !== id) return l;
      const idx = order.indexOf(l.status);
      return { ...l, status: order[(idx + 1) % order.length] };
    }));
  };

  const removeLesson = (id: number) => setLessons(prev => prev.filter(l => l.id !== id));

  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !newTopics.includes(t)) setNewTopics(prev => [...prev, t]);
    setTopicInput('');
  };

  const removeTopic = (t: string) => setNewTopics(prev => prev.filter(x => x !== t));

  const moveLesson = (id: number, direction: 'up' | 'down') => {
    setLessons(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const filteredLessons = lessons.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchTerm && !l.title.toLowerCase().includes(searchTerm.toLowerCase()) && !l.topics.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    return true;
  });

  const grouped = groupByDate(filteredLessons);

  const counts = {
    total: lessons.length,
    completed: lessons.filter(l => l.status === 'completed').length,
    inProgress: lessons.filter(l => l.status === 'in-progress').length,
    planned: lessons.filter(l => l.status === 'planned').length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Lesson Planner</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Organize and track your upcoming sessions</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Lessons', value: counts.total, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Completed', value: counts.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'In Progress', value: counts.inProgress, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Planned', value: counts.planned, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${stat.border} flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <ClipboardList className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="font-display font-extrabold text-lg text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search lessons or topics..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/30 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500/30">
          <option value="all">All Status</option>
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Add Lesson Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lesson Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Introduction to Gear Ratios"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Track</label>
                  <select value={newTrack} onChange={e => setNewTrack(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500">
                    {TRACKS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
                  <select value={newDuration} onChange={e => setNewDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500">
                    <option>30m</option><option>1h</option><option>1.5h</option><option>2h</option><option>2.5h</option><option>3h</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Topics</label>
                <div className="flex gap-2 mb-2">
                  <input value={topicInput} onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                    placeholder="Type a topic and press Enter"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                {newTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newTopics.map(t => (
                      <span key={t} className="flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">
                        {t}
                        <button onClick={() => removeTopic(t)} className="hover:text-blue-800"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_SUGGESTIONS.filter(t => !newTopics.includes(t)).slice(0, 5).map(t => (
                    <button key={t} onClick={() => { setNewTopics(prev => [...prev, t]); }}
                      className="text-[9px] font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-200 transition-colors">
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => { setShowAdd(false); setNewTopics([]); setTopicInput(''); }}
                  className="text-xs text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg">Cancel</button>
                <button onClick={addLesson}
                  className="bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-lg hover:bg-blue-600">Save Lesson</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson List Grouped by Date */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-400">No lessons found.</p>
        </div>
      ) : (
        grouped.map(group => {
          const isExpanded = expandedDates.has(group.date);
          return (
            <div key={group.date} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <button onClick={() => toggleDateExpand(group.date)}
                className="w-full px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-mono text-[11px] font-bold text-slate-600 uppercase tracking-wider">{group.date}</span>
                  <span className="font-mono text-[10px] text-slate-400 ml-1">({group.lessons.length} lesson{group.lessons.length !== 1 ? 's' : ''})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="divide-y divide-slate-50">
                      {group.lessons.map((lesson, i) => {
                        const s = statusStyles[lesson.status];
                        return (
                          <motion.div key={lesson.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="p-5 hover:bg-slate-50/50 transition-all group">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <button className="mt-1.5 p-0.5 rounded text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                  <ClipboardList className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-sans font-bold text-sm text-slate-900">{lesson.title}</h4>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{lesson.track}</span>
                                    <span className="text-xs text-slate-400">{lesson.duration}</span>
                                  </div>
                                  {lesson.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {lesson.topics.map((t, ti) => (
                                        <span key={ti} className="text-[9px] font-medium bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">{t}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                <button onClick={() => cycleStatus(lesson.id)}
                                  className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.border} hover:opacity-80 transition-opacity cursor-pointer`}>
                                  <s.icon className="w-3 h-3" /> {s.label}
                                </button>
                                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveLesson(lesson.id, 'up')} className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"><ChevronDown className="w-3 h-3 rotate-180" /></button>
                                  <button onClick={() => moveLesson(lesson.id, 'down')} className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"><ChevronDown className="w-3 h-3" /></button>
                                </div>
                                <button onClick={() => removeLesson(lesson.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}
