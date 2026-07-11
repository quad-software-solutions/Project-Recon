import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Trophy, MapPin, Calendar, Users, DollarSign, Shield, Loader2, AlertCircle,
  Gamepad2, CheckCircle, Clock, Swords, Medal, Target, Flame, Award, ScrollText, Sparkles,
} from 'lucide-react';
import { getTournamentById, getMatches, getTournamentStandings, type StandingEntry } from '../../api/competitionApi';
import { type Tournament, type MatchResult } from '@/src/shared/types';

interface TournamentDetailPageProps {
  tournamentId: string;
  onBack: () => void;
}

type DetailTab = 'overview' | 'teams' | 'matches' | 'rankings' | 'results' | 'certificates';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

const MATCH_STATUS_STYLE: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-red-100 text-red-700 animate-pulse',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function TournamentDetailPage({ tournamentId, onBack }: TournamentDetailPageProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTournamentById(tournamentId),
      getMatches(tournamentId),
      getTournamentStandings(tournamentId),
    ]).then(([t, m, s]) => {
      if (!t) { setError('Tournament not found'); return; }
      setTournament(t);
      setMatches(m);
      setStandings(s);
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [tournamentId]);

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'live'), [matches]);
  const completedMatches = useMemo(() => matches.filter(m => m.status === 'completed'), [matches]);
  const upcomingMatches = useMemo(() => matches.filter(m => m.status === 'scheduled'), [matches]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
    </div>
  );

  if (error || !tournament) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm font-bold text-red-700">{error || 'Not found'}</p>
      <button onClick={onBack} className="mt-3 text-xs font-bold text-red-600 underline">Back</button>
    </div>
  );

  const TABS: { id: DetailTab; label: string; icon: typeof Trophy }[] = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'matches', label: 'Matches', icon: Gamepad2 },
    { id: 'rankings', label: 'Leaderboard', icon: Medal },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'certificates', label: 'Certificates', icon: ScrollText },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 mb-6 text-white">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/10">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                      <Trophy className="w-2.5 h-2.5" /> EthioRobotics
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                      <Sparkles className="w-2 h-2" /> 2025
                    </span>
                  </div>
                  <h2 className="font-black text-2xl md:text-3xl">{tournament.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[tournament.storedStatus]}`}>{tournament.storedStatus}</span>
                    <span className="text-[11px] text-white/60">{tournament.category}</span>
                  </div>
                </div>
              </div>
              {liveMatches.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-lg shadow-red-500/25">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {liveMatches.length} LIVE
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <Calendar className="w-4 h-4 text-white/60 mb-1" />
                <p className="text-[9px] font-black uppercase text-white/40">Date</p>
                <p className="text-xs font-bold mt-0.5">{new Date(tournament.startDateTime).toLocaleDateString()}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <MapPin className="w-4 h-4 text-white/60 mb-1" />
                <p className="text-[9px] font-black uppercase text-white/40">Location</p>
                <p className="text-xs font-bold mt-0.5 truncate">{tournament.location}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <Users className="w-4 h-4 text-white/60 mb-1" />
                <p className="text-[9px] font-black uppercase text-white/40">Teams</p>
                <p className="text-xs font-bold mt-0.5">{tournament.enrolledCount} / {tournament.maxTeams || '∞'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <DollarSign className="w-4 h-4 text-white/60 mb-1" />
                <p className="text-[9px] font-black uppercase text-white/40">Prize Pool</p>
                <p className="text-xs font-bold mt-0.5">{(tournament as any).prizePool || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto">
          {TABS.map(t => {
            const TIcon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-md shadow-brand-red/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <TIcon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="font-black text-base text-slate-900 mb-3">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{tournament.description || 'No description provided.'}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{standings.length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Registered Teams</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{matches.length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Matches</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{completedMatches.length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Completed</p>
              </div>
            </div>

            {/* Live matches alert */}
            {liveMatches.length > 0 && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black text-red-700 uppercase">Live Now</span>
                </div>
                {liveMatches.map(m => (
                  <div key={m.id} className="text-sm text-red-600">
                    <span className="font-bold">{m.team1}</span> vs <span className="font-bold">{m.team2}</span>
                    <span className="ml-2 font-black">{m.score1} : {m.score2}</span>
                  </div>
                ))}
              </div>
            )}

            {tournament.registrationMode !== 'NONE' && (
              <div className="mt-6 p-4 bg-brand-red/5 border border-brand-red/10 rounded-xl">
                <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-red" />Registration
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-500">Mode:</span> <span className="font-bold text-slate-800">{tournament.registrationMode}</span></div>
                  <div><span className="text-slate-500">Enabled:</span>
                    <span className={`font-bold ml-1 ${tournament.registrationEnabled ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tournament.registrationEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {tournament.registrationDeadline && (
                    <div><span className="text-slate-500">Deadline:</span> <span className="font-bold text-slate-800">{new Date(tournament.registrationDeadline).toLocaleDateString()}</span></div>
                  )}
                  {tournament.paymentRequired && tournament.registrationFee && (
                    <div><span className="text-slate-500">Fee:</span> <span className="font-bold text-amber-600">{tournament.registrationFee} ETB</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teams */}
        {tab === 'teams' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No teams registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">W</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">L</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">D</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{s.teamName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-emerald-600">{s.wins}</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-red-500">{s.losses}</td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">{s.draws}</td>
                        <td className="px-4 py-3 text-center text-sm font-black text-slate-900">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Matches */}
        {tab === 'matches' && (
          <div className="space-y-4">
            {liveMatches.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h4 className="font-black text-xs text-red-700 flex items-center gap-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE — {liveMatches.length} Match{liveMatches.length > 1 ? 'es' : ''}
                </h4>
                {liveMatches.map(m => (
                  <div key={m.id} className="bg-white rounded-xl px-4 py-3 border border-red-100 flex items-center justify-between mb-2 last:mb-0">
                    <span className="text-xs font-bold text-slate-700">{m.team1} vs {m.team2}</span>
                    <span className="text-sm font-black text-red-600">{m.score1} : {m.score2}</span>
                  </div>
                ))}
              </div>
            )}
            {upcomingMatches.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h4 className="font-black text-xs text-slate-700 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-red" />
                  Upcoming — {upcomingMatches.length} Match{upcomingMatches.length > 1 ? 'es' : ''}
                </h4>
                {upcomingMatches.map(m => (
                  <div key={m.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 flex items-center justify-between mb-2 last:mb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">{m.team1} vs {m.team2}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{m.round}</span>
                      <span className="text-[10px] text-slate-500">{new Date(m.time).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {completedMatches.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <h4 className="font-black text-xs text-slate-700 p-4 pb-0 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-red" />
                  Completed — {completedMatches.length} Match{completedMatches.length > 1 ? 'es' : ''}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Round</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team A</th>
                        <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Score</th>
                        <th className="text-right px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team B</th>
                        <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedMatches.map(m => {
                        const won = m.score1 > m.score2;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold text-slate-700">{m.round}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-slate-700">{m.team1}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-black ${won ? 'text-emerald-600' : 'text-red-500'}`}>
                                {m.score1} : {m.score2}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-xs font-medium text-slate-700">{m.team2}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${won ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {won ? 'W' : 'L'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {matches.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 text-center py-12">
                <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No matches yet</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {tab === 'rankings' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <Medal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No rankings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase w-16">Rank</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">W</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">L</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">D</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.map((s, i) => (
                      <tr key={i} className={`transition-colors ${i < 3 ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-4 py-3 text-center">
                          <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-black ${
                            i === 0 ? 'bg-amber-100 text-amber-600' :
                            i === 1 ? 'bg-slate-200 text-slate-600' :
                            i === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-slate-100 text-slate-400'
                          }`}>{i + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-bold text-slate-900">{s.teamName}</span>
                            {s.organization && <span className="text-[10px] text-slate-500 block">{s.organization}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-emerald-600">{s.wins}</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-red-500">{s.losses}</td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">{s.draws}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-base font-black text-slate-900">{s.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {tab === 'results' && (
          <div className="space-y-4">
            {completedMatches.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 text-center py-12">
                <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No results yet</p>
                <p className="text-xs text-slate-400 mt-1">Completed matches will appear here</p>
              </div>
            ) : (
              completedMatches.map(m => {
                const sideAWon = m.score1 > m.score2;
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl border p-5 ${
                      sideAWon ? 'border-emerald-200' : 'border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-500">{m.round}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        sideAWon ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {sideAWon ? `${m.team1} Wins` : `${m.team2} Wins`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center">
                        <div className={`font-bold text-sm ${sideAWon ? 'text-emerald-600' : 'text-slate-700'}`}>{m.team1}</div>
                      </div>
                      <div className="text-center shrink-0">
                        <span className={`text-2xl font-black ${sideAWon ? 'text-emerald-600' : 'text-red-500'}`}>
                          {m.score1}
                        </span>
                        <span className="text-lg font-black text-slate-300 mx-2">:</span>
                        <span className={`text-2xl font-black ${!sideAWon ? 'text-emerald-600' : 'text-red-500'}`}>
                          {m.score2}
                        </span>
                      </div>
                      <div className="flex-1 text-center">
                        <div className={`font-bold text-sm ${!sideAWon ? 'text-emerald-600' : 'text-slate-700'}`}>{m.team2}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Certificates */}
        {tab === 'certificates' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
            <ScrollText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-black text-lg text-slate-700 mb-2">Certificates</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Certificates will be available here once the tournament is completed and results are finalized.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-500">
              <Award className="w-4 h-4" />
              Coming Soon
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
