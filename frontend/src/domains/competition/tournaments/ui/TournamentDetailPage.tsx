import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Trophy, MapPin, Calendar, Users, DollarSign, Shield, Loader2, AlertCircle,
  Gamepad2, CheckCircle, Clock, Swords, Medal, Target, Flame, Award, ScrollText, Sparkles,
} from 'lucide-react';
import { getTournamentById, getMatches, getTournamentStandings, getTournamentMatchDetails, getMyRegistrations, type StandingEntry, type MatchDetail } from '../../api/competitionApi';
import { type Tournament, type MatchResult } from '@/shared/types';
import TournamentCertificateManager from './TournamentCertificateManager';
import MatchCard from '../../matches/ui/MatchCard';
import VexRulesPanel from '../../shared/VexRulesPanel';
import EventRegistrationModal from '../../shared/EventRegistrationModal';
import EventRegisterButton from '../../shared/EventRegisterButton';
import { REGISTRATION_MODE_LABELS } from '../../shared/eventRegistrationUtils';
import type { UserProfile } from '@/shared/types';

interface TournamentDetailPageProps {
  tournamentId: string;
  onBack: () => void;
  currentUser?: UserProfile | null;
  onNavigateLogin?: () => void;
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

export default function TournamentDetailPage({ tournamentId, onBack, currentUser, onNavigateLogin }: TournamentDetailPageProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchDetails, setMatchDetails] = useState<MatchDetail[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTournamentById(tournamentId),
      getMatches(tournamentId),
      getTournamentStandings(tournamentId),
      getTournamentMatchDetails(tournamentId),
    ]).then(([t, m, s, md]) => {
      if (!t) { setError('Tournament not found'); return; }
      setTournament(t);
      setMatches(m);
      setStandings(s);
      setMatchDetails(md);
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [tournamentId]);

  useEffect(() => {
    if (!currentUser) return;
    getMyRegistrations()
      .then(regs => {
        const active = regs.some(r =>
          r.event === tournamentId &&
          (r.registration_status === 'PENDING' || r.registration_status === 'APPROVED'),
        );
        setIsRegistered(active);
      })
      .catch(() => {});
  }, [currentUser, tournamentId]);

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
            {tournament.youtubeLiveUrl && (
              <a href={tournament.youtubeLiveUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/25 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                Watch Live Stream
              </a>
            )}
            <div className="mt-4 max-w-xs">
              <EventRegisterButton
                event={tournament}
                currentUser={currentUser}
                isRegistered={isRegistered}
                onRegister={() => setShowRegModal(true)}
                onNavigateLogin={onNavigateLogin}
                className="!py-3 !text-xs w-full"
              />
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
          <div className="space-y-6">
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
                  <div><span className="text-slate-500">Mode:</span> <span className="font-bold text-slate-800">{REGISTRATION_MODE_LABELS[tournament.registrationMode]}</span></div>
                  <div><span className="text-slate-500">Enabled:</span>
                    <span className={`font-bold ml-1 ${tournament.registrationEnabled ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tournament.registrationEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {tournament.registrationDeadline && (
                    <div><span className="text-slate-500">Deadline:</span> <span className="font-bold text-slate-800">{new Date(tournament.registrationDeadline).toLocaleDateString()}</span></div>
                  )}
                  {tournament.paymentRequired && tournament.registrationFee && (
                    <div><span className="text-slate-500">Fee:</span> <span className="font-bold text-amber-600">{tournament.registrationFee} Birr</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <VexRulesPanel />
          </div>
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

        {/* Matches — VEX Alliance */}
        {tab === 'matches' && (
          <div className="space-y-4">
            {matchDetails.filter(m => m.status === 'LIVE').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h4 className="font-black text-xs text-red-700 flex items-center gap-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE ALLIANCE MATCHES — {matchDetails.filter(m => m.status === 'LIVE').length}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchDetails.filter(m => m.status === 'LIVE').map(m => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
            {matchDetails.filter(m => m.status === 'SCHEDULED').length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h4 className="font-black text-xs text-slate-700 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-red" />
                  Upcoming — {matchDetails.filter(m => m.status === 'SCHEDULED').length}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchDetails.filter(m => m.status === 'SCHEDULED').map(m => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
            {matchDetails.filter(m => m.status === 'COMPLETED').length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h4 className="font-black text-xs text-slate-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-red" />
                  Completed — {matchDetails.filter(m => m.status === 'COMPLETED').length}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchDetails.filter(m => m.status === 'COMPLETED').map(m => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
            {matchDetails.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 text-center py-12">
                <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No alliance matches yet</p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard — VEX Pro Style */}
        {tab === 'rankings' && <LeaderboardSection standings={standings} matches={completedMatches} />}

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
          <TournamentCertificateManager
            tournamentId={tournamentId}
            tournament={tournament}
            standings={standings}
            userRole={currentUser?.role || null}
          />
        )}
      </motion.div>

      {showRegModal && tournament && (
        <EventRegistrationModal
          event={tournament}
          currentUser={currentUser}
          isRegistered={isRegistered}
          onClose={() => setShowRegModal(false)}
          onSuccess={() => {
            setIsRegistered(true);
            setShowRegModal(false);
          }}
          onNavigateLogin={onNavigateLogin}
        />
      )}
    </div>
  );
}

/* ───── Leaderboard Section (VEX Pro Style) ───── */

function computeTeamScores(completedMatches: MatchResult[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const m of completedMatches) {
    scores[m.team1] = (scores[m.team1] || 0) + m.score1;
    scores[m.team2] = (scores[m.team2] || 0) + m.score2;
  }
  return scores;
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

function getMedalClass(rank: number): string {
  if (rank === 1) return 'bg-amber-100 text-amber-600 border-amber-300 shadow-amber-200';
  if (rank === 2) return 'bg-slate-100 text-slate-500 border-slate-300 shadow-slate-200';
  if (rank === 3) return 'bg-orange-100 text-orange-600 border-orange-300 shadow-orange-200';
  return 'bg-slate-50 text-slate-400 border-slate-200';
}

function getRowGlow(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-transparent';
  if (rank === 2) return 'bg-gradient-to-r from-slate-50/80 via-slate-50/40 to-transparent';
  if (rank === 3) return 'bg-gradient-to-r from-orange-50/80 via-orange-50/40 to-transparent';
  return '';
}

function LeaderboardSection({ standings, matches }: { standings: StandingEntry[]; matches: MatchResult[] }) {
  const teamScores = useMemo(() => computeTeamScores(matches), [matches]);

  const ranked = useMemo(() => {
    if (standings.length === 0) return [];

    return [...standings]
      .map(s => ({
        ...s,
        matchesPlayed: s.wins + s.losses + s.draws,
        totalScore: teamScores[s.teamName] || 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalScore - a.totalScore;
      })
      .map((entry, index) => ({ ...entry, finalRank: index + 1 }));
  }, [standings, teamScores]);

  if (standings.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/60 p-12 text-center">
        <Medal className="w-14 h-14 text-slate-600 mx-auto mb-4" />
        <h3 className="font-black text-xl text-slate-300 mb-2">Leaderboard</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Leaderboard will appear once matches begin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Teams', value: ranked.length, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Matches Played', value: matches.length, icon: Gamepad2, color: 'text-brand-red', bg: 'bg-brand-red/5' },
          { label: 'Total Points', value: ranked.reduce((a, b) => a + b.points, 0), icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Top Score', value: ranked[0]?.points || 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="font-black text-xl text-slate-900">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Podium — Top 3 */}
      {ranked.length >= 3 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/60 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-red/5 rounded-full blur-3xl" />

          <div className="relative">
            <h4 className="font-black text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-6">
              <Medal className="w-4 h-4" /> Top Teams
            </h4>

            <div className="flex items-end justify-center gap-4 md:gap-8">
              {[1, 0, 2].map(pos => {
                const entry = ranked[pos];
                if (!entry) return null;
                const isFirst = pos === 0;
                return (
                  <div key={entry.teamName}
                    className={`flex flex-col items-center gap-2 ${isFirst ? 'order-2' : pos === 0 ? 'order-1' : 'order-3'}`}
                  >
                    {/* Medal */}
                    <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-lg md:text-2xl ${
                      pos === 0 ? 'bg-amber-400/20 ring-2 ring-amber-400/40' :
                      pos === 1 ? 'bg-slate-400/20 ring-2 ring-slate-400/40' :
                      'bg-orange-400/20 ring-2 ring-orange-400/40'
                    }`}>
                      {getMedalEmoji(pos + 1)}
                    </div>
                    {/* Points badge */}
                    <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                      pos === 0 ? 'bg-amber-400/20 text-amber-300' :
                      pos === 1 ? 'bg-slate-400/20 text-slate-300' :
                      'bg-orange-400/20 text-orange-300'
                    }`}>
                      {entry.points} pts
                    </div>
                    {/* Bar */}
                    <div className={`w-20 md:w-28 rounded-t-xl flex flex-col items-center justify-end pb-2 ${
                      pos === 0 ? 'h-28 md:h-32 bg-gradient-to-t from-amber-500/40 to-amber-500/10' :
                      pos === 1 ? 'h-20 md:h-24 bg-gradient-to-t from-slate-500/40 to-slate-500/10' :
                      'h-16 md:h-20 bg-gradient-to-t from-orange-500/40 to-orange-500/10'
                    }`}>
                      <span className={`font-black text-lg md:text-xl ${
                        pos === 0 ? 'text-amber-300' :
                        pos === 1 ? 'text-slate-300' :
                        'text-orange-300'
                      }`}>
                        {entry.wins}W
                      </span>
                    </div>
                    {/* Team name */}
                    <span className={`font-black text-sm md:text-base text-center leading-tight max-w-28 truncate ${
                      pos === 0 ? 'text-white' : 'text-slate-300'
                    }`}>
                      {entry.teamName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full rankings table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider w-14">Rank</th>
                <th className="text-left px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">Team</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">MP</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">W</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">L</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">D</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider hidden md:table-cell">Total Score</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider">RP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((entry, i) => {
                const isTop3 = i < 3;
                return (
                  <tr key={entry.teamName}
                    className={`transition-all duration-200 ${isTop3 ? getRowGlow(entry.finalRank) : 'hover:bg-slate-50/80'}`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isTop3 ? (
                          <span className="text-base">{getMedalEmoji(entry.finalRank)}</span>
                        ) : (
                          <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-black border ${getMedalClass(entry.finalRank)}`}>
                            {entry.finalRank}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Team */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          isTop3
                            ? 'bg-gradient-to-br from-brand-red/10 to-brand-red/5 text-brand-red'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {entry.teamName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${isTop3 ? 'text-slate-900' : 'text-slate-800'}`}>
                            {entry.teamName}
                          </span>
                          {entry.organization && (
                            <span className="text-[10px] text-slate-400 block">{entry.organization}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* MP */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-slate-700">{entry.matchesPlayed}</span>
                    </td>
                    {/* W */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-black text-emerald-600">{entry.wins}</span>
                    </td>
                    {/* L */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-black text-red-500">{entry.losses}</span>
                    </td>
                    {/* D */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm text-slate-500">{entry.draws}</span>
                    </td>
                    {/* Total Score */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="text-sm font-bold text-slate-700">{entry.totalScore}</span>
                    </td>
                    {/* RP */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black ${
                        isTop3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {entry.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-slate-400 text-center">
        RP = Ranking Points · Sorted by RP → Wins → Total Score
      </p>
    </div>
  );
}
