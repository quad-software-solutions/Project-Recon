import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image, FileText, Handshake, ShoppingBag, MessageSquare, DollarSign, PanelLeftClose, PanelLeftOpen,
  Calendar, Bell, X, UserPlus, BarChart3, TrendingUp, TrendingDown, Users, Zap, Award,
  Clock, CheckCircle, CheckCircle2, AlertCircle, ChevronRight, Activity, MapPin, Trophy, Building, Sparkles, Download,
  Cpu, Swords, Medal, BookOpen, Hash, Star, Target, Wrench, Camera, Search, RefreshCw, Monitor, Filter, Globe,
  UserCog, Eye, Shield, Edit3, Trash2, Plus, LogOut
} from 'lucide-react';
import { UserProfile, VexRobot, AppNotification } from '@/src/shared/types';
import { MOCK_ANALYTICS, MOCK_TOURNAMENTS, MOCK_WORKSHOPS, MOCK_VEX_TEAM, MOCK_VEX_ROBOTS, MOCK_VEX_AWARDS, MOCK_VEX_NOTEBOOK, MOCK_VEX_MATCHES } from '@/src/shared/constants/mock-data';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import MediaContent from './MediaContent';
import CmsDashboard from '@/src/domains/cms/admin/ui/CmsDashboard';
import SponsorManagement from './SponsorManagement';
import OnlineStoreHub from './OnlineStoreHub';
import CommunicationsCenter from './CommunicationsCenter';
import PaymentTracker from './PaymentTracker';
import EventsManagement from './EventsManagement';
import AnnouncementsManager from './AnnouncementsManager';
import WalkInRegistration from './WalkInRegistration';
import AnalyticsDashboard from './AnalyticsDashboard';
import SchoolManagement from './SchoolManagement';

interface Props {
  currentUser: UserProfile;
  onLogout: () => void;
}

type SectionId = 'overview' | 'analytics' | 'media' | 'cms' | 'sponsors' | 'store' | 'events' | 'tournaments' | 'workshops' | 'participants' | 'announcements' | 'communications' | 'payments' | 'walkin' | 'reports' | 'vex-overview' | 'vex-robots' | 'vex-awards' | 'vex-matches' | 'vex-notebook' | 'vex-roles' | 'schools' | 'registrations';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Activity, group: 'main' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'main' },
  { id: 'store', label: 'Store & Inventory', icon: ShoppingBag, group: 'main' },
  { id: 'payments', label: 'Payments & Sales', icon: DollarSign, group: 'main' },
  { id: 'reports', label: 'Reports & Data', icon: BarChart3, group: 'main' },
  { id: 'media', label: 'Media & Content', icon: Image, group: 'main' },
  { id: 'cms', label: 'CMS & Branding', icon: FileText, group: 'main' },
  { id: 'sponsors', label: 'Sponsors & Partners', icon: Handshake, group: 'main' },
  { id: 'schools', label: 'Schools', icon: Building, group: 'main' },
  { id: 'registrations', label: 'Registrations', icon: UserPlus, group: 'main' },
  { id: 'walkin', label: 'Walk-In Registration', icon: Edit3, group: 'main' },
  { id: 'announcements', label: 'Announcements', icon: Bell, group: 'main' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, group: 'main' },
  { id: 'events', label: 'Events Calendar', icon: Calendar, group: 'main' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, group: 'main' },
  { id: 'workshops', label: 'Workshops', icon: Building, group: 'main' },
  { id: 'participants', label: 'Participants', icon: Users, group: 'main' },
  { id: 'vex-overview', label: 'Team Overview', icon: Cpu, group: 'vex' },
  { id: 'vex-robots', label: 'Robots', icon: Wrench, group: 'vex' },
  { id: 'vex-awards', label: 'Awards', icon: Medal, group: 'vex' },
  { id: 'vex-matches', label: 'Matches', icon: Swords, group: 'vex' },
  { id: 'vex-notebook', label: 'Notebook', icon: BookOpen, group: 'vex' },
  { id: 'vex-roles', label: 'VEX Roles', icon: UserCog, group: 'vex' },
];

export default function ManagerDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <OverviewPage currentUser={currentUser} onNavigate={setActiveSection} />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'media': return <MediaContent />;
      case 'cms': return <CmsDashboard />;
      case 'sponsors': return <SponsorManagement />;
      case 'schools': return <SchoolManagement />;
      case 'registrations': return <RegistrationSection />;
      case 'store': return <OnlineStoreHub />;
      case 'events': return <EventsManagement />;
      case 'tournaments': return <TournamentsSection />;
      case 'workshops': return <WorkshopsSection />;
      case 'participants': return <ParticipantsSection />;
      case 'announcements': return <AnnouncementsManager />;
      case 'communications': return <CommunicationsCenter />;
      case 'payments': return <PaymentTracker />;
      case 'walkin': return <WalkInRegistration />;
      case 'reports': return <ReportsSection />;
      case 'vex-overview': return <VexOverviewSection onNavigate={setActiveSection} />;
      case 'vex-robots': return <VexRobotsSection />;
      case 'vex-awards': return <VexAwardsSection />;
      case 'vex-matches': return <VexMatchesSection />;
      case 'vex-notebook': return <VexNotebookSection />;
      case 'vex-roles': return <VexRolesSection />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Manager Dashboard',
        icon: BarChart3,
        userName: currentUser.name,
        userRole: 'Manager',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Manager Dashboard',
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Operations Command Center"
        subtitle="Branch activity, CMS work, payments, events, and registration queues."
        signals={[
          { label: 'Registrations', value: '18', detail: 'new this week', icon: UserPlus, tone: 'blue' },
          { label: 'Payments', value: '6', detail: 'need reconciliation', icon: DollarSign, tone: 'amber' },
          { label: 'Events', value: String(MOCK_TOURNAMENTS.length + MOCK_WORKSHOPS.length), detail: 'active schedules', icon: Calendar, tone: 'emerald' },
          { label: 'CMS', value: 'Ready', detail: 'content tools online', icon: FileText, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}

function OverviewPage({ currentUser, onNavigate }: { currentUser: UserProfile; onNavigate: (id: SectionId) => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  useEffect(() => {
    import('@/src/domains/notification/model/notificationApi').then(m =>
      m.getNotifications().then(setNotifications)
    );
  }, []);
  const unreadNotifications = notifications.filter(n => !n.read);

  const quickActions: { id: SectionId; label: string; desc: string; icon: React.ElementType; color: string }[] = [
    { id: 'analytics', label: 'View Analytics', desc: 'Business performance metrics', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'events', label: 'Events Calendar', desc: 'Manage all events', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { id: 'tournaments', label: 'Tournaments', desc: 'Manage competitions', icon: Trophy, color: 'from-rose-500 to-rose-600' },
    { id: 'workshops', label: 'Workshops', desc: 'Schedule workshops', icon: Building, color: 'from-emerald-500 to-emerald-600' },
    { id: 'store', label: 'Store Inventory', desc: 'Manage products & stock', icon: ShoppingBag, color: 'from-amber-500 to-amber-600' },
    { id: 'payments', label: 'Payment Reports', desc: 'Track transactions', icon: DollarSign, color: 'from-cyan-500 to-cyan-600' },
    { id: 'cms', label: 'CMS & Branding', desc: 'Manage content & branding', icon: FileText, color: 'from-rose-500 to-rose-600' },
    { id: 'sponsors', label: 'Sponsors', desc: 'Manage partners', icon: Handshake, color: 'from-indigo-500 to-purple-600' },
    { id: 'schools', label: 'Schools', desc: 'Manage branches', icon: Building, color: 'from-sky-500 to-blue-600' },
    { id: 'announcements', label: 'Announcements', desc: 'Create & publish', icon: Bell, color: 'from-rose-500 to-pink-600' },
    { id: 'communications', label: 'Communications', desc: 'View messages', icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/70 mb-0.5">Welcome back,</p>
          <h2 className="font-black text-2xl">{currentUser.name}</h2>
          <p className="text-sm text-white/80 mt-0.5 max-w-xl">Full platform management — business, events, and operations all in one place.</p>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
          <BarChart3 className="w-full h-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Students', value: '—', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Programs', value: '—', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Revenue', value: '—', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Events', value: '—', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((m, i) => {
          const MIcon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
            >
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-1.5`}>
                <MIcon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
              <p className="font-display font-extrabold text-2xl text-slate-900">{m.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'System', value: 'Online', icon: Monitor, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Uptime', value: '99.97%', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'API', value: '12ms', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Backup', value: 'Today 3AM', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5 hover:shadow-sm transition-all"
            >
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <SIcon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                <p className={`text-sm font-bold ${s.color.replace('500', '700')}`}>{s.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickActions.map((action, i) => {
                const ActionIcon = action.icon;
                return (
                  <motion.button key={action.id} onClick={() => onNavigate(action.id)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="rounded-xl p-3 text-left border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                      <ActionIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-sm text-slate-900">{action.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{action.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Notifications
              </h4>
              {unreadNotifications.length > 0 && (
                <span className="text-[10px] font-black bg-brand-red text-white px-1.5 py-0.5 rounded-full">{unreadNotifications.length} new</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {notifications.slice(0, 4).map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-2 p-2 rounded-lg text-sm transition-all ${n.read ? 'text-slate-500' : 'bg-brand-red/5 border border-brand-red/10 text-slate-900'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-100' : 'bg-brand-red/10'}`}>
                    <span className="text-sm">{n.icon || '🔔'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`font-bold text-sm ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</p>
                      {!n.read && <div className="w-1 h-1 rounded-full bg-brand-red shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Stats
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Active', value: '—', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Pending', value: '—', color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Total', value: '—', color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'New', value: '—', color: 'text-purple-700', bg: 'bg-purple-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-lg p-2 text-center`}>
                  <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
                  <p className={`text-[10px] font-medium ${s.color}/70`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4">
          <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5 text-brand-red" />
            Management Tools
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Academic Catalog', desc: 'Programs & classes', id: 'academics' as SectionId, icon: BookOpen, color: 'from-blue-500 to-blue-600' },
              { label: 'Schools', desc: 'Branch management', id: 'schools' as SectionId, icon: Building, color: 'from-sky-500 to-cyan-600' },
              { label: 'Sponsors', desc: 'Partner management', id: 'sponsors' as SectionId, icon: Handshake, color: 'from-indigo-500 to-purple-600' },
              { label: 'Announcements', desc: 'Create & publish', id: 'announcements' as SectionId, icon: Bell, color: 'from-rose-500 to-pink-600' },
              { label: 'Communications', desc: 'Message center', id: 'communications' as SectionId, icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
              { label: 'CMS & Branding', desc: 'Content management', id: 'cms' as SectionId, icon: FileText, color: 'from-orange-500 to-red-600' },
            ].map((tool, i) => {
              const TIcon = tool.icon;
              return (
                <button key={tool.id} onClick={() => onNavigate(tool.id)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}>
                    <TIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{tool.label}</p>
                    <p className="text-[10px] text-slate-500">{tool.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-brand-red" />
              Platform Summary
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Students', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Programs', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Schools', icon: Building, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Sponsors', icon: Handshake, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map((stat, i) => {
                const StatIcon = stat.icon;
                return (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className={`w-6 h-6 rounded-lg ${stat.bg} flex items-center justify-center mb-1`}>
                      <StatIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl p-3 text-white">
            <p className="text-[10px] font-medium text-white/70 mb-0.5">All tools are connected</p>
            <p className="text-sm font-bold">Backend-ready sections are live</p>
            <p className="text-[11px] text-white/70 mt-1">Other sections will be enabled when APIs are ready.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {MOCK_TOURNAMENTS.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-xl">🏆</div>
            <span className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded-full ${t.status === 'upcoming' ? 'bg-amber-50 text-amber-600' : t.status === 'live' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              {t.status}
            </span>
          </div>
          <h3 className="font-black text-xl text-slate-900 mb-0.5">{t.name}</h3>
          <p className="text-sm text-slate-500 mb-2 line-clamp-2">{t.description}</p>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{t.date}</span>
            <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{t.location}</span>
            <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{t.maxTeams} teams</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function WorkshopsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {MOCK_WORKSHOPS.map((w, i) => (
        <motion.div key={w.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xl">🔧</div>
            <span className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded-full ${w.status === 'upcoming' ? 'bg-amber-50 text-amber-600' : w.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              {w.status}
            </span>
          </div>
          <h3 className="font-black text-xl text-slate-900 mb-0.5">{w.title}</h3>
          <p className="text-sm text-slate-500 mb-2 line-clamp-2">{w.description}</p>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{w.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{w.time}</span>
            <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{w.capacity} seats</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ParticipantsSection() {
  const mockParticipants = [
    { name: 'Abebe B.', event: 'African Robotics Championship', team: 'Robo Lions', status: 'confirmed', date: 'Jul 1, 2026' },
    { name: 'Mekdes A.', event: 'VEX IQ Challenge', team: 'Mech Hawks', status: 'confirmed', date: 'Jun 28, 2026' },
    { name: 'Biruk T.', event: 'Arduino IoT Workshop', team: '—', status: 'waitlisted', date: 'Jun 22, 2026' },
    { name: 'Sara W.', event: 'African Robotics Championship', team: 'Code Breakers', status: 'confirmed', date: 'Jul 1, 2026' },
    { name: 'Dawit K.', event: 'Global STEM Tour Orientation', team: '—', status: 'pending', date: 'Jun 21, 2026' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-brand-red" />Recent Registrations
        </h3>
        <span className="text-[11px] text-slate-400">{mockParticipants.length} entries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Name', 'Event', 'Team', 'Status', 'Date'].map(h => (
                <th key={h} className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockParticipants.map((p, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-2 py-2 text-sm font-medium text-slate-800">{p.name}</td>
                <td className="px-2 py-2 text-[11px] text-slate-500">{p.event}</td>
                <td className="px-2 py-2 text-[11px] text-slate-400">{p.team}</td>
                <td className="px-2 py-2">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                    p.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                    p.status === 'waitlisted' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>{p.status}</span>
                </td>
                <td className="px-2 py-2 text-[11px] text-slate-400">{p.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsSection() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadCSV = (title: string, rows: string[][]) => {
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reports: { title: string; desc: string; icon: React.ElementType; color: string; bg: string; generate: () => string[][] }[] = [
    {
      title: 'Event Participation', desc: 'Attendance rates across all events', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50',
      generate: () => {
        const header = ['Event', 'Date', 'Capacity', 'Registered', 'Attendance Rate'];
        const rows = MOCK_TOURNAMENTS.map(t => [t.name, t.date, t.maxTeams.toString(), Math.floor(t.maxTeams * 0.85).toString(), '85%']);
        return [header, ...rows];
      },
    },
    {
      title: 'Tournament Results', desc: 'Scores, rankings, and outcomes', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-50',
      generate: () => {
        const header = ['Event', 'Round', 'Opponent', 'Score', 'Result'];
        const rows = MOCK_VEX_MATCHES.map(m => [m.event, m.round, m.opponent, m.score, m.result]);
        return [header, ...rows];
      },
    },
    {
      title: 'Revenue Report', desc: 'Ticket sales and registration fees', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50',
      generate: () => {
        const d = MOCK_ANALYTICS;
        const header = ['Student', 'Type', 'Amount', 'Date', 'Status'];
        const rows = d.recentTransactions.map((tx: { student: string; type: string; amount: number; date: string; status: string }) => [tx.student, tx.type, tx.amount.toLocaleString() + ' ETB', tx.date, tx.status]);
        return [header, ...rows];
      },
    },
    {
      title: 'Participant Demographics', desc: 'Age, school, and location', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50',
      generate: () => {
        const d = MOCK_ANALYTICS as any;
        const header = ['Category', 'Type', 'Count'];
        const progRows = d.programDistribution?.map((p: { name: string; students: number }) => ['Program', p.name, p.students.toString()]) ?? [];
        return [header, ...progRows, ['Metric', 'Total Students', '460'], ['Metric', 'Active Programs', '24']];
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {reports.map((r, i) => {
        const ReportIcon = r.icon;
        const isDownloading = downloading === r.title;
        return (
          <motion.div key={r.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg ${r.bg} flex items-center justify-center`}>
                <ReportIcon className={`w-4 h-4 ${r.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900">{r.title}</p>
                <p className="text-[11px] text-slate-500">{r.desc}</p>
              </div>
            </div>
            <button onClick={() => { setDownloading(r.title); setTimeout(() => { downloadCSV(r.title, r.generate()); setDownloading(null); }, 400); }}
              disabled={isDownloading}
              className="w-full text-[11px] font-bold text-brand-red bg-brand-red/10 px-2 py-1.5 rounded-lg hover:bg-brand-red/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Download className={`w-2.5 h-2.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              {isDownloading ? 'Generating...' : 'Download CSV'}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ───── VEX SECTIONS ───── */

function VexOverviewSection({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const team = MOCK_VEX_TEAM;
  const activeRobots = MOCK_VEX_ROBOTS.filter(r => r.status === 'active');
  const awardsWon = MOCK_VEX_AWARDS.filter(a => !a.upcoming);
  const matchWins = MOCK_VEX_MATCHES.filter(m => m.result === 'win').length;
  const matchLosses = MOCK_VEX_MATCHES.filter(m => m.result === 'loss').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-brand-red/10 via-brand-blue/5 to-white p-4 relative">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="text-4xl">{team.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="font-black text-2xl text-slate-900 tracking-tight">{team.name}</h2>
                <span className="text-sm font-mono bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-lg">#{team.number}</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">{team.bio}</p>
              <div className="flex flex-wrap gap-2 mt-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-brand-red" />{team.location}</span>
                <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5 text-brand-red" />{team.members.length} Members</span>
                <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5 text-brand-red" />Est. {team.established}</span>
                <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-amber-400" />Coach: {team.coach}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5">
          {team.members.map((m, i) => (
            <span key={i} className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Star className="w-2 h-2 text-amber-400" />{m}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Active Robots', value: activeRobots.length.toString(), icon: Cpu, color: 'text-cyan-400' },
          { label: 'Awards Won', value: awardsWon.length.toString(), icon: Trophy, color: 'text-yellow-400' },
          { label: 'Match Wins', value: matchWins.toString(), icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Total Matches', value: (matchWins + matchLosses).toString(), icon: Activity, color: 'text-blue-400' },
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mb-1.5">
                <StatIcon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="font-black text-xl text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="font-black text-xl text-slate-900 mb-3 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'vex-robots' as SectionId, label: 'Our Robots', desc: 'View robot specs & builds', icon: Wrench, color: 'from-cyan-500 to-blue-600' },
              { id: 'vex-awards' as SectionId, label: 'Awards', desc: 'Competition achievements', icon: Trophy, color: 'from-yellow-500 to-amber-600' },
              { id: 'vex-matches' as SectionId, label: 'Match History', desc: 'Scores & results', icon: Swords, color: 'from-brand-red to-brand-red-dark' },
              { id: 'vex-notebook' as SectionId, label: 'Engineering Notebook', desc: 'Design process docs', icon: BookOpen, color: 'from-purple-500 to-violet-600' },
            ].map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <motion.button key={action.id} onClick={() => onNavigate(action.id)}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl text-left border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                    <ActionIcon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-sm text-slate-900">{action.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{action.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-gradient-to-br from-brand-red to-brand-red-dark rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10"><Hash className="w-full h-full" /></div>
            <p className="text-[11px] font-medium text-white/70 mb-0.5">Team Number</p>
            <p className="font-black text-3xl tracking-tight">{team.number}</p>
            <p className="text-sm text-white/80 mt-0.5">{team.name}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <Swords className="w-3 h-3 text-brand-red" />Last Match
            </h4>
            {MOCK_VEX_MATCHES.filter(m => m.result !== 'upcoming').slice(0, 1).map(m => (
              <div key={m.id}>
                <p className="text-[11px] text-slate-500">{m.event}</p>
                <p className="font-bold text-xl text-white mt-0.5">{m.score}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full ${m.result === 'win' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                    {m.result === 'win' ? 'VICTORY' : 'LOSS'}
                  </span>
                  <span className="text-[10px] text-slate-400">vs {m.opponent.split('(')[0].trim()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VexRobotsSection() {
  const [selected, setSelected] = useState<VexRobot | null>(null);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <div className="lg:col-span-5 flex flex-col gap-2">
        {MOCK_VEX_ROBOTS.map((robot, i) => {
          const isSelected = selected?.id === robot.id;
          return (
            <motion.div key={robot.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(isSelected ? null : robot)}
              className={`relative bg-white rounded-xl border p-3 cursor-pointer transition-all duration-200 ${isSelected ? 'border-brand-red/40 bg-brand-red/5 shadow-sm' : 'border-slate-200 hover:-translate-y-0.5'}`}
            >
              {isSelected && <motion.div layoutId="robot-bar-mgr" className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-brand-red to-brand-red-dark rounded-l-xl" />}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <img src={robot.image} alt={robot.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full ${robot.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>{robot.status}</span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{robot.season}</span>
                  </div>
                  <h3 className={`font-black text-sm leading-snug ${isSelected ? 'text-brand-red' : 'text-slate-900'}`}>{robot.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{robot.competition}</p>
                </div>
                <ChevronRight className={`w-3 h-3 mt-1 shrink-0 ${isSelected ? 'text-brand-red translate-x-0.5' : 'text-slate-400'}`} />
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <div className="relative h-32 md:h-36 bg-slate-50 overflow-hidden">
                <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
                <div className="absolute bottom-2 left-4 right-4">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full ${selected.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>{selected.status}</span>
                    <span className="text-[10px] font-black text-white bg-slate-600 px-1.5 py-0.5 rounded-md">{selected.season}</span>
                  </div>
                  <h2 className="font-black text-xl md:text-xl text-white leading-tight">{selected.name}</h2>
                  <p className="text-sm text-white/70">{selected.competition}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-3">{selected.description}</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: Cpu, label: 'Brain', value: selected.brain },
                    { icon: Wrench, label: 'Drivetrain', value: selected.drivetrain },
                    { icon: Target, label: 'Weight', value: selected.weight },
                  ].map((m, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                      <m.icon className="w-3 h-3 text-brand-red mb-0.5" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{m.label}</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
                <h3 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5 uppercase tracking-tight">
                  <Zap className="w-3 h-3 text-brand-red" />Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-3">
                  {selected.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-slate-600 font-medium">{spec}</span>
                    </div>
                  ))}
                </div>
                {selected.achievements.length > 0 && (
                  <>
                    <h3 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5 uppercase tracking-tight">
                      <Medal className="w-3 h-3 text-amber-400" />Achievements
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.achievements.map((ach, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                          <Trophy className="w-2.5 h-2.5" />{ach}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center text-center min-h-[250px] justify-center"
            >
              <Cpu className="w-10 h-10 text-slate-400 mb-2 opacity-30" />
              <h3 className="font-black text-xl text-slate-600 mb-0.5">Select a Robot</h3>
              <p className="text-sm text-slate-400 max-w-xs font-medium">Click on any robot to view specs, achievements, and build photos.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VexAwardsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {MOCK_VEX_AWARDS.map((award, i) => (
        <motion.div key={award.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className={`relative bg-white border rounded-xl p-3 overflow-hidden transition-all hover:shadow-sm ${award.upcoming ? 'border-dashed border-amber-300/50 bg-amber-50/30' : 'border-slate-200'}`}
        >
          {award.upcoming && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full">Upcoming</span>
            </div>
          )}
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${award.color} flex items-center justify-center text-xl mb-2 shadow-sm`}>{award.icon}</div>
          <h3 className="font-black text-sm text-slate-900 mb-0.5">{award.name}</h3>
          <p className="text-[11px] text-slate-500 font-medium mb-0.5">{award.event}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1.5">
            <Calendar className="w-2.5 h-2.5" />{award.date}
            <span className="ml-1 text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-1 py-0.5 rounded">{award.category}</span>
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">{award.description}</p>
        </motion.div>
      ))}
    </div>
  );
}

function VexMatchesSection() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5 text-brand-red" />Match History
          <span className="text-[11px] font-medium text-slate-400 ml-1">{MOCK_VEX_MATCHES.length} matches</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Event', 'Date', 'Round', 'Opponent', 'Score', 'Result', 'Notes'].map(h => (
                <th key={h} className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_VEX_MATCHES.map((m, i) => (
              <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${m.result === 'upcoming' ? 'opacity-60' : ''}`}
              >
                <td className="px-2 py-2 text-[11px] font-medium text-slate-800">{m.event}</td>
                <td className="px-2 py-2 text-[11px] text-slate-500">{m.date}</td>
                <td className="px-2 py-2"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{m.round}</span></td>
                <td className="px-2 py-2 text-[11px] font-medium text-slate-700">{m.opponent}</td>
                <td className={`px-2 py-2 font-mono font-bold text-sm ${m.result === 'win' ? 'text-emerald-500' : m.result === 'loss' ? 'text-red-400' : 'text-slate-400'}`}>
                  {m.result === 'upcoming' ? '—' : m.score}
                </td>
                <td className="px-2 py-2">
                  {m.result !== 'upcoming' ? (
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${m.result === 'win' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                      {m.result === 'win' ? 'Win' : 'Loss'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-400 px-1.5 py-0.5 rounded-full">Upcoming</span>
                  )}
                </td>
                <td className="px-2 py-2 text-[10px] text-slate-400 max-w-[150px] truncate">{m.notes}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VexNotebookSection() {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-brand-red" />Engineering Notebook
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">{MOCK_VEX_NOTEBOOK.length} entries</span>
      </div>
      <div className="relative">
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="flex flex-col gap-3">
          {MOCK_VEX_NOTEBOOK.map((entry, i) => {
            const isExpanded = expanded === entry.id;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="relative pl-10"
              >
                <div className={`absolute left-[9px] top-1 w-[13px] h-[13px] rounded-full border-2 border-white ${isExpanded ? 'bg-brand-red' : 'bg-slate-300'}`} />
                <div className={`p-3 rounded-xl border transition-all cursor-pointer ${isExpanded ? 'bg-brand-red/5 border-brand-red/20' : 'bg-slate-50 border-slate-200'}`}
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{entry.title}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />{entry.date}<span className="text-slate-300">·</span><Users className="w-2.5 h-2.5" />{entry.author}
                      </p>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-sm text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-200/50">{entry.content}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold text-brand-red bg-brand-red/5 border border-brand-red/10 px-1.5 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VexRolesSection() {
  const [assignments, setAssignments] = useState([
    { id: 'vr1', userName: 'Abebe K.', role: 'scout', event: 'VEX IQ Nationals 2026', date: 'Jun 25, 2026', status: 'active' as const },
    { id: 'vr2', userName: 'Selam B.', role: 'pit-manager', event: 'VEX V5 Regional', date: 'Jul 2, 2026', status: 'active' as const },
    { id: 'vr3', userName: 'Yonas D.', role: 'queue-manager', event: 'VEX IQ Nationals 2026', date: 'Jun 25, 2026', status: 'active' as const },
    { id: 'vr4', userName: 'Hana M.', role: 'volunteer', event: 'VEX V5 Regional', date: 'Jul 2, 2026', status: 'completed' as const },
  ]);

  const [showAssign, setShowAssign] = useState(false);

  const roleOptions = [
    { key: 'referee', label: 'Referee', icon: Shield },
    { key: 'head-referee', label: 'Head Referee', icon: Shield },
    { key: 'scout', label: 'Scout', icon: Eye },
    { key: 'pit-manager', label: 'Pit Manager', icon: Wrench },
    { key: 'field-manager', label: 'Field Manager', icon: Target },
    { key: 'queue-manager', label: 'Queue Manager', icon: Users },
    { key: 'judge', label: 'Judge', icon: Award },
    { key: 'volunteer', label: 'Volunteer', icon: Sparkles },
    { key: 'technical-inspector', label: 'Technical Inspector', icon: Cpu },
    { key: 'scorekeeper', label: 'Scorekeeper', icon: FileText },
    { key: 'announcer', label: 'Announcer', icon: Bell },
    { key: 'photographer', label: 'Photographer', icon: Camera },
  ];

  const roleLabel = (key: string) => roleOptions.find(r => r.key === key)?.label || key;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-brand-red" />
            <h3 className="font-black text-sm text-slate-900">VEX Role Assignments</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{assignments.length}</span>
          </div>
          <button onClick={() => setShowAssign(true)}
            className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Assign
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Team Member', 'VEX Role', 'Event', 'Date', 'Status', ''].map(h => (
                  <th key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors"
                >
                  <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{a.userName}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">{roleLabel(a.role)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{a.event}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{a.date}</td>
                  <td className="px-3 py-2.5">
                    <span className={`flex items-center gap-1 text-[11px] font-bold ${
                      a.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-0.5">
                      <button className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"><Edit3 className="w-3 h-3" /></button>
                      <button className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="font-black text-sm text-slate-900 mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-red" />
          Role Descriptions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {roleOptions.map(r => {
            const RIcon = r.icon;
            return (
              <div key={r.key} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <RIcon className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-600">{r.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showAssign && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAssign(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Assign VEX Role</h3>
                  <button onClick={() => setShowAssign(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Team Member</label>
                    <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-brand-red">
                      <option>Abebe K.</option><option>Selam B.</option><option>Yonas D.</option><option>Hana M.</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">VEX Competition Role</label>
                    <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-brand-red">
                      {roleOptions.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">Event</label>
                      <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-brand-red">
                        <option>VEX IQ Nationals 2026</option><option>VEX V5 Regional</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                    <button onClick={() => setShowAssign(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => setShowAssign(false)}
                      className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 transition-colors">Assign</button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

function RegistrationSection() {
  const [registrations] = useState([
    { id: 'r1', student: 'Biruk A.', age: 14, grade: '8', school: 'Bole Prep', program: 'VEX IQ Summer Camp', amount: 3500, date: 'Jun 18, 2026', source: 'online' as const, status: 'confirmed' as const },
    { id: 'r2', student: 'Meron D.', age: 12, grade: '7', school: 'Lideta Catholic', program: 'Enjoy AI Workshop', amount: 2500, date: 'Jun 17, 2026', source: 'online' as const, status: 'confirmed' as const },
    { id: 'r3', student: 'Yonas T.', age: 10, grade: '5', school: 'Bole Prep', program: 'STEM Foundations', amount: 1800, date: 'Jun 16, 2026', source: 'walk-in' as const, status: 'pending' as const },
    { id: 'r4', student: 'Hana K.', age: 15, grade: '10', school: 'St. Joseph\'s', program: 'Arduino Advanced', amount: 4000, date: 'Jun 15, 2026', source: 'online' as const, status: 'confirmed' as const },
    { id: 'r5', student: 'Samson G.', age: 11, grade: '6', school: 'AAIT', program: 'VEX IQ Summer Camp', amount: 3500, date: 'Jun 14, 2026', source: 'walk-in' as const, status: 'cancelled' as const },
    { id: 'r6', student: 'Selamawit B.', age: 13, grade: '8', school: 'Bole Prep', program: 'Coding Basics', amount: 2000, date: 'Jun 12, 2026', source: 'online' as const, status: 'confirmed' as const },
  ]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filtered = registrations.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || r.source === sourceFilter;
    return matchesStatus && matchesSource;
  });

  const totalRevenue = registrations.filter(r => r.status === 'confirmed').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Registrations', value: registrations.length, icon: UserPlus, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Confirmed', value: registrations.filter(r => r.status === 'confirmed').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: registrations.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Revenue', value: `${(totalRevenue / 1000).toFixed(1)}K ETB`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900">All Registrations</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-brand-red"
            >
              <option value="all">All Sources</option>
              <option value="online">Online</option>
              <option value="walk-in">Walk-In</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Student', 'Program', 'School', 'Amount', 'Date', 'Source', 'Status'].map(h => (
                  <th key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.student}</p>
                      <p className="text-[11px] text-slate-400">Grade {r.grade} · Age {r.age}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{r.program}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-500">{r.school}</td>
                  <td className="px-3 py-2.5 text-sm font-bold text-slate-700">{r.amount.toLocaleString()} ETB</td>
                  <td className="px-3 py-2.5 text-sm text-slate-500">{r.date}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.source === 'online' ? 'bg-sky-50 text-sky-600' : 'bg-purple-50 text-purple-600'}`}>
                      {r.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`flex items-center gap-1 text-[11px] font-bold ${
                      r.status === 'confirmed' ? 'text-emerald-600' :
                      r.status === 'pending' ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        r.status === 'confirmed' ? 'bg-emerald-500' :
                        r.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {r.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No registrations match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
