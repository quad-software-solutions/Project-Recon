import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Calendar, MapPin, Users, Tag, Globe, CheckCircle, Eye, Edit3, Trash2, Send, ToggleLeft, ToggleRight, Clock, Youtube, Trophy, GraduationCap, Swords, UserPlus } from 'lucide-react';
import * as eventsApi from '../../competition/api/eventsApi';
import type { BackendEvent } from '../../competition/api/eventsApi';

const defaultForm = {
  title: '', description: '', location: '', event_type: 'GENERAL' as eventsApi.EventType,
  start_datetime: '', end_datetime: '', visibility: 'PUBLIC' as eventsApi.Visibility,
  registration_enabled: false, registration_mode: 'PUBLIC' as eventsApi.RegistrationMode,
  payment_required: false, registration_fee: '', capacity: '', youtube_live_url: '',
  branch: '',
};

interface EventManagerProps {
  onNavigate?: (section: string) => void;
}

export default function EventManager({ onNavigate }: EventManagerProps) {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [branches, setBranches] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      eventsApi.adminGetEvents(),
      import('../../user/shared/api/adminApi').then(m => m.branchesApi.list() as Promise<any[]>).catch(() => []),
    ]).then(([evts, brs]) => {
      setEvents(Array.isArray(evts) ? evts : []);
      setBranches(Array.isArray(brs) ? brs : []);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (e: BackendEvent) => {
    setEditingId(e.id);
    setForm({
      title: e.title || '',
      description: e.description || '',
      location: e.location || '',
      event_type: e.event_type || 'GENERAL',
      start_datetime: e.start_datetime?.slice(0, 16) || '',
      end_datetime: e.end_datetime?.slice(0, 16) || '',
      visibility: e.visibility || 'PUBLIC',
      registration_enabled: e.registration_enabled || false,
      registration_mode: e.registration_mode || 'PUBLIC',
      payment_required: e.payment_required || false,
      registration_fee: e.registration_fee || '',
      capacity: e.capacity?.toString() || '',
      youtube_live_url: e.youtube_live_url || '',
      branch: e.branch || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.start_datetime || !form.end_datetime) { setError('Title, start and end dates are required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title, description: form.description, location: form.location,
        event_type: form.event_type, start_datetime: form.start_datetime, end_datetime: form.end_datetime,
        visibility: form.visibility, registration_enabled: form.registration_enabled,
        registration_mode: form.registration_enabled ? form.registration_mode : null,
        payment_required: form.registration_enabled ? form.payment_required : false,
        registration_fee: form.registration_enabled && form.payment_required ? form.registration_fee : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        youtube_live_url: form.youtube_live_url || null,
        branch: form.branch || null,
      };
      if (editingId) {
        await eventsApi.adminUpdateEvent(editingId, payload as Partial<BackendEvent>);
      } else {
        await eventsApi.adminCreateEvent(payload as Partial<BackendEvent>);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventsApi.adminDeleteEvent(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const target = events.find(e => e.id === id);
      if (!target) return;
      if (target.status === 'PUBLISHED') {
        await eventsApi.adminUnpublishEvent(id);
      } else {
        await eventsApi.adminPublishEvent(id);
      }
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      if (current) {
        await eventsApi.adminDeactivateEvent(id);
      } else {
        await eventsApi.adminActivateEvent(id);
      }
      load();
    } catch (err: any) { setError(err.message); }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
      PUBLISHED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      GENERAL: 'bg-slate-100 text-slate-600',
      TOURNAMENT: 'bg-purple-100 text-purple-700',
      WORKSHOP: 'bg-cyan-100 text-cyan-700',
    };
    return map[t] || 'bg-slate-100 text-slate-600';
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Admin page header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/60 p-6">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                Admin · EthioRobotics
              </span>
            </div>
            <h3 className="font-black text-lg text-white">Events</h3>
            <p className="text-xs text-slate-400 mt-1">{events.length} events ({events.filter(e => e.status === 'PUBLISHED').length} published)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-red" />
            </div>
            <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">No events found</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Schedule</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Active</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-brand-border">
                {filtered.map((e, i) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-brand-red" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900">{e.title}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-500">{e.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeBadge(e.event_type)}`}>{e.event_type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Clock className="w-3 h-3" />
                        <span>{e.start_datetime?.slice(0, 10)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusBadge(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(e.id, e.is_active)} className={`p-1 rounded-lg ${e.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                        {e.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => window.open(`/event/${e.id}`, '_blank')} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="View public page"><Eye className="w-3.5 h-3.5" /></button>
                        {e.event_type === 'TOURNAMENT' && (
                          <>
                            <button onClick={() => onNavigate?.('tournaments')} className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50" title="Manage Tournament"><Trophy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onNavigate?.('tournament-teams')} className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50" title="Manage Teams"><Users className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onNavigate?.('matches')} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50" title="Manage Matches"><Swords className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                        {e.event_type === 'WORKSHOP' && (
                          <button onClick={() => onNavigate?.('workshops')} className="p-1.5 rounded-lg text-cyan-500 hover:bg-cyan-50" title="Manage Workshop"><GraduationCap className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => onNavigate?.('event-registrations')} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="View Registrations"><UserPlus className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handlePublish(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50" title={e.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}><Send className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-brand-red" />
                  </div>
                  <h3 className="font-black text-lg text-slate-900">{editingId ? 'Edit Event' : 'New Event'}</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Branch</label>
                    <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                      <option value="">All Branches</option>
                      {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Location *</label>
                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Event Type</label>
                    <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value as eventsApi.EventType }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                      <option value="GENERAL">General</option>
                      <option value="TOURNAMENT">Tournament</option>
                      <option value="WORKSHOP">Workshop</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Capacity</label>
                    <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="Unlimited"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Start *</label>
                    <input type="datetime-local" value={form.start_datetime} onChange={e => setForm(p => ({ ...p, start_datetime: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">End *</label>
                    <input type="datetime-local" value={form.end_datetime} onChange={e => setForm(p => ({ ...p, end_datetime: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Visibility</label>
                  <select value={form.visibility} onChange={e => setForm(p => ({ ...p, visibility: e.target.value as eventsApi.Visibility }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.registration_enabled} onChange={e => setForm(p => ({ ...p, registration_enabled: e.target.checked }))} className="rounded" />
                    <span className="text-xs font-medium text-slate-700">Enable Registration</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.payment_required} onChange={e => setForm(p => ({ ...p, payment_required: e.target.checked }))}
                      disabled={!form.registration_enabled} className="rounded" />
                    <span className="text-xs font-medium text-slate-700">Payment Required</span>
                  </label>
                </div>
                {form.registration_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Registration Mode</label>
                      <select value={form.registration_mode} onChange={e => setForm(p => ({ ...p, registration_mode: e.target.value as eventsApi.RegistrationMode }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                        <option value="PUBLIC">Public</option>
                        <option value="STUDENT">Student</option>
                        <option value="SUBPROGRAM_STUDENT">Sub Program Student</option>
                      </select>
                    </div>
                    {form.payment_required && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Fee</label>
                        <input type="number" value={form.registration_fee} onChange={e => setForm(p => ({ ...p, registration_fee: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">YouTube Live URL</label>
                  <input value={form.youtube_live_url} onChange={e => setForm(p => ({ ...p, youtube_live_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.title || !form.start_datetime || !form.end_datetime}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-brand-red to-brand-red-dark rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
