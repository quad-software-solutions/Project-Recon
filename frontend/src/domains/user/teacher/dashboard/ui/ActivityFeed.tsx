import React, { useState } from 'react';
import { Activity, CheckCircle2, Edit3, Award, UserPlus, Star, MessageSquare, BookOpen, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedItem {
  id: number;
  icon: React.ElementType;
  bg: string;
  color: string;
  bold: string;
  text: string;
  time: Date;
  category: 'submission' | 'review' | 'achievement' | 'enrollment' | 'feedback' | 'alert';
}

const CATEGORY_LABEL: Record<string, string> = {
  submission: 'Submissions',
  review: 'Reviews',
  achievement: 'Achievements',
  enrollment: 'Enrollments',
  feedback: 'Feedback',
  alert: 'Alerts',
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDay(items: FeedItem[]): { label: string; items: FeedItem[] }[] {
  const groups: { label: string; items: FeedItem[] }[] = [];
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  let currentLabel = '';
  let currentItems: FeedItem[] = [];

  for (const item of items) {
    const ds = item.time.toDateString();
    let label: string;
    if (ds === today) label = 'Today';
    else if (ds === yesterday) label = 'Yesterday';
    else label = item.time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (label !== currentLabel) {
      if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems });
      currentLabel = label;
      currentItems = [];
    }
    currentItems.push(item);
  }
  if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems });
  return groups;
}

const NOW = Date.now();
const MIN = 60000;
const HOUR = 3600000;
const DAY = 86400000;

const FEED_ITEMS: FeedItem[] = [
  { id: 1, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', bold: 'Abebe B.', text: 'submitted project — PID Controller Demo', time: new Date(NOW - 15 * MIN), category: 'submission' },
  { id: 2, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', bold: 'Radiom J.', text: 'submitted project — Line Follower v2', time: new Date(NOW - 45 * MIN), category: 'submission' },
  { id: 3, icon: Edit3, bg: 'bg-blue-100', color: 'text-blue-600', bold: 'You', text: 'reviewed 3 submissions from batch #12', time: new Date(NOW - 2 * HOUR), category: 'review' },
  { id: 4, icon: Star, bg: 'bg-amber-100', color: 'text-amber-600', bold: 'Skelos K.', text: 'earned "Sensor Master" badge', time: new Date(NOW - 3 * HOUR), category: 'achievement' },
  { id: 5, icon: UserPlus, bg: 'bg-purple-100', color: 'text-purple-600', bold: 'Meron T.', text: 'enrolled in VEX V5 Advanced', time: new Date(NOW - 5 * HOUR), category: 'enrollment' },
  { id: 6, icon: MessageSquare, bg: 'bg-sky-100', color: 'text-sky-600', bold: 'Parent: W/ro Selam', text: 'submitted feedback for Abebe B.', time: new Date(NOW - 8 * HOUR), category: 'feedback' },
  { id: 7, icon: Award, bg: 'bg-purple-100', color: 'text-purple-600', bold: '', text: 'Class average improved by 4% this week', time: new Date(NOW - 1 * DAY), category: 'achievement' },
  { id: 8, icon: Edit3, bg: 'bg-blue-100', color: 'text-blue-600', bold: 'You', text: 'updated lesson plan — Sensor Calibration Lab', time: new Date(NOW - 1 * DAY - 2 * HOUR), category: 'review' },
  { id: 9, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', bold: 'Dr. Elias T.', text: 'submitted project — Obstacle Course', time: new Date(NOW - 1 * DAY - 4 * HOUR), category: 'submission' },
  { id: 10, icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600', bold: '', text: '2 students have low attendance this month', time: new Date(NOW - 2 * DAY), category: 'alert' },
  { id: 11, icon: BookOpen, bg: 'bg-indigo-100', color: 'text-indigo-600', bold: 'System', text: 'New curriculum update available for VEX IQ', time: new Date(NOW - 3 * DAY), category: 'alert' },
  { id: 12, icon: Star, bg: 'bg-amber-100', color: 'text-amber-600', bold: 'Abebe L.', text: 'completed onboarding — lab safety certified', time: new Date(NOW - 4 * DAY), category: 'achievement' },
  { id: 13, icon: UserPlus, bg: 'bg-purple-100', color: 'text-purple-600', bold: 'Yonas D.', text: 'enrolled in STEM Foundation', time: new Date(NOW - 5 * DAY), category: 'enrollment' },
  { id: 14, icon: MessageSquare, bg: 'bg-sky-100', color: 'text-sky-600', bold: 'Parent: Ato Tekle', text: 'requested progress report for Radiom J.', time: new Date(NOW - 6 * DAY), category: 'feedback' },
  { id: 15, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', bold: 'Abebe B.', text: 'submitted project — Autonomous Navigation', time: new Date(NOW - 7 * DAY), category: 'submission' },
];

const ITEMS_PER_PAGE = 5;

export default function ActivityFeed() {
  const [filter, setFilter] = useState<string>('all');
  const [visible, setVisible] = useState(ITEMS_PER_PAGE);

  const filtered = filter === 'all' ? FEED_ITEMS : FEED_ITEMS.filter(i => i.category === filter);
  const visibleItems = filtered.slice(0, visible);
  const grouped = groupByDay(visibleItems);
  const hasMore = visible < filtered.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Activity Feed</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">Real-time class activity and student progress updates</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'submission', 'review', 'achievement', 'enrollment', 'feedback', 'alert'].map(cat => (
          <button key={cat} onClick={() => { setFilter(cat); setVisible(ITEMS_PER_PAGE); }}
            className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-all capitalize ${
              filter === cat
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}>
            {cat === 'all' ? 'All' : CATEGORY_LABEL[cat] || cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {grouped.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No activity in this category yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {grouped.map(group => (
              <div key={group.label}>
                <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {group.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center ${item.color} shrink-0 mt-0.5`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                          {item.bold && <span className="font-bold text-slate-900">{item.bold} </span>}
                          {item.text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-[10px] text-slate-400">{timeAgo(item.time)}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${item.bg} ${item.color}`}>
                            {CATEGORY_LABEL[item.category]}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 mt-1.5 shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <button
              onClick={() => setVisible(prev => prev + ITEMS_PER_PAGE)}
              className="text-xs font-bold text-[#2563EB] hover:text-blue-700 transition-colors px-6 py-2 rounded-lg hover:bg-blue-50"
            >
              Show more activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
