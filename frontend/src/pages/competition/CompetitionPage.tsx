import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Gamepad2, Users, BarChart3, LayoutDashboard, ClipboardList } from 'lucide-react';
import CompetitionHub from '../../domains/competition/hub/ui/CompetitionHub';
import EventDashboard from '../../domains/competition/hub/ui/EventDashboard';
import TournamentDetailPage from '../../domains/competition/tournaments/ui/TournamentDetailPage';
import TeamListPage from '../../domains/competition/teams/ui/TeamListPage';
import TeamDetailsPage from '../../domains/competition/teams/ui/TeamDetailsPage';
import MatchListPage from '../../domains/competition/matches/ui/MatchListPage';
import MatchDetailsPage from '../../domains/competition/matches/ui/MatchDetailsPage';
import RegistrationDashboard from '../../domains/competition/registrations/ui/RegistrationDashboard';
import { UserProfile } from '../../shared/types';
import { canAccessTab } from '../../shared/auth/permissions';

type CompView = 'hub' | 'dashboard' | 'teams' | 'team-detail' | 'matches' | 'match-detail' | 'tournament-detail' | 'registrations';

interface CompetitionPageProps {
  currentUser: UserProfile | null;
}

export default function CompetitionPage({ currentUser }: CompetitionPageProps) {
  const [view, setView] = useState<CompView>('hub');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  const navTo = (v: CompView) => {
    setView(v);
    if (v !== 'team-detail') setSelectedTeamId(null);
    if (v !== 'match-detail') setSelectedMatchId(null);
    if (v !== 'tournament-detail') setSelectedTournamentId(null);
  };

  const openTeam = (id: string) => { setSelectedTeamId(id); setView('team-detail'); };
  const openMatch = (id: string) => { setSelectedMatchId(id); setView('match-detail'); };
  const openTournament = (id: string) => { setSelectedTournamentId(id); setView('tournament-detail'); };

  const role = currentUser?.role || null;
  const isStaff = role === 'Admin' || role === 'Manager' || role === 'EventManager';

  const tabs: { id: CompView; label: string; icon: typeof Trophy; staffOnly?: boolean }[] = [
    { id: 'hub', label: 'Events', icon: Trophy },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, staffOnly: true },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'matches', label: 'Matches', icon: Gamepad2 },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList, staffOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.staffOnly || isStaff);
  const activeTab = visibleTabs.find(t => t.id === view) ? view : 'hub';

  return (
    <motion.div key="competitions-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <div className="min-h-[calc(100vh-76px)] bg-brand-paper py-10 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/8 via-[#080808] to-brand-red/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex gap-1 mb-6 p-1 bg-slate-100 border border-slate-200 rounded-2xl w-fit overflow-x-auto">
            {visibleTabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => navTo(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'hub' && <CompetitionHub currentUser={currentUser} onViewTournament={openTournament} />}
          {activeTab === 'dashboard' && isStaff && <EventDashboard />}
          {activeTab === 'teams' && <TeamListPage onSelectTeam={openTeam} />}
          {activeTab === 'team-detail' && selectedTeamId && (
            <TeamDetailsPage teamId={selectedTeamId} onBack={() => navTo('teams')} />
          )}
          {activeTab === 'matches' && <MatchListPage onSelectMatch={openMatch} />}
          {activeTab === 'match-detail' && selectedMatchId && (
            <MatchDetailsPage matchId={selectedMatchId} onBack={() => navTo('matches')} />
          )}
          {activeTab === 'tournament-detail' && selectedTournamentId && (
            <TournamentDetailPage tournamentId={selectedTournamentId} onBack={() => navTo('hub')} />
          )}
          {activeTab === 'registrations' && isStaff && <RegistrationDashboard />}
        </div>
      </div>
    </motion.div>
  );
}
