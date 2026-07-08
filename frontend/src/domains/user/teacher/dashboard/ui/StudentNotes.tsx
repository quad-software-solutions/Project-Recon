import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, Clock, Search, Filter, MessageSquare, Download, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: number;
  studentName: string;
  content: string;
  date: string;
  tag: 'positive' | 'concern' | 'general';
}

const TAG_STYLES = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Positive', icon: CheckCircle2 },
  concern: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Concern', icon: AlertCircle },
  general: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'General', icon: MessageSquare },
};

const INITIAL_NOTES: Note[] = [
  { id: 1, studentName: 'Abebe B.', content: 'Excellent progress on the VEX V5 autonomous routine. Recommended for regional competition team captain.', date: 'Jun 14, 2026', tag: 'positive' },
  { id: 2, studentName: 'Skelos K.', content: 'Struggling with gear ratio calculations. Schedule extra 1-on-1 session next week.', date: 'Jun 13, 2026', tag: 'concern' },
  { id: 3, studentName: 'Radiom J.', content: 'Showed strong teamwork during the group build challenge. Natural mentor to younger students.', date: 'Jun 12, 2026', tag: 'positive' },
  { id: 4, studentName: 'Abebe L.', content: 'New student — requires orientation on lab safety protocols before handling power tools.', date: 'Jun 11, 2026', tag: 'general' },
  { id: 5, studentName: 'Dr. Elias T.', content: 'Completed advanced sensor integration module ahead of schedule.', date: 'Jun 10, 2026', tag: 'positive' },
  { id: 6, studentName: 'Skelos K.', content: 'Showed improvement in today\'s programming session. Understood loop concepts.', date: 'Jun 9, 2026', tag: 'general' },
];

const STUDENT_NAMES = ['Abebe B.', 'Abebe L.', 'Radiom J.', 'Skelos K.', 'Dr. Elias T.', 'Meron T.', 'Yonas D.'];

export default function StudentNotes() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<Note['tag']>('general');
  const [filterTag, setFilterTag] = useState<Note['tag'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const addNote = () => {
    if (!newStudent.trim() || !newContent.trim()) return;
    setNotes(prev => [{
      id: Date.now(), studentName: newStudent.trim(), content: newContent.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      tag: newTag
    }, ...prev]);
    setNewStudent('');
    setNewContent('');
    setShowAdd(false);
  };

  const removeNote = (id: number) => setNotes(prev => prev.filter(n => n.id !== id));

  const filtered = notes
    .filter(n => filterTag === 'all' || n.tag === filterTag)
    .filter(n => n.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortOrder === 'newest'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime());

  const exportNotes = () => {
    const csv = [
      ['Student', 'Tag', 'Note', 'Date'],
      ...filtered.map(n => [n.studentName, n.tag, n.content, n.date]),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `student-notes.csv`;
    a.click();
  };

  const tagCounts = {
    all: notes.length,
    positive: notes.filter(n => n.tag === 'positive').length,
    concern: notes.filter(n => n.tag === 'concern').length,
    general: notes.filter(n => n.tag === 'general').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Student Notes</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Private observations and recommendations for each student</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportNotes} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Add Note
          </button>
        </div>
      </div>

      {/* Tag Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: 'All Notes', value: tagCounts.all, tag: 'all', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Positive', value: tagCounts.positive, tag: 'positive', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Concern', value: tagCounts.concern, tag: 'concern', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'General', value: tagCounts.general, tag: 'general', color: 'text-slate-600', bg: 'bg-slate-100' },
        ] as const).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all ${filterTag === stat.tag ? 'ring-2 ring-blue-500/20' : ''}`}
            onClick={() => setFilterTag(stat.tag as Note['tag'] | 'all')}>
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <StickyNote className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`font-display font-extrabold text-lg ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search notes by student or content..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/30 transition-all" />
        </div>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500/30">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
              <div className="relative">
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Student</label>
                <input value={newStudent} onChange={e => { setNewStudent(e.target.value); setShowStudentDropdown(true); }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Type student name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                {showStudentDropdown && newStudent && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {STUDENT_NAMES.filter(s => s.toLowerCase().includes(newStudent.toLowerCase())).map(s => (
                      <button key={s} onClick={() => { setNewStudent(s); setShowStudentDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{s}</button>
                    ))}
                    {STUDENT_NAMES.filter(s => s.toLowerCase().includes(newStudent.toLowerCase())).length === 0 && (
                      <div className="px-4 py-2 text-sm text-slate-400">No matching students</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tag</label>
                <select value={newTag} onChange={e => setNewTag(e.target.value as Note['tag'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500">
                  <option value="general">General</option>
                  <option value="positive">Positive</option>
                  <option value="concern">Concern</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Note</label>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your observation..."
                  rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => { setShowAdd(false); setShowStudentDropdown(false); }}
                  className="text-xs text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg">Cancel</button>
                <button onClick={addNote}
                  className="bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-lg hover:bg-blue-600">Save Note</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((note, i) => {
          const t = TAG_STYLES[note.tag];
          return (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${t.bg} flex items-center justify-center`}>
                    <t.icon className={`w-4 h-4 ${t.text}`} />
                  </div>
                  <div>
                    <span className="font-sans text-sm font-bold text-slate-900">{note.studentName}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="font-mono text-[10px] text-slate-400">{note.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border ${t.bg} ${t.text} ${t.border}`}>{t.label}</span>
                  <button onClick={() => removeNote(note.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-sans text-xs text-slate-600 leading-relaxed">{note.content}</p>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No notes match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertCircle(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
