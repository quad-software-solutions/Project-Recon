import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Trophy, Swords, Medal, Building, Phone, Mail, User, Calendar, Gamepad2, Loader2, AlertCircle, Clock, Target } from 'lucide-react';
import { getPublicTeamById, getTeamMatches, type PublicTeamEntry } from '../../api/competitionApi';
import type { MatchResult } from '@/src/shared/types';

interface TeamDetailsPageProps {
  teamId: string;
  onBack: () => void;
}

export default function TeamDetailsPage({ teamId, onBack }: TeamDetailsPageProps) {
  const [team, setTeam] = useState<PublicTeamEntry | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getPublicTeamById(teamId),
      getTeamMatches(teamId),
    ]).then(([t, m]) => {
      if (!t) { setError('Team not found'); return; }
      setTeam(t);
      setMatches(m);
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          <p className="text-xs text-slate-400 font-medium">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{error || 'Team not found'}</p>
        <button onClick={onBack} className="mt-3 text-xs font-bold text-red-600 underline">Go back</button>
      </div>
    );
  }

  const totalGames = team.wins + team.losses + team.draws;
  const winRate = totalGames > 0 ? Math.round((team.wins / totalGames) * 100) : 0;

  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const liveMatches = matches.filter(m => m.status === 'live');

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700', live: 'bg-red-100 text-red-700 animate-pulse',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    return map[s] || 'bg-slate-100 text-slate-500';
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Teams
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                <Users className="w-7 h-7 text-brand-red" />
              </div>
              <div>
                <h2 className="font-black text-2xl text-slate-900">{team.teamName}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{team.organization || 'No organization'}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{team.tournamentName}</span>
                </div>
              </div>
            </div>
          </div>

          {team.coachName && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {team.coachName && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <User className="w-4 h-4 text-brand-red mb-1" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Coach</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{team.coachName}</p>
                </div>
              )}
              {team.contactEmail && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <Mail className="w-4 h-4 text-brand-red mb-1" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Email</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{team.contactEmail}</p>
                </div>
              )}
              {team.contactPhone && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <Phone className="w-4 h-4 text-brand-red mb-1" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{team.contactPhone}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
              <Trophy className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-black text-emerald-700">{team.wins}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Wins</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
              <Swords className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-black text-red-700">{team.losses}</p>
              <p className="text-[10px] font-bold text-red-500 uppercase">Losses</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4 text-center border border-slate-200">
              <Medal className="w-5 h-5 text-slate-500 mx-auto mb-1" />
              <p className="text-lg font-black text-slate-700">{team.draws}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Draws</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
              <Target className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-black text-indigo-700">{team.points}</p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase">Points</p>
            </div>
          </div>

          {totalGames > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-600">Win Rate</span>
                <span className="font-black text-slate-900">{winRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{team.wins}W / {team.losses}L / {team.draws}D in {totalGames} match{totalGames !== 1 ? 'es' : ''}</p>
            </div>
          )}
        </div>

        {liveMatches.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <h3 className="font-black text-sm text-red-700 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Matches ({liveMatches.length})
            </h3>
            <div className="flex flex-col gap-2">
              {liveMatches.map(m => (
                <div key={m.id} className="bg-white rounded-xl px-4 py-2.5 border border-red-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{m.team1} vs {m.team2}</span>
                  <span className="text-xs font-black text-red-600">{m.score1} : {m.score2}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingMatches.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brand-red" />
              Upcoming Matches ({upcomingMatches.length})
            </h3>
            <div className="flex flex-col gap-2">
              {upcomingMatches.map(m => (
                <div key={m.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{m.team1} vs {m.team2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{m.round}</span>
                    <span className="text-[10px] text-slate-400">{new Date(m.time).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 mb-4">
            <Gamepad2 className="w-4 h-4 text-brand-red" />
            Match History ({completedMatches.length})
          </h3>
          {completedMatches.length > 0 ? (
            <div className="flex flex-col gap-2">
              {completedMatches.map(m => {
                const won = (m.score1 > m.score2 && m.team1 === team.teamName) || (m.score2 > m.score1 && m.team2 === team.teamName);
                return (
                  <div key={m.id} className={`rounded-xl px-4 py-3 border flex items-center justify-between ${
                    won ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        won ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
                      }`}>
                        {won ? 'W' : 'L'}
                      </span>
                      <span className="text-xs font-medium text-slate-700 truncate">{m.team1}</span>
                      <span className="text-xs font-black text-slate-900">{m.score1} : {m.score2}</span>
                      <span className="text-xs font-medium text-slate-700 truncate">{m.team2}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-[10px] text-slate-500">{m.round}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl">
              <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No matches played yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
