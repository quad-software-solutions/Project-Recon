import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { VEX_ALLIANCE_CONFIG } from './vexConstants';

export interface AllianceSide {
  side: 'SIDE_A' | 'SIDE_B';
  score: number | null;
  teams: string[];
}

interface VexAllianceDisplayProps {
  sideA: AllianceSide;
  sideB: AllianceSide;
  winningSide?: string | null;
  variant?: 'compact' | 'standard' | 'broadcast' | 'detailed';
  isLive?: boolean;
  showLabels?: boolean;
  round?: string;
  matchNumber?: string;
}

function AllianceColumn({
  label,
  teams,
  score,
  color,
  isWinner,
  variant,
  align,
}: {
  label: string;
  teams: string[];
  score: number | null;
  color: 'red' | 'blue';
  isWinner: boolean;
  variant: 'compact' | 'standard' | 'broadcast' | 'detailed';
  align: 'left' | 'right';
}) {
  const isRed = color === 'red';
  const slots = [
    teams[0] || null,
    teams[1] || null,
  ];

  const displaySlots = variant === 'detailed'
    ? slots
    : [teams[0] || 'TBD', teams[1] || (variant === 'broadcast' ? 'Partner TBD' : null)].filter(Boolean) as string[];

  const bg = isRed
    ? 'bg-gradient-to-br from-red-600/90 to-red-800/90'
    : 'bg-gradient-to-br from-blue-600/90 to-blue-800/90';
  const border = isRed ? 'border-red-400/30' : 'border-blue-400/30';
  const textAlign = align === 'left' ? 'text-left' : 'text-right';

  if (variant === 'compact') {
    const compactSlots = slots.map(t => t || 'TBD');
    return (
      <div className={`flex-1 min-w-0 ${textAlign}`}>
        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
          {label}
        </p>
        {compactSlots.map((t, i) => (
          <p key={i} className={`text-xs font-bold truncate ${isWinner ? 'text-white' : 'text-slate-200'}`}>{t}</p>
        ))}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex-1 rounded-2xl border-2 p-3 md:p-4 relative overflow-hidden ${
        isRed
          ? 'border-red-300 bg-gradient-to-br from-red-50 via-white to-red-100/50'
          : 'border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-100/50'
      } ${isWinner ? 'ring-2 ring-amber-400 shadow-md shadow-amber-200/30' : ''}`}>
        {isWinner && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
            <Trophy className="w-3 h-3" /> Winner
          </div>
        )}
        <div className={`flex items-center gap-2 mb-3 ${isRed ? 'text-red-700' : 'text-blue-700'}`}>
          <div className={`w-3 h-3 rounded-full ${isRed ? 'bg-red-600' : 'bg-blue-600'}`} />
          <p className="text-[10px] font-black uppercase tracking-[0.15em]">{label}</p>
          {score !== null && (
            <span className={`ml-auto text-xl font-black tabular-nums ${isRed ? 'text-red-600' : 'text-blue-600'}`}>{score}</span>
          )}
        </div>
        <div className="space-y-2">
          {displaySlots.map((t, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
              t
                ? isRed ? 'bg-white border-red-200' : 'bg-white border-blue-200'
                : 'bg-slate-50 border-dashed border-slate-200'
            }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                isRed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Alliance Partner {i + 1}</p>
                <p className={`text-sm font-black truncate ${t ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {t || 'Open Slot'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 rounded-2xl border ${border} ${bg} p-4 relative overflow-hidden ${isWinner ? 'ring-2 ring-amber-400/60' : ''}`}>
      {isWinner && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
          <Trophy className="w-3 h-3" /> Winner
        </div>
      )}
      <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 ${isRed ? 'text-red-200' : 'text-blue-200'}`}>
        {label}
      </p>
      <div className="space-y-2">
        {displaySlots.map((t, i) => (
          <div key={i} className="bg-black/20 rounded-xl px-3 py-2 border border-white/10">
            <p className="text-[8px] font-bold text-white/50 uppercase">Team {i + 1}</p>
            <p className={`font-black truncate ${variant === 'broadcast' ? 'text-base md:text-lg' : 'text-sm'} text-white`}>{t}</p>
          </div>
        ))}
      </div>
      {score !== null && variant !== 'standard' && (
        <p className={`mt-3 font-black tabular-nums ${variant === 'broadcast' ? 'text-3xl md:text-4xl' : 'text-2xl'} text-white ${textAlign}`}>
          {score}
        </p>
      )}
    </div>
  );
}

export default function VexAllianceDisplay({
  sideA,
  sideB,
  winningSide,
  variant = 'standard',
  isLive = false,
  showLabels = true,
  round,
  matchNumber,
}: VexAllianceDisplayProps) {
  const scoreA = sideA.score;
  const scoreB = sideB.score;
  const redWins = winningSide === 'SIDE_A' || (scoreA !== null && scoreB !== null && scoreA > scoreB);
  const blueWins = winningSide === 'SIDE_B' || (scoreA !== null && scoreB !== null && scoreB > scoreA);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <AllianceColumn label={showLabels ? 'Red' : ''} teams={sideA.teams} score={scoreA} color="red" isWinner={!!redWins && !blueWins} variant="compact" align="left" />
        <div className="shrink-0 text-center">
          <div className={`flex items-center gap-1.5 font-black tabular-nums ${isLive ? 'text-white text-xl' : 'text-slate-900 text-lg'}`}>
            <span>{scoreA ?? '-'}</span>
            <span className="text-slate-400 text-sm">:</span>
            <span>{scoreB ?? '-'}</span>
          </div>
        </div>
        <AllianceColumn label={showLabels ? 'Blue' : ''} teams={sideB.teams} score={scoreB} color="blue" isWinner={!!blueWins && !redWins} variant="compact" align="right" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(round || matchNumber) && variant === 'detailed' && (
        <div className="flex items-center justify-center gap-2">
          {round && <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{round}</span>}
          {isLive && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
          )}
        </div>
      )}
      <div className={`flex items-stretch gap-3 md:gap-4 ${variant === 'broadcast' ? 'md:gap-6' : ''} ${variant === 'detailed' ? 'flex-col sm:flex-row' : ''}`}>
      <AllianceColumn
        label={VEX_ALLIANCE_CONFIG.redLabel}
        teams={sideA.teams}
        score={scoreA}
        color="red"
        isWinner={!!redWins && !blueWins}
        variant={variant}
        align="left"
      />

      <div className="flex flex-col items-center justify-center shrink-0 px-1 md:px-3">
        {isLive && (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[9px] font-black text-red-400 uppercase tracking-wider mb-2"
          >
            LIVE
          </motion.span>
        )}
        <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 rounded-2xl font-black tabular-nums ${
          isLive
            ? 'bg-white/10 text-white text-2xl md:text-4xl border border-white/20'
            : 'bg-slate-100 text-slate-900 text-xl md:text-3xl border border-slate-200'
        }`}>
          <span>{scoreA ?? '-'}</span>
          <span className={`text-sm md:text-lg ${isLive ? 'text-white/40' : 'text-slate-300'}`}>:</span>
          <span>{scoreB ?? '-'}</span>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest mt-2 ${isLive ? 'text-white/40' : 'text-slate-400'}`}>VS</span>
      </div>

      <AllianceColumn
        label={VEX_ALLIANCE_CONFIG.blueLabel}
        teams={sideB.teams}
        score={scoreB}
        color="blue"
        isWinner={!!blueWins && !redWins}
        variant={variant}
        align="right"
      />
      </div>
    </div>
  );
}

export function sidesFromMatch(sides: { side: 'SIDE_A' | 'SIDE_B'; score: number; teams: string[] }[]) {
  const sideA = sides.find(s => s.side === 'SIDE_A');
  const sideB = sides.find(s => s.side === 'SIDE_B');
  return {
    sideA: { side: 'SIDE_A' as const, score: sideA?.score ?? null, teams: sideA?.teams?.filter(Boolean) || [] },
    sideB: { side: 'SIDE_B' as const, score: sideB?.score ?? null, teams: sideB?.teams?.filter(Boolean) || [] },
  };
}
