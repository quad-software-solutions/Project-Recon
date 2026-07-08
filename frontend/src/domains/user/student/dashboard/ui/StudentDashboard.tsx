import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User, CalendarDays, Target, Calendar, BookOpen, Medal,
  Zap, TrendingUp, Clock, Award, Flame, BarChart3,
  ChevronRight, MessageCircle, Trophy, Video, Gift, FileText,
  Cpu, Swords, ClipboardList, Users, GraduationCap, Activity
} from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import { ROBOTICS_PROGRAMS, MOCK_VEX_TEAM, MOCK_VEX_MATCHES, MOCK_VEX_AWARDS, MOCK_VEX_ROBOTS } from '@/src/shared/constants/mock-data';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';

import heroImg from '@/assets/0M6A6595.00_07_20_18.Still028.jpg';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';

import ProfileOverview from './ProfileOverview';
import AttendanceTracker from './AttendanceTracker';
import ProgressMilestones from './ProgressMilestones';
import UpcomingEvents from './UpcomingEvents';
import VexTeamHub from './VexTeamHub';
import MyRegistrations from './MyRegistrations';
import LearningResources from './LearningResources';
import Achievements from './Achievements';
import ParentFeedback from './ParentFeedback';
import CertificateGenerator from './CertificateGenerator';
import Leaderboard from './Leaderboard';
import VideoLibrary from './VideoLibrary';
import ReferralProgram from './ReferralProgram';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

type SectionId = 'overview' | 'profile' | 'attendance' | 'progress' | 'events' | 'resources' | 'achievements' | 'feedback' | 'certificates' | 'leaderboard' | 'videos' | 'referrals' | 'vex-team' | 'registrations';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, group: 'main' },
  { id: 'profile', label: 'My Profile', icon: User, group: 'main' },
  { id: 'progress', label: 'Milestones', icon: Target, group: 'main' },
  { id: 'achievements', label: 'Achievements', icon: Medal, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: FileText, group: 'main' },
  { id: 'resources', label: 'Learning Resources', icon: BookOpen, group: 'main' },
  { id: 'videos', label: 'Video Library', icon: Video, group: 'main' },
  { id: 'attendance', label: 'Attendance', icon: CalendarDays, group: 'main' },
  { id: 'registrations', label: 'My Registrations', icon: ClipboardList, group: 'main' },
  { id: 'events', label: 'Upcoming Events', icon: Calendar, group: 'main' },
  { id: 'vex-team', label: 'VEX Team Hub', icon: Users, group: 'vex' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, group: 'main' },
  { id: 'referrals', label: 'Referral Program', icon: Gift, group: 'main' },
  { id: 'feedback', label: 'Parent Feedback', icon: MessageCircle, group: 'main' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function StudentDashboard({ currentUser, onLogout }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const enrolledDetails: typeof ROBOTICS_PROGRAMS = [];
  const streakDays = 12;
  const completedProjects = 14;
  const progressPct = 65;

  const renderPage = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewPage currentUser={currentUser} enrolledDetails={enrolledDetails} streakDays={streakDays} completedProjects={completedProjects} progressPct={progressPct} onNavigate={setActiveSection} />;
      case 'profile':    return <ProfileOverview currentUser={currentUser} />;
      case 'attendance': return <AttendanceTracker />;
      case 'progress':   return <ProgressMilestones />;
      case 'events':     return <UpcomingEvents />;
      case 'resources':  return <LearningResources />;
      case 'achievements': return <Achievements />;
      case 'feedback':   return <ParentFeedback />;
      case 'certificates': return <CertificateGenerator />;
      case 'leaderboard': return <Leaderboard />;
      case 'videos':     return <VideoLibrary />;
      case 'referrals':  return <ReferralProgram />;
      case 'vex-team':   return <VexTeamHub />;
      case 'registrations': return <MyRegistrations />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Student Dashboard',
        icon: User,
        userName: currentUser.name,
        userRole: 'Student',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Student Dashboard',
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Learning Command Center"
        subtitle="Progress, events, certificates, and VEX team readiness."
        signals={[
          { label: 'XP', value: currentUser.xpPoints.toLocaleString(), detail: 'current points', icon: Zap, tone: 'amber' },
          { label: 'Progress', value: `${progressPct}%`, detail: 'active track average', icon: TrendingUp, tone: 'emerald' },
          { label: 'Programs', value: String(enrolledDetails.length), detail: 'currently enrolled', icon: BookOpen, tone: enrolledDetails.length ? 'blue' : 'amber' },
          { label: 'VEX Team', value: MOCK_VEX_TEAM.name ? 'Ready' : 'Open', detail: 'team hub status', icon: Users, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}

/* ─── OVERVIEW PAGE ─── */

interface OverviewProps {
  currentUser: UserProfile;
  enrolledDetails: typeof ROBOTICS_PROGRAMS;
  streakDays: number;
  completedProjects: number;
  progressPct: number;
  onNavigate: (s: SectionId) => void;
}

function OverviewPage({ currentUser, enrolledDetails, streakDays, completedProjects, progressPct, onNavigate }: OverviewProps) {
  const firstName = currentUser.name.split(' ')[0];

  const quickStats = [
    { label: 'XP Points', value: currentUser.xpPoints.toLocaleString(), icon: Zap, color: 'text-amber-400' },
    { label: 'Day Streak', value: `${streakDays} days`, icon: Flame, color: 'text-orange-400' },
    { label: 'Progress', value: `${progressPct}%`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Projects', value: `${completedProjects}`, icon: Target, color: 'text-purple-400' },
  ];

  const upcomingItems = [
    { title: 'VEX Regional Finals Prep', date: 'Sat 15th', dotColor: 'bg-brand-blue' },
    { title: 'Enjoy AI Webinar', date: 'Wed 19th', dotColor: 'bg-brand-red' },
    { title: 'Global STEM Tour Orientation', date: 'Fri 21st', dotColor: 'bg-gray-500' },
  ];

  const recentBadges = [
    { title: 'Robotics Master', icon: '🏆' },
    { title: 'Code Guardian', icon: '🛡️' },
    { title: 'AI Innovator', icon: '⭐' },
  ];

  const weekActivity = [
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 4.5 },
    { day: 'Wed', hours: 2 },
    { day: 'Thu', hours: 5 },
    { day: 'Fri', hours: 3.5 },
    { day: 'Sat', hours: 6 },
    { day: 'Sun', hours: 1 },
  ];
  const maxHours = Math.max(...weekActivity.map(w => w.hours));

  return (
    <div className="pb-8">
      {/* Welcome + Profile Card */}
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-brand-red/5 via-brand-blue/5 to-white px-5 py-4 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 border-brand-border shadow-sm shrink-0">
            <img src={profileImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-red uppercase tracking-widest mb-0.5">{getGreeting()}</p>
            <h2 className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight">Welcome back, {firstName}!</h2>
            <p className="text-sm text-slate-500 mt-0.5">You're on a <strong className="text-brand-red">{streakDays}-day streak</strong>. Keep building!</p>
          </div>
          <div className="hidden sm:flex gap-2 shrink-0">
            {currentUser.badges.slice(0, 3).map((badge, i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-slate-100 border border-brand-border flex items-center justify-center text-lg" title={badge}>
                {recentBadges[i]?.icon || '🎖️'}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-px bg-brand-border">
          {quickStats.map((stat, i) => (
            <div key={stat.label} className="bg-white px-4 py-3 text-center">
              <p className="font-black text-2xl text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Tracks + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900">Your Active Tracks</h3>
            <button onClick={() => onNavigate('progress')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 uppercase tracking-wider">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {enrolledDetails.length > 0 ? enrolledDetails.map((prog, i) => (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-brand-border hover:border-brand-red/20 transition-all group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-slate-900 truncate">{prog.title}</h4>
                  <p className="text-sm text-slate-500">{prog.category} · {prog.level}</p>
                  <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.2 }}
                      className="h-full bg-gradient-to-r from-brand-red to-brand-red-dark rounded-full"
                    />
                  </div>
                </div>
                <span className="text-sm font-black text-brand-red shrink-0">{progressPct}%</span>
              </motion.div>
            )) : (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No programs enrolled yet. Explore our tracks!</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col">
          <h3 className="font-black text-lg text-slate-900 mb-1">Weekly Activity</h3>
          <p className="text-sm text-slate-500 mb-6">Hours spent this week</p>
          <div className="flex-1 flex items-end gap-2 min-h-[160px]">
            {weekActivity.map((w, i) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-black text-slate-400">{w.hours}h</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(w.hours / maxHours) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="w-full bg-gradient-to-t from-brand-red to-brand-red-dark rounded-t-lg min-h-[8px]"
                />
                <span className="text-xs text-slate-400">{w.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border flex justify-between items-center">
            <span className="text-sm text-slate-500 font-medium">Total</span>
            <span className="text-base font-black text-brand-red">{weekActivity.reduce((s, w) => s + w.hours, 0)}h</span>
          </div>
        </div>
      </div>

      {/* Events + Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-lg text-slate-900">Upcoming Events</h3>
            <button onClick={() => onNavigate('events')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 uppercase tracking-wider">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingItems.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-brand-border hover:border-brand-red/20 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${ev.dotColor} shrink-0`} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{ev.date}</p>
                </div>
                <Clock className="w-4 h-4 text-slate-400" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-lg text-slate-900">Recent Badges</h3>
            <button onClick={() => onNavigate('achievements')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 uppercase tracking-wider">
              All Badges <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {currentUser.badges.slice(0, 6).map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-brand-border hover:-translate-y-0.5 hover:border-brand-red/20 transition-all"
              >
                <span className="text-2xl mb-2">{recentBadges[i]?.icon || '🎖️'}</span>
                <span className="font-bold text-xs text-slate-600 text-center leading-tight">{badge}</span>
              </motion.div>
            ))}
            {currentUser.badges.length === 0 && (
              <div className="col-span-3 text-center py-8 text-slate-400">
                <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Complete challenges to earn badges!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VEX Team Summary */}
      <div className="mt-6">
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-5 h-5 text-brand-red" />
                <h3 className="font-black text-lg text-slate-900">VEX Competition Team</h3>
                <span className="text-[10px] font-mono font-bold bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full">#{MOCK_VEX_TEAM.number}</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">{MOCK_VEX_TEAM.name} · {MOCK_VEX_TEAM.school}</p>
            </div>
            <button onClick={() => onNavigate('vex-team')} className="text-sm font-black text-brand-red hover:underline flex items-center gap-1 shrink-0 uppercase tracking-wider">
              Full Hub <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Active Robots', value: MOCK_VEX_ROBOTS.filter(r => r.status === 'active').length.toString(), icon: Cpu, color: 'text-cyan-400' },
              { label: 'Awards', value: MOCK_VEX_AWARDS.filter(a => !a.upcoming).length.toString(), icon: Trophy, color: 'text-yellow-400' },
              { label: 'Wins', value: MOCK_VEX_MATCHES.filter(m => m.result === 'win').length.toString(), icon: Swords, color: 'text-emerald-400' },
              { label: 'Members', value: MOCK_VEX_TEAM.members.length.toString(), icon: User, color: 'text-blue-400' },
            ].map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-brand-border">
                  <StatIcon className={`w-4 h-4 ${stat.color} mb-1`} />
                  <p className="font-black text-xl text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{MOCK_VEX_TEAM.members.slice(0, 3).join(', ')}{MOCK_VEX_TEAM.members.length > 3 ? ` +${MOCK_VEX_TEAM.members.length - 3} more` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
