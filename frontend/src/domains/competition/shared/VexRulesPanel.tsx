import { Trophy, Users, GitBranch, Shield, Zap, Target, Medal } from 'lucide-react';
import {
  VEX_CATEGORIES,
  VEX_SCORING_RULES,
  VEX_ALLIANCE_CONFIG,
  VEX_COMPETITION_PATHWAY,
  VEX_ELIMINATION_RULES,
  VEX_MATCH_ROUNDS,
} from './vexConstants';

export default function VexRulesPanel() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-amber-400" />
        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">VEX Competition Rules</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Alliance Format */}
        <div className="bg-gradient-to-br from-red-50 via-white to-blue-50 rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand-red" />
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">Alliance Format</h4>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-red-600 text-white rounded-xl p-3 text-center">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Red</p>
              <p className="text-[10px] font-bold mt-1">2 Teams</p>
            </div>
            <span className="text-xs font-black text-slate-400">VS</span>
            <div className="flex-1 bg-blue-600 text-white rounded-xl p-3 text-center">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Blue</p>
              <p className="text-[10px] font-bold mt-1">2 Teams</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Each match pits a {VEX_ALLIANCE_CONFIG.redLabel} against a {VEX_ALLIANCE_CONFIG.blueLabel}.
            Alliance score is the combined match score for both teams.
          </p>
        </div>

        {/* Scoring */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-4 h-4 text-amber-500" />
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">Ranking Points</h4>
          </div>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-slate-700">Win</span>
              <span className="text-sm font-black text-emerald-600">{VEX_SCORING_RULES.winPoints} RP</span>
            </div>
            <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-slate-700">Draw</span>
              <span className="text-sm font-black text-amber-600">{VEX_SCORING_RULES.drawPoints} RP</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-slate-700">Loss</span>
              <span className="text-sm font-black text-slate-500">{VEX_SCORING_RULES.lossPoints} RP</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400">
            Tie-breakers: {VEX_SCORING_RULES.tieBreakers.join(' → ')}
          </p>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-brand-blue" />
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">Categories</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {VEX_CATEGORIES.map(cat => (
              <span key={cat} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                {cat}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
            Rankings are computed live from match results — never manually stored.
          </p>
        </div>
      </div>

      {/* Elimination & Finals */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-4 h-4 text-brand-red" />
          <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">Elimination & Finals</h4>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {VEX_MATCH_ROUNDS.map((round, i) => (
            <div key={round} className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                {round}
              </span>
              {i < VEX_MATCH_ROUNDS.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
        <ul className="space-y-1.5">
          {VEX_ELIMINATION_RULES.map(rule => (
            <li key={rule} className="flex items-start gap-2 text-[10px] text-slate-600">
              <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Pathway */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h4 className="font-black text-xs text-amber-400 uppercase tracking-wider">Competition Pathway</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {VEX_COMPETITION_PATHWAY.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <p className="text-[10px] font-black text-white">{step.label}</p>
                <p className="text-[8px] text-slate-400">{step.desc}</p>
              </div>
              {i < VEX_COMPETITION_PATHWAY.length - 1 && (
                <span className="text-white/30 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
