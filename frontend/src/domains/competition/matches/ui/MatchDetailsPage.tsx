import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Clock, Calendar, Loader2, AlertCircle,
  CheckCircle, Trophy, RefreshCw,
} from 'lucide-react';
import { getMatchDetail } from '../../api/matchApi';
import type { MatchDetail } from '../../api/matchMappers';
import { sidesFromMatch } from '../../shared/VexAllianceDisplay';
import VexMatchArena from '../../shared/VexMatchArena';
import { VEX_ALLIANCE_CONFIG } from '../../shared/vexConstants';

interface MatchDetailsPageProps {
  matchId: string;
  tournamentId?: string | null;
  onBack: () => void;
}

export default function MatchDetailsPage({ matchId, tournamentId, onBack }: MatchDetailsPageProps) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = () => {
    getMatchDetail(matchId, tournamentId || undefined)
      .then(m => {
        if (!m) {
          setError(
            tournamentId
              ? 'Match not found'
              : 'Match not found. Open this match from a tournament or live list so we can load it from the server.',
          );
          return;
        }
        setMatch(m);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchMatch();
  }, [matchId, tournamentId]);

  useEffect(() => {
    if (!match || match.status !== 'LIVE') return;
    const interval = setInterval(fetchMatch, 10000);
    return () => clearInterval(interval);
  }, [matchId, match?.status]);

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

  const { sideA, sideB } = sidesFromMatch(match.sides);
  const isLive = match.status === 'LIVE';

  const winnerLabel = match.winningSide === 'SIDE_A'
    ? VEX_ALLIANCE_CONFIG.redLabel
    : match.winningSide === 'SIDE_B'
      ? VEX_ALLIANCE_CONFIG.blueLabel
      : null;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Live View
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <VexMatchArena
          sideA={sideA}
          sideB={sideB}
          status={match.status}
          round={match.round}
          tournamentName={match.tournamentName}
          winningSide={match.winningSide}
          scheduledAt={match.scheduledAt}
          startedAt={match.startedAt}
          size="detail"
        />

        {isLive && (
          <div className="flex justify-end">
            <button onClick={fetchMatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh Scores
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 border-2 border-red-300 bg-gradient-to-br from-red-50 to-white">
            <p className="text-[10px] font-black uppercase tracking-wider mb-3 text-red-700">
              {VEX_ALLIANCE_CONFIG.redLabel}
            </p>
            <div className="space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white border border-red-100">
                  <span className="text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center bg-red-100 text-red-600">{i + 1}</span>
                  <span className="text-sm font-bold truncate text-slate-900">
                    {sideA.teams[i] || 'Open Slot'}
                  </span>
                </div>
              ))}
            </div>
            {sideA.score !== null && (
              <p className="mt-3 text-2xl font-black tabular-nums text-red-600">{sideA.score}</p>
            )}
          </div>
          <div className="rounded-2xl p-4 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
            <p className="text-[10px] font-black uppercase tracking-wider mb-3 text-blue-700">
              {VEX_ALLIANCE_CONFIG.blueLabel}
            </p>
            <div className="space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white border border-blue-100">
                  <span className="text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">{i + 1}</span>
                  <span className="text-sm font-bold truncate text-slate-900">
                    {sideB.teams[i] || 'Open Slot'}
                  </span>
                </div>
              ))}
            </div>
            {sideB.score !== null && (
              <p className="mt-3 text-2xl font-black tabular-nums text-blue-600">{sideB.score}</p>
            )}
          </div>
        </div>

        {winnerLabel && (
          <div className="flex items-center justify-center gap-2 text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl py-4">
            <Trophy className="w-5 h-5" />
            {winnerLabel} Wins
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 mb-1 text-brand-red" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Scheduled</p>
            <p className="text-xs font-bold mt-0.5 text-slate-900">{match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : '—'}</p>
          </div>
          <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
            <Clock className="w-4 h-4 mb-1 text-brand-red" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Started</p>
            <p className="text-xs font-bold mt-0.5 text-slate-900">{match.startedAt ? new Date(match.startedAt).toLocaleString() : '—'}</p>
          </div>
          <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
            <CheckCircle className="w-4 h-4 mb-1 text-brand-red" />
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Completed</p>
            <p className="text-xs font-bold mt-0.5 text-slate-900">{match.completedAt ? new Date(match.completedAt).toLocaleString() : '—'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
