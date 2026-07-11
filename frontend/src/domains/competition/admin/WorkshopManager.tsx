import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, GraduationCap, Edit3, Trash2, Clock, DollarSign, User } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendWorkshop, BackendEvent, WorkshopLevel } from '../api/eventsApi';

const defaultForm = { event: '', instructor: '', duration_minutes: 60, level: 'BEGINNER' as WorkshopLevel, price: '' };

export default function WorkshopManager() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    Promise.all([
      eventsApi.adminGetWorkshops(),
      eventsApi.adminGetEvents({ event_type: 'WORKSHOP' }),
    ]).then(([ws, evts]) => {
      setWorkshops(Array.isArray(ws) ? ws : []);
      setEvents(Array.isArray(evts) ? evts : []);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (w: any) => { setEditingId(w.id); setForm({ event: w.event || '', instructor: w.instructor || '', duration_minutes: w.duration_minutes || 60, level: w.level || 'BEGINNER', price: w.price?.toString() || '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.event) { setError('Event is required'); return; }
    setSaving(true); setError(null);
    try {
      const payload = { event: form.event, instructor: form.instructor, duration_minutes: form.duration_minutes, level: form.level, price: form.price || null };
      if (editingId) { await eventsApi.adminUpdateWorkshop(editingId, payload as any); }
      else { await eventsApi.adminCreateWorkshop(payload as any); }
      setShowForm(false); load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this workshop?')) return;
    try { await eventsApi.adminDeleteWorkshop(id); load(); } catch (err: any) { setError(err.message); }
  };

  const levelBadge = (lvl: string) => {
    const map: Record<string, string> = {
      BEGINNER: 'bg-emerald-100 text-emerald-700', INTERMEDIATE: 'bg-amber-100 text-amber-700', ADVANCED: 'bg-red-100 text-red-700',
    };
    return map[lvl] || 'bg-slate-100 text-slate-600';
  };

  const filtered = workshops.filter(w => (w.event_title || w.event || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>)}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h3 className="font-black text-lg text-slate-900">Workshops</h3><p className="text-xs text-slate-500 mt-1">{workshops.length} workshops</p></div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Plus className="w-4 h-4" /> New Workshop</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl"><GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="font-bold text-slate-600">No workshops</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-brand-border rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-cyan-600" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{w.event_title || w.event}</h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${levelBadge(w.level)}`}>{w.level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {w.instructor_name && <div className="flex items-center gap-2 text-[11px] text-slate-500"><User className="w-3.5 h-3.5" /><span>{w.instructor_name}</span></div>}
                <div className="flex items-center gap-2 text-[11px] text-slate-500"><Clock className="w-3.5 h-3.5" /><span>{w.duration_minutes} minutes</span></div>
                {w.price && <div className="flex items-center gap-2 text-[11px] text-slate-500"><DollarSign className="w-3.5 h-3.5" /><span>{w.price} ETB</span></div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 z-10">
              <div className="flex items-center justify-between mb-6"><h3 className="font-black text-lg text-slate-900">{editingId ? 'Edit Workshop' : 'New Workshop'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
              <div className="flex flex-col gap-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Event *</label>
                  <select value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                    <option value="">Select...</option>{events.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Instructor *</label>
                  <input value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))} placeholder="User ID" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Duration (min)</label>
                    <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Level</label>
                    <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value as WorkshopLevel }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                      <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
                    </select></div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Price (ETB)</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Free" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.event}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-brand-red to-brand-red-dark rounded-xl shadow-lg shadow-brand-red/25 disabled:opacity-50 flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
