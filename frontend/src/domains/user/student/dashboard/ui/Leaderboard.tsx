import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, TrendingUp, RefreshCw, Users, Search, Award, Star, Loader2 } from 'lucide-react';
import { getPublicTeams, type PublicTeamEntry } from '@/domains/competition/api/competitionApi';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-orange-500" />;
  return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400">#{rank}</span>;
}

export default function Leaderboard() {
  const [teams, setTeams] = useState<PublicTeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('all');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getPublicTeams();
      const sorted = [...data].sort((a, b) => b.points - a.points || b.wins - a.wins || b.totalScore - a.totalScore);
      setTeams(sorted);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const computeRank = (index: number, arr: PublicTeamEntry[]) => {
    if (index === 0) return 1;
    const prev = arr[index - 1];
    const curr = arr[index];
    if (curr.points === prev.points && curr.wins === prev.wins && curr.totalScore === prev.totalScore) {
      return computeRank(index - 1, arr);
    }
    return index + 1;
  };

  const tournaments = [...new Set(teams.map(t => t.tournamentName))];
  const filtered = teams.filter(t => {
    const matchesSearch = t.teamName.toLowerCase().includes(search.toLowerCase());
    const matchesTournament = tournamentFilter === 'all' || t.tournamentName === tournamentFilter;
    return matchesSearch && matchesTournament;
  });

  const top3 = filtered.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl text-slate-900">Global Leaderboard</h3>
          <p className="text-xs text-slate-500 mt-1">{teams.length} teams competing · {tournaments.length} tournaments</p>
        </div>
        <button onClick={() => { setLoading(true); fetchLeaderboard(); }} className="px-3 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No teams yet</p>
          <p className="text-xs text-slate-400 mt-1">Leaderboard will populate once teams compete in tournaments.</p>
        </div>
      ) : (
        <>
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[top3[1], top3[0], top3[2]].map((team, i) => {
                const position = i === 0 ? 2 : i === 1 ? 1 : 3;
                const colors = position === 1 ? 'from-amber-50 to-yellow-50 border-amber-200' : position === 2 ? 'from-slate-50 to-gray-50 border-slate-200' : 'from-orange-50 to-amber-50 border-orange-200';
                const iconColor = position === 1 ? 'text-amber-500' : position === 2 ? 'text-slate-400' : 'text-orange-500';
                return (
                  <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`bg-gradient-to-br ${colors} border rounded-2xl p-5 text-center relative overflow-hidden`}>
                    <div className="flex justify-center mb-2">
                      {position === 1 ? <Trophy className={`w-8 h-8 ${iconColor}`} /> : <Medal className={`w-6 h-6 ${iconColor}`} />}
                    </div>
                    <p className="font-bold text-sm text-slate-900 truncate">{team.teamName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{team.tournamentName}</p>
                    <p className={`text-2xl font-black mt-1 ${iconColor}`}>{team.points}</p>
                    <p className="text-[10px] text-slate-400">pts · {team.wins}W {team.losses}L</p>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-red" />
            </div>
            <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-red">
              <option value="all">All Tournaments</option>
              {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="text-[10px] text-slate-400 font-medium">{filtered.length} teams</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase w-12">Rank</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Team</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Tournament</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">W</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">L</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">D</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((team, idx) => (
                  <motion.tr key={team.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className={`hover:bg-slate-50/50 transition-colors ${idx < 3 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3"><RankIcon rank={computeRank(idx, filtered)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center"><Users className="w-4 h-4 text-brand-red" /></div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900">{team.teamName}</span>
                          {team.organization && <span className="text-[10px] text-slate-500 block">{team.organization}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-600">{team.tournamentName}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-emerald-600">{team.wins}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-red-500">{team.losses}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-amber-500">{team.draws}</td>
                    <td className="px-4 py-3 text-center text-xs font-black text-slate-900">{team.points}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
