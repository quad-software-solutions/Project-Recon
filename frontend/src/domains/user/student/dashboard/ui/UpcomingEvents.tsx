import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Clock, ExternalLink } from 'lucide-react';
import { cmsPublicApi } from '@/src/domains/cms/public/api/cmsPublicApi';

const DOT_COLORS = ['bg-brand-blue', 'bg-brand-red', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'];

export default function UpcomingEvents() {
  const [events, setEvents] = useState<{ title: string; date: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsPublicApi.getNews({ limit: '5' }).then(res => {
      const items = res?.results || [];
      setEvents(items.map(n => ({
        title: n.title,
        date: new Date(n.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        slug: n.slug,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60">
      <h3 className="font-bold text-slate-900 text-lg mb-6">Upcoming Events & News</h3>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No upcoming events at the moment.</p>
          <p className="text-xs mt-1">Check back later for new events and announcements.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-brand-border-light ml-3 pl-6 flex flex-col gap-6">
          {events.map((ev, i) => (
            <div key={i} className="relative">
              <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]} border-[3px] border-white shadow-sm`} />
              <div className="bg-[#faf8ff] p-4 rounded-xl border border-brand-border-light/50 flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-brand-muted font-medium flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {ev.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
