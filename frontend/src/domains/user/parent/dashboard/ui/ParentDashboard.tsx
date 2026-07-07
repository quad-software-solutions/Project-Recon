import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, BookOpen, Calendar, Clock, TrendingUp, Award, MessageCircle, Bell, ChevronRight,
  Send, CreditCard, Star, CheckCircle, AlertCircle, Activity, BarChart3, Zap, Target,
  MapPin, School, Users, Sparkles, ArrowUp, ArrowDown, MoreHorizontal, X, LogOut,
  PanelLeftClose, PanelLeftOpen, Briefcase, Eye
} from 'lucide-react';
import { UserProfile, AppNotification } from '@/src/shared/types';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';

const CHILD_DATA = {
  name: 'Abebe Kebede', age: 15, grade: '10th Grade', school: 'Bole Preparatory',
  enrolledPrograms: ['VEX V5 Competitive', 'Python Programming'],
  xp: 3900, badges: 8, streak: 12, rank: 3, totalHours: 78,
  attendance: { present: 42, total: 48, rate: 87.5 },
  avgScore: 88.3,
  nextClass: { name: 'VEX V5 Lab Session', time: 'Tomorrow, 3:00 PM', instructor: 'Coach Nebil', room: 'Robotics Lab B' },
  recentGrades: [
    { subject: 'Mechanical Design', score: 92, max: 100, date: 'Jun 15' },
    { subject: 'C++ Programming Quiz', score: 85, max: 100, date: 'Jun 12' },
    { subject: 'Autonomous Challenge', score: 88, max: 100, date: 'Jun 08' },
  ],
  weeklyProgress: [
    { week: 'W1', hours: 6 }, { week: 'W2', hours: 8 }, { week: 'W3', hours: 5 },
    { week: 'W4', hours: 9 }, { week: 'W5', hours: 7 }, { week: 'W6', hours: 10 },
  ],
  payments: [
    { id: 'p1', desc: 'VEX V5 Enrollment — Term 2', amount: 3500, date: 'Jun 01, 2026', status: 'paid' },
    { id: 'p2', desc: 'Python Programming — Monthly', amount: 2500, date: 'Jun 01, 2026', status: 'paid' },
    { id: 'p3', desc: 'Competition Registration Fee', amount: 1500, date: 'Jul 01, 2026', status: 'upcoming' },
  ],
  notifications: [], // populated via API below
  upcomingEvents: [
    { name: 'VEX IQ Nationals 2026', date: 'Jun 25', time: '8:00 AM', location: 'Addis Ababa Stadium' },
    { name: 'Safety Seminar', date: 'Jun 22', time: '9:00 AM', location: 'Main Auditorium' },
  ],
  achievements: [
    { name: '100 Hours', icon: '🎉', color: 'text-amber-400' },
    { name: 'Perfect Week', icon: '⭐', color: 'text-yellow-400' },
    { name: 'Top Coder', icon: '💻', color: 'text-blue-400' },
  ],
};

type ParentTab = 'overview' | 'grades' | 'payments' | 'messages';

interface Message { id: string; text: string; sender: 'instructor' | 'parent'; time: string; }

interface ParentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { id: ParentTab; label: string; icon: React.ElementType }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Monitoring', icon: Eye,
    items: [
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'grades',   label: 'Grades',   icon: BookOpen },
    ],
  },
  {
    label: 'Account', icon: Briefcase,
    items: [
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'messages', label: 'Messages', icon: MessageCircle },
    ],
  },
];

const FLAT_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export default function ParentDashboard({ currentUser, onLogout }: ParentDashboardProps) {
  const [tab, setTab] = useState<ParentTab>('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [overlaySidebar, setOverlaySidebar] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    import('@/src/domains/notification/model/notificationApi').then(m =>
      m.getNotifications().then(setLiveNotifications)
    );
  }, []);

  const [msgText, setMsgText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', text: 'Hello! Abebe has been making excellent progress in the VEX V5 program. His PID implementation was one of the best in the class.', sender: 'instructor', time: 'Jun 16, 10:30 AM' },
    { id: 'm2', text: "Thank you, Coach Nebil! He's very excited about the upcoming competition.", sender: 'parent', time: 'Jun 17, 2:15 PM' },
    { id: 'm3', text: 'Great to hear! I recommend he practice the autonomous routine this weekend.', sender: 'instructor', time: 'Jun 17, 3:00 PM' },
  ]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMobileNav = (id: ParentTab) => { setTab(id); setOverlaySidebar(false); };

  const d = CHILD_DATA;
  const maxHours = Math.max(...d.weeklyProgress.map(w => w.hours));
  const totalPaid = d.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalUpcoming = d.payments.filter(p => p.status === 'upcoming').reduce((s, p) => s + p.amount, 0);

  const sendMessage = () => {
    if (!msgText.trim()) return;
    setMessages(prev => [...prev, { id: `m${Date.now()}`, text: msgText, sender: 'parent', time: 'Just now' }]);
    setMsgText('');
  };

  return (
    <div className="flex min-h-[calc(100vh-76px)] bg-brand-paper">
      <motion.aside
        animate={{ width: sidebarExpanded ? 240 : 64 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="hidden md:flex flex-col bg-white border-r border-brand-border fixed left-0 top-[76px] h-[calc(100vh-76px)] z-20 overflow-hidden"
      >
        <div className={`shrink-0 ${sidebarExpanded ? 'px-3 py-2' : 'flex justify-center py-2'}`}>
          {sidebarExpanded ? (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark border border-brand-red-dark/30 px-3 py-2">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, white 0%, transparent 60%)' }} />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Parent Panel</span>
                </div>
                <button onClick={() => setSidebarExpanded(prev => !prev)} className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setSidebarExpanded(prev => !prev)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          )}
        </div>

        {sidebarExpanded && (
          <div className="px-4 py-3 border-b border-brand-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-black text-base shrink-0">
                {d.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{d.name}</p>
                <p className="text-[10px] text-slate-500">{d.grade} · {d.school}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-3 px-2 mt-2 flex-1 overflow-y-auto overflow-x-hidden">
          {NAV_GROUPS.map(group => {
            const isCollapsed = collapsedGroups[group.label];
            const hasActive = group.items.some(item => item.id === tab);
            const GroupIcon = group.icon;
            return (
              <div key={group.label}>
                {sidebarExpanded ? (
                  <>
                    <button onClick={() => toggleGroup(group.label)}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                        hasActive ? 'text-brand-red' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <GroupIcon className="w-3 h-3" />
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    </button>
                    {!isCollapsed && (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {group.items.map(item => {
                          const isActive = tab === item.id;
                          return (
                            <button key={item.id} onClick={() => setTab(item.id)}
                              className={`flex items-center gap-3 rounded-xl transition-all px-3.5 py-2 ${isActive ? 'bg-brand-red/10 text-brand-red font-black' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
                            >
                              <item.icon className="w-[18px] h-[18px] shrink-0" />
                              <span className="text-sm whitespace-nowrap overflow-hidden">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-center py-1">
                      <div className="w-5 h-px bg-slate-200" />
                    </div>
                    {group.items.map(item => {
                      const isActive = tab === item.id;
                      return (
                        <button key={item.id} onClick={() => setTab(item.id)} title={item.label}
                          className={`flex items-center justify-center w-full py-2.5 rounded-xl transition-all ${isActive ? 'bg-brand-red/10 text-brand-red' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                          <item.icon className="w-[18px] h-[18px] shrink-0" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {sidebarExpanded && (
          <div className="mt-auto shrink-0 bg-gradient-to-r from-brand-red/5 to-brand-red/[0.02] border-t border-brand-red/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-red flex items-center justify-center text-white font-black text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-brand-red uppercase tracking-wider truncate">Parent</p>
                <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-brand-red hover:bg-brand-red/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </motion.aside>

      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-200 ${sidebarExpanded ? 'md:pl-60' : 'md:pl-16'}`}>
        <div className="px-4 sm:px-5 lg:px-6 py-5 pb-28 lg:pb-6 max-w-[1600px] w-full">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <button onClick={() => setOverlaySidebar(true)} className="md:hidden p-1 -ml-1 rounded-lg text-slate-400 hover:text-brand-red hover:bg-brand-red/10 transition-colors">
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parent Portal</p>
                  </div>
                  <h1 className="font-black text-lg md:text-xl text-slate-900 tracking-tight">{tab === 'overview' ? 'Dashboard' : tab === 'grades' ? 'Grades & Assessments' : tab === 'payments' ? 'Payments & Billing' : 'Messages'}</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {FLAT_ITEMS.map(t => {
              const TIcon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 ${tab === t.id ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                  <TIcon className="w-3.5 h-3.5" />{t.label}
                </button>
              );
            })}
          </div>

          <DashboardCommandCenter
            title="Parent Command Center"
            subtitle="Child progress, billing, attendance, and instructor communication."
            signals={[
              { label: 'Attendance', value: `${d.attendance.rate}%`, detail: 'current rate', icon: Activity, tone: 'emerald' },
              { label: 'Avg Score', value: `${d.avgScore}%`, detail: 'recent assessments', icon: TrendingUp, tone: 'blue' },
              { label: 'Upcoming Due', value: `${totalUpcoming.toLocaleString()} ETB`, detail: 'billing queue', icon: CreditCard, tone: totalUpcoming > 0 ? 'amber' : 'emerald' },
              { label: 'Messages', value: String(messages.length), detail: 'conversation history', icon: MessageCircle, tone: 'slate' },
            ]}
          />

          {tab === 'overview' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total Hours', value: `${d.totalHours}h`, icon: Clock, color: 'text-brand-red', bg: 'bg-brand-red/10' },
                  { label: 'Avg Score', value: `${d.avgScore}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Attendance', value: `${d.attendance.rate}%`, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Rank', value: `#${d.rank}`, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
                  >
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className="font-black text-lg text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-brand-red" />Weekly Learning Hours
                      </h4>
                      <span className="text-[10px] text-slate-400">Total: {d.weeklyProgress.reduce((s, w) => s + w.hours, 0)}h</span>
                    </div>
                    <div className="flex items-end gap-2 h-28">
                      {d.weeklyProgress.map((w, i) => (
                        <motion.div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-400">{w.hours}h</span>
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: `${(w.hours / maxHours) * 100}%` }}
                            transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
                            className="w-full bg-gradient-to-t from-brand-red/80 to-brand-red rounded-t-lg min-h-[4px] hover:from-brand-red transition-all cursor-pointer"
                          />
                          <span className="text-[8px] text-slate-400">{w.week}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-black text-xs text-slate-900 mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-red" />Enrolled Programs
                    </h4>
                    {d.enrolledPrograms.map((p, i) => (
                      <motion.div key={p} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <BookOpen className="w-4 h-4 text-brand-red shrink-0" />
                        <span className="text-xs font-medium text-slate-700">{p}</span>
                        <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-brand-red" />Recent Updates
                      </h4>
                      <span className="text-[9px] text-slate-400">{liveNotifications.filter(n => !n.read).length} new</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {liveNotifications.length === 0 ? (
                        <div className="py-4 text-center text-[10px] text-slate-400 font-medium">
                          No recent notifications
                        </div>
                      ) : liveNotifications.slice(0, 4).map((n, i) => (
                        <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className={`flex items-start gap-2 p-2 rounded-lg text-xs transition-all ${!n.read ? 'bg-brand-red/5 border border-brand-red/10' : 'bg-slate-50'}`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-brand-red/10' : 'bg-slate-100'}`}>
                            <span className="text-xs">{n.icon || '🔔'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] ${!n.read ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">{n.timestamp.startsWith('20') ? new Date(n.timestamp).toLocaleDateString() : n.timestamp}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-black text-xs text-slate-900 mb-3 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-red" />Upcoming Events
                    </h4>
                    {d.upcomingEvents.map((e, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-xs font-black text-brand-red shrink-0">
                          {e.date.split(' ')[1]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-900">{e.name}</p>
                          <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />{e.time}
                          </p>
                          <p className="text-[9px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />{e.location}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-br from-brand-red to-brand-red-dark rounded-xl p-4 text-white">
                    <h4 className="font-black text-xs mb-1.5 uppercase tracking-tight">Parent-Teacher Meeting</h4>
                    <p className="text-white/70 text-[10px] mb-3">Schedule a one-on-one meeting with your child's instructor.</p>
                    <button className="bg-white text-brand-red px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-50 transition-colors w-full flex items-center justify-center gap-1">
                      <Calendar className="w-3 h-3" /> Book Meeting
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'grades' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Average', value: `${d.avgScore}%`, icon: TrendingUp, color: d.avgScore >= 90 ? 'text-emerald-500' : 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Highest', value: `${Math.max(...d.recentGrades.map(g => g.score))}%`, icon: ArrowUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Lowest', value: `${Math.min(...d.recentGrades.map(g => g.score))}%`, icon: ArrowDown, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Assessments', value: d.recentGrades.length.toString(), icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200 rounded-xl p-3"
                  >
                    <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}><s.icon className={`w-3.5 h-3.5 ${s.color}`} /></div>
                    <p className="font-black text-lg text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-red" />Recent Assessments
                  </h4>
                  <span className="text-[9px] text-slate-400">{d.recentGrades.length} entries</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        {['Subject', 'Date', 'Score', 'Status'].map(h => (
                          <th key={h} className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-4 py-2.5 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.recentGrades.map((g, i) => (
                        <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-medium text-slate-800">{g.subject}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{g.date}</td>
                          <td className="px-4 py-3">
                            <span className={`font-black text-sm ${g.score >= 90 ? 'text-emerald-500' : g.score >= 80 ? 'text-blue-500' : 'text-amber-500'}`}>
                              {g.score}<span className="text-slate-400 text-[10px] font-medium">/{g.max}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              g.score >= 90 ? 'bg-emerald-50 text-emerald-600' :
                              g.score >= 80 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {g.score >= 90 ? 'Excellent' : g.score >= 80 ? 'Good' : 'Needs Work'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total Paid', value: `${totalPaid.toLocaleString()} ETB`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Upcoming', value: `${totalUpcoming.toLocaleString()} ETB`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Transactions', value: d.payments.length.toString(), icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'On Time', value: `${Math.round((d.payments.filter(p => p.status === 'paid').length / d.payments.length) * 100)}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200 rounded-xl p-3"
                  >
                    <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}><s.icon className={`w-3.5 h-3.5 ${s.color}`} /></div>
                    <p className="font-black text-sm text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-brand-red" />Payment History
                  </h4>
                  <span className="text-[9px] text-slate-400">{d.payments.length} transactions</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        {['Description', 'Date', 'Amount', 'Status'].map(h => (
                          <th key={h} className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-4 py-2.5 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.payments.map((p, i) => (
                        <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-medium text-slate-800">{p.desc}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{p.date}</td>
                          <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900">{p.amount.toLocaleString()} ETB</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {p.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'messages' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-xs font-bold text-brand-red">CN</div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Coach Nebil Mohammed</p>
                  <p className="text-[9px] text-slate-400">Instructor · VEX V5 Program</p>
                </div>
              </div>
              <div className="p-4 h-72 overflow-y-auto flex flex-col gap-3">
                {messages.map(m => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.sender === 'parent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                      m.sender === 'parent'
                        ? 'bg-brand-red text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                    }`}>
                      <p className="text-xs">{m.text}</p>
                      <p className={`text-[9px] mt-1 ${m.sender === 'parent' ? 'text-white/60' : 'text-slate-400'}`}>{m.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-red/30"
                  />
                  <button onClick={sendMessage}
                    className="bg-brand-red text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-brand-red-dark transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[9px] text-slate-400">
                &copy; {new Date().getFullYear()} <span className="font-bold text-brand-red">Ethio Robotics</span>. All rights reserved.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-slate-300">v2.1.0</span>
                <span className="text-[9px] text-slate-300">|</span>
                <span className="text-[9px] text-slate-400">Made with <span className="text-red-500">&hearts;</span> in Ethiopia</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* ─── Mobile Overlay Sidebar ─── */}
      <AnimatePresence>
        {overlaySidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOverlaySidebar(false)} className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-[76px] bottom-0 z-40 w-[280px] sm:w-[300px] bg-white border-r border-brand-border overflow-y-auto md:hidden shadow-2xl"
            >
              <div className="px-3 py-3 border-b border-brand-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-red" />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Parent Panel</span>
                  </div>
                  <button onClick={() => setOverlaySidebar(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <nav className="flex flex-col gap-2 px-2 py-3">
                {NAV_GROUPS.map(group => {
                  const GroupIcon = group.icon;
                  const hasActive = group.items.some(item => item.id === tab);
                  return (
                    <div key={group.label}>
                      <div className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${hasActive ? 'text-brand-red' : 'text-slate-400'}`}>
                        <GroupIcon className="w-3 h-3" />
                        <span>{group.label}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5 ml-1">
                        {group.items.map(item => {
                          const isActive = tab === item.id;
                          return (
                            <button key={item.id} onClick={() => handleMobileNav(item.id)}
                              className={`flex items-center gap-3 rounded-xl transition-all px-3 py-2 text-sm ${isActive ? 'bg-brand-red/10 text-brand-red font-black' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
                            >
                              <item.icon className="w-4 h-4 shrink-0" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
              <div className="px-4 py-3 border-t border-brand-border mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-red flex items-center justify-center text-white font-black text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-brand-red uppercase tracking-wider">Parent</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                  </div>
                </div>
                <button onClick={onLogout} className="w-full mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-brand-red hover:bg-brand-red/5 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
