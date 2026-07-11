import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Trophy, Users, DollarSign, Edit3, Trash2, Lock, Unlock, Eye, Tags, Save } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendTournament, BackendTournamentCategory } from '../api/eventsApi';

const defaultForm = {
  event: '', category: '', max_teams: '', prize_pool: '',
};

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [categories, setCategories] = useState<BackendTournamentCategory[]>([]);
  const [events, setEvents] = useState<BackendTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', description: '' });
  const [savingCategory, setSavingCategory] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      eventsApi.adminGetTournaments(),
      eventsApi.adminGetTournamentCategories(),
      eventsApi.adminGetEvents({ event_type: 'TOURNAMENT' }),
    ]).then(([ts, cats, evts]) => {
      setTournaments(Array.isArray(ts) ? ts : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setEvents(Array.isArray(evts) ? evts : []);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({ event: t.event || '', category: t.category || '', max_teams: t.max_teams?.toString() || '', prize_pool: t.prize_pool?.toString() || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.event) { setError('Event is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { event: form.event, category: form.category, max_teams: form.max_teams ? parseInt(form.max_teams) : null, prize_pool: form.prize_pool || null };
      if (editingId) {
        await eventsApi.adminUpdateTournament(editingId, payload as any);
      } else {
        await eventsApi.adminCreateTournament(payload as any);
      }
      setShowForm(false);
      load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tournament?')) return;
    try { await eventsApi.adminDeleteTournament(id); load(); } catch (err: any) { setError(err.message); }
  };

  const handleToggleClose = async (id: string, isClosed: boolean) => {
    try {
      if (isClosed) {
        await eventsApi.adminReopenTournament(id);
      } else {
        await eventsApi.adminCloseTournament(id);
      }
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleShowDetail = async (t: any) => {
    try {
      const [standings, teams] = await Promise.all([
        eventsApi.adminGetTournamentStandings(t.id),
        eventsApi.adminGetTournamentTeams(t.id),
      ]);
      setSelectedTournament({
        ...t,
        standings: Array.isArray(standings) ? standings : [],
        teams: Array.isArray(teams) ? teams : [],
      });
    } catch (err: any) { setError(err.message); }
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', code: '', description: '' });
    setShowCategoryModal(true);
  };

  const openEditCategory = (c: BackendTournamentCategory) => {
    setEditingCategoryId(c.id);
    setCategoryForm({ name: c.name, code: c.code, description: c.description });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.code) { setError('Name and code are required'); return; }
    setSavingCategory(true);
    setError(null);
    try {
      if (editingCategoryId) {
        await eventsApi.adminUpdateTournamentCategory(editingCategoryId, categoryForm);
      } else {
        await eventsApi.adminCreateTournamentCategory(categoryForm);
      }
      setShowCategoryModal(false);
      load();
    } catch (err: any) { setError(err.message); } finally { setSavingCategory(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category? Categories in use by tournaments cannot be deleted.')) return;
    try { await eventsApi.adminDeleteTournamentCategory(id); load(); } catch (err: any) { setError(err.message); }
  };

  const filtered = tournaments.filter(t =>
    (t.event_title || t.event || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-lg text-slate-900">Tournaments</h3>
          <p className="text-xs text-slate-500 mt-1">{tournaments.length} tournaments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreateCategory} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Tags className="w-4 h-4" /> Categories</button>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Plus className="w-4 h-4" /> New Tournament</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl"><Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="font-bold text-slate-600">No tournaments</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-brand-border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => handleShowDetail(t)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-purple-600" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{t.event_title || t.event}</h4>
                    <span className="text-[10px] text-slate-500">{t.category_name || t.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleToggleClose(t.id, t.is_closed)} className={`p-1.5 rounded-lg ${t.is_closed ? 'text-slate-400' : 'text-emerald-500'}`} title={t.is_closed ? 'Reopen' : 'Close'}>
                    {t.is_closed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {t.max_teams && <div className="flex items-center gap-3 text-[11px] text-slate-500"><Users className="w-3.5 h-3.5" /><span>Max {t.max_teams} teams</span></div>}
              {t.prize_pool && <div className="flex items-center gap-3 text-[11px] text-slate-500"><DollarSign className="w-3.5 h-3.5" /><span>{t.prize_pool} ETB</span></div>}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-slate-900">{editingId ? 'Edit Tournament' : 'New Tournament'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Event *</label>
                  <select value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                    <option value="">Select event...</option>
                    {events.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Max Teams</label>
                    <input type="number" value={form.max_teams} onChange={e => setForm(p => ({ ...p, max_teams: e.target.value }))} placeholder="Unlimited" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Prize Pool (ETB)</label>
                    <input type="number" value={form.prize_pool} onChange={e => setForm(p => ({ ...p, prize_pool: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                </div>
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

        {selectedTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTournament(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-slate-900">{selectedTournament.event_title}</h3>
                <button onClick={() => setSelectedTournament(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Standings</h4>
                  {selectedTournament.standings?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50 border-b border-brand-border">
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-500 uppercase">#</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black text-slate-500 uppercase">Team</th>
                        <th className="text-center px-3 py-2 text-[10px] font-black text-slate-500 uppercase">W</th>
                        <th className="text-center px-3 py-2 text-[10px] font-black text-slate-500 uppercase">L</th>
                        <th className="text-center px-3 py-2 text-[10px] font-black text-slate-500 uppercase">D</th>
                        <th className="text-center px-3 py-2 text-[10px] font-black text-slate-500 uppercase">Pts</th>
                      </tr></thead>
                      <tbody className="divide-y divide-brand-border">
                        {selectedTournament.standings.map((s: any, i: number) => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-xs font-bold text-slate-600">{i + 1}</td>
                            <td className="px-3 py-2 text-xs font-medium text-slate-900">{s.team_name}</td>
                            <td className="px-3 py-2 text-center text-xs text-emerald-600 font-bold">{s.wins}</td>
                            <td className="px-3 py-2 text-center text-xs text-red-500 font-bold">{s.losses}</td>
                            <td className="px-3 py-2 text-center text-xs text-amber-500 font-bold">{s.draws}</td>
                            <td className="px-3 py-2 text-center text-xs font-black text-slate-900">{s.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="text-xs text-slate-400 py-4 text-center">No standings data</p>}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Teams ({selectedTournament.teams?.length || 0})</h4>
                  {selectedTournament.teams?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTournament.teams.map((team: any) => (
                        <div key={team.id} className="bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-brand-red" /></div>
                          <div><span className="text-xs font-medium text-slate-900">{team.team_name}</span>{team.organization && <span className="text-[10px] text-slate-500 block">{team.organization}</span>}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-400 py-4 text-center">No teams</p>}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCategoryModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-slate-900">Manage Categories</h3>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="border border-brand-border rounded-2xl divide-y divide-brand-border mb-4 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No categories yet</p>
                ) : categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.code}{c.description ? ` — ${c.description}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditCategory(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-xs text-slate-700">{editingCategoryId ? 'Edit Category' : 'New Category'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Name *</label>
                    <input value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. VEX V5" className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Code *</label>
                    <input value={categoryForm.code} onChange={e => setCategoryForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. VEXV5" className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-xl text-sm font-mono focus:outline-none focus:border-brand-red" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Description</label>
                  <input value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-brand-border">
                <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Close</button>
                <button onClick={handleSaveCategory} disabled={savingCategory || !categoryForm.name || !categoryForm.code}
                  className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-brand-red to-brand-red-dark rounded-xl disabled:opacity-50 flex items-center gap-1.5">
                  {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingCategory ? 'Saving...' : editingCategoryId ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
