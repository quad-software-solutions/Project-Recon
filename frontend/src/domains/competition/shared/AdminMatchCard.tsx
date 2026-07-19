import { motion } from 'motion/react';
import { Clock, Users, Gamepad2, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import type { BackendMatch } from '../api/eventsApi';
import VexAllianceDisplay, { sidesFromMatch } from './VexAllianceDisplay';
import { getSideTeamNames } from './vexAllianceUtils';

function formatCardDateTime(iso?: string | null) {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface AdminMatchCardProps {
  match: BackendMatch;
  onClick?: () => void;
  onStart?: () => void;
  compact?: boolean;
}

export default function AdminMatchCard({ match, onClick, onStart, compact = false }: AdminMatchCardProps) {
  const sideA = match.sides?.find(s => s.side === 'SIDE_A');
  const sideB = match.sides?.find(s => s.side === 'SIDE_B');
  const sides = [
    { side: 'SIDE_A' as const, score: sideA?.score ?? null, teams: getSideTeamNames(sideA?.participants) },
    { side: 'SIDE_B' as const, score: sideB?.score ?? null, teams: getSideTeamNames(sideB?.participants) },
  ];
  const { sideA: red, sideB: blue } = sidesFromMatch(sides);
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isScheduled = match.status === 'SCHEDULED';
  const totalTeams = (sideA?.participants?.length || 0) + (sideB?.participants?.length || 0);

  const statusStyle = isLive
    ? 'bg-red-500 text-white'
    : isCompleted
      ? 'bg-emerald-500 text-white'
      : 'bg-blue-500 text-white';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer group ${
        isLive
          ? 'border-red-400 shadow-lg shadow-red-200/50 ring-1 ring-red-400/30'
          : 'border-slate-200 hover:shadow-md hover:border-brand-red/20'
      }`}
    >
      <div className={`px-4 py-2.5 flex items-center justify-between ${
        isLive ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : 'bg-slate-50'
      }`}>
        <div className="flex items-center gap-2">
          <Gamepad2 className={`w-4 h-4 ${isLive ? 'text-white' : 'text-amber-600'}`} />
          <div>
            <p className={`text-xs font-black ${isLive ? 'text-white' : 'text-slate-900'}`}>{match.round}</p>
            <p className={`text-[10px] ${isLive ? 'text-white/70' : 'text-slate-500'} flex items-center gap-1`}>
              {match.tournament_title || (match.tournament ? <span className="inline-flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> Tournament #{match.tournament.slice(0, 6)}</span> : '—')}
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">TOURNAMENT</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusStyle}`}>{match.status}</span>
        </div>
      </div>

      <div className={`p-4 ${compact ? 'py-3' : ''}`}>
        <VexAllianceDisplay
          sideA={red}
          sideB={blue}
          winningSide={match.winning_side_label || match.winning_side}
          variant={compact ? 'compact' : 'standard'}
          isLive={isLive}
        />
      </div>

      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatCardDateTime(match.scheduled_at)}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{totalTeams}/4 teams</span>
        </span>
        {isScheduled && onStart && (
          <button
            onClick={e => { e.stopPropagation(); onStart(); }}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Play className="w-3 h-3" /> Start
          </button>
        )}
        {isCompleted && (
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <CheckCircle className="w-3 h-3" /> Done
          </span>
        )}
      </div>
    </motion.div>
  );
}
