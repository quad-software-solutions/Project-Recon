import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, MapPin, Users, Calendar, ChevronRight, Shield, Medal, Target, Clock,
  SearchX, CheckCircle2, ExternalLink, Sparkles, Tv, Binary, GraduationCap,
  BookOpen, User, Clock3, DollarSign, Wrench, Cpu, Swords
} from 'lucide-react';
import { MOCK_TOURNAMENTS, MOCK_MATCHES, MOCK_WORKSHOPS } from '@/src/shared/constants/mock-data';

import { UserProfile } from '@/src/shared/types';

type StatusFilter = 'all' | 'upcoming' | 'live' | 'completed';
type HubTab = 'tournaments' | 'workshops' | 'myteam';

const CATEGORY_COLORS: Record<string, string> = {
  'VEX IQ': 'from-cyan-500 to-blue-600',
  'VEX V5': 'from-brand-blue to-brand-blue-dark',
  'Enjoy AI': 'from-emerald-500 to-teal-600',
  'Arduino': 'from-brand-red to-brand-red-dark',
  'STEM': 'from-purple-500 to-violet-600',
  'Coding': 'from-amber-500 to-orange-600',
};

const WS_STATUS: Record<string, string> = {
  upcoming: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  ongoing: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  completed: 'bg-slate-100 text-slate-500 border-slate-200',
};

interface CompetitionHubProps {
  currentUser?: UserProfile | null;
}

export default function CompetitionHub({ currentUser }: CompetitionHubProps) {
  const [hubTab, setHubTab] = useState<HubTab>('tournaments');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string | null>(null);
  const [registered, setRegistered] = useState<string[]>([]);
  const [workshopEnrolled, setWorkshopEnrolled] = useState<string[]>([]);

  const filtered = statusFilter === 'all' ? MOCK_TOURNAMENTS : MOCK_TOURNAMENTS.filter(t => t.status === statusFilter);
  const selected = MOCK_TOURNAMENTS.find(t => t.id === selectedTournament);
  const selectedMatches = MOCK_MATCHES.filter(m => m.tournamentId === selectedTournament);
  const isRegistered = selected ? registered.includes(selected.id) : false;

  const filteredWorkshops = statusFilter === 'all' ? MOCK_WORKSHOPS : MOCK_WORKSHOPS.filter(w => w.status === statusFilter);
  const selectedWorkshopData = MOCK_WORKSHOPS.find(w => w.id === selectedWorkshop);
  const isEnrolled = selectedWorkshopData ? workshopEnrolled.includes(selectedWorkshopData.id) : false;

  const sc: Record<string, { bg: string; text: string; dot: string }> = {
    upcoming: { bg: 'bg-brand-blue/10', text: 'text-brand-blue', dot: 'bg-brand-blue' },
    live: { bg: 'bg-brand-red/10', text: 'text-brand-red', dot: 'bg-brand-red animate-pulse' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  };

  const FILTERS: { id: StatusFilter; icon: React.ElementType }[] = [
    { id: 'all', icon: Binary },
    { id: 'upcoming', icon: Calendar },
    { id: 'live', icon: Tv },
    { id: 'completed', icon: CheckCircle2 },
  ];

  const handleRegister = (tournamentId: string) => setRegistered(prev => [...prev, tournamentId]);
  const handleEnroll = (workshopId: string) => setWorkshopEnrolled(prev => [...prev, workshopId]);

  const switchTab = (tab: HubTab) => {
    setHubTab(tab);
    setSelectedTournament(null);
    setSelectedWorkshop(null);
    setStatusFilter('all');
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-brand-paper py-10 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/8 via-[#080808] to-brand-red/5 pointer-events-none" />
      <div className="absolute top-[-8%] right-[-5%] w-[500px] h-[500px] bg-brand-red/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-8%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-full mb-3">
            <Sparkles className="w-3 h-3" />
            <span className="font-black text-[9px] uppercase tracking-[0.2em]">
              {hubTab === 'tournaments' ? 'Competition Hub' : 'Workshop Center'}
            </span>
          </div>
          <h1 className="font-black text-3xl md:text-4xl text-white tracking-tight">
            {hubTab === 'tournaments' ? (
              <>Tournaments & <span className="text-brand-red">Championships</span></>
            ) : (
              <>Hands-On <span className="text-brand-red">Workshops</span></>
            )}
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl font-medium">
            {hubTab === 'tournaments'
              ? 'Register, track, and follow robotics competitions across Ethiopia and Africa. Live scores, standings & team registration.'
              : 'Build skills with intensive hands-on training sessions led by expert instructors. For all levels and ages.'}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-100 border border-slate-200 rounded-2xl w-fit overflow-x-auto">
          {([
            { id: 'tournaments' as HubTab, label: 'Tournaments', icon: Trophy },
            { id: 'workshops' as HubTab, label: 'Workshops', icon: GraduationCap },
            { id: 'myteam' as HubTab, label: 'My Team', icon: Cpu },
          ]).map(tab => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
                  hubTab === tab.id
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

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {FILTERS.map(f => {
            const Icon = f.icon;
            return (
              <button key={f.id} onClick={() => { setStatusFilter(f.id); setSelectedTournament(null); setSelectedWorkshop(null); }}
                className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  statusFilter === f.id
                    ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.id}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {hubTab === 'tournaments' ? (
          <TournamentsView
            filtered={filtered}
            selected={selected}
            selectedMatches={selectedMatches}
            isRegistered={isRegistered}
            selectedTournament={selectedTournament}
            sc={sc}
            statusFilter={statusFilter}
            onSelect={setSelectedTournament}
            onRegister={handleRegister}
          />
        ) : hubTab === 'workshops' ? (
          <WorkshopsView
            filteredWorkshops={filteredWorkshops}
            selectedWorkshopData={selectedWorkshopData}
            isEnrolled={isEnrolled}
            statusFilter={statusFilter}
            onSelect={setSelectedWorkshop}
            onEnroll={handleEnroll}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center text-center">
            <Cpu className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="font-black text-xl text-slate-700 mb-2">VEX Team Management</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6">Full VEX team tools — robots, awards, matches, and engineering notebook — are now in the Manager Dashboard.</p>
            <p className="text-xs text-slate-500">Log in with <strong className="text-brand-red">manager@gmail.com</strong> or <strong className="text-brand-red">event@gmail.com</strong> and navigate to the VEX sections.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tournaments ──
function TournamentsView({
  filtered, selected, selectedMatches, isRegistered, selectedTournament, sc, statusFilter, onSelect, onRegister,
}: {
  filtered: typeof MOCK_TOURNAMENTS;
  selected: typeof MOCK_TOURNAMENTS[0] | undefined;
  selectedMatches: typeof MOCK_MATCHES;
  isRegistered: boolean;
  selectedTournament: string | null;
  sc: Record<string, { bg: string; text: string; dot: string }>;
  statusFilter: string;
  onSelect: (id: string | null) => void;
  onRegister: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 flex flex-col gap-3">
        {filtered.length > 0 ? filtered.map((t, i) => {
          const s = sc[t.status];
          const isSelected = selectedTournament === t.id;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(t.id)}
              className={`relative bg-white/90 backdrop-blur-sm rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-brand-red/40 bg-brand-red/5 shadow-lg shadow-brand-red/10' : 'border-slate-200 hover:border-slate-200 hover:-translate-y-0.5'
              }`}
            >
              {isSelected && <motion.div layoutId="tournament-bar" className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-red to-brand-red-dark rounded-l-2xl" />}
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg} ${s.text} text-[9px] font-black uppercase tracking-wider`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{t.status}
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{t.category}</span>
              </div>
              <h3 className={`font-black text-base mb-1 transition-colors ${isSelected ? 'text-brand-red' : 'text-slate-900'}`}>{t.name}</h3>
              <div className="flex flex-col gap-1.5 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />{t.date}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{t.location}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" />{t.teams.length}/{t.maxTeams} teams</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1 text-xs font-black text-amber-400"><Trophy className="w-3.5 h-3.5" />{t.prizePool}</span>
                <ChevronRight className={`w-4 h-4 transition-all ${isSelected ? 'text-brand-red translate-x-0.5' : 'text-slate-400'}`} />
              </div>
            </motion.div>
          );
        }) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 text-center bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-200">
            <SearchX className="w-12 h-12 text-slate-400 mb-3 opacity-40" />
            <h3 className="font-black text-base text-slate-600 mb-1">No {statusFilter} tournaments</h3>
            <p className="text-sm text-slate-400 max-w-xs font-medium">Try a different filter or check back later.</p>
          </motion.div>
        )}
      </div>

      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 24, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#0c0c0c] p-6 md:p-8 border-b border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => { const s = sc[selected.status]; return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{selected.status}
                      </span>
                    ); })()}
                    <span className="text-[10px] text-slate-400 font-bold">{selected.category}</span>
                  </div>
                  <h2 className="font-black text-2xl md:text-3xl text-slate-900 mb-2">{selected.name}</h2>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">{selected.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {[
                      { icon: Calendar, label: 'Date', value: selected.date },
                      { icon: MapPin, label: 'Venue', value: selected.location },
                      { icon: Trophy, label: 'Prize', value: selected.prizePool },
                      { icon: Clock, label: 'Deadline', value: selected.registrationDeadline }
                    ].map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                        className="bg-slate-100 backdrop-blur-sm rounded-xl p-3 border border-slate-100"
                      >
                        <m.icon className="w-4 h-4 text-brand-red mb-1" />
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">{m.label}</p>
                        <p className="text-xs font-bold text-slate-900">{m.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                  <Medal className="w-5 h-5 text-amber-400" />Standings
                  <span className="text-xs font-medium text-slate-400 ml-auto">{selected.teams.length} teams</span>
                </h3>
                <div className="space-y-2 mb-8">
                  {[...selected.teams].sort((a, b) => { if (b.score !== a.score) return b.score - a.score; return b.wins - a.wins; }).map((team, i) => (
                    <motion.div key={team.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${i === 0 ? 'bg-amber-500/10 border-amber-500/30' : i < 3 ? 'bg-slate-100 border-slate-200' : 'border-slate-100 hover:bg-slate-100'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30' : i === 1 ? 'bg-gradient-to-br from-slate-500 to-slate-600 text-slate-900' : i === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{team.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{team.school}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-slate-900">{team.score.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{team.wins}W · {team.losses}L</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {selectedMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                      <Target className="w-5 h-5 text-brand-red" />Match Schedule
                      <span className="text-xs font-medium text-slate-400 ml-auto">{selectedMatches.length} matches</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedMatches.map((match, i) => (
                        <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all group"
                        >
                          <div className="text-center min-w-[70px] shrink-0">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{match.round}</p>
                            <p className="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />{match.time}
                            </p>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 flex-1 text-right truncate">{match.team1}</span>
                            <div className={`px-4 py-1.5 rounded-lg font-black text-sm min-w-[70px] text-center border ${match.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : match.status === 'live' ? 'bg-brand-red/10 text-brand-red border-brand-red/30 animate-pulse' : 'bg-brand-blue/10 text-brand-blue border-brand-blue/30'}`}>
                              {match.status === 'completed' ? `${match.score1} - ${match.score2}` : 'vs'}
                            </div>
                            <span className="font-bold text-sm text-slate-900 flex-1 text-left truncate">{match.team2}</span>
                          </div>
                          {selected.status === 'live' && <ExternalLink className="w-4 h-4 text-brand-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.status === 'upcoming' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {isRegistered ? (
                      <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-4 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 uppercase tracking-wider">
                        <CheckCircle2 className="w-5 h-5" />Team Registered Successfully
                      </div>
                    ) : (
                      <button onClick={() => onRegister(selected.id)}
                        className="group relative w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all overflow-hidden"
                      >
                        <Shield className="w-5 h-5" />Register Your Team
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center min-h-[400px] justify-center"
            >
              <Trophy className="w-16 h-16 text-slate-400 mb-4 opacity-30" />
              <h3 className="font-black text-xl text-slate-600 mb-1">Select a Tournament</h3>
              <p className="text-sm text-slate-400 max-w-xs font-medium">Click on any competition from the left panel to view standings, match schedules, and registration.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Workshops ──
function WorkshopsView({
  filteredWorkshops, selectedWorkshopData, isEnrolled, statusFilter, onSelect, onEnroll,
}: {
  filteredWorkshops: typeof MOCK_WORKSHOPS;
  selectedWorkshopData: typeof MOCK_WORKSHOPS[0] | undefined;
  isEnrolled: boolean;
  statusFilter: string;
  onSelect: (id: string | null) => void;
  onEnroll: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Workshop List */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        {filteredWorkshops.length > 0 ? filteredWorkshops.map((w, i) => {
          const isSelected = selectedWorkshopData?.id === w.id;
          const spotsLeft = w.capacity - w.enrolled;
          const catColor = CATEGORY_COLORS[w.category] || 'from-slate-500 to-slate-600';
          return (
            <motion.div key={w.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(w.id)}
              className={`relative bg-white/90 backdrop-blur-sm rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-brand-red/40 bg-brand-red/5 shadow-lg shadow-brand-red/10' : 'border-slate-200 hover:border-slate-200 hover:-translate-y-0.5'
              }`}
            >
              {isSelected && <motion.div layoutId="workshop-bar" className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-red to-brand-red-dark rounded-l-2xl" />}
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${WS_STATUS[w.status] || WS_STATUS.upcoming}`}>
                  {w.status}
                </span>
                <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r ${catColor}`}>
                  {w.category}
                </span>
              </div>
              <h3 className={`font-black text-sm mb-1 leading-snug transition-colors ${isSelected ? 'text-brand-red' : 'text-slate-900'}`}>
                {w.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed font-medium">{w.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{w.date}</span>
                <span className="flex items-center gap-1"><Clock3 className="w-3 h-3 text-slate-400" />{w.duration}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{w.location.split(',')[0]}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-brand-red">{w.price.toLocaleString()} ETB</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    spotsLeft === 0 ? 'bg-brand-red/10 text-brand-red' : spotsLeft <= 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <User className="w-3 h-3" />{w.enrolled}/{w.capacity}
                </span>
              </div>
            </motion.div>
          );
        }) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 text-center bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-200">
            <SearchX className="w-12 h-12 text-slate-400 mb-3 opacity-40" />
            <h3 className="font-black text-base text-slate-600 mb-1">No {statusFilter} workshops</h3>
            <p className="text-sm text-slate-400 max-w-xs font-medium">Check back soon for new workshop schedules.</p>
          </motion.div>
        )}
      </div>

      {/* Workshop Detail */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {selectedWorkshopData ? (
            <motion.div key={selectedWorkshopData.id} initial={{ opacity: 0, x: 24, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200 overflow-hidden"
            >
              {/* Hero */}
              <div className="relative h-48 md:h-52 bg-slate-50 overflow-hidden">
                <img src={selectedWorkshopData.image} alt={selectedWorkshopData.title}
                  className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${WS_STATUS[selectedWorkshopData.status] || WS_STATUS.upcoming}`}>
                      {selectedWorkshopData.status}
                    </span>
                    <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-r ${CATEGORY_COLORS[selectedWorkshopData.category] || 'from-slate-500 to-slate-600'}`}>
                      {selectedWorkshopData.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {selectedWorkshopData.level}
                    </span>
                  </div>
                  <h2 className="font-black text-xl md:text-2xl text-slate-900 leading-tight">{selectedWorkshopData.title}</h2>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8">
                {/* Meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { icon: Calendar, label: 'Date', value: selectedWorkshopData.date },
                    { icon: Clock3, label: 'Time', value: selectedWorkshopData.time },
                    { icon: MapPin, label: 'Location', value: selectedWorkshopData.location },
                    { icon: DollarSign, label: 'Fee', value: `${selectedWorkshopData.price.toLocaleString()} ETB` },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-100 rounded-xl p-3 border border-slate-100">
                      <m.icon className="w-4 h-4 text-brand-red mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{m.label}</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3 p-4 bg-slate-100 rounded-xl border border-slate-200 mb-6">
                  <img src={selectedWorkshopData.instructorImage} alt={selectedWorkshopData.instructor}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Instructor</p>
                    <p className="font-bold text-sm text-slate-900">{selectedWorkshopData.instructor}</p>
                    <p className="text-xs text-slate-500">{selectedWorkshopData.instructorRole}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-black text-base text-slate-900 mb-2 uppercase tracking-tight">About This Workshop</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{selectedWorkshopData.detailedDescription}</p>
                </div>

                {/* Curriculum */}
                <div className="mb-6">
                  <h3 className="font-black text-base text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
                    <BookOpen className="w-4 h-4 text-brand-red" />Curriculum Topics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedWorkshopData.topics.map((topic, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-6">
                  <h3 className="font-black text-base text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
                    <Wrench className="w-4 h-4 text-brand-red" />Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkshopData.requirements.map((req, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Enrollment</span>
                    <span className="text-xs font-black text-slate-500">{selectedWorkshopData.enrolled} / {selectedWorkshopData.capacity}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedWorkshopData.enrolled / selectedWorkshopData.capacity) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${selectedWorkshopData.enrolled === selectedWorkshopData.capacity ? 'bg-brand-red' : selectedWorkshopData.enrolled >= selectedWorkshopData.capacity * 0.8 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-red to-brand-red-dark'}`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                    {selectedWorkshopData.capacity - selectedWorkshopData.enrolled === 0
                      ? 'Workshop is full'
                      : `${selectedWorkshopData.capacity - selectedWorkshopData.enrolled} spot${selectedWorkshopData.capacity - selectedWorkshopData.enrolled !== 1 ? 's' : ''} remaining`}
                  </p>
                </div>

                {/* CTA */}
                {selectedWorkshopData.status === 'upcoming' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {isEnrolled ? (
                      <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-4 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 uppercase tracking-wider">
                        <CheckCircle2 className="w-5 h-5" />You&apos;re Enrolled!
                      </div>
                    ) : (
                      <button onClick={() => onEnroll(selectedWorkshopData.id)}
                        disabled={selectedWorkshopData.enrolled >= selectedWorkshopData.capacity}
                        className={`group relative w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all overflow-hidden ${
                          selectedWorkshopData.enrolled >= selectedWorkshopData.capacity
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 hover:-translate-y-0.5 active:scale-[0.98]'
                        }`}
                      >
                        {selectedWorkshopData.enrolled >= selectedWorkshopData.capacity ? (
                          'Workshop Full'
                        ) : (
                          <><GraduationCap className="w-5 h-5" />Enroll Now — {selectedWorkshopData.price.toLocaleString()} ETB</>
                        )}
                        {selectedWorkshopData.enrolled < selectedWorkshopData.capacity && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}
                      </button>
                    )}
                  </motion.div>
                )}

                {selectedWorkshopData.status === 'completed' && (
                  <div className="w-full bg-slate-100 text-slate-400 py-4 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5" />This workshop has ended
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center min-h-[400px] justify-center"
            >
              <GraduationCap className="w-16 h-16 text-slate-400 mb-4 opacity-30" />
              <h3 className="font-black text-xl text-slate-600 mb-1">Select a Workshop</h3>
              <p className="text-sm text-slate-400 max-w-xs font-medium">Click on any workshop from the left panel to view curriculum details, instructor info, and enrollment options.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}