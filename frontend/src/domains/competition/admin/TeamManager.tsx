import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Users, Edit3, Trash2, Trophy, Medal, Gamepad2, BarChart3, Phone, Mail, Building, User, TrendingUp, Calendar, Clock, Swords } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendMatch } from '../api/eventsApi';

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
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamMatches, setTeamMatches] = useState<BackendMatch[]>([]);
  const [showDashboard, setShowDashboard] = useState(true);
  const [tournamentFilter, setTournamentFilter] = useState('all');

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

  const isTournamentClosed = (id: string) => {
    const t = tournaments.find(t => t.id === id);
    return t?.tournament?.is_closed ?? t?.is_closed ?? false;
  };

  const handleSave = async () => {
    if (!form.tournament || !form.team_name) { setError('Tournament and team name are required'); return; }
    if (isTournamentClosed(form.tournament)) { setError('Cannot modify teams in a closed tournament.'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Record<string, any> = { tournament: form.tournament, team_name: form.team_name };
      if (editingId) {
        if (form.organization) payload.organization = form.organization;
        if (form.coach_name) payload.coach_name = form.coach_name;
        if (form.contact_email) payload.contact_email = form.contact_email;
        if (form.contact_phone) payload.contact_phone = form.contact_phone;
        await eventsApi.adminUpdateTeam(editingId, payload);
      } else {
        if (form.organization) payload.organization = form.organization;
        if (form.coach_name) payload.coach_name = form.coach_name;
        if (form.contact_email) payload.contact_email = form.contact_email;
        if (form.contact_phone) payload.contact_phone = form.contact_phone;
        await eventsApi.adminCreateTeam(payload);
      }
      setShowForm(false); load();
    } catch (err: any) { setError(`Team create failed: ${err.message}`); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this team?')) return;
    try { await eventsApi.adminDeleteTeam(id); load(); } catch (err: any) { setError(err.message); }
  };

  const handleShowDetail = async (team: any) => {
    try {
      const [allMatches] = await Promise.all([
        eventsApi.adminGetTournamentMatches(team.tournament).catch(() => []),
      ]);
      const relatedMatches = (Array.isArray(allMatches) ? allMatches : []).filter((m: BackendMatch) =>
        m.sides?.some(s => s.participants?.some(p => p.tournament_team === team.id))
      );
      setSelectedTeam(team);
      setTeamMatches(relatedMatches);
    } catch (err: any) { setError(err.message); }
  };

  const filtered = teams.filter(t => {
    const matchesSearch = t.team_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTournament = tournamentFilter === 'all' || t.tournament === tournamentFilter;
    return matchesSearch && matchesTournament;
  });

  const totalTeams = teams.length;
  const totalWins = teams.reduce((sum: number, t: any) => sum + (t.wins || 0), 0);
  const totalLosses = teams.reduce((sum: number, t: any) => sum + (t.losses || 0), 0);
  const totalDraws = teams.reduce((sum: number, t: any) => sum + (t.draws || 0), 0);
  const totalMatches = totalWins + totalLosses + totalDraws;
  const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : '—';
  const avgPoints = teams.length > 0 ? (teams.reduce((sum: number, t: any) => sum + (t.points || 0), 0) / teams.length).toFixed(1) : '0';

  const toCsv = (rows: Record<string, any>[]) => {
    if (!rows.length) return '';
    const keys = Object.keys(rows[0]);
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  };

  const exportTeams = () => {
    const rows = filtered.map(t => ({
      Team: t.team_name,
      Tournament: t.tournament_title || t.tournament || '',
      Organization: t.organization || '',
      Coach: t.coach_name || '',
      Email: t.contact_email || '',
      Phone: t.contact_phone || '',
      Wins: t.wins || 0,
      Losses: t.losses || 0,
      Draws: t.draws || 0,
      Points: t.points || 0,
      Win_Rate: ((() => { const tot = (t.wins || 0) + (t.losses || 0) + (t.draws || 0); return tot > 0 ? ((t.wins || 0) / tot * 100).toFixed(1) + '%' : '—'; })()),
    }));
    const csv = toCsv(rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `teams-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>)}

      {/* Dashboard */}
      {showDashboard && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Teams', value: totalTeams, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Win Rate', value: winRate + '%', icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Matches', value: totalMatches, icon: Swords, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Avg Points', value: avgPoints, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
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
        <div><h3 className="font-black text-lg text-slate-900">Tournament Teams</h3><p className="text-xs text-slate-500 mt-1">{teams.length} teams</p></div>
        <div className="flex items-center gap-2">
          <button onClick={exportTeams} className="px-3 py-2 bg-white border border-brand-border text-slate-600 font-black text-xs rounded-xl hover:bg-slate-50 flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Export</button>
          <button onClick={() => setShowDashboard(p => !p)} className="px-3 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> {showDashboard ? 'Hide' : 'Stats'}</button>
          <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red">
            <option value="all">All Tournaments ({teams.length})</option>
            {tournaments.map((t: any) => {
              const closed = t.tournament?.is_closed ?? t?.is_closed ?? false;
              const count = teams.filter((tm: any) => tm.tournament === t.id).length;
              return <option key={t.id} value={t.id} disabled={closed}>{t.event_title || t.event} ({count}){closed ? ' 🔒' : ''}</option>;
            })}
          </select>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-44 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
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
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden lg:table-cell">Tournament</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Contact</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Record</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Pts</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Win Rate</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.map((t, i) => {
                const total = (t.wins || 0) + (t.losses || 0) + (t.draws || 0);
                const winPct = total > 0 ? ((t.wins || 0) / total) * 100 : 0;
                const gradColors = ['from-brand-red/10 to-brand-red/5', 'from-blue-500/10 to-blue-600/5', 'from-emerald-500/10 to-emerald-600/5', 'from-amber-500/10 to-amber-600/5', 'from-purple-500/10 to-purple-600/5'];
                const grad = gradColors[i % gradColors.length];
                return (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleShowDetail(t)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center`}>
                        <span className="text-[10px] font-black text-slate-600">{t.team_name?.charAt(0) || 'T'}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900">{t.team_name}</span>
                        {t.organization && <span className="text-[10px] text-slate-400 block leading-tight">{t.organization}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-slate-600">{t.tournament_title || t.tournament?.slice(0, 8) || '—'}</span></td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {t.coach_name && <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{t.coach_name}</span>}
                      {t.contact_email && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{t.contact_email}</span>}
                      {!t.coach_name && !t.contact_email && <span className="text-[10px] text-slate-300 italic">No contact</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold">
                      <span className="text-emerald-600">{t.wins || 0}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-red-500">{t.losses || 0}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-amber-500">{t.draws || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><span className="font-black text-sm text-slate-900">{t.points}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(winPct, 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-8 text-left">{winPct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleShowDetail(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue transition-colors" title="View details"><Users className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )})}
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
                    <option value="">Select tournament...</option>
                    {tournaments.map((t: any) => {
                      const closed = t.tournament?.is_closed ?? t?.is_closed ?? false;
                      return <option key={t.id} value={t.id} disabled={closed}>{t.event_title || t.event}{closed ? ' (Closed)' : ''}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Team Name *</label>
                  <input value={form.team_name} onChange={e => setForm(p => ({ ...p, team_name: e.target.value }))} placeholder="e.g. Robo Titans, Circuit Breakers, VEX Kings" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Organization</label><input value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} placeholder="e.g. Ethio Robotics, School of Engineering" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Coach</label><input value={form.coach_name} onChange={e => setForm(p => ({ ...p, coach_name: e.target.value }))} placeholder="e.g. Alemayehu Hailu, Sarah Johnson" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Email</label><input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="e.g. coach@example.com, team.lead@school.edu" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Phone</label><input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} placeholder="e.g. +251-911-234-567, +1-555-0123" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
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

        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTeam(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center"><Users className="w-6 h-6 text-brand-red" /></div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{selectedTeam.team_name}</h3>
                    <p className="text-xs text-slate-500">{selectedTeam.tournament_title || selectedTeam.tournament}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTeam(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: Building, label: 'Organization', value: selectedTeam.organization || '—' },
                  { icon: User, label: 'Coach', value: selectedTeam.coach_name || '—' },
                  { icon: Mail, label: 'Email', value: selectedTeam.contact_email || '—' },
                  { icon: Phone, label: 'Phone', value: selectedTeam.contact_phone || '—' },
                ].map((m, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <m.icon className="w-4 h-4 text-brand-red mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{m.label}</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <Trophy className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-emerald-700">{selectedTeam.wins || 0}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Wins</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                  <Swords className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-red-700">{selectedTeam.losses || 0}</p>
                  <p className="text-[10px] font-bold text-red-500 uppercase">Losses</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                  <Medal className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-amber-700">{selectedTeam.draws || 0}</p>
                  <p className="text-[10px] font-bold text-amber-500 uppercase">Draws</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <BarChart3 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-blue-700">{selectedTeam.points || 0}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">Points</p>
                </div>
              </div>
              {/* Win Rate Bar */}
              {(() => {
                const tmTotal = (selectedTeam.wins || 0) + (selectedTeam.losses || 0) + (selectedTeam.draws || 0);
                const tmWinPct = tmTotal > 0 ? ((selectedTeam.wins || 0) / tmTotal) * 100 : 0;
                return tmTotal > 0 ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-bold">Win Rate</span>
                      <span className="font-black text-slate-900">{tmWinPct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${Math.min(tmWinPct, 100)}%` }} />
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Match History */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5"><Gamepad2 className="w-4 h-4 text-brand-red" /> Match History ({teamMatches.length})</h4>
                {teamMatches.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {teamMatches.map((match: BackendMatch) => {
                      const sideA = match.sides?.find(s => s.side === 'SIDE_A');
                      const sideB = match.sides?.find(s => s.side === 'SIDE_B');
                      const teamInSideA = sideA?.participants?.some(p => p.tournament_team === selectedTeam.id);
                      const teamScore = teamInSideA ? sideA?.score : sideB?.score;
                      const opponentScore = teamInSideA ? sideB?.score : sideA?.score;
                      const won = match.status === 'COMPLETED' && (teamScore ?? 0) > (opponentScore ?? 0);
                      const teamNames = (sideA?.participants || []).map(p => (p as any).team_name || p.tournament_team_name || '—');
                      const oppNames = (sideB?.participants || []).map(p => (p as any).team_name || p.tournament_team_name || '—');
                      return (
                        <div key={match.id} className={`bg-slate-50 rounded-xl px-4 py-3 border transition-colors ${
                          match.status === 'COMPLETED' ? (won ? 'border-emerald-200 hover:bg-emerald-50/50' : 'border-red-200 hover:bg-red-50/50') :
                          match.status === 'LIVE' ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:bg-slate-100/50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-400">{match.round}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                  match.status === 'LIVE' ? 'bg-red-100 text-red-700 animate-pulse' :
                                  match.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>{match.status}</span>
                                {match.completed_at && (
                                  <span className="text-[9px] text-slate-400">{new Date(match.completed_at).toLocaleDateString()}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-700 flex-1 truncate text-right">
                                  {teamInSideA ? teamNames.join(', ') : oppNames.join(', ') || 'TBD'}
                                </span>
                                <span className={`text-sm font-black min-w-[48px] text-center ${
                                  match.status === 'COMPLETED'
                                    ? (won ? 'text-emerald-600' : (teamScore === opponentScore ? 'text-amber-500' : 'text-red-500'))
                                    : 'text-slate-400'
                                }`}>
                                  {match.status === 'COMPLETED' ? `${teamScore ?? '-'} : ${opponentScore ?? '-'}` : 'vs'}
                                </span>
                                <span className="text-xs font-medium text-slate-700 flex-1 truncate">
                                  {teamInSideA ? oppNames.join(', ') : teamNames.join(', ') || 'TBD'}
                                </span>
                              </div>
                            </div>
                            {match.status === 'COMPLETED' && (
                              <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                won ? 'bg-emerald-100 text-emerald-700' :
                                teamScore === opponentScore ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                              }`}>
                                {won ? 'W' : teamScore === opponentScore ? 'D' : 'L'}
                              </div>
                            )}
                            {match.status === 'LIVE' && (
                              <div className="shrink-0 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <Gamepad2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No matches played yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
