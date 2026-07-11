import { motion } from 'motion/react';
import { Users, Trophy, Swords, Medal, Building, ChevronRight } from 'lucide-react';
import type { PublicTeamEntry } from '../../api/competitionApi';

interface TeamCardProps {
  key?: string | number | null;
  team: PublicTeamEntry;
  rank?: number;
  onClick?: () => void;
}

export default function TeamCard({ team, rank, onClick }: TeamCardProps) {
  const totalGames = team.wins + team.losses + team.draws;
  const winRate = totalGames > 0 ? Math.round((team.wins / totalGames) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-brand-red/20 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {rank !== undefined && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
              rank === 1 ? 'bg-amber-100 text-amber-600' :
              rank === 2 ? 'bg-slate-100 text-slate-500' :
              rank === 3 ? 'bg-orange-100 text-orange-600' :
              'bg-slate-100 text-slate-400'
            }`}>
              {rank}
            </div>
          )}
          <div>
            <h4 className="font-black text-sm text-slate-900 group-hover:text-brand-red transition-colors">{team.teamName}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
              <Building className="w-3 h-3" />
              {team.organization || 'No organization'}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-red transition-colors" />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-emerald-50 rounded-lg p-2 text-center">
          <Trophy className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
          <p className="text-sm font-black text-emerald-700">{team.wins}</p>
          <p className="text-[8px] font-bold text-emerald-500 uppercase">W</p>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <Swords className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
          <p className="text-sm font-black text-red-600">{team.losses}</p>
          <p className="text-[8px] font-bold text-red-400 uppercase">L</p>
        </div>
        <div className="bg-slate-100 rounded-lg p-2 text-center">
          <Medal className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
          <p className="text-sm font-black text-slate-600">{team.draws}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase">D</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2 text-center">
          <Users className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-0.5" />
          <p className="text-sm font-black text-indigo-700">{team.points}</p>
          <p className="text-[8px] font-bold text-indigo-500 uppercase">Pts</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-medium">{team.tournamentName}</span>
        <span className="font-bold text-slate-600">{winRate}% Win Rate</span>
      </div>

      {totalGames > 0 && (
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${winRate}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
