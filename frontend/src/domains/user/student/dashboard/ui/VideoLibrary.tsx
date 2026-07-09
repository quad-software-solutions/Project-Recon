import React from 'react';
import { Video, Film } from 'lucide-react';

export default function VideoLibrary() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-bold text-xl text-slate-900">Video Library</h3>
        <p className="text-xs text-slate-500 mt-1">Watch structured lessons from expert instructors</p>
      </div>

      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <Film className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">Video library coming soon</p>
        <p className="text-xs text-slate-400 mt-1">Course videos and tutorials will appear here once available.</p>
      </div>
    </div>
  );
}
