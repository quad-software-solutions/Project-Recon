import { motion } from 'motion/react';
import { Clock, Users, Gamepad2, MapPin, Video, ExternalLink } from 'lucide-react';
import type { MatchDetail } from '../../api/competitionApi';

interface MatchCardProps {
  key?: string | number | null;
  match: MatchDetail;
  onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const sideA = match.sides.find(s => s.side === 'SIDE_A');
  const sideB = match.sides.find(s => s.side === 'SIDE_B');
  const teamA = sideA?.teams[0] || 'TBD';
  const teamB = sideB?.teams[0] || 'TBD';
  const scoreA = sideA?.score ?? null;
  const scoreB = sideB?.score ?? null;

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isScheduled = match.status === 'SCHEDULED';

  const statusBadge = () => {
    if (isLive) return 'bg-red-500 text-white';
    if (isCompleted) return 'bg-emerald-500 text-white';
    if (match.status === 'CANCELLED') return 'bg-slate-400 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer group ${
        isLive
          ? 'border-red-300 shadow-lg shadow-red-200/50'
          : 'border-slate-200 hover:shadow-lg hover:border-brand-red/20'
      }`}
    >
      {/* Top bar */}
      <div className={`px-5 py-2.5 flex items-center justify-between ${
        isLive ? 'bg-red-50' : isCompleted ? 'bg-emerald-50' : 'bg-slate-50'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isLive ? 'bg-red-500' : isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
          }`}>
            <Gamepad2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">{match.tournamentName}</span>
              <span className="text-[8px] text-slate-300">·</span>
              <span className="text-[10px] font-semibold text-slate-600">{match.round}</span>
            </div>
            {match.matchNumber && (
              <span className="text-[9px] text-slate-400">Match #{match.matchNumber}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge()}`}>
            {match.status}
          </span>
        </div>
      </div>

      {/* Main score area */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Team A */}
          <div className="flex-1 text-center min-w-0">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-gradient-to-br from-brand-red/20 to-brand-red/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-red" />
            </div>
            <span className="text-sm font-bold text-slate-900 block truncate">{teamA}</span>
          </div>

          {/* Score */}
          <div className="text-center shrink-0">
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black ${scoreA !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {scoreA !== null ? scoreA : '-'}
              </span>
              <span className="text-xl font-black text-slate-400">:</span>
              <span className={`text-3xl font-black ${scoreB !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {scoreB !== null ? scoreB : '-'}
              </span>
            </div>
            {isLive && <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Live</span>}
            {match.winningSide && (
              <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                {match.winningSide === 'SIDE_A' ? `${teamA} Wins` : `${teamB} Wins`}
              </span>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 text-center min-w-0">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-900 block truncate">{teamB}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : 'TBD'}
          </span>
          {match.field && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.field}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {match.streamUrl && (
            <a href={match.streamUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-red/10 text-brand-red font-bold hover:bg-brand-red/20 transition-colors"
            >
              <Video className="w-3 h-3" />
              Watch
            </a>
          )}
          <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-brand-red transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
