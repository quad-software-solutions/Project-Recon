import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle, ListOrdered, Users, Gamepad2, Award, Trophy, Camera, Handshake,
  FileText, PanelLeftClose, PanelLeftOpen, Calendar, Bell, MoreHorizontal, X,
  BarChart3, Settings, CheckCircle2, Search, MapPin, Clock, UserPlus,
  Sparkles, Shield, Medal, Star, GitBranch, Play, Flag, ClipboardList,
  DollarSign, Globe, Target, ArrowUpRight, QrCode, ExternalLink, Download, BookOpen,
  Youtube, Podcast, Radio, Tv, MonitorPlay, ListVideo, Timer,
  Cpu, Swords, Hash, Wrench, Zap, ChevronRight, Activity as ActivityIcon, User, LogOut, Loader2, AlertCircle, Lock, Trash2
} from 'lucide-react';
import { UserProfile, VexRobot, VexMatchRecord, VexTeam, StudentAward } from '@/shared/types';
import * as eventsApi from '../../api/eventsApi';
import MatchManager from '../../admin/MatchManager';
import TeamManager from '../../admin/TeamManager';
import VexRulesPanel from '../../shared/VexRulesPanel';


import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';

type SectionId = 'overview' | 'create' | 'events' | 'teams' | 'matches' | 'judging' | 'brackets' | 'media' | 'sponsors' | 'reports' | 'vex-overview' | 'vex-robots' | 'vex-awards' | 'vex-matches' | 'vex-notebook';



interface EventCommandCenterProps {
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, group: 'main' },
  { id: 'create', label: 'Create Event', icon: PlusCircle, group: 'main' },
  { id: 'events', label: 'All Events', icon: ListOrdered, group: 'main' },
  { id: 'teams', label: 'Teams', icon: Users, group: 'main' },
  { id: 'matches', label: 'Match Control', icon: Gamepad2, group: 'main' },
  { id: 'judging', label: 'Live Judging', icon: Award, group: 'main' },
  { id: 'brackets', label: 'Brackets', icon: GitBranch, group: 'main' },
  { id: 'media', label: 'Media & Stream', icon: Camera, group: 'main' },
  { id: 'sponsors', label: 'Sponsors', icon: Handshake, group: 'main' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'main' },
  { id: 'vex-overview', label: 'My VEX Team', icon: Cpu, group: 'vex' },
  { id: 'vex-robots', label: 'Our Robots', icon: Wrench, group: 'vex' },
  { id: 'vex-awards', label: 'Awards', icon: Medal, group: 'vex' },
  { id: 'vex-matches', label: 'Match History', icon: Swords, group: 'vex' },
  { id: 'vex-notebook', label: 'Notebook', icon: BookOpen, group: 'vex' },
];

const MANAGER_SECTIONS: SectionId[] = [
  'overview', 'create', 'events', 'teams', 'matches', 'judging', 'brackets', 'media', 'sponsors', 'reports',
  'vex-overview', 'vex-robots', 'vex-awards', 'vex-matches', 'vex-notebook',
];

const ADMIN_SECTIONS: SectionId[] = [
  'overview', 'events', 'teams', 'sponsors', 'reports',
];

const MOBILE_PRIMARY: SectionId[] = ['overview', 'vex-overview', 'events', 'matches'];

export default function EventCommandCenter({ currentUser, onLogout }: EventCommandCenterProps) {
  const isManager = currentUser?.role === 'Manager';
  const allowedSections: SectionId[] = isManager ? MANAGER_SECTIONS : ADMIN_SECTIONS;
  const defaultSection: SectionId = 'overview';

  const [activeSection, setActiveSection] = useState<SectionId>(defaultSection);
  const [selectedRobot, setSelectedRobot] = useState<VexRobot | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const filteredItems = NAV_ITEMS.filter(item => allowedSections.includes(item.id as SectionId));
  const activeLabel = filteredItems.find(n => n.id === activeSection)?.label ?? '';

  const renderPage = () => {
    const section = allowedSections.includes(activeSection) ? activeSection : defaultSection;
    switch (section) {
      case 'overview': return <Overview />;
      case 'create': return <CreateEvent />;
      case 'events': return <AllEvents />;
      case 'teams': return <TeamsPanel />;
      case 'matches': return <MatchManager />;
      case 'judging': return <JudgingPanel />;
      case 'brackets': return <BracketsView />;
      case 'media': return <MediaHub />;
      case 'sponsors': return <SponsorsPanel />;
      case 'reports': return <ReportsPanel />;
      case 'vex-overview': return <VexTeamOverview onNavigate={setActiveSection} />;
      case 'vex-robots': return <VexRobotsPanel selected={selectedRobot} onSelect={setSelectedRobot} />;
      case 'vex-awards': return <VexAwardsPanel />;
      case 'vex-matches': return <VexMatchesPanel />;
      case 'vex-notebook': return <VexNotebookPanel expanded={expandedEntry} onToggle={setExpandedEntry} />;
      default: return <Overview />;
    }
  };

  return (
    <AppLayout
      sidebar={{
        items: filteredItems,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Event Command Center',
        icon: Swords,
        userName: currentUser?.name,
        userRole: isManager ? 'Manager' : 'Admin',
      }}
      topNavbar={{
        title: activeLabel,
        subtitle: 'Event Command Center',
      }}
      onLogout={onLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}

/* ─── OVERVIEW ─── */
function Overview() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventsApi.adminGetTournaments().catch(() => []),
      eventsApi.adminGetMatches().catch(() => []),
    ]).then(([ts, ms]) => {
      setTournaments(Array.isArray(ts) ? ts : []);
      setMatches(Array.isArray(ms) ? ms : []);
    }).finally(() => setLoading(false));
  }, []);

  const totalT = tournaments.length;
  const closedT = tournaments.filter((t: any) => t.is_closed).length;
  const activeT = totalT - closedT;
  const liveM = matches.filter((m: any) => m.status === 'LIVE').length;
  const completedM = matches.filter((m: any) => m.status === 'COMPLETED').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', total: totalT, active: activeT, completed: closedT, icon: Trophy, color: 'from-brand-red to-brand-red-dark' },
          { label: 'Active', total: activeT, active: activeT, completed: 0, icon: ActivityIcon, color: 'from-emerald-500 to-teal-500' },
          { label: 'Live Matches', total: liveM, active: liveM, completed: 0, icon: Gamepad2, color: 'from-blue-500 to-indigo-500' },
          { label: 'Completed Matches', total: completedM, active: 0, completed: completedM, icon: Medal, color: 'from-purple-500 to-violet-500' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="font-black text-2xl text-slate-900">{c.total}</p>
            <p className="text-xs text-slate-500 mt-1">
              {c.active > 0 && <><span className="text-emerald-600 font-bold">{c.active} active</span><span className="mx-1">·</span></>}
              <span className="text-slate-400">{c.completed} completed</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-red" />
          Competition Progression Pathway
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Friendly', icon: Sparkles, color: 'bg-emerald-500' },
            { label: 'Local', icon: MapPin, color: 'bg-blue-500' },
            { label: 'National', icon: Trophy, color: 'bg-brand-red' },
            { label: 'African', icon: Globe, color: 'bg-purple-500' },
            { label: 'Worlds', icon: Award, color: 'bg-amber-500' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <div className={`w-6 h-6 rounded-md ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">{s.label}</span>
              </div>
              {i < 4 && <ArrowUpRight className="w-4 h-4 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-red" />Upcoming Events</h3>
          <div className="space-y-3">
            {tournaments.filter((t: any) => !t.is_closed).slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.event_title || t.event || 'Tournament'}</p>
                  <p className="text-[10px] text-slate-500">{t.max_teams || '—'} max teams</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">{t.is_closed ? 'Closed' : 'Open'}</span>
              </div>
            ))}
            {!tournaments.filter((t: any) => !t.is_closed).length && (
              <p className="text-xs text-slate-400 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-brand-red" />Recent Results</h3>
          <div className="space-y-3">
            {matches.filter((m: any) => m.status === 'COMPLETED').slice(0, 3).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-900">{m.round}</p>
                  <p className="text-[9px] text-slate-500">{m.sides?.map((s: any) => `${s.score ?? 0}`).join(' · ') || '—'}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">{m.winning_side ? 'Winner' : '—'}</span>
              </div>
            ))}
            {!matches.filter((m: any) => m.status === 'COMPLETED').length && (
              <p className="text-xs text-slate-400 text-center py-4">No completed matches</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CREATE EVENT ─── */
function CreateEvent() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [maxTeams, setMaxTeams] = useState('');
  const [fee, setFee] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name || !date) { setError('Name and date are required'); return; }
    setSaving(true); setError(null);
    try {
      const evt = await eventsApi.adminCreateEvent({
        title: name, event_type: 'TOURNAMENT', visibility: 'PUBLIC',
        start_datetime: `${date}T08:00:00Z`, end_datetime: `${date}T18:00:00Z`,
        location: location || 'TBD', registration_enabled: true,
        payment_required: !!fee, registration_fee: fee || null,
        status: 'DRAFT',
      });
      await eventsApi.adminCreateTournament({
        event: evt.id, category: category || 'General',
        max_teams: maxTeams ? parseInt(maxTeams) : null,
        prize_pool: null,
      });
      setSuccess(true);
      setTimeout(() => { setName(''); setCategory(''); setDate(''); setMaxTeams(''); setFee(''); setLocation(''); setSuccess(false); }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create event');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl">
      <h3 className="font-bold text-sm text-slate-900 mb-1">New Competition Event</h3>
      <p className="text-xs text-slate-500 mb-6">Create a friendly scrimmage, local qualifier, national championship, or African competition.</p>
      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
      {success && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-xs text-emerald-700"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>Event created successfully!</span></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Event Name *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Addis Ababa VEX Qualifier" /></div>
        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Category</label><input value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. VEX V5" /></div>
        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Date *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Max Teams</label><input type="number" value={maxTeams} onChange={e => setMaxTeams(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. 40" /></div>
        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Registration Fee (Birr)</label><input type="number" value={fee} onChange={e => setFee(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="0 for free" /></div>
        <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Bole Prep Hall" /></div>
      </div>
      <button onClick={handleSubmit} disabled={saving}
        className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 transition-all flex items-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} {saving ? 'Creating...' : 'Create Event'}
      </button>
    </div>
  );
}

/* ─── ALL EVENTS ─── */
function AllEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventsApi.adminGetTournaments(),
      eventsApi.adminGetMatches().catch(() => []),
    ]).then(([data, ms]) => {
      setEvents(Array.isArray(data) ? data : []);
      setMatches(Array.isArray(ms) ? ms : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const [closingId, setClosingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleClose = async (id: string) => {
    setClosingId(id);
    try {
      await eventsApi.adminCloseTournament(id);
      const data = await eventsApi.adminGetTournaments();
      setEvents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally { setClosingId(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id); setDeleteError(null);
    try {
      await eventsApi.adminDeleteTournament(id);
      setEvents((prev: any[]) => prev.filter((e: any) => e.id !== id));
    } catch (err: any) { setDeleteError(err?.message || 'Delete failed'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tournaments', value: events.length, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Open', value: events.filter((e: any) => !e.is_closed).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Live Matches', value: matches.filter((m: any) => m.status === 'LIVE').length, icon: Zap, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Matches', value: matches.length, icon: Gamepad2, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="font-black text-xl text-slate-900">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {deleteError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /><span>{deleteError}</span><button onClick={() => setDeleteError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button></div>}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input className="w-full text-sm bg-transparent outline-none" placeholder="Search events..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e: any) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${e.is_closed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>{e.is_closed ? 'Closed' : 'Open'}</span>
              <span className="text-[9px] font-bold text-slate-400">{e.category || 'VEX Tournament'}</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-2">{e.event_title || e.event || 'Untitled'}</h4>
            <div className="text-[10px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5"><Users className="w-3 h-3" />{e.max_teams || '—'} max teams</p>
              <p className="flex items-center gap-1.5"><Gamepad2 className="w-3 h-3" />{matches.filter((m: any) => m.tournament === e.id).length} matches</p>
              {e.prize_pool && <p className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" />{e.prize_pool} Birr</p>}
            </div>
            <div className="flex gap-2 mt-4">
              {e.is_closed ? (
                <span className="flex-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-lg flex items-center justify-center gap-1"><Lock className="w-3 h-3" />Closed</span>
              ) : (
                <button onClick={() => handleClose(e.id)} disabled={closingId === e.id}
                  className="flex-1 text-[10px] font-bold text-white bg-red-500 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                  {closingId === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Lock className="w-3 h-3" />Close Tournament</>}
                </button>
              )}
              <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id}
                className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1">
                {deletingId === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3" />Delete</>}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <VexRulesPanel />
      </div>
    </div>
  );
}

/* ─── TEAMS ─── */
function TeamsPanel() {
  return <TeamManager />;
}

/* ─── LIVE JUDGING ─── */
function JudgingPanel() {
  const awards = [
    { name: 'Excellence Award', icon: Star, desc: 'Top overall team', color: 'text-amber-500' },
    { name: 'Design Award', icon: Settings, desc: 'Best robot design', color: 'text-blue-500' },
    { name: 'Engineering Notebook', icon: FileText, desc: 'Best documentation', color: 'text-green-500' },
    { name: 'Judges Award', icon: Medal, desc: 'Special recognition', color: 'text-purple-500' },
    { name: 'Sportsmanship', icon: Shield, desc: 'Best team spirit', color: 'text-cyan-500' },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {awards.map(a => (
          <div key={a.name} className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:shadow-md transition-all">
            <a.icon className={`w-6 h-6 mx-auto mb-2 ${a.color}`} />
            <p className="text-[10px] font-black text-slate-900">{a.name}</p>
            <p className="text-[8px] text-slate-500 mt-0.5">{a.desc}</p>
            <button className="mt-3 text-[9px] font-bold text-brand-red bg-brand-red/10 px-3 py-1.5 rounded-lg w-full hover:bg-brand-red/20 transition-colors">Score</button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Judging Rubric — Design Award</h3>
        <div className="space-y-3">
          {[
            { criterion: 'Mechanical Design & Durability', max: 20 },
            { criterion: 'Software & Programming', max: 20 },
            { criterion: 'Innovation & Creativity', max: 20 },
            { criterion: 'Design Process Documentation', max: 20 },
            { criterion: 'Team Interview Performance', max: 20 },
          ].map(r => (
            <div key={r.criterion} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-700">{r.criterion}</span>
              <div className="flex items-center gap-2">
                <input className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md text-center" placeholder="0" />
                <span className="text-[10px] text-slate-400">/ {r.max}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 bg-gradient-to-r from-brand-red to-brand-red-dark text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl transition-all">Submit Scores</button>
      </div>
    </div>
  );
}

/* ─── BRACKETS ─── */
function BracketsView() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><GitBranch className="w-4 h-4 text-brand-red" />Elimination Bracket</h3>
      <div className="flex gap-8 overflow-x-auto pb-4">
        {[
          { round: 'Quarter-Finals', matches: [{ team1: 'T-001', team2: 'T-006', score1: 2, score2: 0 }, { team1: 'T-002', team2: 'T-005', score1: 2, score2: 1 }, { team1: 'T-003', team2: 'T-004', score1: 0, score2: 2 }, { team1: 'T-001', team2: 'T-005', score1: 0, score2: 0 }] },
          { round: 'Semi-Finals', matches: [{ team1: 'T-001', team2: 'T-004', score1: 0, score2: 0 }, { team1: 'T-002', team2: 'TBD', score1: 0, score2: 0 }] },
          { round: 'Finals', matches: [{ team1: 'TBD', team2: 'TBD', score1: 0, score2: 0 }] },
        ].map(r => (
          <div key={r.round} className="min-w-[200px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3 text-center">{r.round}</p>
            <div className="space-y-3">
              {r.matches.map((m, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className={`flex items-center justify-between py-1 ${m.score1 > m.score2 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    <span className="text-[10px] font-bold">{m.team1}</span>
                    <span className="text-xs font-black">{m.score1 > 0 ? m.score1 : '-'}</span>
                  </div>
                  <div className="border-t border-slate-200 my-1" />
                  <div className={`flex items-center justify-between py-1 ${m.score2 > m.score1 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    <span className="text-[10px] font-bold">{m.team2}</span>
                    <span className="text-xs font-black">{m.score2 > 0 ? m.score2 : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MEDIA ─── */
function MediaHub() {
  const [activeField, setActiveField] = useState(1);

  const LIVE_SHOWS = [
    { time: '09:00', label: 'Opening Ceremony', field: 1, duration: '30m', host: 'Mekdes W.', youtubeId: 'dQw4w9WgXcQ' },
    { time: '09:45', label: 'Qualification M-01 · Robo Lions vs Tech Titans', field: 1, duration: '15m', host: 'Field Announcer', youtubeId: '' },
    { time: '10:00', label: 'Qualification M-02 · Iron Eagles vs Bot Builders', field: 2, duration: '15m', host: 'Field Announcer', youtubeId: '' },
    { time: '10:15', label: 'Qualification M-03 · Mech Warriors vs Circuit Breakers', field: 1, duration: '15m', host: 'Field Announcer', youtubeId: '' },
    { time: '10:45', label: 'Design Award Interviews', field: 3, duration: '45m', host: 'Judging Panel', youtubeId: '' },
    { time: '11:30', label: 'Semi-Finals · Match A', field: 1, duration: '20m', host: 'Main Commentator', youtubeId: '' },
    { time: '12:00', label: 'Lunch Break', field: 1, duration: '1h', host: '—', youtubeId: '' },
    { time: '13:00', label: 'Semi-Finals · Match B', field: 1, duration: '20m', host: 'Main Commentator', youtubeId: '' },
    { time: '13:30', label: 'Finals · Championship Match', field: 1, duration: '30m', host: 'Main Commentator', youtubeId: '' },
    { time: '14:15', label: 'Award Ceremony', field: 1, duration: '45m', host: 'Mekdes W.', youtubeId: '' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── YouTube Live Stream ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2"><Youtube className="w-4 h-4 text-brand-red" />Live YouTube Stream</h3>
        <p className="text-[10px] text-slate-500 mb-4">Broadcast matches live to YouTube from any field</p>
        <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center text-slate-500 relative overflow-hidden group">
          <div className="text-center z-10">
            <Youtube className="w-12 h-12 mx-auto mb-2 text-red-500" />
            <p className="text-xs font-bold text-white">Field {activeField} — {activeField === 1 ? '🔴 LIVE' : 'Standby'}</p>
            <p className="text-[10px] text-slate-500">youtube.com/ethiorobotics/live</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-white">LIVE</span>
            </div>
            <span className="text-[9px] text-white/60">{LIVE_SHOWS.find(s => s.field === activeField)?.label ?? 'No broadcast'}</span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md">
            <MonitorPlay className="w-3 h-3 text-white/80" />
            <span className="text-[9px] text-white/80">{LIVE_SHOWS.find(s => s.field === activeField)?.duration ?? '—'}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map(f => (
            <button key={f} onClick={() => setActiveField(f)}
              className={`flex-1 text-[10px] font-bold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeField === f
                  ? 'text-white bg-brand-red shadow-md'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}>
              {f === 1 && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              {f === 1 ? '🔴' : '📺'} Field {f}
            </button>
          ))}
          <button className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
            <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
          </button>
        </div>
      </div>

      {/* ── Live Shows Schedule ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2"><ListVideo className="w-4 h-4 text-brand-red" />Live Shows Schedule</h3>
        <p className="text-[10px] text-slate-500 mb-4">Full day program — click a show to stream or add to broadcast queue</p>
        <div className="space-y-1">
          {LIVE_SHOWS.map((show, i) => (
            <div key={i}
              className={`flex items-center gap-4 p-2.5 rounded-xl transition-colors ${
                show.field === activeField ? 'bg-brand-red/5 border border-brand-red/10' : 'hover:bg-slate-50 border border-transparent'
              }`}>
              {/* Time */}
              <div className="w-14 text-center shrink-0">
                <p className="text-[10px] font-black text-slate-900">{show.time}</p>
                <p className="text-[8px] text-slate-400 font-medium">{show.duration}</p>
              </div>
              {/* Timeline dot */}
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-brand-red animate-pulse' : 'bg-slate-300'}`} />
                {i < LIVE_SHOWS.length - 1 && <div className="w-0.5 h-5 bg-slate-200" />}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{show.label}</p>
                  {show.field === activeField && (
                    <span className="text-[8px] font-bold text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />ON AIR
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 flex items-center gap-2">
                  <Tv className="w-3 h-3" /> Field {show.field} · {show.host}
                </p>
              </div>
              {/* Actions */}
              <div className="flex gap-1.5 shrink-0">
                <button className="text-[9px] font-bold text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/20 transition-colors flex items-center gap-1">
                  <Play className="w-3 h-3" /> Stream
                </button>
                <button className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  <Youtube className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Photo Gallery ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2"><Camera className="w-4 h-4 text-brand-red" />Photo Gallery</h3>
        <p className="text-[10px] text-slate-500 mb-4">Match photos, team robots, and event moments</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Opening Ceremony', field: 1 },
            { label: 'Qualification Matches', field: 2 },
            { label: 'Robot Inspections', field: 3 },
            { label: 'Award Ceremony', field: 4 },
          ].map((p, i) => (
            <div key={i} className="aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 border border-slate-200 hover:border-brand-red/30 hover:bg-slate-50 transition-colors group cursor-pointer">
              <Camera className="w-6 h-6 group-hover:text-brand-red transition-colors" />
              <p className="text-[8px] text-slate-400 mt-1 font-medium">{p.label}</p>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full text-[10px] font-bold text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg hover:bg-brand-red/20 transition-colors">Upload Photos</button>
      </div>
    </div>
  );
}

/* ─── SPONSORS ─── */
function SponsorsPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'VEX Robotics', tier: 'Platinum', contribution: 'Game kits & field donation', logo: 'VEX', color: 'from-slate-800 to-slate-900' },
          { name: 'Ethio Telecom', tier: 'Gold', contribution: 'Internet & streaming sponsor', logo: 'ET', color: 'from-green-600 to-green-700' },
          { name: 'Ministry of Innovation', tier: 'Silver', contribution: 'Venue & logistics partner', logo: 'MoIT', color: 'from-blue-600 to-blue-700' },
        ].map(s => (
          <div key={s.name} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-[9px] font-black mb-3`}>{s.logo}</div>
            <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase">{s.tier}</span>
            <p className="text-[10px] text-slate-500 mt-2">{s.contribution}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-2">Sponsor Overlay Preview</h3>
        <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-center gap-8 text-white/80 text-[9px] font-bold">
          {['VEX', 'Ethio Telecom', 'MoIT', 'AAU'].map(l => (
            <span key={l} className="bg-white/10 px-3 py-1.5 rounded-md">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── REPORTS ─── */
function ReportsPanel() {
  const [selectedAward, setSelectedAward] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    eventsApi.adminGetTournaments().then(data => setEvents(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const awardCerts: StudentAward[] = [];

  const AWARD_TYPES = [
    { key: 'Excellence Award', icon: Trophy, desc: 'Top overall team across all criteria', color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'Tournament Champions', icon: Shield, desc: 'Winning alliance in elimination bracket', color: 'text-brand-red', bg: 'bg-brand-red/10' },
    { key: 'Design Award', icon: Settings, desc: 'Best robot mechanical & software design', color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'Engineering Notebook Award', icon: BookOpen, desc: 'Best documentation & engineering process', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'Judges Award', icon: Medal, desc: 'Special recognition from judging panel', color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'Sportsmanship Award', icon: Star, desc: 'Team that best embodies gracious professionalism', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Certificate Generator ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Award className="w-4 h-4 text-brand-red" />Award Certificate Generator</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Generate verified competition award certificates for winners</p>
          </div>
          {/* Event Filter */}
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="text-[10px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/20">
            <option value="all">All Events</option>
            {events.map((e: any) => (
              <option key={e.id} value={e.id}>{e.event_title || e.event || 'Event'} ({e.id?.slice(-6)})</option>
            ))}
          </select>
        </div>

        {/* Award Type Selection */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {AWARD_TYPES.map(a => (
            <button key={a.key} onClick={() => setSelectedAward(a.key === selectedAward ? null : a.key)}
              className={`text-left p-3 rounded-xl border transition-all ${selectedAward === a.key ? 'border-brand-red bg-brand-red/5 ring-1 ring-brand-red/20' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'}`}>
              <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center mb-2`}>
                <a.icon className={`w-4 h-4 ${a.color}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-900 leading-tight">{a.key}</p>
              <p className="text-[8px] text-slate-500 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Generated Certificates */}
        {awardCerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Issued Certificates ({awardCerts.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {awardCerts.map(cert => {
                const cfg = AWARD_TYPES.find(a => a.key === cert.awardCategory);
                return (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-red/20 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${cfg?.bg ?? 'bg-slate-100'} flex items-center justify-center`}>
                        {cfg ? <cfg.icon className={`w-4 h-4 ${cfg?.color ?? 'text-slate-600'}`} /> : <Award className="w-4 h-4 text-slate-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cert.teamName} <span className="text-[9px] font-normal text-slate-400">({cert.studentName})</span></p>
                        <p className="text-[9px] text-slate-500">{cert.awardCategory} · {cert.eventName}</p>
                        <p className="text-[8px] font-mono text-emerald-600 mt-0.5 flex items-center gap-1">
                          <Shield className="w-3 h-3" />{cert.verificationCode}
                        </p>
                      </div>
                    </div>
                    <button className="flex items-center gap-1.5 text-[9px] font-bold text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-red/20">
                      <Download className="w-3 h-3" />PDF
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {awardCerts.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No award certificates issued yet</p>
            <p className="text-[10px]">Select an award type above to generate the first certificate</p>
          </div>
        )}

        {/* Certificate Preview */}
        {awardCerts.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#002f87] rounded-xl p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <p className="font-mono text-[8px] text-amber-300 uppercase tracking-[0.3em] font-bold">CERTIFICATE OF ACHIEVEMENT</p>
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </div>
              <h2 className="font-display font-extrabold text-xl text-white mb-1 tracking-tight">ETHIO ROBOTICS</h2>
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4" />
              <p className="text-slate-400 text-[10px] mb-1">This award is presented to</p>
              <p className="font-display font-bold text-lg text-white mb-0.5">{awardCerts[0].teamName}</p>
              <p className="text-slate-400 text-[9px] mb-3">{awardCerts[0].studentName} · {awardCerts[0].schoolName}</p>
              <p className="text-slate-400 text-[10px] mb-1">For outstanding achievement in</p>
              <p className="font-display font-bold text-base text-[#57dffe]">{awardCerts[0].awardCategory}</p>
              <p className="text-slate-500 text-[9px] mt-3">{awardCerts[0].eventName} · {awardCerts[0].issueDate}</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-500">
                <Shield className="w-3.5 h-3.5" />
                <p className="font-mono text-[8px]">{awardCerts[0].verificationCode}</p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                  <QrCode className="w-3 h-3" />QR Code
                </button>
                <button className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                  <ExternalLink className="w-3 h-3" />Share
                </button>
                <button className="flex items-center gap-1.5 text-[9px] font-bold text-slate-900 bg-white px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <Download className="w-3 h-3" />Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Post-Event Reports ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-brand-red" />Post-Event Reports</h3>
        <p className="text-xs text-slate-500 mb-4">Downloadable summaries of competition results, sponsor impact, and media assets.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mb-3"><Star className="w-4 h-4 text-purple-600" /></div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">Sponsor Impact Report</h4>
            <p className="text-[9px] text-slate-500 mb-3">Logo impressions, audience reach, sponsor visibility in event photos and stream overlays.</p>
            <button className="w-full text-[9px] font-bold text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg hover:bg-brand-red/20 transition-colors">Download</button>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3"><ClipboardList className="w-4 h-4 text-blue-600" /></div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">Full Event Results</h4>
            <p className="text-[9px] text-slate-500 mb-3">Complete qualification rankings, elimination brackets, award winners, and match history.</p>
            <button className="w-full text-[9px] font-bold text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg hover:bg-brand-red/20 transition-colors">Download</button>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3"><Camera className="w-4 h-4 text-amber-600" /></div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">Media Kit</h4>
            <p className="text-[9px] text-slate-500 mb-3">Event photos, press release template, winner quotes, and social media assets package.</p>
            <button className="w-full text-[9px] font-bold text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg hover:bg-brand-red/20 transition-colors">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VEX TEAM OVERVIEW ─── */
function VexTeamOverview({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const [team, setTeam] = useState<VexTeam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.adminGetTeams().then(teams => {
      const raw: any = Array.isArray(teams) ? teams[0] : null;
      if (raw) {
        setTeam({
          id: raw.id,
          name: raw.team_name || 'My Team',
          number: raw.id?.slice(-4) || '0000',
          school: raw.organization || '',
          location: '',
          members: [],
          coach: raw.coach_name || '',
          bio: `${raw.team_name || 'Team'} from ${raw.organization || 'Ethiopia'}`,
          established: new Date().getFullYear().toString(),
          avatar: '🤖',
          color: '#E63946',
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  if (!team) return (
    <div className="flex flex-col items-center py-20 text-center gap-4">
      <Cpu className="w-16 h-16 text-slate-300" />
      <h3 className="font-black text-xl text-slate-600">No Team Found</h3>
      <p className="text-sm text-slate-400 max-w-md">Register a team in the Teams section to see your VEX team overview here.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-brand-red/10 via-brand-blue/5 to-white p-6 md:p-8 relative">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="text-6xl">{team.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight">{team.name}</h2>
                <span className="text-sm font-mono bg-brand-red/10 text-brand-red px-2.5 py-0.5 rounded-lg">#{team.number}</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">{team.bio}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-red" />{team.location}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-brand-red" />{team.school}</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" />Coach: {team.coach}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Matches', value: '0', icon: Swords, color: 'text-blue-400' },
          { label: 'Wins', value: '0', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Rating', value: '—', icon: Star, color: 'text-amber-400' },
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <StatIcon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="font-black text-2xl text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-3">
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
                  className="relative p-4 rounded-2xl text-left border border-slate-100 hover:border-slate-200 bg-white hover:shadow-md transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                    <ActionIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-bold text-xs text-slate-900">{action.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{action.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-brand-red to-brand-red-dark rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10"><Hash className="w-full h-full" /></div>
            <p className="text-xs font-medium text-white/70 mb-1">Team Number</p>
            <p className="font-black text-4xl tracking-tight">{team.number}</p>
            <p className="text-sm text-white/80 mt-1">{team.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VEX ROBOTS ─── */
function VexRobotsPanel({ selected, onSelect }: { selected: VexRobot | null; onSelect: (r: VexRobot | null) => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center gap-4">
      <Wrench className="w-16 h-16 text-slate-300" />
      <h3 className="font-black text-xl text-slate-600">No Robots Yet</h3>
      <p className="text-sm text-slate-400 max-w-md">Robot data will appear here once your team registers a VEX robot build.</p>
    </div>
  );
}

/* ─── VEX AWARDS ─── */
function VexAwardsPanel() {
  return (
    <div className="flex flex-col items-center py-20 text-center gap-4">
      <Medal className="w-16 h-16 text-slate-300" />
      <h3 className="font-black text-xl text-slate-600">No Awards Yet</h3>
      <p className="text-sm text-slate-400 max-w-md">Award history will appear once your team earns competition recognition.</p>
    </div>
  );
}

/* ─── VEX MATCHES ─── */
function VexMatchesPanel() {
  const [matches, setMatches] = useState<VexMatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.adminGetMatches().then(data => {
      const list = Array.isArray(data) ? data : [];
      const transformed: VexMatchRecord[] = list.map(m => ({
        id: m.id,
        event: m.tournament_title || `Match ${m.round}`,
        date: m.scheduled_at ? new Date(m.scheduled_at).toISOString().split('T')[0] : '—',
        round: m.round,
        opponent: `Team (${m.tournament?.slice(-4) || '—'})`,
        score: m.sides?.length ? `${m.sides[0]?.score ?? 0} — ${m.sides[1]?.score ?? 0}` : '—',
        result: m.status === 'COMPLETED' ? (m.winning_side ? 'win' : 'loss') : 'upcoming',
        notes: m.status === 'LIVE' ? 'In progress' : m.status === 'SCHEDULED' ? 'Scheduled' : '',
      }));
      setMatches(transformed);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

  if (!matches.length) return (
    <div className="flex flex-col items-center py-20 text-center gap-4">
      <Swords className="w-16 h-16 text-slate-300" />
      <h3 className="font-black text-xl text-slate-600">No Matches Yet</h3>
      <p className="text-sm text-slate-400 max-w-md">Match history will appear once your team participates in competitions.</p>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
          <Swords className="w-5 h-5 text-brand-red" />Match History
          <span className="text-xs font-medium text-slate-400 ml-2">{matches.length} matches</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Event', 'Date', 'Round', 'Opponent', 'Score', 'Result', 'Notes'].map(h => (
                <th key={h} className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((m, i) => (
              <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${m.result === 'upcoming' ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 text-xs font-medium text-slate-800">{m.event}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{m.date}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{m.round}</span></td>
                <td className="px-4 py-3 text-xs font-medium text-slate-700">{m.opponent}</td>
                <td className={`px-4 py-3 font-mono font-bold text-sm ${m.result === 'win' ? 'text-emerald-500' : m.result === 'loss' ? 'text-red-400' : 'text-slate-400'}`}>
                  {m.result === 'upcoming' ? '—' : m.score}
                </td>
                <td className="px-4 py-3">
                  {m.result !== 'upcoming' ? (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${m.result === 'win' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                      {m.result === 'win' ? 'Win' : 'Loss'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-400 px-2 py-0.5 rounded-full">Upcoming</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-400 max-w-[200px] truncate">{m.notes}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── VEX NOTEBOOK ─── */
function VexNotebookPanel({ expanded, onToggle }: { expanded: string | null; onToggle: (id: string | null) => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center gap-4">
      <BookOpen className="w-16 h-16 text-slate-300" />
      <h3 className="font-black text-xl text-slate-600">No Notebook Entries</h3>
      <p className="text-sm text-slate-400 max-w-md">Engineering notebook entries will appear once your team documents their design process.</p>
    </div>
  );
}
