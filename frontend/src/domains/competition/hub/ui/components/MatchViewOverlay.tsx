import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Tv, Minimize2, Maximize2, X, Loader2, Clock, CheckCircle2, Gamepad2, Medal } from 'lucide-react';
import { PublicTeamEntry, MatchDetail, getAllPublicMatches, getPublicTeams } from '../../../api/competitionApi';
import MatchCardAnimated from './MatchCardAnimated';

export default function MatchViewOverlay({ teams: initialTeams, onClose, onViewTournament }: {
  teams: PublicTeamEntry[];
  onClose: () => void;
  onViewTournament?: (id: string) => void;
}) {
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [teams, setTeams] = useState<PublicTeamEntry[]>(initialTeams);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matches' | 'standings'>('matches');

  const fetchData = async () => {
    try {
      const [freshMatches, freshTeams] = await Promise.all([
        getAllPublicMatches(),
        getPublicTeams(),
      ]);
      setMatches(freshMatches);
      setTeams(freshTeams);
    } catch { /* ignore */ }
    setLoadingMatches(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const tournamentIds = useMemo(() => {
    const ids = new Set(matches.map(m => m.tournamentId));
    return Array.from(ids);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedTournament === 'all') return matches;
    return matches.filter(m => m.tournamentId === selectedTournament);
  }, [matches, selectedTournament]);

  const liveMatches = useMemo(() => filteredMatches.filter(m => m.status === 'LIVE'), [filteredMatches]);
  const upcomingMatches = useMemo(() => filteredMatches.filter(m => m.status === 'SCHEDULED'), [filteredMatches]);
  const completedMatches = useMemo(() => filteredMatches.filter(m => m.status === 'COMPLETED'), [filteredMatches]);

  const sortedTeams = useMemo(() =>
    [...teams].sort((a, b) => b.points - a.points || (b.wins - a.wins) || (b.totalScore - a.totalScore)),
  [teams]);

  const topTeams = useMemo(() =>
    [...sortedTeams].sort((a, b) => b.points - a.points).slice(0, 3),
  [sortedTeams, teams]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/98 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 shrink-0"
      >
        <div className="flex items-center gap-3">
          <Tv className="w-5 h-5 text-red-400" />
          <h2 className="text-sm md:text-base font-black text-white tracking-tight">
            <span className="hidden sm:inline">Large Screen &middot; </span>Live View
          </h2>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Auto-refreshing every 15s</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}
            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300 focus:outline-none focus:border-red-500/40"
          >
            <option value="all">All Tournaments</option>
            {tournamentIds.map(id => (
              <option key={id} value={id}>{matches.find(m => m.tournamentId === id)?.tournamentName || id.slice(0, 8)}</option>
            ))}
          </select>
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button onClick={() => setViewMode('matches')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'matches' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}>Matches</button>
            <button onClick={() => setViewMode('standings')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'standings' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}>Standings</button>
          </div>
          <button onClick={toggleFullscreen}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Content */}
      {loadingMatches ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            <p className="text-sm text-slate-400">Loading matches...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {viewMode === 'matches' && (
              <div className="space-y-8">
                {/* Live now */}
                {liveMatches.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <h3 className="text-sm font-black text-red-400 uppercase tracking-wider">
                        Live Now ({liveMatches.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(liveMatches as MatchDetail[]).map((m, i) => (
                        <MatchCardAnimated key={m.id} match={m} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Upcoming */}
                {upcomingMatches.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">
                        Upcoming ({upcomingMatches.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(upcomingMatches as MatchDetail[]).map((m, i) => (
                        <MatchCardAnimated key={m.id} match={m} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Completed - last 20 */}
                {completedMatches.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                        Completed ({completedMatches.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(completedMatches as MatchDetail[]).slice(0, 20).map((m, i) => (
                        <MatchCardAnimated key={m.id} match={m} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {filteredMatches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Gamepad2 className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="font-black text-lg text-slate-400">No matches yet</p>
                    <p className="text-xs text-slate-600 mt-1">Matches will appear once they are scheduled.</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'standings' && (
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Medal className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">Standings</h3>
                </div>
                {sortedTeams.length > 0 ? (
                  <div className="border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">#</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Team</th>
                          <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">MP</th>
                          <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">W</th>
                          <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">L</th>
                          <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">D</th>
                          <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">TS</th>
                          <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedTeams.map((t, i) => (
                          <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                            className={`hover:bg-white/5 transition-colors ${i < 3 ? 'bg-amber-500/5' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                                i === 0 ? 'bg-amber-500 text-white' :
                                i === 1 ? 'bg-slate-500 text-white' :
                                i === 2 ? 'bg-orange-500 text-white' :
                                'bg-white/5 text-slate-400'
                              }`}>{i + 1}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-white">{t.teamName}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-slate-400">{t.matchesPlayed}</td>
                            <td className="px-4 py-3 text-center text-xs font-bold text-emerald-400">{t.wins}</td>
                            <td className="px-4 py-3 text-center text-xs font-bold text-red-400">{t.losses}</td>
                            <td className="px-4 py-3 text-center text-xs text-amber-400">{t.draws}</td>
                            <td className="px-4 py-3 text-center text-xs font-bold text-slate-300">{t.totalScore}</td>
                            <td className="px-4 py-3 text-center text-sm font-black text-white">{t.points}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2.5 bg-white/5 border-t border-white/10 flex items-center gap-4 text-[9px] text-slate-500">
                      <span><span className="font-bold text-slate-400">MP</span> Matches Played</span>
                      <span><span className="font-bold text-slate-400">Pts</span> W&times;2 + D</span>
                      <span><span className="font-bold text-slate-400">TS</span> Total Score (tie-breaker)</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Medal className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="font-black text-base text-slate-400">No standings yet</p>
                    <p className="text-xs text-slate-600 mt-1">Standings will be computed once matches complete.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Standings sidebar (visible on large screens) */}
          <div className="hidden xl:block w-72 2xl:w-80 border-l border-white/10 overflow-y-auto p-4 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <Medal className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">Top Teams</h3>
            </div>

            {/* Mini podium */}
            {topTeams.length >= 3 && (
              <div className="mb-6 bg-white/5 rounded-xl p-3">
                <div className="flex items-end justify-center gap-2">
                  {[1, 0, 2].map(pos => {
                    const entry = topTeams[pos];
                    if (!entry) return null;
                    const isFirst = pos === 0;
                    return (
                      <div key={entry.id}
                        className={`flex flex-col items-center gap-1 ${isFirst ? 'order-2' : pos === 0 ? 'order-1' : 'order-3'}`}
                      >
                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                          pos === 0 ? 'bg-amber-500/20 text-amber-300' :
                          pos === 1 ? 'bg-slate-500/20 text-slate-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>{entry.points} pts</div>
                        <div className={`rounded-t w-12 flex items-center justify-center ${
                          pos === 0 ? 'h-16 bg-amber-500/20' :
                          pos === 1 ? 'h-12 bg-slate-500/20' :
                          'h-10 bg-orange-500/20'
                        }`}>
                          <span className="text-lg">{['🥇', '🥈', '🥉'][pos]}</span>
                        </div>
                        <span className="text-[9px] font-bold text-white text-center truncate max-w-16">{entry.teamName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standings list */}
            <div className="space-y-1">
              {sortedTeams.slice(0, 15).map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    i < 3 ? 'bg-amber-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                    i === 0 ? 'bg-amber-500 text-white' :
                    i === 1 ? 'bg-slate-500 text-white' :
                    i === 2 ? 'bg-orange-500 text-white' :
                    'bg-white/5 text-slate-400'
                  }`}>{i + 1}</div>
                  <span className="flex-1 font-bold text-white truncate">{t.teamName}</span>
                  <span className="font-black text-white">{t.points}</span>
                  <span className="text-[9px] text-slate-400">{t.wins}W {t.losses}L</span>
                </motion.div>
              ))}
            </div>

            <button onClick={() => setViewMode('standings')}
              className="mt-3 w-full text-center text-[10px] font-bold text-slate-400 hover:text-white py-2 transition-colors">
              View Full Standings &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
