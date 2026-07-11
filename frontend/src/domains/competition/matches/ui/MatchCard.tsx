import { motion } from 'motion/react';
import { Clock, Users, Gamepad2, ChevronRight } from 'lucide-react';
import type { MatchDetail } from '../../api/competitionApi';

interface MatchCardProps {
  key?: string | number | null;
  match: MatchDetail;
  onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const sideA = match.sides.find(s => s.side === 'SIDE_A');
  const sideB = match.sides.find(s => s.side === 'SIDE_B');

  const statusBadgeClass = () => {
    switch (match.status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'LIVE': return 'bg-red-100 text-red-700 animate-pulse';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-slate-100 text-slate-500';
    }
  };

  const roundLabel = match.round || 'Match';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-brand-red/20 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{roundLabel}</h4>
            <span className="text-[10px] text-slate-500">{match.tournamentName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {match.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadgeClass()}`}>{match.status}</span>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-red transition-colors" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
        <div className="flex-1 text-center min-w-0">
          <span className="text-xs font-semibold text-slate-700 block truncate">
            {sideA?.teams.join(', ') || 'TBD'}
          </span>
          <span className="text-[9px] text-slate-400 uppercase">Side A</span>
        </div>
        <div className="mx-4 text-center">
          <span className="text-lg font-black text-slate-900">{sideA?.score ?? '-'} : {sideB?.score ?? '-'}</span>
          <p className="text-[9px] text-slate-400 uppercase">Score</p>
          {match.winningSide && (
            <span className="text-[9px] font-bold text-emerald-600">
              {match.winningSide === 'SIDE_A' ? 'Side A Wins' : 'Side B Wins'}
            </span>
          )}
        </div>
        <div className="flex-1 text-center min-w-0">
          <span className="text-xs font-semibold text-slate-700 block truncate">
            {sideB?.teams.join(', ') || 'TBD'}
          </span>
          <span className="text-[9px] text-slate-400 uppercase">Side B</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : 'TBD'}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {(sideA?.teams.length || 0) + (sideB?.teams.length || 0)} teams
        </span>
      </div>
    </motion.div>
  );
}
