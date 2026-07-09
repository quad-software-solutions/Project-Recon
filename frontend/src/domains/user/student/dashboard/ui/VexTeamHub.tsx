import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Trophy, Swords, Users, Award, Calendar, Loader2, ExternalLink } from 'lucide-react';
import { getTournaments, getMatches, getWorkshops } from '@/src/domains/competition/api/competitionApi';
import type { Tournament, MatchResult, Workshop } from '@/src/shared/types';

export default function VexTeamHub() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments' | 'matches' | 'workshops'>('overview');

  useEffect(() => {
    Promise.all([
      getTournaments(),
      getMatches(),
      getWorkshops(),
    ]).then(([t, m, w]) => {
      setTournaments(t || []);
      setMatches(m || []);
      setWorkshops(w || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Cpu },
    { id: 'tournaments' as const, label: 'Tournaments', icon: Trophy },
    { id: 'matches' as const, label: 'Matches', icon: Swords },
    { id: 'workshops' as const, label: 'Workshops', icon: Calendar },
  ];

  const wins = matches.filter(m => m.status === 'completed' && m.score1 > m.score2).length;
  const losses = matches.filter(m => m.status === 'completed' && m.score1 < m.score2).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl text-slate-900">VEX Competition Hub</h3>
          <p className="text-xs text-slate-500 mt-1">Tournaments, matches, workshops, and team readiness</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const TIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-brand-red text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              <TIcon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tournaments', value: tournaments.length, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Matches', value: matches.length, icon: Swords, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
              { label: 'Wins', value: wins, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Workshops', value: workshops.length, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
            ].map((s, i) => {
              const SIcon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><SIcon className={`w-5 h-5 ${s.color}`} /></div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </motion.div>
              );
            })}
          </div>

          {tournaments.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h4 className="font-bold text-sm text-slate-900 mb-3">Active Tournaments</h4>
              <div className="space-y-2">
                {tournaments.filter(t => t.status === 'upcoming' || t.status === 'live').slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-[10px] text-slate-500">{t.date} · {t.location}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tournaments.length === 0 && matches.length === 0 && workshops.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No competition data yet</p>
              <p className="text-xs text-slate-400 mt-1">Competition information will appear here once available.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tournaments' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Location</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {tournaments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">No tournaments found</td></tr>
                ) : tournaments.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{t.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.location}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'live' ? 'bg-emerald-100 text-emerald-700' : t.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Round</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Team 1</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Score</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Team 2</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {matches.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">No matches found</td></tr>
                ) : matches.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-700">{m.round}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.team1}</td>
                    <td className="px-4 py-3 text-center font-bold text-sm">{m.score1} — {m.score2}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.team2}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : m.status === 'live' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'workshops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workshops.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No workshops available</p>
            </div>
          ) : workshops.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-red/5 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-brand-red" />
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${w.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : w.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{w.status}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{w.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{w.date} · {w.time} · {w.instructor}</p>
              <p className="text-xs text-slate-500">{w.location} · {w.capacity - w.enrolled} spots left</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
