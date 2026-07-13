import React, { useState, useEffect, useMemo } from 'react';
import {
  StickyNote, Plus, Trash2, Clock, Search, X, Edit3, Save, Pin, PinOff, Download,
  Users, Tag, Filter, SortAsc, CalendarDays, ChevronDown, Eye, Star, AlertCircle,
  BookOpen, BrainCircuit, Award, MessageSquare, CheckSquare, Square, Flag, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: number;
  studentName: string;
  content: string;
  date: string;
  tags: string[];
  pinned: boolean;
  followUp?: string;
  category?: string;
}

const TAG_OPTIONS = [
  { value: 'positive', label: 'Positive', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: Star },
  { value: 'concern', label: 'Concern', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: AlertCircle },
  { value: 'general', label: 'General', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: MessageSquare },
  { value: 'achievement', label: 'Achievement', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Award },
  { value: 'behavior', label: 'Behavior', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: BrainCircuit },
  { value: 'academic', label: 'Academic', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: BookOpen },
];

const TAG_MAP: Record<string, typeof TAG_OPTIONS[0]> = {};
TAG_OPTIONS.forEach(t => { TAG_MAP[t.value] = t; });

const STORAGE_KEY = 'teacher_notes';
const DATE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(notes: Note[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {} 
}

const defaultTags = ['general'];

export default function StudentNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStudent, setNewStudent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>(defaultTags);
  const [newFollowUp, setNewFollowUp] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'student'>('newest');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => { setNotes(loadNotes()); }, []);

  useEffect(() => { saveNotes(notes); }, [notes]);

  const existingStudents = useMemo(() => {
    return [...new Set(notes.map(n => n.studentName))].sort();
  }, [notes]);

  const filteredSuggestions = newStudent.trim()
    ? existingStudents.filter(s => s.toLowerCase().includes(newStudent.toLowerCase()) && s.toLowerCase() !== newStudent.toLowerCase())
    : [];

  const addNote = () => {
    if (!newStudent.trim() || !newContent.trim()) return;
    const note: Note = {
      id: Date.now(),
      studentName: newStudent.trim(),
      content: newContent.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      tags: newTags.length > 0 ? newTags : defaultTags,
      pinned: false,
      followUp: newFollowUp || undefined,
    };
    setNotes(prev => [note, ...prev]);
    setNewStudent('');
    setNewContent('');
    setNewTags(defaultTags);
    setNewFollowUp('');
    setShowAdd(false);
  };

  const removeNote = (id: number) => setNotes(prev => prev.filter(n => n.id !== id));

  const removeSelected = () => {
    setNotes(prev => prev.filter(n => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const togglePin = (id: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditTags([...note.tags]);
  };

  const saveEdit = (id: number) => {
    if (!editContent.trim()) return;
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, content: editContent.trim(), tags: editTags.length > 0 ? editTags : defaultTags } : n
    ));
    setEditingId(null);
    setEditContent('');
  };

  const exportNotes = () => {
    const lines = filtered.map(n =>
      `[${n.tags.map(t => TAG_MAP[t]?.label || t).join(', ')}]${n.pinned ? ' ★' : ''}\nStudent: ${n.studentName}\nDate: ${n.date}${n.followUp ? `\nFollow-up: ${n.followUp}` : ''}\n${n.content}\n---`
    );
    const text = lines.join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `notes_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    let result = [...notes];

    if (filterTags.length > 0) {
      result = result.filter(n => filterTags.some(t => n.tags.includes(t)));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.studentName.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.includes(q))
      );
    }

    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(n => {
        const noteDate = new Date(n.date);
        return !isNaN(noteDate.getTime()) && noteDate >= cutoff;
      });
    }

    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'student') return a.studentName.localeCompare(b.studentName);
      return 0;
    });

    return result;
  }, [notes, filterTags, searchQuery, dateFilter, sortBy]);

  const groupedByStudent = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    filtered.forEach(n => {
      if (!groups[n.studentName]) groups[n.studentName] = [];
      groups[n.studentName].push(n);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Stats
  const studentsWithNotes = new Set(notes.map(n => n.studentName)).size;
  const notesThisWeek = notes.filter(n => {
    const d = new Date(n.date);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return !isNaN(d.getTime()) && d >= weekAgo;
  }).length;
  const pinnedCount = notes.filter(n => n.pinned).length;

  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    notes.forEach(n => n.tags.forEach(t => { stats[t] = (stats[t] || 0) + 1; }));
    return stats;
  }, [notes]);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <StickyNote className="w-4 h-4 text-brand-blue" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{notes.length}</p>
          <p className="text-[10px] text-slate-500">notes saved</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Students</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{studentsWithNotes}</p>
          <p className="text-[10px] text-slate-500">with notes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">This Week</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{notesThisWeek}</p>
          <p className="text-[10px] text-slate-500">new notes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Pin className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pinned</span>
          </div>
          <p className="text-xl font-bold text-purple-600">{pinnedCount}</p>
          <p className="text-[10px] text-slate-500">important</p>
        </div>
      </div>

      {/* Tag Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {TAG_OPTIONS.map(t => {
          const TIcon = t.icon;
          const isActive = filterTags.includes(t.value);
          const count = tagStats[t.value] || 0;
          return (
            <button key={t.value} onClick={() => toggleFilterTag(t.value)}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors
                ${isActive ? `${t.bg} ${t.text} ${t.border}` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              <TIcon className="w-3 h-3" />
              {t.label}
              <span className="ml-0.5 opacity-60">({count})</span>
              {isActive && <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); toggleFilterTag(t.value); }} />}
            </button>
          );
        })}
        {filterTags.length > 0 && (
          <button onClick={() => setFilterTags([])}
            className="text-[10px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1">
            Clear all
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes by student, content, or tag..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue-bright" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-bright">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="student">By Student</option>
        </select>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-bright">
          {DATE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${viewMode === 'grid' ? 'bg-brand-blue text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            Grid
          </button>
          <button onClick={() => setViewMode('grouped')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${viewMode === 'grouped' ? 'bg-brand-blue text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            By Student
          </button>
        </div>
        <button onClick={exportNotes} disabled={filtered.length === 0}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); setSelectMode(false); }}
          className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>

      {/* Bulk Actions */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <span className="text-xs text-red-700 font-medium">{selectedIds.size} selected</span>
          <button onClick={removeSelected} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
          <button onClick={() => { setSelectedIds(new Set()); setSelectMode(false); }} className="text-xs text-slate-500 hover:text-slate-700 px-2">
            Cancel
          </button>
        </div>
      )}

      {/* Add Note Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-5 space-y-3">
              <div className="relative">
                <input value={newStudent} onChange={e => { setNewStudent(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Student name..."
                  className="w-full bg-slate-50 border border-brand-border-light rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-blue-bright" />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-32 overflow-y-auto">
                    {filteredSuggestions.map(s => (
                      <button key={s} onMouseDown={() => { setNewStudent(s); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map(t => {
                  const TIcon = t.icon;
                  const isSelected = newTags.includes(t.value);
                  return (
                    <button key={t.value} onClick={() => setNewTags(prev =>
                      prev.includes(t.value) ? prev.filter(v => v !== t.value) : [...prev, t.value]
                    )}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors
                        ${isSelected ? `${t.bg} ${t.text} ${t.border}` : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                      <TIcon className="w-3 h-3" /> {t.label}
                    </button>
                  );
                })}
              </div>

              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your note..." rows={3}
                className="w-full bg-slate-50 border border-brand-border-light rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-blue-bright" />

              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="date" value={newFollowUp} onChange={e => setNewFollowUp(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-blue-bright" />
                <span className="text-[10px] text-slate-400">Optional follow-up</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">{newContent.length}/500</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg">Cancel</button>
                  <button onClick={addNote} disabled={!newStudent.trim() || !newContent.trim()}
                    className="bg-blue-600 text-white font-bold text-xs px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Note</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filtered.length === 0 && !showAdd && (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-base font-semibold text-slate-500 mb-1">
            {searchQuery || filterTags.length > 0 ? 'No matching notes' : 'No notes yet'}
          </p>
          <p className="text-xs text-slate-400">
            {searchQuery || filterTags.length > 0
              ? 'Try adjusting your search or filters.'
              : 'Click "Add Note" to start tracking student observations.'}
          </p>
        </div>
      )}

      {/* Notes Display: Grid View */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note, i) => {
            const isEditing = editingId === note.id;
            const isSelected = selectedIds.has(note.id);
            return (
              <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all group
                  ${note.pinned ? 'border-amber-200 shadow-amber-100/50 ring-1 ring-amber-200/50' : 'border-brand-border-light/60 hover:shadow-md'}
                  ${isSelected ? 'ring-2 ring-brand-blue-bright' : ''}
                  ${note.followUp ? 'border-l-4 border-l-blue-400' : ''}
                  relative cursor-pointer`}
                onClick={() => setSelectedNote(note)}
              >
                {/* Select checkbox */}
                {selectMode && (
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(note.id); }}
                    className="absolute top-3 left-3 z-10">
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-brand-blue" />
                      : <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />}
                  </button>
                )}

                {/* Pin badge */}
                <div className={`absolute top-3 right-3 flex items-center gap-1 ${selectMode ? 'right-10' : ''}`}>
                  <button onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                    className={`p-1 rounded transition-colors ${note.pinned ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                    {note.pinned ? <Pin className="w-3.5 h-3.5 fill-amber-400" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className={`flex items-start justify-between mb-3 ${selectMode ? 'ml-7' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                      ${note.pinned ? 'bg-amber-100 text-amber-600' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'}`}>
                      {note.studentName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-sans text-sm font-bold text-slate-900">{note.studentName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-[10px] text-slate-400">{note.date}</span>
                        {note.followUp && (
                          <span className="flex items-center gap-0.5 text-[9px] text-brand-blue font-medium">
                            <Flag className="w-2.5 h-2.5" /> {note.followUp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.map(t => {
                    const ts = TAG_MAP[t];
                    if (!ts) return null;
                    const TIcon = ts.icon;
                    return (
                      <span key={t} className={`inline-flex items-center gap-0.5 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${ts.bg} ${ts.text} ${ts.border}`}>
                        <TIcon className="w-2.5 h-2.5" /> {ts.label}
                      </span>
                    );
                  })}
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {TAG_OPTIONS.map(t => {
                        const isSel = editTags.includes(t.value);
                        return (
                          <button key={t.value} onClick={() => setEditTags(prev =>
                            prev.includes(t.value) ? prev.filter(v => v !== t.value) : [...prev, t.value]
                          )}
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${isSel ? `${t.bg} ${t.text} ${t.border}` : 'bg-white text-slate-400 border-slate-200'}`}>
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3}
                      className="w-full bg-slate-50 border border-blue-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-brand-blue-bright" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="text-[10px] text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg">Cancel</button>
                      <button onClick={() => saveEdit(note.id)} disabled={!editContent.trim()}
                        className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-sans text-xs text-slate-600 leading-relaxed line-clamp-3">{note.content}</p>
                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => startEdit(note)} className="p-1 rounded text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeNote(note.id)} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setSelectedNote(note)} className="p-1 rounded text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors ml-auto">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Notes Display: Grouped by Student */}
      {viewMode === 'grouped' && filtered.length > 0 && (
        <div className="space-y-6">
          {groupedByStudent.map(([student, studentNotes]) => (
            <div key={student}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue/20 to-purple-200 flex items-center justify-center font-bold text-xs text-brand-blue">
                  {student.charAt(0)}
                </div>
                <h3 className="font-bold text-base text-slate-900">{student}</h3>
                <span className="text-[10px] text-slate-400">({studentNotes.length} note{studentNotes.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="space-y-2 ml-10">
                {studentNotes.map(note => (
                  <div key={note.id}
                    className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all group
                      ${note.pinned ? 'border-amber-200' : 'border-slate-200'}`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {note.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-400" />}
                        <span className="text-[10px] text-slate-500">{note.date}</span>
                        <div className="flex gap-1">
                          {note.tags.map(t => {
                            const ts = TAG_MAP[t];
                            if (!ts) return null;
                            return (
                              <span key={t} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${ts.bg} ${ts.text} ${ts.border}`}>
                                {ts.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => removeNote(note.id)} className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{note.content}</p>
                    {note.followUp && (
                      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-brand-blue">
                        <Flag className="w-2.5 h-2.5" /> Follow-up: {note.followUp}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Select Mode Toggle */}
      {!selectMode && filtered.length > 0 && (
        <button onClick={() => setSelectMode(true)}
          className="fixed bottom-6 right-6 bg-white border border-slate-200 shadow-lg rounded-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 z-20 flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4" /> Select
        </button>
      )}
      {selectMode && (
        <button onClick={() => { setSelectedIds(new Set()); setSelectMode(false); }}
          className="fixed bottom-6 right-6 bg-white border border-slate-200 shadow-lg rounded-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 z-20 flex items-center gap-1.5">
          <X className="w-4 h-4" /> Done
        </button>
      )}

      {/* Note Detail Modal */}
      <AnimatePresence>
        {selectedNote && (() => {
          const note = selectedNote;
          const studentNotes = notes.filter(n => n.studentName === note.studentName);
          return (
            <>
              <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedNote(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
              <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white z-10 flex items-start justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${note.pinned ? 'bg-amber-100 text-amber-600' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'}`}>
                        {note.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                          {note.studentName}
                          {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" /> {note.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { togglePin(note.id); setSelectedNote({ ...note, pinned: !note.pinned }); }}
                        className={`p-1.5 rounded-lg ${note.pinned ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <Pin className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedNote(null); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags.map(t => {
                        const ts = TAG_MAP[t];
                        if (!ts) return null;
                        const TIcon = ts.icon;
                        return (
                          <span key={t} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${ts.bg} ${ts.text} ${ts.border}`}>
                            <TIcon className="w-3 h-3" /> {ts.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Content */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {/* Follow-up */}
                    {note.followUp && (
                      <div className="flex items-center gap-2 bg-brand-blue/10 border border-brand-blue-bright/20 rounded-xl px-4 py-3">
                        <CalendarDays className="w-4 h-4 text-brand-blue" />
                        <div>
                          <p className="text-xs font-bold text-brand-blue">Follow-up Date</p>
                          <p className="text-xs text-brand-blue/80">{note.followUp}</p>
                        </div>
                      </div>
                    )}

                    {/* Other notes for same student */}
                    {studentNotes.length > 1 && (
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Other notes for {note.studentName} ({studentNotes.length - 1})
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {studentNotes.filter(n => n.id !== note.id).slice(0, 5).map(n => (
                            <button key={n.id} onClick={() => setSelectedNote(n)}
                              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-between">
                              <span className="text-xs text-slate-600 truncate flex-1">{n.content.slice(0, 60)}...</span>
                              <span className="text-[9px] text-slate-400 shrink-0 ml-2">{n.date}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                    <button onClick={() => { removeNote(note.id); setSelectedNote(null); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Note
                    </button>
                    <span className="text-[10px] text-slate-400">ID: {note.id}</span>
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
