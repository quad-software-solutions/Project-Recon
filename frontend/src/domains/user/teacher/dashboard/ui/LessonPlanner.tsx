import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Clock, CheckCircle2, Circle, Trash2,
  Search, Filter, Calendar, BookOpen, Target, TrendingUp,
  X, Edit3, Save, Loader2, ChevronDown, ChevronUp, Copy,
  Flag, AlertTriangle, MessageSquare,
  Download, LayoutGrid, List, GripVertical, CalendarDays,
  BarChart3, Eye, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubTask {
  id: number;
  title: string;
  done: boolean;
}

interface LessonItem {
  id: number;
  title: string;
  description: string;
  track: string;
  date: string;
  duration: string;
  status: 'planned' | 'in-progress' | 'completed';
  topics: string[];
  priority: 'low' | 'medium' | 'high';
  subTasks: SubTask[];
}

const TRACKS = ['VEX V5', 'VEX IQ', 'Enjoy AI'];
const TRACK_COLORS: Record<string, string> = {
  'VEX V5': 'text-blue-600 bg-blue-50 border-blue-200',
  'VEX IQ': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Enjoy AI': 'text-purple-600 bg-purple-50 border-purple-200',
};
const TRACK_BG: Record<string, string> = {
  'VEX V5': 'bg-blue-500',
  'VEX IQ': 'bg-emerald-500',
  'Enjoy AI': 'bg-purple-500',
};

const INITIAL_LESSONS: LessonItem[] = [
  { id: 1, title: 'Introduction to PID Controllers', description: 'Cover fundamental PID control theory with practical robot arm exercises.', track: 'VEX V5', date: 'Mon, Jun 16', duration: '2h', status: 'completed', topics: ['Proportional Control', 'Integral Tuning', 'Derivative Dampening'], priority: 'high', subTasks: [{ id: 101, title: 'Watch intro video', done: true }, { id: 102, title: 'Build test rig', done: true }, { id: 103, title: 'Run calibration', done: true }] },
  { id: 2, title: 'Sensor Calibration Lab', description: 'Hands-on calibration of gyroscope, ultrasonic, and color sensors.', track: 'VEX IQ', date: 'Tue, Jun 17', duration: '1.5h', status: 'in-progress', topics: ['Gyroscope Calibration', 'Ultrasonic Ranging', 'Color Sensor Thresholds'], priority: 'high', subTasks: [{ id: 201, title: 'Review sensor docs', done: true }, { id: 202, title: 'Calibrate gyro', done: false }, { id: 203, title: 'Test range finder', done: false }] },
  { id: 3, title: 'Autonomous Navigation Basics', description: 'Introduce line following, obstacle detection, and path planning.', track: 'Enjoy AI', date: 'Wed, Jun 18', duration: '2h', status: 'planned', topics: ['Line Following', 'Obstacle Detection', 'Path Planning'], priority: 'medium', subTasks: [{ id: 301, title: 'Prepare maze', done: false }, { id: 302, title: 'Write path algorithm', done: false }] },
  { id: 4, title: 'Mechanical Design Review', description: 'Review gear ratios, structural integrity, and weight distribution principles.', track: 'VEX V5', date: 'Thu, Jun 19', duration: '1h', status: 'planned', topics: ['Gear Ratios', 'Structural Integrity', 'Weight Distribution'], priority: 'low', subTasks: [] },
];

const statusStyles = {
  'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle2, label: 'Completed', dot: 'bg-emerald-500', bar: 'bg-emerald-400' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Clock, label: 'In Progress', dot: 'bg-blue-500', bar: 'bg-blue-400' },
  'planned': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: Circle, label: 'Planned', dot: 'bg-slate-400', bar: 'bg-slate-300' },
};

const PRIORITY_STYLES = {
  high: { icon: Flag, color: 'text-red-500', bg: 'bg-red-50', label: 'High' },
  medium: { icon: Flag, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Medium' },
  low: { icon: Flag, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Low' },
};

export default function LessonPlanner() {
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTrack, setNewTrack] = useState('VEX V5');
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState('1h');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [newTopics, setNewTopics] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [newSubTaskInput, setNewSubTaskInput] = useState('');

  const addLesson = () => {
    if (!newTitle.trim()) return;
    setLessons(prev => [...prev, {
      id: Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      track: newTrack,
      date: newDate || 'TBD',
      duration: newDuration,
      status: 'planned',
      topics: [...newTopics],
      priority: newPriority,
      subTasks: [],
    }]);
    setNewTitle(''); setNewDesc(''); setNewDate(''); setNewDuration('1h');
    setNewPriority('medium'); setNewTopics([]); setNewTopicInput('');
    setShowAdd(false);
  };

  const addTopic = () => {
    const t = newTopicInput.trim();
    if (t && !newTopics.includes(t)) { setNewTopics(prev => [...prev, t]); setNewTopicInput(''); }
  };

  const removeNewTopic = (topic: string) => setNewTopics(prev => prev.filter(t => t !== topic));

  const cycleStatus = (id: number) => {
    const order: LessonItem['status'][] = ['planned', 'in-progress', 'completed'];
    setLessons(prev => prev.map(l => {
      if (l.id !== id) return l;
      const idx = order.indexOf(l.status);
      return { ...l, status: order[(idx + 1) % order.length] };
    }));
  };

  const removeLesson = (id: number) => setLessons(prev => prev.filter(l => l.id !== id));

  const duplicateLesson = (lesson: LessonItem) => {
    setLessons(prev => [...prev, { ...lesson, id: Date.now(), title: `${lesson.title} (copy)`, status: 'planned' }]);
  };

  const startEdit = (lesson: LessonItem) => { setEditingId(lesson.id); setEditTitle(lesson.title); };

  const saveEdit = (id: number) => {
    if (!editTitle.trim()) return;
    setLessons(prev => prev.map(l => l.id === id ? { ...l, title: editTitle.trim() } : l));
    setEditingId(null);
  };

  const toggleSubTask = (lessonId: number, subTaskId: number) => {
    setLessons(prev => prev.map(l =>
      l.id !== lessonId ? l : {
        ...l, subTasks: l.subTasks.map(st => st.id === subTaskId ? { ...st, done: !st.done } : st)
      }
    ));
  };

  const addSubTask = (lessonId: number) => {
    if (!newSubTaskInput.trim()) return;
    setLessons(prev => prev.map(l =>
      l.id !== lessonId ? l : {
        ...l, subTasks: [...l.subTasks, { id: Date.now(), title: newSubTaskInput.trim(), done: false }]
      }
    ));
    setNewSubTaskInput('');
  };

  const removeSubTask = (lessonId: number, subTaskId: number) => {
    setLessons(prev => prev.map(l =>
      l.id !== lessonId ? l : { ...l, subTasks: l.subTasks.filter(st => st.id !== subTaskId) }
    ));
  };

  const moveLesson = (id: number, direction: 'up' | 'down') => {
    setLessons(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1);
      if (newIdx === idx) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const exportLessons = () => {
    const lines = lessons.map(l =>
      `[${l.status.toUpperCase()}] ${l.title}\n  Track: ${l.track} | Date: ${l.date} | Duration: ${l.duration} | Priority: ${l.priority}\n  Topics: ${l.topics.join(', ')}\n  ${l.description || '—'}`
    );
    const text = `Lesson Planner Export — ${new Date().toLocaleDateString()}\n${'='.repeat(50)}\n\n${lines.join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lessons_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.track.toLowerCase().includes(search.toLowerCase()) || l.topics.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesTrack = filterTrack === 'all' || l.track === filterTrack;
      const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || l.priority === filterPriority;
      return matchesSearch && matchesTrack && matchesStatus && matchesPriority;
    });
  }, [lessons, search, filterTrack, filterStatus, filterPriority]);

  const sorted = useMemo(() => {
    const order = { 'planned': 0, 'in-progress': 1, 'completed': 2 };
    return [...filtered].sort((a, b) => order[a.status] - order[b.status]);
  }, [filtered]);

  const stats = useMemo(() => ({
    total: lessons.length,
    completed: lessons.filter(l => l.status === 'completed').length,
    inProgress: lessons.filter(l => l.status === 'in-progress').length,
    planned: lessons.filter(l => l.status === 'planned').length,
    highPriority: lessons.filter(l => l.priority === 'high' && l.status !== 'completed').length,
    completionRate: lessons.length > 0 ? Math.round((lessons.filter(l => l.status === 'completed').length / lessons.length) * 100) : 0,
    vexV5: lessons.filter(l => l.track === 'VEX V5').length,
    vexIq: lessons.filter(l => l.track === 'VEX IQ').length,
    enjoyAi: lessons.filter(l => l.track === 'Enjoy AI').length,
  }), [lessons]);

  const trackCompletion = useMemo(() => {
    const tracks = ['VEX V5', 'VEX IQ', 'Enjoy AI'];
    return tracks.map(t => {
      const trackLessons = lessons.filter(l => l.track === t);
      const completed = trackLessons.filter(l => l.status === 'completed').length;
      return { track: t, total: trackLessons.length, completed, rate: trackLessons.length > 0 ? Math.round((completed / trackLessons.length) * 100) : 0 };
    });
  }, [lessons]);

  const kanbanColumns = [
    { id: 'planned', label: 'Planned', icon: Circle, lessons: sorted.filter(l => l.status === 'planned'), color: 'border-slate-300', headerBg: 'bg-slate-100' },
    { id: 'in-progress', label: 'In Progress', icon: Clock, lessons: sorted.filter(l => l.status === 'in-progress'), color: 'border-blue-300', headerBg: 'bg-blue-50' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, lessons: sorted.filter(l => l.status === 'completed'), color: 'border-emerald-300', headerBg: 'bg-emerald-50' },
  ];

  // Calendar view data
  const calendarWeeks = useMemo(() => {
    const weekMap: Record<string, LessonItem[]> = {};
    sorted.forEach(l => {
      if (l.date === 'TBD') {
        if (!weekMap['Unscheduled']) weekMap['Unscheduled'] = [];
        weekMap['Unscheduled'].push(l);
        return;
      }
      weekMap[l.date] = [...(weekMap[l.date] || []), l];
    });
    return Object.entries(weekMap);
  }, [sorted]);

  const cancelAdd = () => {
    setShowAdd(false);
    setNewTitle(''); setNewDesc(''); setNewDate(''); setNewDuration('1h');
    setNewPriority('medium'); setNewTopics([]); setNewTopicInput('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {([
          { label: 'Total', value: stats.total, icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Planned', value: stats.planned, icon: Target, color: 'text-slate-500', bg: 'bg-slate-100' },
          { label: 'Active', value: stats.inProgress, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Done', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'High Priority', value: stats.highPriority, icon: Flag, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Rate', value: `${stats.completionRate}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
        ] as const).map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-slate-200 rounded-xl p-3 text-center hover:shadow-sm transition-shadow">
              <Icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <p className="font-black text-xl text-slate-900 leading-none">{s.value}</p>
              <p className="text-[9px] font-medium text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Track Progress Bars ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {trackCompletion.map(tc => (
          <div key={tc.track} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-700">{tc.track}</span>
              <span className="text-[10px] text-slate-500">{tc.completed}/{tc.total}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${tc.rate}%` }} transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${TRACK_BG[tc.track] || 'bg-slate-400'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Header + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Lesson Planner</h3>
          <p className="text-sm text-slate-500 mt-0.5">Organize and track your upcoming sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportLessons} disabled={lessons.length === 0}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-brand-red text-white font-black text-xs px-5 py-2.5 rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-1.5 shadow-lg shadow-brand-red/20 active:scale-95">
            <Plus className="w-4 h-4" /> New Lesson
          </button>
        </div>
      </div>

      {/* ── Add Lesson Form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-brand-red" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">New Lesson</h4>
              </div>
              <div className="flex flex-col gap-3">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Lesson title..." autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-red/40 focus:bg-white transition-all" />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Lesson description (optional)..."
                  rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs resize-none focus:outline-none focus:border-brand-red/40" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <select value={newTrack} onChange={e => setNewTrack(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-brand-red/40">
                    {TRACKS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as typeof newPriority)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-brand-red/40">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input type="text" value={newDate} onChange={e => setNewDate(e.target.value)}
                    placeholder="Date (e.g. Fri, Jun 20)"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-brand-red/40" />
                  <select value={newDuration} onChange={e => setNewDuration(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-brand-red/40">
                    {['30m', '1h', '1.5h', '2h', '2.5h', '3h'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                {/* Topics */}
                <div>
                  <div className="flex gap-2">
                    <input value={newTopicInput} onChange={e => setNewTopicInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
                      placeholder="Add a topic..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-red/40" />
                    <button onClick={addTopic} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Add</button>
                  </div>
                  {newTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {newTopics.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {t} <button onClick={() => removeNewTopic(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={addLesson} disabled={!newTitle.trim()}
                    className="px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-bold hover:bg-brand-red-dark disabled:opacity-50 transition-all">Save Lesson</button>
                  <button onClick={cancelAdd} className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters + View Toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search lessons, topics..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red/40 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-brand-red/40">
            <option value="all">All Tracks</option>
            {TRACKS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-brand-red/40">
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-brand-red/40">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-2">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No lessons match your filters</p>
            </div>
          ) : sorted.map((lesson, i) => {
            const s = statusStyles[lesson.status];
            const isEditing = editingId === lesson.id;
            const pStyle = PRIORITY_STYLES[lesson.priority];
            const PIcon = pStyle.icon;
            const subDone = lesson.subTasks.filter(st => st.done).length;
            const subTotal = lesson.subTasks.length;
            const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
            return (
              <motion.div key={lesson.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 mt-0.5">
                    <button onClick={() => cycleStatus(lesson.id)}
                      className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0 hover:scale-110 transition-transform`} title="Cycle status">
                      <s.icon className={`w-5 h-5 ${s.text}`} />
                    </button>
                    <button onClick={() => moveLesson(lesson.id, 'up')} className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100"><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={() => moveLesson(lesson.id, 'down')} className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100"><ChevronDown className="w-3 h-3" /></button>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedLesson(lesson)}>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          autoFocus className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm font-semibold focus:outline-none focus:border-brand-red/40" />
                        <button onClick={(e) => { e.stopPropagation(); saveEdit(lesson.id); }} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{lesson.title}</h4>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(lesson); }} className="p-0.5 text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 className="w-3 h-3" /></button>
                      </div>
                    )}
                    {lesson.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot} mr-1 align-middle`} />{s.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TRACK_COLORS[lesson.track] || 'bg-slate-100 text-slate-600'}`}>{lesson.track}</span>
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${pStyle.bg} ${pStyle.color}`}>
                        <PIcon className="w-2.5 h-2.5" /> {pStyle.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{lesson.date}</span>
                      <span className="text-[10px] text-slate-400">· {lesson.duration}</span>
                      {subTotal > 0 && (
                        <span className="text-[10px] text-slate-500">{subDone}/{subTotal} tasks</span>
                      )}
                    </div>
                    {lesson.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {lesson.topics.map((t, ti) => (
                          <span key={ti} className="text-[9px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                    {subTotal > 0 && (
                      <div className="w-32 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${subPct}%` }} className={`h-full rounded-full ${s.bar}`} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); duplicateLesson(lesson); }} className="p-1.5 rounded-lg text-slate-300 hover:text-brand-blue hover:bg-brand-blue/10 transition-all opacity-0 group-hover:opacity-100" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeLesson(lesson.id); }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Kanban View ── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map(col => {
            const ColIcon = col.icon;
            return (
              <div key={col.id} className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
                <div className={`${col.headerBg} px-4 py-3 border-b border-slate-200 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-4 h-4 text-slate-600" />
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{col.label}</h4>
                  </div>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-500">{col.lessons.length}</span>
                </div>
                <div className="p-3 flex flex-col gap-2 min-h-[200px]">
                  {col.lessons.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-[10px] font-medium py-8">No lessons</div>
                  ) : col.lessons.map((lesson, i) => {
                    const trackColor = TRACK_COLORS[lesson.track] || 'bg-slate-100 text-slate-600';
                    const pStyle = PRIORITY_STYLES[lesson.priority];
                    const PIcon = pStyle.icon;
                    return (
                      <motion.div key={lesson.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer"
                        onClick={() => setSelectedLesson(lesson)}>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-xs text-slate-900 leading-snug flex items-center gap-1">
                            {lesson.priority === 'high' && <PIcon className="w-3 h-3 text-red-500 shrink-0" />}
                            {lesson.title}
                          </h5>
                          <button onClick={(e) => { e.stopPropagation(); removeLesson(lesson.id); }} className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${trackColor}`}>{lesson.track}</span>
                          <span className="text-[8px] text-slate-400">{lesson.date}</span>
                          <span className="text-[8px] text-slate-400">{lesson.duration}</span>
                        </div>
                        {lesson.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {lesson.topics.slice(0, 3).map((t, ti) => (
                              <span key={ti} className="text-[8px] text-slate-500 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded">{t}</span>
                            ))}
                            {lesson.topics.length > 3 && <span className="text-[8px] text-slate-400">+{lesson.topics.length - 3}</span>}
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); cycleStatus(lesson.id); }}
                          className="mt-2 w-full py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                          Move →
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <div className="flex flex-col gap-4">
          {calendarWeeks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No scheduled lessons</p>
            </div>
          ) : calendarWeeks.map(([date, dayLessons]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <h4 className="font-bold text-sm text-slate-800">{date}</h4>
                <span className="text-[10px] text-slate-400">({dayLessons.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                {dayLessons.map(lesson => {
                  const s = statusStyles[lesson.status];
                  return (
                    <div key={lesson.id} onClick={() => setSelectedLesson(lesson)}
                      className="bg-white border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-sm hover:border-slate-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <s.icon className={`w-3.5 h-3.5 ${s.text}`} />
                          <span className="text-xs font-bold text-slate-900">{lesson.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${TRACK_COLORS[lesson.track] || 'bg-slate-100 text-slate-600'}`}>{lesson.track}</span>
                        <span className="text-[9px] text-slate-400">{lesson.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lesson Detail Modal ── */}
      <AnimatePresence>
        {selectedLesson && (() => {
          const lesson = selectedLesson;
          const s = statusStyles[lesson.status];
          const pStyle = PRIORITY_STYLES[lesson.priority];
          const PIcon = pStyle.icon;
          const subDone = lesson.subTasks.filter(st => st.done).length;
          const subTotal = lesson.subTasks.length;
          const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
          return (
            <>
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLesson(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
              <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="sticky top-0 bg-white z-10 flex items-start justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`w-5 h-5 ${s.text}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{lesson.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className={`font-bold px-1.5 py-0.5 rounded ${TRACK_COLORS[lesson.track] || 'bg-slate-100 text-slate-600'}`}>{lesson.track}</span>
                          <span>{lesson.date} · {lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedLesson(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Status + Priority */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => { cycleStatus(lesson.id); setSelectedLesson({ ...lesson, status: (lesson.status === 'planned' ? 'in-progress' : lesson.status === 'in-progress' ? 'completed' : 'planned') }); }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${s.bg} ${s.text} ${s.border} hover:scale-105 transition-transform`}>
                        <s.icon className="w-3.5 h-3.5 inline mr-1" />{s.label} → Click to cycle
                      </button>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${pStyle.bg} ${pStyle.color}`}>
                        <PIcon className="w-3 h-3" /> {pStyle.label}
                      </span>
                    </div>

                    {/* Description */}
                    {lesson.description && (
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Description
                        </p>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-600 leading-relaxed">{lesson.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Topics */}
                    {lesson.topics.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Topics ({lesson.topics.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {lesson.topics.map((t, ti) => (
                            <span key={ti} className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sub-tasks */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sub-tasks {subTotal > 0 && `(${subDone}/${subTotal})`}
                        </p>
                      </div>
                      {subTotal > 0 && (
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${subPct}%` }} className={`h-full rounded-full ${s.bar}`} />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {lesson.subTasks.map(st => (
                          <div key={st.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <button onClick={() => { toggleSubTask(lesson.id, st.id); setSelectedLesson({ ...lesson, subTasks: lesson.subTasks.map(x => x.id === st.id ? { ...x, done: !x.done } : x) }); }}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${st.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-slate-400'}`}>
                              {st.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </button>
                            <span className={`text-xs flex-1 ${st.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{st.title}</span>
                            <button onClick={() => { removeSubTask(lesson.id, st.id); setSelectedLesson({ ...lesson, subTasks: lesson.subTasks.filter(x => x.id !== st.id) }); }}
                              className="text-slate-300 hover:text-red-500 opacity-0 hover:opacity-100"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <input value={newSubTaskInput} onChange={e => setNewSubTaskInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubTask(lesson.id); setNewSubTaskInput(''); } }}
                            placeholder="Add sub-task..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-red/40" />
                          <button onClick={() => { addSubTask(lesson.id); setNewSubTaskInput(''); }}
                            className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-bold hover:bg-brand-blue-bright">Add</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={() => { removeLesson(lesson.id); setSelectedLesson(null); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Lesson
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { duplicateLesson(lesson); }}
                        className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </button>
                      <span className="text-[9px] text-slate-400">ID: {lesson.id}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
