import { motion } from 'motion/react';
import { Clock, ExternalLink } from 'lucide-react';
import type { MatchDetail } from '../../api/competitionApi';
import { sidesFromMatch } from '../../shared/VexAllianceDisplay';
import VexMatchArena from '../../shared/VexMatchArena';

interface MatchCardProps {
  match: MatchDetail;
  onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const { sideA, sideB } = sidesFromMatch(match.sides);
  const isLive = match.status === 'LIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`rounded-2xl overflow-hidden transition-all cursor-pointer group ${
        isLive
          ? 'ring-2 ring-red-500/50 shadow-xl shadow-red-500/20'
          : 'ring-1 ring-slate-200 hover:ring-brand-red/30 hover:shadow-xl'
      }`}
    >
      <VexMatchArena
        sideA={sideA}
        sideB={sideB}
        status={match.status}
        round={match.round}
        tournamentName={match.tournamentName}
        winningSide={match.winningSide}
        scheduledAt={match.scheduledAt}
        startedAt={match.startedAt}
        size="card"
      />

      <div className="bg-white px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : '—'}
        </span>
        <span className="flex items-center gap-1 text-slate-400 group-hover:text-brand-red transition-colors">
          View Match <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}
