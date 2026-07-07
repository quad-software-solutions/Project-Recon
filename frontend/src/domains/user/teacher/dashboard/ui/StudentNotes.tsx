import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: number;
  studentName: string;
  content: string;
  date: string;
  tag: 'positive' | 'concern' | 'general';
}

const TAG_STYLES = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Positive' },
  concern: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Concern' },
  general: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'General' },
};

const INITIAL_NOTES: Note[] = [
  { id: 1, studentName: 'Abebe B.', content: 'Excellent progress on the VEX V5 autonomous routine. Recommended for regional competition team captain.', date: 'Jun 14, 2026', tag: 'positive' },
  { id: 2, studentName: 'Skelos K.', content: 'Struggling with gear ratio calculations. Schedule extra 1-on-1 session next week.', date: 'Jun 13, 2026', tag: 'concern' },
  { id: 3, studentName: 'Radiom J.', content: 'Showed strong teamwork during the group build challenge. Natural mentor to younger students.', date: 'Jun 12, 2026', tag: 'positive' },
  { id: 4, studentName: 'Abebe L.', content: 'New student — requires orientation on lab safety protocols before handling power tools.', date: 'Jun 11, 2026', tag: 'general' },
];

export default function StudentNotes() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<Note['tag']>('general');
  const [filterTag, setFilterTag] = useState<Note['tag'] | 'all'>('all');

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

  const filtered = filterTag === 'all' ? notes : notes.filter(n => n.tag === filterTag);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Student Notes</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Private observations and recommendations for each student</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'positive', 'concern', 'general'] as const).map(tag => (
          <button key={tag} onClick={() => setFilterTag(tag)}
            className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-colors capitalize ${
              filterTag === tag ? 'bg-[#2563EB] text-slate-900' : 'bg-white text-slate-600 border border-brand-border-light hover:bg-slate-50'
            }`}>{tag}</button>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-5 space-y-3">
              <div className="flex gap-3">
                <input value={newStudent} onChange={e => setNewStudent(e.target.value)} placeholder="Student name..."
                  className="flex-1 bg-slate-50 border border-brand-border-light rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]" />
                <select value={newTag} onChange={e => setNewTag(e.target.value as Note['tag'])}
                  className="bg-slate-50 border border-brand-border-light rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#2563EB]">
                  <option value="general">General</option>
                  <option value="positive">Positive</option>
                  <option value="concern">Concern</option>
                </select>
              </div>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your note..." rows={3}
                className="w-full bg-slate-50 border border-brand-border-light rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#2563EB]" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg">Cancel</button>
                <button onClick={addNote} className="bg-[#2563EB] text-white font-bold text-xs px-5 py-2 rounded-lg hover:bg-blue-700">Save Note</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((note, i) => {
          const t = TAG_STYLES[note.tag];
          return (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">{note.studentName.charAt(0)}</div>
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
                  <button onClick={() => removeNote(note.id)} className="p-1 rounded text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-sans text-xs text-slate-600 leading-relaxed">{note.content}</p>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No notes match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
