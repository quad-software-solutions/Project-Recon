import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Trophy, MapPin, Calendar, Users, DollarSign, Shield, Loader2, AlertCircle,
  Gamepad2, CheckCircle, Clock, XCircle, Swords, Medal, Target,
} from 'lucide-react';
import { getTournamentById, getMatches, getTournamentStandings, type StandingEntry } from '../../api/competitionApi';
import { type Tournament, type MatchResult } from '@/src/shared/types';

interface TournamentDetailPageProps {
  tournamentId: string;
  onBack: () => void;
}

type DetailTab = 'overview' | 'teams' | 'matches' | 'rankings';

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
    { id: 'rankings', label: 'Rankings', icon: Medal },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h2 className="font-black text-2xl text-slate-900">{tournament.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[tournament.storedStatus]}`}>{tournament.storedStatus}</span>
                  <span className="text-[11px] text-slate-500">{tournament.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-400">Date</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {new Date(tournament.startDateTime).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <MapPin className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-400">Location</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{tournament.location}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <Users className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-400">Teams</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{tournament.enrolledCount} / {tournament.maxTeams || '∞'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <DollarSign className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-400">Prize Pool</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{(tournament as any).prizePool || '—'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
          {TABS.map(t => {
            const TIcon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  tab === t.id
                    ? 'bg-white text-brand-red shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <TIcon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
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
                <p className="text-2xl font-black text-slate-900">
                  {matches.filter(m => m.status === 'completed').length}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Completed</p>
              </div>
            </div>

            {tournament.registrationMode !== 'NONE' && (
              <div className="mt-6 p-4 bg-brand-red/5 border border-brand-red/10 rounded-xl">
                <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-red" />Registration
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-500">Mode:</span> <span className="font-bold text-slate-800">{tournament.registrationMode}</span></div>
                  <div><span className="text-slate-500">Enabled:</span> <span className={`font-bold ${tournament.registrationEnabled ? 'text-emerald-600' : 'text-red-600'}`}>{tournament.registrationEnabled ? 'Yes' : 'No'}</span></div>
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

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No teams registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Organization</th>
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
                        <td className="px-4 py-3 text-xs text-slate-600">{s.organization || '—'}</td>
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

        {/* Matches Tab */}
        {tab === 'matches' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No matches yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Round</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team A</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Score</th>
                      <th className="text-right px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team B</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Status</th>
                      <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matches.map(m => {
                      const won = m.status === 'completed' && m.score1 > m.score2;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{m.round}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-slate-700">{m.team1}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-black ${m.status === 'completed' ? (won ? 'text-emerald-600' : 'text-red-500') : 'text-slate-400'}`}>
                              {m.score1} : {m.score2}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-medium text-slate-700">{m.team2}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${MATCH_STATUS_STYLE[m.status === 'live' ? 'LIVE' : m.status === 'completed' ? 'COMPLETED' : 'SCHEDULED']}`}>
                              {m.status === 'live' ? 'LIVE' : m.status === 'completed' ? 'COMPLETED' : 'SCHEDULED'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {m.status === 'completed' ? (
                              <span className={`text-[9px] font-bold ${won ? 'text-emerald-600' : 'text-red-500'}`}>
                                {won ? 'Side A' : 'Side B'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rankings Tab */}
        {tab === 'rankings' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <Medal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No rankings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
      </motion.div>
    </div>
  );
}
