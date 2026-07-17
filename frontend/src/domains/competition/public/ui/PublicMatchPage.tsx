import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, RotateCcw, ShieldAlert, Trophy, Zap,
} from 'lucide-react';
import { getMatchDetail } from '@/domains/competition/api/matchApi';
import type { MatchDetail } from '@/domains/competition/api/matchMappers';
import { sidesFromMatch } from '@/domains/competition/shared/VexAllianceDisplay';
import VexMatchArena from '@/domains/competition/shared/VexMatchArena';

interface PublicMatchPageProps {
  matchId: string;
  tournamentId?: string | null;
  onBack: () => void;
}

export default function PublicMatchPage({ matchId, tournamentId, onBack }: PublicMatchPageProps) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    getMatchDetail(matchId, tournamentId || undefined)
      .then((m) => {
        if (!m) {
          setError(
            tournamentId
              ? 'Match not found'
              : 'Match not found. Open this match from a tournament so we can load it from the server.',
          );
          return;
        }
        setMatch(m);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        const forbidden = msg.includes('403') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden');
        setPermissionDenied(forbidden);
        setError(forbidden ? 'You don’t have permission to view this match.' : msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [matchId, tournamentId]);

  useEffect(() => {
    if (!match || match.status !== 'LIVE') return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [match?.status, matchId, tournamentId]);

  const derived = useMemo(() => {
    if (!match) return null;
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';
    const winner = match.winningSide || null;
    const { sideA, sideB } = sidesFromMatch(match.sides);
    return { isLive, isCompleted, winner, sideA, sideB };
  }, [match]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (!match || error) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-red">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className={`${permissionDenied ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-3xl p-10 text-center`}>
          {permissionDenied ? (
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          ) : (
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          )}
          <p className={`text-base font-bold ${permissionDenied ? 'text-amber-800' : 'text-red-700'}`}>{error || 'Match not found'}</p>
          <button
            onClick={load}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl ${
              permissionDenied ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-red">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {match.tournamentName || 'Tournament'} · {match.round}
            </p>
            <h1 className="mt-1 font-black text-xl md:text-2xl text-slate-900 tracking-tight">
              Match {match.id.slice(0, 8)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {match.status === 'LIVE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
            {match.status === 'COMPLETED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            )}
            {match.status === 'SCHEDULED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                Scheduled
              </span>
            )}
            {match.status === 'CANCELLED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                Cancelled
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          <VexMatchArena
            sideA={derived?.sideA}
            sideB={derived?.sideB}
            status={match.status}
            round={match.round}
            tournamentName={match.tournamentName}
            winningSide={match.winningSide}
            scheduledAt={match.scheduledAt}
            startedAt={match.startedAt}
            size="detail"
          />
        </div>
      </div>

      {/* Match metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-brand-red" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Scheduled</p>
          </div>
          <p className="text-sm font-bold text-slate-900">{match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : '—'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-brand-red" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Started</p>
          </div>
          <p className="text-sm font-bold text-slate-900">{match.startedAt ? new Date(match.startedAt).toLocaleString() : '—'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-brand-red" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Winner</p>
          </div>
          <p className="text-sm font-bold text-slate-900">{derived?.winner || '—'}</p>
        </div>
      </div>

      {/* Timeline (placeholder until backend provides events) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-brand-red" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-700">Timeline</p>
        </div>
        <p className="text-sm text-slate-600">
          Match timeline will appear here when the backend exposes timeline events. For now we show scheduled/started/completed timestamps.
        </p>
      </motion.div>
    </div>
  );
}

