import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Gamepad2, Clock, Trash2, CheckCircle, XCircle, Users, Trophy, Activity, BarChart3, Calendar, Target, Medal, TrendingUp, Play, Flag, Shield, AlertTriangle, Info, Timer, Lock } from 'lucide-react';
import * as eventsApi from '../api/eventsApi';
import type { BackendMatch, BackendTournamentTeam, SideType, BackendStanding } from '../api/eventsApi';
import AdminMatchCard from '../shared/AdminMatchCard';
import VexAllianceDisplay, { sidesFromMatch } from '../shared/VexAllianceDisplay';
import { getSideTeamNames, sideLabel, canAddTeamToSide, TEAMS_PER_ALLIANCE } from '../shared/vexAllianceUtils';
import { VEX_ALLIANCE_CONFIG, VEX_SCORING_RULES } from '../shared/vexConstants';

const defaultForm = { tournament: '', round: '', scheduled_at: '', side_a_teams: [] as string[], side_b_teams: [] as string[], roundCount: 1 };
const defaultScoreForm = { side_a_score: 0, side_b_score: 0 };

/* ─── Standings computation (client-side) ─── */
function computeStandings(
  teams: BackendTournamentTeam[],
  completedMatches: BackendMatch[],
): (BackendStanding & { totalScore: number; matchesPlayed: number })[] {
  const map = new Map<string, { wins: number; losses: number; draws: number; points: number; totalScore: number; matchesPlayed: number }>();
  for (const t of teams) {
    map.set(t.id, { wins: 0, losses: 0, draws: 0, points: 0, totalScore: 0, matchesPlayed: 0 });
  }
  for (const m of completedMatches) {
    const sideA = m.sides?.find(s => s.side === 'SIDE_A');
    const sideB = m.sides?.find(s => s.side === 'SIDE_B');
    if (!sideA || !sideB) continue;
    const scoreA = sideA.score ?? 0;
    const scoreB = sideB.score ?? 0;
    for (const p of sideA.participants || []) {
      const entry = map.get(p.tournament_team);
      if (!entry) continue;
      entry.matchesPlayed++;
      entry.totalScore += scoreA;
      if (scoreA > scoreB) { entry.wins++; entry.points += 2; }
      else if (scoreA === scoreB) { entry.draws++; entry.points += 1; }
      else entry.losses++;
    }
    for (const p of sideB.participants || []) {
      const entry = map.get(p.tournament_team);
      if (!entry) continue;
      entry.matchesPlayed++;
      entry.totalScore += scoreB;
      if (scoreB > scoreA) { entry.wins++; entry.points += 2; }
      else if (scoreA === scoreB) { entry.draws++; entry.points += 1; }
      else entry.losses++;
    }
  }
  const teamMap = new Map(teams.map(t => [t.id, t]));
  return Array.from(map.entries())
    .map(([teamId, stats]) => ({
      rank: 0,
      team_id: teamId,
      team_name: teamMap.get(teamId)?.team_name || 'Unknown',
      ...stats,
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.totalScore - a.totalScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

type ToastType = { id: number; type: 'success' | 'error' | 'info'; message: string; title?: string };
type ConfirmAction = { title: string; message: string; onConfirm: () => void; confirmLabel?: string; variant?: 'danger' | 'primary' };

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
  const [showClosed, setShowClosed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedMatch, setSelectedMatch] = useState<BackendMatch | null>(null);
  const [assignForm, setAssignForm] = useState({ side: 'SIDE_A' as SideType, tournament_team: '' });
  const [scoreForm, setScoreForm] = useState(defaultScoreForm);
  const [showDashboard, setShowDashboard] = useState(true);

  /* Toast system */
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const toastId = useRef(0);
  const addToast = useCallback((type: ToastType['type'], message: string, title?: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* Confirm modal */
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  /* Countdown state */
  const [countdown, setCountdown] = useState<{ matchId: string; matchName: string; count: number } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Bulk close state */
  const [bulkClose, setBulkClose] = useState<{ show: boolean; type: 'matches' | 'tournaments' | 'all'; loading: boolean; progress: string }>({ show: false, type: 'matches', loading: false, progress: '' });

  /* Match timer state */
  const [elapsedMap, setElapsedMap] = useState<Record<string, string>>({});
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const live = matches.filter(m => m.status === 'LIVE');
    if (live.length === 0) { if (timerInterval.current) clearInterval(timerInterval.current); timerInterval.current = null; return; }
    const tick = () => {
      const next: Record<string, string> = {};
      for (const m of live) {
        if (m.started_at) {
          const diff = Date.now() - new Date(m.started_at).getTime();
          const mmin = Math.floor(diff / 60000);
          const ssec = Math.floor((diff % 60000) / 1000);
          next[m.id] = `${String(mmin).padStart(2, '0')}:${String(ssec).padStart(2, '0')}`;
        }
      }
      setElapsedMap(next);
    };
    tick();
    timerInterval.current = setInterval(tick, 1000);
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [matches]);


  /* Standings state */
  const [showStandings, setShowStandings] = useState(false);
  const [standingsTournament, setStandingsTournament] = useState('');

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
  const openEdit = (m: BackendMatch) => {
    const sideA = m.sides?.find(s => s.side === 'SIDE_A')?.participants?.map(p => p.tournament_team) || [];
    const sideB = m.sides?.find(s => s.side === 'SIDE_B')?.participants?.map(p => p.tournament_team) || [];
    setEditingId(m.id);
    setForm({ tournament: m.tournament, round: m.round, scheduled_at: m.scheduled_at?.slice(0, 16) || '', side_a_teams: sideA, side_b_teams: sideB, roundCount: 1 });
    setShowForm(true);
  };

  const assignTeams = async (matchId: string, a: string[], b: string[]) => {
    for (const tid of a) await eventsApi.adminAssignTeamToMatch(matchId, { side: 'SIDE_A', tournament_team: tid });
    for (const tid of b) await eventsApi.adminAssignTeamToMatch(matchId, { side: 'SIDE_B', tournament_team: tid });
  };

  const handleSave = async () => {
    if (!form.tournament || !form.round || !form.scheduled_at) { addToast('error', 'Tournament, round and date are required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await eventsApi.adminUpdateMatch(editingId, { tournament: form.tournament, round: form.round, scheduled_at: form.scheduled_at });
        const mt = await eventsApi.adminGetMatch(editingId);
        const existingA = new Set(mt.sides?.find(s => s.side === 'SIDE_A')?.participants?.map(p => p.tournament_team) || []);
        const existingB = new Set(mt.sides?.find(s => s.side === 'SIDE_B')?.participants?.map(p => p.tournament_team) || []);
        const newA = form.side_a_teams.filter(t => !existingA.has(t));
        const newB = form.side_b_teams.filter(t => !existingB.has(t));
        const removeA = [...existingA].filter(t => !form.side_a_teams.includes(t));
        const removeB = [...existingB].filter(t => !form.side_b_teams.includes(t));
        for (const tid of removeA) await eventsApi.adminRemoveTeamFromMatch(editingId, { side: 'SIDE_A', tournament_team: tid });
        for (const tid of removeB) await eventsApi.adminRemoveTeamFromMatch(editingId, { side: 'SIDE_B', tournament_team: tid });
        for (const tid of newA) await eventsApi.adminAssignTeamToMatch(editingId, { side: 'SIDE_A', tournament_team: tid });
        for (const tid of newB) await eventsApi.adminAssignTeamToMatch(editingId, { side: 'SIDE_B', tournament_team: tid });
        addToast('success', `Match "${form.round}" updated`);
      } else {
        for (let i = 0; i < form.roundCount; i++) {
          const roundName = form.roundCount > 1 ? `${form.round} ${i + 1}` : form.round;
          const created = await eventsApi.adminCreateMatch({ tournament: form.tournament, round: roundName, scheduled_at: form.scheduled_at } as any);
          await assignTeams(created.id, form.side_a_teams, form.side_b_teams);
        }
        addToast('success', `${form.roundCount} match${form.roundCount > 1 ? 'es' : ''} created`);
      }
      setShowForm(false); load();
    } catch (err: any) { addToast('error', err.message || 'Failed to save match'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setConfirm({
      title: 'Delete Alliance Match',
      message: 'This will permanently remove this match and all team assignments. This action cannot be undone.',
      confirmLabel: 'Delete Match',
      variant: 'danger',
      onConfirm: async () => {
        try { await eventsApi.adminDeleteMatch(id); load(); addToast('success', 'Match deleted successfully'); } catch (err: any) { addToast('error', err.message || 'Failed to delete match'); }
      },
    });
  };

  const handleAssign = async () => {
    if (!selectedMatch || !assignForm.tournament_team) return;
    const teamName = teams.find(t => t.id === assignForm.tournament_team)?.team_name || '';
    try {
      await eventsApi.adminAssignTeamToMatch(selectedMatch.id, assignForm);
      setAssignForm({ side: 'SIDE_A', tournament_team: '' });
      addToast('success', `${teamName} assigned to ${sideLabel(assignForm.side)} alliance`);
      load();
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
    } catch (err: any) { addToast('error', `Assign failed: ${err.message}`); load(); }
  };

  const handleRemoveTeam = async (side: SideType, teamId: string) => {
    if (!selectedMatch) return;
    const teamName = teams.find(t => t.id === teamId)?.team_name || '';
    try {
      await eventsApi.adminRemoveTeamFromMatch(selectedMatch.id, { side, tournament_team: teamId });
      addToast('info', `${teamName} removed from ${sideLabel(side)} alliance`);
      load();
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
    } catch (err: any) {
      addToast('error', `Remove failed: ${err.message}`);
      load();
    }
  };

  const handleRecordScores = async () => {
    if (!selectedMatch) return;
    const { side_a_score, side_b_score } = scoreForm;
    try {
      await eventsApi.adminRecordMatchScores(selectedMatch.id, scoreForm);
      addToast('success', `${VEX_ALLIANCE_CONFIG.redLabel} ${side_a_score} : ${side_b_score} ${VEX_ALLIANCE_CONFIG.blueLabel} — Scores recorded!`);
      load();
      const updated = await eventsApi.adminGetMatch(selectedMatch.id);
      setSelectedMatch(updated);
    } catch (err: any) { addToast('error', `Scores failed: ${err.message}`); load(); }
  };

  const handleComplete = async () => {
    if (!selectedMatch) return;
    setConfirm({
      title: 'Complete Alliance Match',
      message: `Finalize "${selectedMatch.round}"? Scores will be locked and standings updated.`,
      confirmLabel: 'Complete Match',
      variant: 'primary',
      onConfirm: async () => {
        try {
          await eventsApi.adminCompleteMatch(selectedMatch.id);
          addToast('success', `"${selectedMatch.round}" is now complete! Standings updated.`);
          load();
          const updated = await eventsApi.adminGetMatch(selectedMatch.id);
          setSelectedMatch(updated);
        } catch (err: any) { addToast('error', `Complete failed: ${err.message}`); load(); }
      },
    });
  };

  const doStartMatch = async (id: string) => {
    const match = matches.find(m => m.id === id);
    if (!match) return;
    try {
      await eventsApi.adminUpdateMatch(id, { status: 'LIVE' as any });
      addToast('success', `"${match.round}" is LIVE! Timer started.`);
      load();
      if (selectedMatch?.id === id) {
        const updated = await eventsApi.adminGetMatch(id);
        setSelectedMatch(updated);
      }
    } catch (err: any) { addToast('error', `Start failed: ${err.message}`); }
  };

  const handleStartMatch = (id: string) => {
    const match = matches.find(m => m.id === id);
    if (!match) return;
    setConfirm({
      title: 'Start Alliance Match',
      message: `Start "${match.round}"? A 5-second countdown will play before the match goes LIVE.`,
      confirmLabel: 'Begin Countdown',
      variant: 'primary',
      onConfirm: () => {
        setCountdown({ matchId: id, matchName: match.round, count: 5 });
      },
    });
  };

  /* Countdown effect - runs once when countdown shows, ticks every second until 0 then fires match start */
  useEffect(() => {
    if (!countdown) return;
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (!prev) return null;
        if (prev.count <= 1) {
          if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
          doStartMatch(prev.matchId);
          return null;
        }
        return { ...prev, count: prev.count - 1 };
      });
    }, 1000);
    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } };
  }, [!!countdown]);

  /* ─── Bulk Close ─── */
  const handleBulkClose = async () => {
    setBulkClose(prev => ({ ...prev, loading: true, progress: 'Preparing...' }));
    let completed = 0; let skipped = 0; let failed = 0;
    try {
      if (bulkClose.type === 'matches' || bulkClose.type === 'all') {
        const liveMatches = matches.filter(m => m.status === 'LIVE');
        for (let i = 0; i < liveMatches.length; i++) {
          const m = liveMatches[i];
          setBulkClose(prev => ({ ...prev, progress: `Completing live match ${i + 1}/${liveMatches.length}: ${m.round}` }));
          try {
            const sideA = m.sides?.find(s => s.side === 'SIDE_A');
            const sideB = m.sides?.find(s => s.side === 'SIDE_B');
            const hasScores = (sideA?.score ?? 0) > 0 || (sideB?.score ?? 0) > 0;
            if (!hasScores) {
              await eventsApi.adminRecordMatchScores(m.id, { side_a_score: 0, side_b_score: 0 });
            }
            await eventsApi.adminCompleteMatch(m.id);
            completed++;
          } catch { failed++; }
        }
        const schMatches = matches.filter(m => m.status === 'SCHEDULED');
        if (schMatches.length > 0) skipped += schMatches.length;
        const skippedMsg = skipped > 0 ? ` (${skipped} scheduled skipped — must be LIVE first)` : '';
        if (completed > 0 || failed > 0) addToast(completed > 0 ? 'success' : 'error', `Completed ${completed} live matches, ${failed} failed${skippedMsg}`);
      }
      if (bulkClose.type === 'tournaments' || bulkClose.type === 'all') {
        const openTournaments = tournaments.filter((t: any) => !t.is_closed);
        for (let i = 0; i < openTournaments.length; i++) {
          const t = openTournaments[i];
          setBulkClose(prev => ({ ...prev, progress: `Closing tournament ${i + 1}/${openTournaments.length}: ${t.event_title || t.event || t.id.slice(0, 8)}` }));
          try { await eventsApi.adminCloseTournament(t.id); completed++; } catch { failed++; }
        }
      }
      addToast('success', `Bulk operation done! ${completed} completed, ${skipped} skipped, ${failed} failed.`, 'Bulk Close');
      setBulkClose(prev => ({ ...prev, show: false, loading: false }));
      load();
    } catch (err: any) {
      addToast('error', err.message || 'Bulk close failed');
      setBulkClose(prev => ({ ...prev, loading: false }));
    }
  };

  /* ─── Standings (client-side computed) ─── */
  const standingsData = useMemo(() => {
    if (!standingsTournament) return [];
    const tournamentTeams = teams.filter(t => t.tournament === standingsTournament);
    const completedMatches = matches.filter(m => m.tournament === standingsTournament && m.status === 'COMPLETED');
    return computeStandings(tournamentTeams, completedMatches);
  }, [standingsTournament, teams, matches]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-700', LIVE: 'bg-red-100 text-red-700 animate-pulse',
      COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const getTournamentName = useCallback((matchOrId: BackendMatch | string): string => {
    const id = typeof matchOrId === 'string' ? matchOrId : matchOrId.tournament;
    if (!id) return '—';
    const found = tournaments.find((t: any) => t.id === id);
    if (found) return found.event_title || found.event || found.id;
    if (typeof matchOrId !== 'string') return matchOrId.tournament_title || `Tournament #${id.slice(0, 6)}`;
    return `Tournament #${id.slice(0, 6)}`;
  }, [tournaments]);

  const filtered = matches.filter(m => {
    const matchesSearch = m.round?.toLowerCase().includes(search.toLowerCase());
    const matchesTournament = tournamentFilter === 'all' || m.tournament === tournamentFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const tournament = tournaments.find((t: any) => t.id === m.tournament);
    const matchesClosed = showClosed || !tournament?.is_closed;
    return matchesSearch && matchesTournament && matchesStatus && matchesClosed;
  });

  const totalMatches = matches.length;
  const liveCount = matches.filter(m => m.status === 'LIVE').length;
  const completedCount = matches.filter(m => m.status === 'COMPLETED').length;
  const scheduledCount = matches.filter(m => m.status === 'SCHEDULED').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {error && (<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>)}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
              className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${
                t.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                t.type === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                t.type === 'success' ? 'bg-emerald-500' :
                t.type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`}>
                {t.type === 'success' ? <CheckCircle className="w-4 h-4 text-white" /> :
                 t.type === 'error' ? <AlertCircle className="w-4 h-4 text-white" /> :
                 <Info className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-xs font-black text-slate-800">{t.title}</p>}
                <p className="text-[11px] text-slate-600 mt-0.5">{t.message}</p>
              </div>
              <button onClick={() => removeToast(t.id)} className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-slate-400">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-red" />
            <h3 className="font-black text-lg text-slate-900">VEX Match Control</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {VEX_ALLIANCE_CONFIG.redLabel} vs {VEX_ALLIANCE_CONFIG.blueLabel} · {TEAMS_PER_ALLIANCE} teams per alliance · {completedCount} completed / {totalMatches} total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowDashboard(p => !p)} className="px-3 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {showDashboard ? 'Hide' : 'Stats'}</button>
          <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red">
            <option value="all">All Tournaments</option>
            {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.event_title || t.event || t.id.slice(0, 8)}{t.is_closed ? ' (Closed)' : ''}</option>)}
          </select>
          <button onClick={() => setShowClosed(p => !p)}
            className={`text-[10px] font-black tracking-wider px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              showClosed ? 'bg-slate-700 text-white border border-slate-600' : 'bg-white text-slate-400 border border-slate-200'
            }`}>
            <Lock className="w-3 h-3" />{showClosed ? 'Hide Closed' : 'Show Closed'}
          </button>
          <span className="text-[9px] font-bold px-2 py-1.5 rounded-full bg-purple-100 text-purple-600 flex items-center gap-1"><Trophy className="w-3 h-3" />TOURNAMENT</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red">
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rounds..." className="w-48 pl-9 pr-3 py-2 bg-white border border-brand-border rounded-xl text-xs focus:outline-none focus:border-brand-red" /></div>
          <button onClick={() => { setStandingsTournament(tournamentFilter === 'all' ? '' : tournamentFilter); setShowStandings(true); }}
            className="px-3 py-2 bg-purple-50 text-purple-700 font-black text-xs rounded-xl hover:bg-purple-100 flex items-center gap-1.5 border border-purple-200"><Target className="w-4 h-4" /> Standings</button>
          <button onClick={() => setBulkClose(prev => ({ ...prev, show: true }))} className="px-3 py-2 bg-red-50 text-red-700 font-black text-xs rounded-xl hover:bg-red-100 flex items-center gap-1.5 border border-red-200"><XCircle className="w-4 h-4" /> Close All</button>
          <button onClick={openCreate} className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-red/25"><Plus className="w-4 h-4" /> New Match</button>
        </div>
      </div>

      {/* Live matches bar */}
      <AnimatePresence>
        {liveCount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 text-white overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-black uppercase">{liveCount} Alliance Match{liveCount > 1 ? 'es' : ''} LIVE</span>
              <span className="text-[9px] text-white/60 ml-auto">Click to score & manage</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {matches.filter(m => m.status === 'LIVE').slice(0, 4).map(m => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedMatch(m); setScoreForm({ side_a_score: m.sides?.find(s => s.side === 'SIDE_A')?.score ?? 0, side_b_score: m.sides?.find(s => s.side === 'SIDE_B')?.score ?? 0 }); }}
                  className="bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-left text-xs font-bold transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{m.round}</span>
                    {elapsedMap[m.id] && (
                      <span className="shrink-0 flex items-center gap-1 text-[9px] font-mono text-white/80 bg-white/10 px-1.5 py-0.5 rounded">
                        <Timer className="w-3 h-3" /> {elapsedMap[m.id]}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/70 mt-0.5">
                    {getSideTeamNames(m.sides?.find(s => s.side === 'SIDE_A')?.participants).join(' & ') || 'RED'} vs {getSideTeamNames(m.sides?.find(s => s.side === 'SIDE_B')?.participants).join(' & ') || 'BLUE'}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white border border-brand-border rounded-2xl">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
            <Gamepad2 className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          </motion.div>
          <p className="font-bold text-slate-500 text-lg">No matches yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Create your first alliance match to get started.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={openCreate} className="px-4 py-2 bg-brand-red text-white text-xs font-black rounded-xl flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Match</button>
          </div>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.03 }}
              >
                <AdminMatchCard
                  match={m}
                  onClick={() => {
                    const sideA = m.sides?.find(s => s.side === 'SIDE_A');
                    const sideB = m.sides?.find(s => s.side === 'SIDE_B');
                    setSelectedMatch(m);
                    setScoreForm({ side_a_score: sideA?.score ?? 0, side_b_score: sideB?.score ?? 0 });
                  }}
                  onStart={m.status === 'SCHEDULED' ? () => handleStartMatch(m.id) : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
                    <option value="">Select tournament...</option>{tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.event_title || t.event || t.id.slice(0, 8)}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Round *</label>
                    <input value={form.round} onChange={e => setForm(p => ({ ...p, round: e.target.value }))} placeholder="e.g. Final" className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Rounds to create</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setForm(p => ({ ...p, roundCount: n }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${form.roundCount === n ? 'bg-brand-red text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Scheduled At *</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-red" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />{VEX_ALLIANCE_CONFIG.redLabel} Teams ({form.side_a_teams.length})
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-50/70 border border-brand-border p-1.5">
                      {teams.filter(t => !form.tournament || t.tournament === form.tournament).length === 0 && (
                        <p className="text-[11px] text-slate-400 text-center py-3">No teams for this tournament</p>
                      )}
                      {teams.filter(t => !form.tournament || t.tournament === form.tournament).map(t => {
                        const checked = form.side_a_teams.includes(t.id);
                        const onB = form.side_b_teams.includes(t.id);
                        return (
                          <label key={t.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs font-medium ${checked ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : onB ? 'bg-slate-100 text-slate-400 line-through' : 'hover:bg-slate-100 text-slate-600'}`}>
                            <input type="checkbox" checked={checked} disabled={onB}
                              onChange={() => setForm(p => ({ ...p, side_a_teams: checked ? p.side_a_teams.filter(x => x !== t.id) : [...p.side_a_teams, t.id] }))} />
                            {t.team_name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{VEX_ALLIANCE_CONFIG.blueLabel} Teams ({form.side_b_teams.length})
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-50/70 border border-brand-border p-1.5">
                      {teams.filter(t => !form.tournament || t.tournament === form.tournament).length === 0 && (
                        <p className="text-[11px] text-slate-400 text-center py-3">No teams for this tournament</p>
                      )}
                      {teams.filter(t => !form.tournament || t.tournament === form.tournament).map(t => {
                        const checked = form.side_b_teams.includes(t.id);
                        const onA = form.side_a_teams.includes(t.id);
                        return (
                          <label key={t.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs font-medium ${checked ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : onA ? 'bg-slate-100 text-slate-400 line-through' : 'hover:bg-slate-100 text-slate-600'}`}>
                            <input type="checkbox" checked={checked} disabled={onA}
                              onChange={() => setForm(p => ({ ...p, side_b_teams: checked ? p.side_b_teams.filter(x => x !== t.id) : [...p.side_b_teams, t.id] }))} />
                            {t.team_name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
              className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div
                      animate={selectedMatch.status === 'LIVE' ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Gamepad2 className="w-5 h-5 text-brand-red" />
                    </motion.div>
                    <h3 className="font-black text-lg text-slate-900">{selectedMatch.round}</h3>
                    <motion.span
                      key={selectedMatch.status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(selectedMatch.status)}`}
                    >
                      {selectedMatch.status}
                    </motion.span>
                    {selectedMatch.status === 'LIVE' && elapsedMap[selectedMatch.id] && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[9px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <Timer className="w-3 h-3" /> {elapsedMap[selectedMatch.id]}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {getTournamentName(selectedMatch)}
                    {!tournaments.find((t: any) => t.id === selectedMatch.tournament) && selectedMatch.tournament && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-2.5 h-2.5" /> Not in current list
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMatch.status === 'SCHEDULED' && (
                    <button onClick={() => handleStartMatch(selectedMatch.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-colors">
                      <Play className="w-4 h-4" /> Start Match
                    </button>
                  )}
                  {selectedMatch.status === 'LIVE' && (
                    <button onClick={handleComplete}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white text-xs font-black rounded-xl hover:bg-brand-red-dark transition-colors">
                      <Flag className="w-4 h-4" /> Complete
                    </button>
                  )}
                  <button onClick={() => setSelectedMatch(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </div>
              </div>

              {/* VEX Alliance Display */}
              <motion.div
                key={selectedMatch.status + selectedMatch.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="mb-6"
              >
                {(() => {
                  const sideAData = selectedMatch.sides?.find(s => s.side === 'SIDE_A');
                  const sideBData = selectedMatch.sides?.find(s => s.side === 'SIDE_B');
                  const sides = [
                    { side: 'SIDE_A' as const, score: sideAData?.score ?? null, teams: getSideTeamNames(sideAData?.participants) },
                    { side: 'SIDE_B' as const, score: sideBData?.score ?? null, teams: getSideTeamNames(sideBData?.participants) },
                  ];
                  const { sideA, sideB } = sidesFromMatch(sides);
                  return (
                    <VexAllianceDisplay
                      sideA={sideA}
                      sideB={sideB}
                      winningSide={selectedMatch.winning_side_label || selectedMatch.winning_side}
                      variant="broadcast"
                      isLive={selectedMatch.status === 'LIVE'}
                    />
                  );
                })()}
              </motion.div>

              {/* Alliance team slots */}
              <motion.div layout className="grid grid-cols-2 gap-4 mb-6">
                {(['SIDE_A', 'SIDE_B'] as SideType[]).map(sideKey => {
                  const side = selectedMatch.sides?.find(s => s.side === sideKey);
                  const count = side?.participants?.length || 0;
                  const isRed = sideKey === 'SIDE_A';
                  const isReady = count >= TEAMS_PER_ALLIANCE;
                  return (
                    <motion.div
                      key={sideKey}
                      layout
                      initial={{ opacity: 0, x: isRed ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-2xl p-4 border-2 transition-colors ${
                        isRed
                          ? `${isReady ? 'border-red-300 bg-red-50' : 'border-red-200/50 bg-red-50/30'}`
                          : `${isReady ? 'border-blue-300 bg-blue-50' : 'border-blue-200/50 bg-blue-50/30'}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isRed ? 'text-red-600' : 'text-blue-600'}`}>
                            {sideLabel(sideKey)}
                          </span>
                          {isReady && <CheckCircle className={`w-3 h-3 ${isRed ? 'text-red-500' : 'text-blue-500'}`} />}
                        </div>
                        <span className={`text-[9px] font-bold ${count >= TEAMS_PER_ALLIANCE ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {count}/{TEAMS_PER_ALLIANCE}
                        </span>
                      </div>
                      <AnimatePresence mode="popLayout">
                        {[0, 1].map(slot => {
                          const p = side?.participants?.[slot];
                          return (
                            <motion.div
                              key={slot}
                              layout
                              initial={{ opacity: 0, x: -8, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: 'auto' }}
                              exit={{ opacity: 0, x: 8, height: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 mb-1.5 border border-slate-100"
                            >
                              {p ? (
                                <>
                                  <span className="text-xs font-bold text-slate-900">{p.team_name || p.tournament_team_name}</span>
                                  {selectedMatch.status !== 'COMPLETED' && selectedMatch.status !== 'CANCELLED' && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleRemoveTeam(sideKey, p.tournament_team)}
                                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </motion.button>
                                  )}
                                </>
                              ) : selectedMatch.status !== 'COMPLETED' && selectedMatch.status !== 'CANCELLED' ? (
                                <span className="text-xs text-slate-400 italic flex items-center gap-1.5">
                                  <Users className="w-3 h-3" /> Slot {slot + 1} — open
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {selectedMatch.status === 'SCHEDULED' && !isReady && (
                        <p className="text-[9px] text-amber-600 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Need {TEAMS_PER_ALLIANCE - count} more team{TEAMS_PER_ALLIANCE - count > 1 ? 's' : ''}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Times */}
              <motion.div layout className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Calendar, label: 'Scheduled', value: selectedMatch.scheduled_at?.slice(0, 16) || '—' },
                  { icon: selectedMatch.status === 'LIVE' ? Timer : Clock, label: 'Started', value: selectedMatch.started_at?.slice(0, 16) || '—' },
                  { icon: CheckCircle, label: 'Completed', value: selectedMatch.completed_at?.slice(0, 16) || '—' },
                ].map((m, i) => {
                  const MIcon = m.icon;
                  const isActive = (i === 1 && selectedMatch.status === 'LIVE') || (i === 2 && selectedMatch.status === 'COMPLETED');
                  return (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-xl p-3 border transition-colors ${
                        isActive
                          ? i === 1 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <MIcon className={`w-4 h-4 mb-1 ${isActive ? (i === 1 ? 'text-red-500' : 'text-emerald-500') : 'text-brand-red'}`} />
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{m.label}</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        {m.value}
                        {i === 1 && selectedMatch.status === 'LIVE' && elapsedMap[selectedMatch.id] && (
                          <span className="ml-1.5 text-red-600 font-mono">({elapsedMap[selectedMatch.id]})</span>
                        )}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="flex flex-col gap-4">
                {/* Assign Teams */}
                {selectedMatch.status !== 'COMPLETED' && selectedMatch.status !== 'CANCELLED' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Assign to Alliance
                        <span className="text-[9px] text-slate-400 font-normal">(max {TEAMS_PER_ALLIANCE} per side)</span>
                      </h4>
                      <span className="text-[9px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {teams.filter(t => t.tournament === selectedMatch.tournament).length} available
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 px-3 py-1.5">
                        <span className="text-[9px] font-bold uppercase text-slate-400">Side</span>
                        <select value={assignForm.side} onChange={e => setAssignForm(p => ({ ...p, side: e.target.value as SideType }))} className="text-xs bg-transparent border-0 focus:outline-none">
                          <option value="SIDE_A">🔴 {VEX_ALLIANCE_CONFIG.redLabel}</option>
                          <option value="SIDE_B">🔵 {VEX_ALLIANCE_CONFIG.blueLabel}</option>
                        </select>
                      </div>
                      <select value={assignForm.tournament_team} onChange={e => setAssignForm(p => ({ ...p, tournament_team: e.target.value }))} className="flex-1 min-w-[160px] px-3 py-2 bg-white border border-brand-border rounded-lg text-xs">
                        <option value="">Pick a team...</option>
                        {teams.filter(t => t.tournament === selectedMatch.tournament).map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                      </select>
                      <motion.button
                        whileHover={assignForm.tournament_team ? { scale: 1.03 } : {}}
                        whileTap={assignForm.tournament_team ? { scale: 0.97 } : {}}
                        onClick={handleAssign}
                        disabled={!assignForm.tournament_team || !canAddTeamToSide(
                          selectedMatch.sides?.find(s => s.side === assignForm.side)?.participants?.length || 0
                        )}
                        className="px-5 py-2 bg-gradient-to-r from-brand-red to-brand-red-dark text-white text-xs font-black rounded-lg shadow-lg shadow-brand-red/25 disabled:opacity-40 disabled:shadow-none"
                      >
                        Assign
                      </motion.button>
                    </div>
                    {!canAddTeamToSide(selectedMatch.sides?.find(s => s.side === assignForm.side)?.participants?.length || 0) && (
                      <p className="text-[9px] text-amber-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Selected alliance side is full ({TEAMS_PER_ALLIANCE}/{TEAMS_PER_ALLIANCE})
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Record Scores */}
                {selectedMatch.status !== 'COMPLETED' && selectedMatch.status !== 'CANCELLED' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border-2 border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> Record Alliance Scores
                      </h4>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        <Info className="w-3 h-3" /> {selectedMatch.status === 'LIVE' ? 'Live scoring' : 'Pre-match scoring'}
                      </div>
                    </div>

                    {/* Animated scoreboard */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1 text-center">
                        <div className="text-[9px] font-black uppercase tracking-wider text-red-600 mb-1">{VEX_ALLIANCE_CONFIG.redLabel} Alliance</div>
                        <div className="relative">
                          <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
                            <input type="number" value={scoreForm.side_a_score}
                              onChange={e => setScoreForm(p => ({ ...p, side_a_score: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="w-full text-center text-4xl font-black py-4 bg-transparent text-red-700 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <motion.div
                            key={scoreForm.side_a_score}
                            initial={{ scale: 1.3, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg"
                          >
                            {scoreForm.side_a_score}
                          </motion.div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 mt-6">
                        <span className="font-black text-3xl text-slate-300">:</span>
                      </div>

                      <div className="flex-1 text-center">
                        <div className="text-[9px] font-black uppercase tracking-wider text-blue-600 mb-1">{VEX_ALLIANCE_CONFIG.blueLabel} Alliance</div>
                        <div className="relative">
                          <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
                            <input type="number" value={scoreForm.side_b_score}
                              onChange={e => setScoreForm(p => ({ ...p, side_b_score: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="w-full text-center text-4xl font-black py-4 bg-transparent text-blue-700 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                          <motion.div
                            key={scoreForm.side_b_score}
                            initial={{ scale: 1.3, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg"
                          >
                            {scoreForm.side_b_score}
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${selectedMatch.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                        {selectedMatch.status === 'LIVE' ? 'Match in progress — scores update live' : 'Set scores before completing'}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRecordScores}
                        className="px-6 py-2.5 bg-gradient-to-r from-brand-red to-brand-red-dark text-white text-xs font-black rounded-xl shadow-lg shadow-brand-red/25 flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> Save Scores
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {selectedMatch.status === 'COMPLETED' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-2xl p-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    </motion.div>
                    <p className="text-sm font-black text-emerald-800">Match Completed</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Scores are locked. Results recorded to standings.</p>
                    <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
                      <span className="flex items-center gap-1 font-bold text-emerald-700">
                        <Trophy className="w-3 h-3" /> Winner: {selectedMatch.winning_side_label || selectedMatch.winning_side || '—'}
                      </span>
                    </div>
                  </motion.div>
                )}

                {selectedMatch.status === 'CANCELLED' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    >
                      <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    </motion.div>
                    <p className="text-sm font-black text-red-800">Match Cancelled</p>
                    <p className="text-[10px] text-red-600 mt-1">This match has been voided. No further changes allowed.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Standings Modal */}
        {showStandings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStandings(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center"><Target className="w-5 h-5 text-purple-600" /></div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Live Standings</h3>
                    <p className="text-xs text-slate-500">
                      {standingsTournament
                        ? `${standingsData.length} teams · ${matches.filter(m => m.tournament === standingsTournament && m.status === 'COMPLETED').length} matches completed`
                        : 'Select a tournament to view standings'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={standingsTournament} onChange={e => setStandingsTournament(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-red">
                    <option value="">All tournaments</option>
                    {tournaments.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.event_title || t.event || t.id.slice(0, 8)}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowStandings(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </div>
              </div>

              {standingsData.length > 0 ? (
                <div className="border border-brand-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-brand-border">
                        <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">#</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Team</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">MP</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">W</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">L</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">D</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">TS</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {standingsData.map((s, i) => (
                        <tr key={s.team_id} className={`hover:bg-slate-50/50 ${i === 0 ? 'bg-amber-50/50' : i === 1 ? 'bg-slate-50/50' : i === 2 ? 'bg-orange-50/30' : ''}`}>
                          <td className="px-4 py-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              i === 0 ? 'bg-amber-500 text-white' :
                              i === 1 ? 'bg-slate-400 text-white' :
                              i === 2 ? 'bg-orange-500 text-white' :
                              'bg-slate-100 text-slate-500'
                            }`}>{s.rank}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {i === 0 && <Medal className="w-3.5 h-3.5 text-amber-500" />}
                              {i === 1 && <Medal className="w-3.5 h-3.5 text-slate-400" />}
                              {i === 2 && <Medal className="w-3.5 h-3.5 text-orange-500" />}
                              <span className="text-xs font-semibold text-slate-900">{s.team_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs text-slate-500">{s.matchesPlayed}</td>
                          <td className="px-4 py-2.5 text-center text-xs text-emerald-600 font-bold">{s.wins}</td>
                          <td className="px-4 py-2.5 text-center text-xs text-red-500 font-bold">{s.losses}</td>
                          <td className="px-4 py-2.5 text-center text-xs text-amber-500 font-bold">{s.draws}</td>
                          <td className="px-4 py-2.5 text-center text-xs font-bold text-slate-700">{s.totalScore}</td>
                          <td className="px-4 py-2.5 text-center text-xs font-black text-slate-900">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                  <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-500">No standings yet</p>
                  <p className="text-xs text-slate-400 mt-1">Standings are computed from completed matches in real-time.</p>
                </div>
              )}

              {standingsData.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-brand-red" /> Legend</h4>
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <span className="text-slate-500"><span className="font-bold">MP</span> = Matches Played</span>
                    <span className="text-slate-500"><span className="font-bold">W</span> = Wins (2 pts)</span>
                    <span className="text-slate-500"><span className="font-bold">L</span> = Losses (0 pts)</span>
                    <span className="text-slate-500"><span className="font-bold">D</span> = Draws (1 pt)</span>
                    <span className="text-slate-500 col-span-2"><span className="font-bold">TS</span> = Total Score (tie-breaker)</span>
                    <span className="text-slate-500 col-span-2"><span className="font-bold">Pts</span> = Total Points</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
        {/* Countdown Overlay */}
        {countdown && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <motion.div
              key={countdown.count}
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative z-10 text-center"
            >
              <motion.span
                key={countdown.count}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[180px] font-black text-white drop-shadow-2xl"
                style={{ textShadow: '0 0 60px rgba(255,255,255,0.3)' }}
              >
                {countdown.count === 0 ? 'GO!' : countdown.count}
              </motion.span>
              <p className="text-white/60 text-sm mt-4 font-bold tracking-widest uppercase">{countdown.matchName}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[5, 4, 3, 2, 1].map(n => (
                  <div key={n} className={`w-2 h-2 rounded-full transition-all ${n <= countdown.count ? 'bg-white scale-100' : 'bg-white/20 scale-75'}`} />
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Bulk Close Modal */}
        {bulkClose.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { if (!bulkClose.loading) setBulkClose(prev => ({ ...prev, show: false })); }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              {bulkClose.loading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-sm font-medium text-slate-700 text-center">{bulkClose.progress}</p>
                </div>
              ) : (
                <>
                  <h3 className="font-black text-lg text-slate-900 mb-1">Bulk Close</h3>
                  <p className="text-sm text-slate-600 mb-4">What would you like to close?</p>
                  <div className="flex flex-col gap-2 mb-6">
                    {([
                      { id: 'matches' as const, label: 'All Live Matches', desc: `Complete ${matches.filter(m => m.status === 'LIVE').length} live matches (scheduled matches skipped — start them first)` },
                      { id: 'tournaments' as const, label: 'All Open Tournaments', desc: `Close ${tournaments.filter((t: any) => !t.is_closed).length} open tournaments` },
                      { id: 'all' as const, label: 'Both (Everything)', desc: `Complete all live matches and close all tournaments` },
                    ]).map(opt => (
                      <button key={opt.id} onClick={() => setBulkClose(prev => ({ ...prev, type: opt.id }))}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          bulkClose.type === opt.id ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          bulkClose.type === opt.id ? 'border-red-500' : 'border-slate-300'
                        }`}>
                          {bulkClose.type === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${bulkClose.type === opt.id ? 'text-red-700' : 'text-slate-700'}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setBulkClose(prev => ({ ...prev, show: false }))} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                    <button onClick={handleBulkClose} className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/25 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Execute Close
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 z-10"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                confirm.variant === 'danger' ? 'bg-red-100' : 'bg-emerald-100'
              }`}>
                {confirm.variant === 'danger'
                  ? <AlertTriangle className="w-6 h-6 text-red-600" />
                  : <Play className="w-6 h-6 text-emerald-600" />
                }
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">{confirm.title}</h3>
              <p className="text-sm text-slate-600 mb-6">{confirm.message}</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setConfirm(null)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button onClick={() => { confirm.onConfirm(); setConfirm(null); }}
                  className={`px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-lg flex items-center gap-1.5 ${
                    confirm.variant === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                  }`}
                >
                  {confirm.confirmLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
