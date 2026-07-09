import React from 'react';
import { Trophy, Search, Users } from 'lucide-react';

export default function Leaderboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-bold text-xl text-slate-900">Global Leaderboard</h3>
        <p className="text-xs text-slate-500 mt-1">Compete with students across all Ethio Robotics branches</p>
      </div>

      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">Leaderboard coming soon</p>
        <p className="text-xs text-slate-400 mt-1">Rankings will appear here once enough students are enrolled.</p>
      </div>
    </div>
  );
}
