import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, Users, Filter, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'competition' | 'workshop' | 'webinar' | 'social';
  spots: number;
  registered: number;
  color: string;
  dotColor: string;
}

const EVENTS: EventItem[] = [
  { id: 1, title: 'VEX Regional Finals Prep', date: 'Sat, Jun 15', time: '9:00 AM - 4:00 PM', location: 'Main Arena', category: 'competition', spots: 30, registered: 28, color: 'bg-blue-500', dotColor: 'bg-blue-500' },
  { id: 2, title: 'Enjoy AI Webinar', date: 'Wed, Jun 19', time: '2:00 PM - 3:30 PM', location: 'Online (Zoom)', category: 'webinar', spots: 100, registered: 45, color: 'bg-purple-500', dotColor: 'bg-purple-500' },
  { id: 3, title: 'Global STEM Tour Orientation', date: 'Fri, Jun 21', time: '10:00 AM - 12:00 PM', location: 'Conference Hall B', category: 'workshop', spots: 40, registered: 22, color: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
  { id: 4, title: 'Team Building Challenge', date: 'Sat, Jun 22', time: '1:00 PM - 5:00 PM', location: 'Outdoor Field', category: 'social', spots: 50, registered: 35, color: 'bg-amber-500', dotColor: 'bg-amber-500' },
  { id: 5, title: 'Intro to Arduino Workshop', date: 'Mon, Jun 24', time: '3:00 PM - 5:00 PM', location: 'Lab 3', category: 'workshop', spots: 20, registered: 18, color: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
  { id: 6, title: 'National Robotics Championship', date: 'Sat, Jul 6', time: '8:00 AM - 6:00 PM', location: 'Expo Center', category: 'competition', spots: 200, registered: 156, color: 'bg-blue-500', dotColor: 'bg-blue-500' },
];

const CATEGORY_LABEL: Record<string, string> = {
  competition: 'Competition',
  workshop: 'Workshop',
  webinar: 'Webinar',
  social: 'Social',
};

export default function UpcomingEvents() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.category === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Upcoming Events</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Stay updated with competitions, workshops, and activities</p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'competition', 'workshop', 'webinar', 'social'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-all capitalize ${
              filter === cat ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {cat === 'all' ? 'All Events' : CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No events in this category.</p>
          </div>
        )}
        {filtered.map((ev, i) => {
          const filled = Math.round((ev.registered / ev.spots) * 100);
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedEvent(ev)}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${ev.color} bg-opacity-10 flex items-center justify-center`}
                    style={{ backgroundColor: `${ev.color}15` }}>
                    <Calendar className={`w-5 h-5 ${ev.color.replace('bg-', 'text-')}`} style={{ color: ev.color.replace('bg-', '#').replace('-500', '') }} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-900">{ev.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.color} bg-opacity-10`}
                      style={{ backgroundColor: `${ev.color}15`, color: ev.color.replace('bg-', '#').replace('-500', '') }}>
                      {CATEGORY_LABEL[ev.category]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.date}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" />
                  <span>{ev.time}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{ev.registered}/{ev.spots} registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${filled}%` }} />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-500">{filled}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedEvent(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className={`h-2 ${selectedEvent.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">{selectedEvent.title}</h3>
                    <span className="text-[11px] font-bold text-slate-500">{CATEGORY_LABEL[selectedEvent.category]}</span>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{selectedEvent.registered}/{selectedEvent.spots} registered</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((selectedEvent.registered / selectedEvent.spots) * 100)}%` }} />
                </div>
                <button className="w-full bg-blue-500 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <ExternalLink className="w-4 h-4" /> Register Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
