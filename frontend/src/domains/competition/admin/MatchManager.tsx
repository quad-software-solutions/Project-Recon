import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Gamepad2, Clock, Edit3, Trash2, CheckCircle, Swords, Users, Trophy, Activity, BarChart3, Calendar, Filter } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendMatch, BackendTournamentTeam, SideType } from '../api/eventsApi';

const defaultForm = { tournament: '', round: '', scheduled_at: '' };
const defaultScoreForm = { side_a_score: 0, side_b_score: 0 };

export default function MatchManager() {
  const [matches, setMatches] = useState<BackendMatch[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teams, setTeams] = useState<BackendTournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedMatch, setSelectedMatch] = useState<BackendMatch | null>(null);
  const [assignForm, setAssignForm] = useState({ side: 'SIDE_A' as SideType, tournament_team: '' });
  const [scoreForm, setScoreForm] = useState(defaultScoreForm);
  const [showDashboard, setShowDashboard] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      eventsApi.adminGetMatches(),
      eventsApi.adminGetTournaments(),
      eventsApi.adminGetTeams(),
    ]).then(([m, ts, tms]) => {
      setMatches(Array.isArray(m) ? m : []);
      setTournaments(Array.isArray(ts) ? ts : []);
      setTeams(Array.isArray(tms) ? tms : []);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (m: BackendMatch) => { setEditingId(m.id); setForm({ tournament: m.tournament, round: m.round, scheduled_at: m.scheduled_at?.slice(0, 16) || '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.tournament || !form.round || !form.scheduled_at) { setError('All fields required'); return; }
    setSaving(true); setError(null);
    try {
      if (editingId) { await eventsApi.adminUpdateMatch(editingId, form as any); }
      else { await eventsApi.adminCreateMatch(form as any); }
      setShowForm(false); load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this match?')) return;
    try { await eventsApi.adminDeleteMatch(id); load(); } catch (err: any) { setError(err.message); }
  };

  const handleAssign = async () => {
    if (!selectedMatch || !assignForm.tournament_team) return;
    try {
      await eventsApi.adminAssignTeamToMatch(selectedMatch.id, assignForm);
      setAssignForm({ side: 'SIDE_A', tournament_team: '' });
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
    } catch (err: any) { setError(err.message); }
  };

  const handleRemoveTeam = async (side: SideType, teamId: string) => {
    if (!selectedMatch) return;
    try {
      await eventsApi.adminRemoveTeamFromMatch(selectedMatch.id, { side, tournament_team: teamId });
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
    } catch (err: any) { setError(err.message); }
  };

  const handleRecordScores = async () => {
    if (!selectedMatch) return;
    try {
      await eventsApi.adminRecordMatchScores(selectedMatch.id, scoreForm);
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
    } catch (err: any) { setError(err.message); }
  };

  const handleComplete = async () => {
    if (!selectedMatch) return;
    try {
      await eventsApi.adminCompleteMatch(selectedMatch.id);
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-700', LIVE: 'bg-red-100 text-red-700 animate-pulse',
      COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const filtered = matches.filter(m => {
    const matchesSearch = m.round?.toLowerCase().includes(search.toLowerCase());
    const matchesTournament = tournamentFilter === 'all' || m.tournament === tournamentFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesTournament && matchesStatus;
  });

  const totalMatches = matches.length;
  const liveCount = matches.filter(m => m.status === 'LIVE').length;
  const completedCount = matches.filter(m => m.status === 'COMPLETED').length;
  const scheduledCount = matches.filter(m => m.status === 'SCHEDULED').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>)}

      {/* Dashboard Stats */}
      {showDashboard && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Matches', value: totalMatches, icon: Gamepad2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Scheduled', value: scheduledCount, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Live', value: liveCount, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
        <div><h3 className="font-black text-lg text-slate-900">Matches</h3><p className="text-xs text-slate-500 mt-1">{completedCount} completed / {totalMatches} total</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowDashboard(p => !p)} className="px-3 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {showDashboard ? 'Hide' : 'Stats'}</button>
          <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red">
            <option value="all">All Tournaments</option>
            {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.event_title || t.event}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red">
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rounds..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Plus className="w-4 h-4" /> New Match</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-2xl"><Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="font-bold text-slate-600">No matches</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m, i) => {
            const sideA = m.sides?.find(s => s.side === 'SIDE_A');
            const sideB = m.sides?.find(s => s.side === 'SIDE_B');
            const teamANames = sideA?.participants?.map(p => p.tournament_team_name).join(', ') || 'TBD';
            const teamBNames = sideB?.participants?.map(p => p.tournament_team_name).join(', ') || 'TBD';
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white border border-brand-border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedMatch(m)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-amber-600" /></div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{m.round}</h4>
                      <span className="text-[10px] text-slate-500">{m.tournament_title}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(m.status)}`}>{m.status}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                  <div className="flex-1 text-center min-w-0">
                    <span className="text-xs font-semibold text-slate-700 block truncate">{teamANames}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Side A</span>
                  </div>
                  <div className="mx-4 text-center">
                    <span className="text-lg font-black text-slate-900">{sideA?.score ?? '-'} : {sideB?.score ?? '-'}</span>
                    <p className="text-[9px] text-slate-400 uppercase">Score</p>
                  </div>
                  <div className="flex-1 text-center min-w-0">
                    <span className="text-xs font-semibold text-slate-700 block truncate">{teamBNames}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Side B</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.scheduled_at?.slice(0, 16) || 'TBD'}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(sideA?.participants?.length || 0) + (sideB?.participants?.length || 0)} participants</span>
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
              <div className="flex items-center justify-between mb-6"><h3 className="font-black text-lg text-slate-900">{editingId ? 'Edit Match' : 'New Match'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
              <div className="flex flex-col gap-4">
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tournament *</label>
                  <select value={form.tournament} onChange={e => setForm(p => ({ ...p, tournament: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red">
                    <option value="">Select...</option>{tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.event_title || t.event}</option>)}
                  </select></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Round *</label>
                  <input value={form.round} onChange={e => setForm(p => ({ ...p, round: e.target.value }))} placeholder="e.g. Quarter Final" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Scheduled At *</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.tournament || !form.round || !form.scheduled_at}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-brand-red to-brand-red-dark rounded-xl shadow-lg shadow-brand-red/25 disabled:opacity-50 flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMatch(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-lg text-slate-900">{selectedMatch.round}</h3>
                  <p className="text-xs text-slate-500">{selectedMatch.tournament_title}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${statusBadge(selectedMatch.status)}`}>{selectedMatch.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMatch.status !== 'COMPLETED' && selectedMatch.status !== 'CANCELLED' && (
                    <button onClick={handleComplete} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><CheckCircle className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => setSelectedMatch(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Sides Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {(['SIDE_A', 'SIDE_B'] as SideType[]).map(sideKey => {
                  const side = selectedMatch.sides?.find(s => s.side === sideKey);
                  return (
                    <div key={sideKey} className={`rounded-2xl p-4 border ${sideKey === 'SIDE_A' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{sideKey === 'SIDE_A' ? 'Side A' : 'Side B'}</span>
                        <span className="text-lg font-black text-slate-900">{side?.score ?? '-'}</span>
                      </div>
                      {side?.participants?.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 mb-1.5 last:mb-0">
                          <span className="text-xs font-medium text-slate-900">{p.tournament_team_name}</span>
                          <button onClick={() => handleRemoveTeam(sideKey, p.tournament_team)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      )) || <p className="text-xs text-slate-400 text-center py-3">No teams assigned</p>}
                    </div>
                  );
                })}
              </div>

              {/* Times */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Calendar, label: 'Scheduled', value: selectedMatch.scheduled_at?.slice(0, 16) || '—' },
                  { icon: Clock, label: 'Started', value: selectedMatch.started_at?.slice(0, 16) || '—' },
                  { icon: CheckCircle, label: 'Completed', value: selectedMatch.completed_at?.slice(0, 16) || '—' },
                ].map((m, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <m.icon className="w-4 h-4 text-brand-red mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{m.label}</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                {/* Assign Teams */}
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="font-bold text-xs text-slate-700 mb-3">Assign Teams</h4>
                  <div className="flex items-center gap-2">
                    <select value={assignForm.side} onChange={e => setAssignForm(p => ({ ...p, side: e.target.value as SideType }))} className="px-3 py-2 bg-white border border-brand-border rounded-lg text-xs">
                      <option value="SIDE_A">Side A</option><option value="SIDE_B">Side B</option>
                    </select>
                    <select value={assignForm.tournament_team} onChange={e => setAssignForm(p => ({ ...p, tournament_team: e.target.value }))} className="flex-1 px-3 py-2 bg-white border border-brand-border rounded-lg text-xs">
                      <option value="">Select team...</option>
                      {teams.filter(t => t.tournament === selectedMatch.tournament).map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                    </select>
                    <button onClick={handleAssign} disabled={!assignForm.tournament_team} className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-red-dark disabled:opacity-50">Assign</button>
                  </div>
                </div>

                {/* Record Scores */}
                <div className="bg-slate-50 rounded-2xl p-4">
                  <h4 className="font-bold text-xs text-slate-700 mb-3">Record Scores</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Side A</label>
                      <input type="number" value={scoreForm.side_a_score} onChange={e => setScoreForm(p => ({ ...p, side_a_score: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white border border-brand-border rounded-lg text-sm" />
                    </div>
                    <span className="font-bold text-slate-400 mt-6">:</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Side B</label>
                      <input type="number" value={scoreForm.side_b_score} onChange={e => setScoreForm(p => ({ ...p, side_b_score: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white border border-brand-border rounded-lg text-sm" />
                    </div>
                    <button onClick={handleRecordScores} className="px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-brand-red-dark mt-6">Save Scores</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
