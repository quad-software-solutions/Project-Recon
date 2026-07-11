import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Calendar, Gamepad2, Loader2, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { getPublicMatchById, type MatchDetail } from '../../api/competitionApi';
import MatchScoreboard from './MatchScoreboard';

interface MatchDetailsPageProps {
  matchId: string;
  onBack: () => void;
}

export default function MatchDetailsPage({ matchId, onBack }: MatchDetailsPageProps) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPublicMatchById(matchId)
      .then(m => {
        if (!m) { setError('Match not found'); return; }
        setMatch(m);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          <p className="text-xs text-slate-400 font-medium">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{error || 'Match not found'}</p>
        <button onClick={onBack} className="mt-3 text-xs font-bold text-red-600 underline">Go back</button>
      </div>
    );
  }

  const sideA = match.sides.find(s => s.side === 'SIDE_A');
  const sideB = match.sides.find(s => s.side === 'SIDE_B');

  const statusBadgeClass = () => {
    switch (match.status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'LIVE': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-slate-100 text-slate-500';
    }
  };

  const teamNames = [...(sideA?.teams || []), ...(sideB?.teams || [])];
  const title = teamNames.length >= 2
    ? `${teamNames.slice(0, Math.ceil(teamNames.length / 2)).join(', ')} vs ${teamNames.slice(Math.ceil(teamNames.length / 2)).join(', ')}`
    : match.round || 'Match Details';

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gamepad2 className="w-5 h-5 text-brand-red" />
                <h2 className="font-black text-xl md:text-2xl text-slate-900">{title}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>{match.tournamentName}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{match.round}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusBadgeClass()}`}>{match.status}</span>
          </div>

          <div className="mb-6">
            <MatchScoreboard
              sideALabel="Side A"
              sideBLabel="Side B"
              sideAScore={sideA?.score ?? 0}
              sideBScore={sideB?.score ?? 0}
              winningSide={match.winningSide}
              status={match.status}
              sideATeams={sideA?.teams || []}
              sideBTeams={sideB?.teams || []}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <Calendar className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Scheduled</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <Clock className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Started</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {match.startedAt ? new Date(match.startedAt).toLocaleString() : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-brand-red mb-1" />
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Completed</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {match.completedAt ? new Date(match.completedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {([
            { label: 'Side A', side: sideA, color: 'red', borderColor: 'border-red-200', bgColor: 'bg-red-50' },
            { label: 'Side B', side: sideB, color: 'blue', borderColor: 'border-blue-200', bgColor: 'bg-blue-50' },
          ] as const).map(({ label, side, color, borderColor, bgColor }) => (
            <div key={label} className={`rounded-2xl p-5 border ${side ? borderColor : 'border-slate-200'} ${bgColor}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm text-slate-800">{label}</h3>
                <span className={`text-lg font-black ${color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                  {side?.score ?? '-'}
                </span>
              </div>
              {side?.teams && side.teams.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {side.teams.map((name, i) => (
                    <div key={i} className="bg-white/80 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-700">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No teams assigned</p>
              )}
              {match.winningSide === side?.side && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-100/50 rounded-lg px-2.5 py-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  Winning Side
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Trophy(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
