import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Clock, Calendar, Gamepad2, Loader2, AlertCircle, Users,
  CheckCircle, Video, MapPin, Zap, Trophy,
} from 'lucide-react';
import { getPublicMatchById, type MatchDetail } from '../../api/competitionApi';

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

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
    </div>
  );

  if (error || !match) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm font-bold text-red-700">{error || 'Match not found'}</p>
      <button onClick={onBack} className="mt-3 text-xs font-bold text-red-600 underline">Go back</button>
    </div>
  );

  const sideA = match.sides.find(s => s.side === 'SIDE_A');
  const sideB = match.sides.find(s => s.side === 'SIDE_B');
  const teamA = sideA?.teams[0] || 'TBD';
  const teamB = sideB?.teams[0] || 'TBD';
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  const statusBadgeClass = () => {
    switch (match.status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'LIVE': return 'bg-red-100 text-red-700 animate-pulse';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Hero scoreboard */}
        <div className={`rounded-3xl border p-6 md:p-8 mb-6 ${
          isLive
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-red-500 text-white shadow-xl shadow-red-200/30'
            : isCompleted
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200'
        }`}>
          {/* Top info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gamepad2 className={`w-5 h-5 ${isLive || isCompleted ? 'text-white/80' : 'text-brand-red'}`} />
                <h2 className={`font-black text-lg md:text-xl ${isLive || isCompleted ? 'text-white' : 'text-slate-900'}`}>
                  {match.round || 'Match'}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusBadgeClass()}`}>{match.status}</span>
              </div>
              <div className={`flex items-center gap-3 text-xs mt-1 ${isLive || isCompleted ? 'text-white/70' : 'text-slate-500'}`}>
                <span>{match.tournamentName}</span>
                {match.matchNumber && <><span className="w-1 h-1 rounded-full bg-current opacity-40" /><span>Match #{match.matchNumber}</span></>}
              </div>
            </div>
            {isLive && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-[10px] font-black uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Teams vs Score */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 text-center">
              <div className={`w-16 h-16 mx-auto mb-2 rounded-2xl flex items-center justify-center ${
                isLive || isCompleted ? 'bg-white/10' : 'bg-gradient-to-br from-brand-red/20 to-brand-red/10'
              }`}>
                <Users className={`w-8 h-8 ${isLive || isCompleted ? 'text-white' : 'text-brand-red'}`} />
              </div>
              <h3 className={`font-black text-lg ${isLive || isCompleted ? 'text-white' : 'text-slate-900'}`}>{teamA}</h3>
            </div>

            <div className="mx-6 text-center">
              <div className={`flex items-center gap-4 ${isLive || isCompleted ? 'text-white' : 'text-slate-900'}`}>
                <span className="text-5xl md:text-6xl font-black tabular-nums">{sideA?.score ?? '-'}</span>
                <span className="text-3xl font-black text-slate-400">:</span>
                <span className="text-5xl md:text-6xl font-black tabular-nums">{sideB?.score ?? '-'}</span>
              </div>
              {isLive && (
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-red-300 uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5" />
                  Live
                </span>
              )}
              {match.winningSide && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-black text-emerald-400">
                  <Trophy className="w-4 h-4" />
                  {match.winningSide === 'SIDE_A' ? `${teamA} Wins` : `${teamB} Wins`}
                </div>
              )}
            </div>

            <div className="flex-1 text-center">
              <div className={`w-16 h-16 mx-auto mb-2 rounded-2xl flex items-center justify-center ${
                isLive || isCompleted ? 'bg-white/10' : 'bg-gradient-to-br from-blue-500/20 to-blue-500/10'
              }`}>
                <Users className={`w-8 h-8 ${isLive || isCompleted ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h3 className={`font-black text-lg ${isLive || isCompleted ? 'text-white' : 'text-slate-900'}`}>{teamB}</h3>
            </div>
          </div>

          {/* Meta info */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isLive || isCompleted ? 'text-white/80' : ''}`}>
            <div className={`rounded-xl p-3 ${isLive || isCompleted ? 'bg-white/5' : 'bg-slate-50'}`}>
              <Calendar className={`w-4 h-4 mb-1 ${isLive || isCompleted ? 'text-white/60' : 'text-brand-red'}`} />
              <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Scheduled</p>
              <p className="text-xs font-bold mt-0.5">{match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : '—'}</p>
            </div>
            <div className={`rounded-xl p-3 ${isLive || isCompleted ? 'bg-white/5' : 'bg-slate-50'}`}>
              <Clock className={`w-4 h-4 mb-1 ${isLive || isCompleted ? 'text-white/60' : 'text-brand-red'}`} />
              <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Started</p>
              <p className="text-xs font-bold mt-0.5">{match.startedAt ? new Date(match.startedAt).toLocaleString() : '—'}</p>
            </div>
            <div className={`rounded-xl p-3 ${isLive || isCompleted ? 'bg-white/5' : 'bg-slate-50'}`}>
              <CheckCircle className={`w-4 h-4 mb-1 ${isLive || isCompleted ? 'text-white/60' : 'text-brand-red'}`} />
              <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Completed</p>
              <p className="text-xs font-bold mt-0.5">{match.completedAt ? new Date(match.completedAt).toLocaleString() : '—'}</p>
            </div>
            {match.field && (
              <div className={`rounded-xl p-3 ${isLive || isCompleted ? 'bg-white/5' : 'bg-slate-50'}`}>
                <MapPin className={`w-4 h-4 mb-1 ${isLive || isCompleted ? 'text-white/60' : 'text-brand-red'}`} />
                <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Field</p>
                <p className="text-xs font-bold mt-0.5">{match.field}</p>
              </div>
            )}
          </div>

          {/* Watch live button */}
          {match.streamUrl && (
            <a href={match.streamUrl} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-wider transition-all"
            >
              <Video className="w-4 h-4" />
              Watch Live Stream
            </a>
          )}
        </div>

        {/* Side details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: teamA || 'Side A', side: sideA, teamName: teamA, color: 'red', border: 'border-red-200', bg: 'bg-red-50', isWinner: match.winningSide === 'SIDE_A' },
            { label: teamB || 'Side B', side: sideB, teamName: teamB, color: 'blue', border: 'border-blue-200', bg: 'bg-blue-50', isWinner: match.winningSide === 'SIDE_B' },
          ].map(({ label, side, teamName, color, border, bg, isWinner }) => (
            <div key={label} className={`rounded-2xl p-5 border ${isWinner ? 'border-emerald-300 bg-emerald-50' : `${border} ${bg}`}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-sm text-slate-800">{teamName || label}</h3>
                <span className={`text-2xl font-black ${color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
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
              {isWinner && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-100/50 rounded-lg px-2.5 py-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  Winner
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
