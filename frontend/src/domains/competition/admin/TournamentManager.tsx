import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Trophy, Users, DollarSign, Edit3, Trash2, Lock, Eye, Tags, Save, Target, Medal, Calendar, MapPin, Clock, Gamepad2, Activity, Sparkles } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendTournament, BackendTournamentCategory, BackendEvent, BackendStanding, BackendTournamentTeam, BackendMatch } from '../api/eventsApi';

const defaultForm = {
  event: '', category: '', max_teams: '', prize_pool: '',
};

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [categories, setCategories] = useState<BackendTournamentCategory[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
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
  const [showDashboard, setShowDashboard] = useState(true);
  const [tournamentMatches, setTournamentMatches] = useState<Record<string, BackendMatch[]>>({});

  const load = () => {
    setLoading(true);
    Promise.all([
      eventsApi.adminGetTournaments(),
      eventsApi.adminGetTournamentCategories(),
      eventsApi.adminGetEvents({ event_type: 'TOURNAMENT' }),
      eventsApi.adminGetMatches(),
    ]).then(([ts, cats, evts, matches]) => {
      setTournaments(Array.isArray(ts) ? ts : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setEvents(Array.isArray(evts) ? evts : []);
      const matchMap: Record<string, BackendMatch[]> = {};
      (Array.isArray(matches) ? matches : []).forEach((m: BackendMatch) => {
        if (!matchMap[m.tournament]) matchMap[m.tournament] = [];
        matchMap[m.tournament].push(m);
      });
      setTournamentMatches(matchMap);
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

  const handleClose = async (id: string) => {
    try {
      await eventsApi.adminCloseTournament(id);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    try { await eventsApi.adminDeleteTournament(id); load(); } catch (err: any) { setError(err.message); }
  };

  const handleShowDetail = async (t: any) => {
    try {
      const [standings, teams, winner] = await Promise.all([
        eventsApi.adminGetTournamentStandings(t.id).catch(() => []),
        eventsApi.adminGetTournamentTeams(t.id).catch(() => []),
        eventsApi.adminGetTournamentWinner(t.id).catch(() => null),
      ]);
      const event = events.find(e => e.id === t.event);
      setSelectedTournament({
        ...t,
        eventDetail: event || null,
        standings: Array.isArray(standings) ? standings : [],
        teams: Array.isArray(teams) ? teams : [],
        winner: winner || null,
        matches: tournamentMatches[t.id] || [],
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

  const totalTournaments = tournaments.length;
  const closedCount = tournaments.filter(t => t.is_closed).length;
  const activeCount = totalTournaments - closedCount;
  const allMatchLists = Object.values(tournamentMatches) as BackendMatch[][];
  const totalMatches = allMatchLists.reduce((sum, m) => sum + m.length, 0);
  const liveMatches = allMatchLists.reduce((sum, m) => sum + m.filter(x => x.status === 'LIVE').length, 0);
  const completedMatches = allMatchLists.reduce((sum, m) => sum + m.filter(x => x.status === 'COMPLETED').length, 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>
      )}

      {/* Dashboard */}
      {showDashboard && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Tournaments', value: totalTournaments, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Active', value: activeCount, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Live Matches', value: liveMatches, icon: Gamepad2, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Completed Matches', value: completedMatches, icon: Medal, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((stat, i) => {
            const SIcon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${stat.color}`} /></div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-lg text-slate-900">Tournaments</h3>
          <p className="text-xs text-slate-500 mt-1">{tournaments.length} tournaments · {totalMatches} matches</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDashboard(p => !p)} className="px-3 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"><Activity className="w-4 h-4" /> {showDashboard ? 'Hide' : 'Stats'}</button>
          <button onClick={openCreateCategory} className="px-3 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"><Tags className="w-4 h-4" /> Categories</button>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Plus className="w-4 h-4" /> New Tournament</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl"><Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="font-bold text-slate-600">No tournaments</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t, i) => {
            const matchCount = tournamentMatches[t.id]?.length || 0;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white border border-brand-border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => handleShowDetail(t)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-purple-600" /></div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{t.event_title || t.event}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">TOURNAMENT</span>
                        <span className="text-[10px] text-slate-500">{t.category_name || t.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {t.is_closed ? (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1"><Lock className="w-3 h-3" />Closed</span>
                    ) : (
                      <button onClick={() => handleClose(t.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Close Tournament">
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                  {t.max_teams && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max {t.max_teams} teams</span>}
                  {t.prize_pool && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{t.prize_pool} Birr</span>}
                  <span className="flex items-center gap-1"><Gamepad2 className="w-3.5 h-3.5" />{matchCount} matches</span>
                </div>
              </motion.div>
            );
          })}
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Prize Pool (Birr)</label>
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
              className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900">{selectedTournament.event_title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">TOURNAMENT</span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedTournament.category_name} · {selectedTournament.is_closed ? <span className="text-red-500 font-bold">Closed</span> : 'Open'}</p>
                </div>
                <button onClick={() => setSelectedTournament(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Tournament Info */}
                {selectedTournament.eventDetail && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: Calendar, label: 'Start', value: selectedTournament.eventDetail.start_datetime?.slice(0, 10) || '—' },
                      { icon: MapPin, label: 'Location', value: selectedTournament.eventDetail.location || '—' },
                      { icon: Users, label: 'Capacity', value: selectedTournament.eventDetail.capacity ? `${selectedTournament.eventDetail.capacity} max` : 'Unlimited' },
                      { icon: Clock, label: 'Deadline', value: selectedTournament.eventDetail.registration_deadline?.slice(0, 10) || '—' },
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <m.icon className="w-4 h-4 text-brand-red mb-1" />
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{m.label}</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prize & Teams */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                    <DollarSign className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-amber-700">{selectedTournament.prize_pool || '0'}</p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase">Prize Pool</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-blue-700">{selectedTournament.teams?.length || 0}</p>
                    <p className="text-[10px] font-bold text-blue-500 uppercase">Teams</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                    <Gamepad2 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-purple-700">{selectedTournament.matches?.length || 0}</p>
                    <p className="text-[10px] font-bold text-purple-500 uppercase">Matches</p>
                  </div>
                </div>

                {/* Winner */}
                {selectedTournament.winner && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <Medal className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Tournament Winner</p>
                      <p className="font-bold text-base text-slate-900">{selectedTournament.winner.team_name}</p>
                      <p className="text-xs text-slate-500">{selectedTournament.winner.points} points · {selectedTournament.winner.wins}W/{selectedTournament.winner.losses}L</p>
                    </div>
                  </div>
                )}

                {/* Standings */}
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5"><Target className="w-4 h-4 text-brand-red" /> Standings</h4>
                  {selectedTournament.standings?.length > 0 ? (
                    <div className="border border-brand-border rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-slate-50 border-b border-brand-border">
                          <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">#</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Team</th>
                          <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">W</th>
                          <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">L</th>
                          <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">D</th>
                          <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Pts</th>
                        </tr></thead>
                        <tbody className="divide-y divide-brand-border">
                          {selectedTournament.standings.map((s: BackendStanding, i: number) => (
                            <tr key={s.team_id} className={`hover:bg-slate-50/50 ${i === 0 ? 'bg-amber-50/50' : ''}`}>
                              <td className="px-4 py-2.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {i + 1}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs font-medium text-slate-900">{s.team_name}</td>
                              <td className="px-4 py-2.5 text-center text-xs text-emerald-600 font-bold">{s.wins}</td>
                              <td className="px-4 py-2.5 text-center text-xs text-red-500 font-bold">{s.losses}</td>
                              <td className="px-4 py-2.5 text-center text-xs text-amber-500 font-bold">{s.draws}</td>
                              <td className="px-4 py-2.5 text-center text-xs font-black text-slate-900">{s.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">No standings data — rankings are generated after matches are completed.</p>}
                </div>

                {/* Teams */}
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-red" /> Teams ({selectedTournament.teams?.length || 0})</h4>
                  {selectedTournament.teams?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedTournament.teams.map((team: BackendTournamentTeam) => {
                        const standing = selectedTournament.standings?.find((s: BackendStanding) => s.team_name === team.team_name);
                        return (
                          <div key={team.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center"><Users className="w-4 h-4 text-brand-red" /></div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-900 block truncate">{team.team_name}</span>
                                {team.organization && <span className="text-[10px] text-slate-500">{team.organization}</span>}
                              </div>
                              {standing && (
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-slate-900">{standing.points}</span>
                                  <span className="text-[9px] text-slate-400 block">pts</span>
                                </div>
                              )}
                            </div>
                            {team.coach_name && <p className="text-[10px] text-slate-400 mt-1.5 pl-10">Coach: {team.coach_name}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">No teams registered yet</p>}
                </div>

                {/* Recent Matches */}
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5"><Gamepad2 className="w-4 h-4 text-brand-red" /> Matches ({selectedTournament.matches?.length || 0})</h4>
                  {selectedTournament.matches?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selectedTournament.matches.slice(0, 10).map((match: BackendMatch) => {
                        const sideA = match.sides?.find(s => s.side === 'SIDE_A');
                        const sideB = match.sides?.find(s => s.side === 'SIDE_B');
                        return (
                          <div key={match.id} className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-[10px] font-bold text-slate-400 w-20 truncate">{match.round}</span>
                              <span className="text-xs font-medium text-slate-700 flex-1 text-right truncate">{(sideA?.participants?.[0] as any)?.team_name || sideA?.participants?.[0]?.tournament_team_name || 'TBD'}</span>
                              <span className="text-xs font-black text-slate-900 min-w-[40px] text-center">
                                {match.status === 'COMPLETED' ? `${sideA?.score ?? '-'}:${sideB?.score ?? '-'}` : 'vs'}
                              </span>
                              <span className="text-xs font-medium text-slate-700 flex-1 truncate">{(sideB?.participants?.[0] as any)?.team_name || sideB?.participants?.[0]?.tournament_team_name || 'TBD'}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2 ${
                              match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                              match.status === 'LIVE' ? 'bg-red-100 text-red-700 animate-pulse' :
                              match.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>{match.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">No matches scheduled</p>}
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
