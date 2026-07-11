import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Users, Edit3, Trash2, Trophy } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';

const defaultForm = { tournament: '', team_name: '', organization: '', coach_name: '', contact_email: '', contact_phone: '' };

export default function TeamManager() {
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
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
      eventsApi.adminGetTeams(),
      eventsApi.adminGetTournaments(),
    ]).then(([t, ts]) => {
      setTeams(Array.isArray(t) ? t : []);
      setTournaments(Array.isArray(ts) ? ts : []);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (t: any) => { setEditingId(t.id); setForm({ tournament: t.tournament || '', team_name: t.team_name || '', organization: t.organization || '', coach_name: t.coach_name || '', contact_email: t.contact_email || '', contact_phone: t.contact_phone || '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.tournament || !form.team_name) { setError('Tournament and team name are required'); return; }
    setSaving(true); setError(null);
    try {
      if (editingId) {
        await eventsApi.adminUpdateTeam(editingId, form as any);
      } else {
        await eventsApi.adminCreateTeam(form as any);
      }
      setShowForm(false); load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this team?')) return;
    try { await eventsApi.adminDeleteTeam(id); load(); } catch (err: any) { setError(err.message); }
  };

  const filtered = teams.filter(t => t.team_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>)}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h3 className="font-black text-lg text-slate-900">Tournament Teams</h3><p className="text-xs text-slate-500 mt-1">{teams.length} teams</p></div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Plus className="w-4 h-4" /> New Team</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl"><Users className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="font-bold text-slate-600">No teams</p></div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-brand-border">
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Team</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Tournament</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">W/L/D</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Pts</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center"><Users className="w-4 h-4 text-brand-red" /></div>
                      <div><span className="text-xs font-semibold text-slate-900">{t.team_name}</span>{t.organization && <span className="text-[10px] text-slate-500 block">{t.organization}</span>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-600">{t.tournament_event_title || t.tournament}</td>
                  <td className="px-4 py-3 text-center"><span className="text-xs text-slate-600">{t.wins}/{t.losses}/{t.draws}</span></td>
                  <td className="px-4 py-3 text-center"><span className="font-black text-sm text-slate-900">{t.points}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 z-10">
              <div className="flex items-center justify-between mb-6"><h3 className="font-black text-lg text-slate-900">{editingId ? 'Edit Team' : 'New Team'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tournament *</label>
                  <select value={form.tournament} onChange={e => setForm(p => ({ ...p, tournament: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                    <option value="">Select...</option>
                    {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.event_title || t.event}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Team Name *</label>
                  <input value={form.team_name} onChange={e => setForm(p => ({ ...p, team_name: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Organization</label><input value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Coach</label><input value={form.coach_name} onChange={e => setForm(p => ({ ...p, coach_name: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Email</label><input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Phone</label><input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.tournament || !form.team_name}
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
