import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Radio, Clock } from 'lucide-react';
import { VEX_ALLIANCE_CONFIG } from './vexConstants';
import type { AllianceSide } from './VexAllianceDisplay';

interface VexMatchArenaProps {
  sideA: AllianceSide;
  sideB: AllianceSide;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  round?: string;
  tournamentName?: string;
  winningSide?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  size?: 'card' | 'detail';
}

function teamNumber(name: string | null, fallback: number) {
  if (!name) return `#${fallback}`;
  const m = name.match(/\d+/);
  return m ? `#${m[0]}` : name.slice(0, 6);
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Date.now() - new Date(startedAt).getTime());
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="font-mono tabular-nums">{elapsed}</span>;
}

function AllianceStation({
  label,
  teams,
  score,
  color,
  isWinner,
  size,
}: {
  label: string;
  teams: string[];
  score: number | null;
  color: 'red' | 'blue';
  isWinner: boolean;
  size: 'card' | 'detail';
}) {
  const isRed = color === 'red';
  const slots = [teams[0] || null, teams[1] || null];
  const accent = isRed ? 'from-red-600 to-red-900' : 'from-blue-600 to-blue-900';
  const glow = isRed ? 'shadow-red-500/30' : 'shadow-blue-500/30';
  const border = isRed ? 'border-red-400/40' : 'border-blue-400/40';
  const text = isRed ? 'text-red-200' : 'text-blue-200';

  return (
    <div className={`relative flex-1 rounded-xl border ${border} bg-gradient-to-br ${accent} overflow-hidden ${
      isWinner ? `ring-2 ${isRed ? 'ring-amber-400' : 'ring-amber-400'} shadow-lg ${glow}` : ''
    }`}>
      {isWinner && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
          <Trophy className="w-3 h-3" /> Win
        </div>
      )}
      <div className={`px-3 py-2 border-b ${isRed ? 'border-red-400/20 bg-red-950/40' : 'border-blue-400/20 bg-blue-950/40'}`}>
        <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${text}`}>{label}</p>
      </div>
      <div className={`p-2 space-y-1.5 ${size === 'detail' ? 'p-3 space-y-2' : ''}`}>
        {slots.map((team, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 bg-black/25 border border-white/10 ${
              size === 'detail' ? 'px-3 py-2.5' : ''
            }`}
          >
            <span className={`shrink-0 font-black tabular-nums rounded-md px-1.5 py-0.5 text-[10px] ${
              isRed ? 'bg-red-500/30 text-red-100' : 'bg-blue-500/30 text-blue-100'
            }`}>
              {teamNumber(team, i + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[7px] font-bold text-white/40 uppercase">Partner {i + 1}</p>
              <p className={`font-black truncate text-white ${size === 'detail' ? 'text-sm' : 'text-xs'}`}>
                {team || 'AWAITING TEAM'}
              </p>
            </div>
          </div>
        ))}
      </div>
      {score !== null && (
        <div className={`px-3 pb-2 ${size === 'detail' ? 'pb-3' : ''}`}>
          <p className={`font-black tabular-nums text-white ${size === 'detail' ? 'text-3xl' : 'text-xl'}`}>{score}</p>
        </div>
      )}
    </div>
  );
}

export default function VexMatchArena({
  sideA,
  sideB,
  status,
  round,
  tournamentName,
  winningSide,
  scheduledAt,
  startedAt,
  size = 'card',
}: VexMatchArenaProps) {
  const isLive = status === 'LIVE';
  const isCompleted = status === 'COMPLETED';
  const scoreA = sideA.score;
  const scoreB = sideB.score;
  const redWins = winningSide === 'SIDE_A' || (scoreA !== null && scoreB !== null && scoreA > scoreB);
  const blueWins = winningSide === 'SIDE_B' || (scoreA !== null && scoreB !== null && scoreB > scoreA);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${
      isLive
        ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ring-1 ring-red-500/30'
        : isCompleted
          ? 'bg-gradient-to-b from-slate-900 to-slate-950 ring-1 ring-slate-600/40'
          : 'bg-gradient-to-b from-slate-800 to-slate-900 ring-1 ring-slate-600/30'
    }`}>
      {/* Field grid texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(90deg, white 1px, transparent 1px),
          linear-gradient(white 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
      }} />

      {/* Live scan line */}
      {isLive && (
        <motion.div
          animate={{ y: ['-100%', '400%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-red-500/10 to-transparent pointer-events-none z-0"
        />
      )}

      <div className={`relative ${size === 'detail' ? 'p-5 md:p-6' : 'p-3 md:p-4'}`}>
        {/* Top broadcast bar */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-red-400' : 'text-slate-400'}`} />
            </div>
            <div className="min-w-0">
              {tournamentName && (
                <p className="text-[9px] font-bold text-white/50 truncate uppercase tracking-wider">{tournamentName}</p>
              )}
              <p className={`font-black text-white truncate ${size === 'detail' ? 'text-sm' : 'text-xs'}`}>
                {round || 'Match'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLive && startedAt && (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                <Clock className="w-3 h-3" />
                <LiveTimer startedAt={startedAt} />
              </span>
            )}
            <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
              isLive ? 'bg-red-500 text-white animate-pulse' :
              isCompleted ? 'bg-emerald-500/80 text-white' :
              status === 'CANCELLED' ? 'bg-slate-500 text-white' :
              'bg-blue-500/80 text-white'
            }`}>
              {isLive ? '● LIVE' : status}
            </span>
          </div>
        </div>

        {/* LED Scoreboard center + alliances */}
        <div className={`flex gap-2 md:gap-3 items-stretch ${size === 'detail' ? 'md:gap-4' : ''}`}>
          <AllianceStation
            label={VEX_ALLIANCE_CONFIG.redLabel}
            teams={sideA.teams}
            score={scoreA}
            color="red"
            isWinner={!!redWins && !blueWins}
            size={size}
          />

          {/* Center scoreboard — VEX TM style */}
          <div className="flex flex-col items-center justify-center shrink-0 px-1">
            <div className={`rounded-xl border-2 border-slate-600 bg-black/60 shadow-inner ${
              size === 'detail' ? 'px-4 py-3 min-w-[100px]' : 'px-3 py-2 min-w-[72px]'
            } ${isLive ? 'border-red-500/40 shadow-red-500/20' : ''}`}>
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest text-center mb-1">Score</p>
              <div className={`flex items-center gap-1 font-black tabular-nums text-white ${
                size === 'detail' ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
              }`}>
                <span className={redWins && isCompleted ? 'text-red-400' : ''}>{scoreA ?? '0'}</span>
                <span className="text-slate-600 text-sm">:</span>
                <span className={blueWins && isCompleted ? 'text-blue-400' : ''}>{scoreB ?? '0'}</span>
              </div>
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">VS</span>
            <span className="text-[7px] text-slate-600 mt-0.5">2v2 Alliance</span>
          </div>

          <AllianceStation
            label={VEX_ALLIANCE_CONFIG.blueLabel}
            teams={sideB.teams}
            score={scoreB}
            color="blue"
            isWinner={!!blueWins && !redWins}
            size={size}
          />
        </div>

        {/* Field footer */}
        {scheduledAt && !isLive && (
          <p className="mt-3 text-center text-[9px] text-slate-500 font-medium">
            Scheduled · {new Date(scheduledAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
