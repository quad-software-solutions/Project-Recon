import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Users, Building2, Trophy, Filter, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { getPublicTeams, type PublicTeamEntry } from '../../api/competitionApi';
import TeamCard from './TeamCard';

interface TeamListPageProps {
  onSelectTeam: (teamId: string) => void;
}

export default function TeamListPage({ onSelectTeam }: TeamListPageProps) {
  const [teams, setTeams] = useState<PublicTeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPublicTeams()
      .then(setTeams)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const tournaments = [...new Set(teams.map(t => t.tournamentName))].sort();
  const organizations = [...new Set(teams.map(t => t.organization).filter(Boolean))].sort();

  const sorted = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
  const filtered = sorted.filter(t => {
    if (search && !t.teamName.toLowerCase().includes(search.toLowerCase()) && !t.organization.toLowerCase().includes(search.toLowerCase())) return false;
    if (tournamentFilter !== 'all' && t.tournamentName !== tournamentFilter) return false;
    if (orgFilter !== 'all' && t.organization !== orgFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          <p className="text-xs text-slate-400 font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold text-red-600 underline">Try again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-red" />
            Teams ({teams.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Browse all competing teams across tournaments</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams or organizations..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={tournamentFilter}
            onChange={e => setTournamentFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-red"
          >
            <option value="all">All Tournaments</option>
            {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {organizations.length > 0 && (
            <select
              value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-red"
            >
              <option value="all">All Organizations</option>
              {organizations.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center">
          <Users className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="font-black text-xl text-slate-600 mb-1">No Teams Found</h3>
          <p className="text-sm text-slate-400 max-w-xs font-medium">
            {search || tournamentFilter !== 'all' || orgFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No teams are registered for any tournaments yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team, idx) => (
            <TeamCard
              key={team.id}
              team={team}
              rank={idx + 1}
              onClick={() => onSelectTeam(team.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
