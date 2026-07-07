import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Trophy, Swords, Wrench, Medal, BookOpen, ChevronRight, MapPin, Star, Calendar, Users, Hash, Target, Eye, Zap, CheckCircle2, FlaskConical } from 'lucide-react';
import { MOCK_VEX_TEAM, MOCK_VEX_ROBOTS, MOCK_VEX_AWARDS, MOCK_VEX_MATCHES, MOCK_VEX_NOTEBOOK } from '@/src/shared/constants/mock-data';

type VexTab = 'overview' | 'robots' | 'awards' | 'matches' | 'notebook';

const memberRoles: Record<string, string> = {
  'Melkamu A.': 'Captain / Driver',
  'Abebe K.': 'Programmer',
  'Selam B.': 'Builder',
  'Yonas D.': 'Driver',
  'Hana M.': 'Notebook Lead',
};

const team = MOCK_VEX_TEAM;

export default function VexTeamHub() {
  const [activeTab, setActiveTab] = useState<VexTab>('overview');

  const tabs: { id: VexTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Team Overview', icon: Cpu },
    { id: 'robots', label: 'Robots', icon: Wrench },
    { id: 'awards', label: 'Awards', icon: Medal },
    { id: 'matches', label: 'Matches', icon: Swords },
    { id: 'notebook', label: 'Notebook', icon: BookOpen },
  ];

  return (
    <div className="pb-8">
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-brand-red/5 via-brand-blue/5 to-white px-5 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5 text-brand-red" />
              <h2 className="font-black text-lg text-slate-900">{team.name}</h2>
              <span className="text-[10px] font-mono font-bold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full">#{team.number}</span>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Demo</span>
            </div>
            <p className="text-xs text-slate-500">{team.school} · {team.location}</p>
          </div>
          <div className="text-3xl">{team.avatar}</div>
        </div>
        <div className="grid grid-cols-4 gap-px bg-brand-border">
          {[
            { label: 'Active Robots', value: MOCK_VEX_ROBOTS.filter(r => r.status === 'active').length.toString(), icon: Wrench },
            { label: 'Awards Won', value: MOCK_VEX_AWARDS.filter(a => !a.upcoming).length.toString(), icon: Trophy },
            { label: 'Match Wins', value: MOCK_VEX_MATCHES.filter(m => m.result === 'win').length.toString(), icon: Star },
            { label: 'Members', value: team.members.length.toString(), icon: Users },
          ].map((s, i) => {
            const StatIcon = s.icon;
            return (
              <div key={i} className="bg-white px-4 py-3 text-center">
                <StatIcon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="font-black text-xl text-slate-900">{s.value}</p>
                <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isActive ? 'bg-brand-red text-white shadow-sm' : 'bg-white border border-brand-border text-slate-500 hover:border-slate-300'}`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === 'overview' && <TeamOverview />}
          {activeTab === 'robots' && <RobotsList />}
          {activeTab === 'awards' && <AwardsList />}
          {activeTab === 'matches' && <MatchHistory />}
          {activeTab === 'notebook' && <NotebookEntries />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TeamOverview() {
  const awardsWon = MOCK_VEX_AWARDS.filter(a => !a.upcoming);
  const matchWins = MOCK_VEX_MATCHES.filter(m => m.result === 'win');
  const lastMatch = MOCK_VEX_MATCHES.filter(m => m.result !== 'upcoming')[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-brand-red" /> About the Team
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">{team.bio}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{team.location}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Est. {team.established}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />Coach: {team.coach}</span>
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand-red" /> Team Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {team.members.map((name, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-brand-border">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-black text-sm shrink-0">
                  {name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-900 font-semibold">{name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{memberRoles[name] || 'Team Member'}</p>
                </div>
                {i === 0 && <span className="ml-auto text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">Captain</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-gradient-to-br from-brand-red to-brand-red-dark rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10"><Hash className="w-full h-full" /></div>
          <p className="text-[10px] font-medium text-white/70 mb-0.5">Team Number</p>
          <p className="font-black text-2xl tracking-tight">{team.number}</p>
          <p className="text-xs text-white/80 mt-0.5">{team.name}</p>
        </div>

        {lastMatch && (
          <div className="bg-white border border-brand-border rounded-2xl p-4">
            <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5">
              <Swords className="w-3 h-3 text-brand-red" /> Last Match
            </h4>
            <p className="text-[11px] text-slate-500">{lastMatch.event}</p>
            <p className="font-bold text-lg text-slate-900 mt-0.5">{lastMatch.score}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${lastMatch.result === 'win' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {lastMatch.result === 'win' ? 'Victory' : 'Loss'}
              </span>
              <span className="text-[10px] text-slate-400">vs {lastMatch.opponent.split('(')[0].trim()}</span>
            </div>
          </div>
        )}

        <div className="bg-white border border-brand-border rounded-2xl p-4">
          <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" /> Top Achievement
          </h4>
          {awardsWon.length > 0 ? (
            <>
              <p className="font-bold text-sm text-slate-900">{awardsWon[0].name}</p>
              <p className="text-[10px] text-slate-500">{awardsWon[0].event}</p>
            </>
          ) : (
            <p className="text-[11px] text-slate-400 italic">No awards yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RobotsList() {
  if (MOCK_VEX_ROBOTS.length === 0) {
    return (
      <div className="bg-white border border-dashed border-brand-border rounded-2xl p-10 text-center">
        <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-slate-500">No Robots Registered</h3>
        <p className="text-[11px] text-slate-400 mt-1">Robots will appear here once added.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {MOCK_VEX_ROBOTS.map((robot, i) => (
        <motion.div key={robot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="bg-white border border-brand-border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 border border-brand-border flex items-center justify-center text-2xl shrink-0 overflow-hidden">
            {robot.image ? (
              <img src={robot.image} alt={robot.name} className="w-full h-full object-cover" />
            ) : '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-bold text-sm text-slate-900">{robot.name}</h4>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${robot.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{robot.status}</span>
            </div>
            <p className="text-xs text-slate-500">{robot.competition} · {robot.season}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {robot.specs.slice(0, 3).map((spec, j) => (
                <span key={j} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-brand-border">{spec}</span>
              ))}
              {robot.specs.length > 3 && <span className="text-[10px] text-slate-400">+{robot.specs.length - 3} more</span>}
            </div>
            {robot.achievements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {robot.achievements.map((a, j) => (
                  <span key={j} className="text-[9px] font-medium text-brand-red bg-brand-red/5 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5" /> {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AwardsList() {
  if (MOCK_VEX_AWARDS.length === 0) {
    return (
      <div className="bg-white border border-dashed border-brand-border rounded-2xl p-10 text-center">
        <Medal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-slate-500">No Awards Yet</h3>
        <p className="text-[11px] text-slate-400 mt-1">Awards and recognitions will be listed here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {MOCK_VEX_AWARDS.map((award, i) => (
        <motion.div key={award.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className={`bg-white border rounded-xl p-4 ${award.upcoming ? 'border-dashed border-amber-300/50 bg-amber-50/30' : 'border-brand-border'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${award.upcoming ? 'bg-amber-100' : 'bg-brand-red/10'}`}>
                {award.upcoming ? '📅' : '🏆'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{award.name}</h4>
                <p className="text-xs text-slate-500">{award.event}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {award.date}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${award.upcoming ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{award.upcoming ? 'Upcoming' : 'Awarded'}</span>
                </div>
              </div>
            </div>
            {!award.upcoming && (
              <span className="text-xs font-black text-brand-red">{award.category}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MatchHistory() {
  if (MOCK_VEX_MATCHES.length === 0) {
    return (
      <div className="bg-white border border-dashed border-brand-border rounded-2xl p-10 text-center">
        <Swords className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-slate-500">No Matches Yet</h3>
        <p className="text-[11px] text-slate-400 mt-1">Match history will appear once competitions begin.</p>
      </div>
    );
  }

  const wins = MOCK_VEX_MATCHES.filter(m => m.result === 'win').length;
  const losses = MOCK_VEX_MATCHES.filter(m => m.result === 'loss').length;
  const total = MOCK_VEX_MATCHES.filter(m => m.result !== 'upcoming').length;

  return (
    <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900">Match History</h3>
        {total > 0 && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-600 font-bold">{wins}W</span>
            <span className="text-slate-300">-</span>
            <span className="text-red-600 font-bold">{losses}L</span>
            <span className="text-slate-400">· {Math.round((wins / total) * 100)}% win rate</span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-brand-border">
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Event</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Round</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Opponent</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Score</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Result</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_VEX_MATCHES.map((m, i) => (
              <tr key={m.id || i} className="border-b border-brand-border hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-700">{m.event}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{m.round}</span></td>
                <td className="px-4 py-3 text-xs text-slate-700">{m.opponent}</td>
                <td className={`px-4 py-3 text-xs font-bold text-center ${m.result === 'win' ? 'text-emerald-600' : m.result === 'loss' ? 'text-red-600' : 'text-slate-400'}`}>{m.result === 'upcoming' ? '—' : m.score}</td>
                <td className="px-4 py-3 text-center">
                  {m.result !== 'upcoming' ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.result === 'win' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {m.result}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Upcoming</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotebookEntries() {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (MOCK_VEX_NOTEBOOK.length === 0) {
    return (
      <div className="bg-white border border-dashed border-brand-border rounded-2xl p-10 text-center">
        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-sm text-slate-500">No Notebook Entries</h3>
        <p className="text-[11px] text-slate-400 mt-1">Engineering notebook entries will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {MOCK_VEX_NOTEBOOK.map((entry, i) => {
        const isOpen = expanded === entry.id;
        return (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-brand-border rounded-xl overflow-hidden"
          >
            <button onClick={() => setExpanded(isOpen ? null : entry.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-red/5 flex items-center justify-center">
                  <FlaskConical className="w-3.5 h-3.5 text-brand-red" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{entry.title}</h4>
                  <p className="text-[10px] text-slate-400">{entry.date} · {entry.author}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 border-t border-brand-border">
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{entry.content}</p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag, j) => (
                          <span key={j} className="text-[9px] font-bold text-brand-red bg-brand-red/5 border border-brand-red/10 px-1.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
