import React, { useState } from 'react';
import { ClipboardList, Plus, Clock, BookOpen, CheckCircle2, Circle, Trash2 } from 'lucide-react';
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
  { id: 2, title: 'Sensor Calibration Lab', track: 'VEX IQ', date: 'Tue, Jun 17', duration: '1.5h', status: 'in-progress', topics: ['Gyroscope Calibration', 'Ultrasonic Ranging', 'Color Sensor Thresholds'] },
  { id: 3, title: 'Autonomous Navigation Basics', track: 'Enjoy AI', date: 'Wed, Jun 18', duration: '2h', status: 'planned', topics: ['Line Following', 'Obstacle Detection', 'Path Planning'] },
  { id: 4, title: 'Mechanical Design Review', track: 'VEX V5', date: 'Thu, Jun 19', duration: '1h', status: 'planned', topics: ['Gear Ratios', 'Structural Integrity', 'Weight Distribution'] },
];

const statusStyles = {
  'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle2, label: 'Completed' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-[#2563EB]', border: 'border-blue-200', icon: Clock, label: 'In Progress' },
  'planned': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: Circle, label: 'Planned' },
};

export default function LessonPlanner() {
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTrack, setNewTrack] = useState('VEX V5');

  const addLesson = () => {
    if (!newTitle.trim()) return;
    setLessons(prev => [...prev, {
      id: Date.now(), title: newTitle.trim(), track: newTrack,
      date: 'TBD', duration: '1h', status: 'planned', topics: []
    }]);
    setNewTitle('');
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Lesson Planner</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Organize and track your upcoming sessions</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Lesson title..."
                className="flex-1 bg-slate-50 border border-brand-border-light rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]" />
              <select value={newTrack} onChange={e => setNewTrack(e.target.value)}
                className="bg-slate-50 border border-brand-border-light rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#2563EB]">
                <option>VEX V5</option><option>VEX IQ</option><option>Enjoy AI</option>
              </select>
              <button onClick={addLesson} className="bg-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">Save</button>
              <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-lg">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {lessons.map((lesson, i) => {
          const s = statusStyles[lesson.status];
          return (
            <motion.div key={lesson.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-900">{lesson.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-[10px] font-bold bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded border border-blue-100">{lesson.track}</span>
                      <span className="text-xs text-slate-400">{lesson.date}</span>
                      <span className="text-xs text-slate-400">· {lesson.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cycleStatus(lesson.id)}
                    className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.border} hover:opacity-80 transition-opacity cursor-pointer`}>
                    <s.icon className="w-3 h-3" /> {s.label}
                  </button>
                  <button onClick={() => removeLesson(lesson.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {lesson.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-[52px]">
                  {lesson.topics.map((t, ti) => (
                    <span key={ti} className="text-[10px] font-medium bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">{t}</span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
