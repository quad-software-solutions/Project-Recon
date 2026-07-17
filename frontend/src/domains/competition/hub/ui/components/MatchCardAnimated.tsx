import { motion } from 'motion/react';
import { MatchDetail } from '../../../api/competitionApi';
import VexMatchArena from '../../../shared/VexMatchArena';
import { sidesFromMatch } from '../../../shared/VexAllianceDisplay';

export default function MatchCardAnimated({ match, index }: { match: MatchDetail; index: number; key?: string }) {
  const isLive = match.status === 'LIVE';
  const { sideA, sideB } = sidesFromMatch(match.sides);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        ...(isLive ? { y: [0, -2, 0] } : {}),
      }}
      transition={{
        opacity: { duration: 0.4, delay: index * 0.05 },
        y: isLive ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 },
        scale: { duration: 0.4 },
        layout: { duration: 0.5, ease: 'easeInOut' },
      }}
      className={isLive ? 'ring-2 ring-red-500/40 rounded-2xl' : 'rounded-2xl'}
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
    </motion.div>
  );
}
