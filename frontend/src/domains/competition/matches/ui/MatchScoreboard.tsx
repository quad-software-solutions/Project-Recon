import { Trophy } from 'lucide-react';

interface MatchScoreboardProps {
  sideALabel?: string;
  sideBLabel?: string;
  sideAScore: number;
  sideBScore: number;
  winningSide: string | null;
  status: string;
  sideATeams: string[];
  sideBTeams: string[];
}

export default function MatchScoreboard({
  sideALabel = 'Side A',
  sideBLabel = 'Side B',
  sideAScore,
  sideBScore,
  winningSide,
  status,
  sideATeams,
  sideBTeams,
}: MatchScoreboardProps) {
  const isComplete = status === 'COMPLETED';
  const isLive = status === 'LIVE';
  const sideAWon = winningSide === 'SIDE_A';
  const sideBWon = winningSide === 'SIDE_B';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-red-400">LIVE</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 items-center">
        <div className={`text-center ${sideAWon ? 'opacity-100' : isComplete ? 'opacity-50' : ''}`}>
          <div className="flex flex-wrap justify-center gap-1.5 mb-2">
            {sideATeams.map((name, i) => (
              <span key={i} className="text-xs font-bold text-slate-300 bg-white/10 rounded-lg px-2.5 py-1">
                {name}
              </span>
            ))}
            {sideATeams.length === 0 && <span className="text-xs text-slate-500 italic">TBD</span>}
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{sideALabel}</p>
          {sideAWon && <Trophy className="w-4 h-4 text-amber-400 mx-auto" />}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-1">
            <span className={`text-5xl md:text-6xl font-black ${sideAWon ? 'text-emerald-400' : isComplete && !sideBWon ? 'text-red-400' : 'text-white'}`}>
              {sideAScore}
            </span>
            <span className="text-3xl font-black text-slate-500">:</span>
            <span className={`text-5xl md:text-6xl font-black ${sideBWon ? 'text-emerald-400' : isComplete && !sideAWon ? 'text-red-400' : 'text-white'}`}>
              {sideBScore}
            </span>
          </div>
          {isComplete && winningSide && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-3 py-1 inline-block">
              {sideAWon ? `${sideALabel} Wins` : `${sideBLabel} Wins`}
            </span>
          )}
          {!isComplete && !isLive && (
            <span className="text-xs text-slate-400 font-medium">Match Not Played</span>
          )}
          {isLive && (
            <span className="text-xs text-red-400 font-black animate-pulse">In Progress</span>
          )}
        </div>

        <div className={`text-center ${sideBWon ? 'opacity-100' : isComplete ? 'opacity-50' : ''}`}>
          <div className="flex flex-wrap justify-center gap-1.5 mb-2">
            {sideBTeams.map((name, i) => (
              <span key={i} className="text-xs font-bold text-slate-300 bg-white/10 rounded-lg px-2.5 py-1">
                {name}
              </span>
            ))}
            {sideBTeams.length === 0 && <span className="text-xs text-slate-500 italic">TBD</span>}
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{sideBLabel}</p>
          {sideBWon && <Trophy className="w-4 h-4 text-amber-400 mx-auto" />}
        </div>
      </div>
    </div>
  );
}
