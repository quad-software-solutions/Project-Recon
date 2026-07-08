import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus, Users, DollarSign, Award, FileText, LayoutDashboard,
  Plus, Search, X, CheckCircle2, Loader2, Calendar, Mail, Phone, MapPin,
  CreditCard, Printer, Download, Eye, User, BookOpen, Shield, AlertCircle, Check,
  TrendingUp, Clock, Filter, ChevronDown, ArrowUpDown, Receipt, Stamp,
  BarChart3, PieChart, Ban, Trash2, MoreHorizontal, Settings, RefreshCw
} from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';

interface Props { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'overview' | 'admissions' | 'enrollments' | 'payments' | 'certificates' | 'reports';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'admissions', label: 'Admissions', icon: UserPlus, group: 'main' },
  { id: 'enrollments', label: 'Enrollments', icon: Users, group: 'main' },
  { id: 'payments', label: 'Payments', icon: DollarSign, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'main' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'main' },
];

export default function SecretaryDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <Overview />;
      case 'admissions': return <AdmissionsPanel />;
      case 'enrollments': return <EnrollmentsPanel />;
      case 'payments': return <PaymentsPanel />;
      case 'certificates': return <CertificatesPanel />;
      case 'reports': return <ReportsPanel />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SectionId),
        title: 'Secretary Dashboard',
        icon: Shield,
        userName: currentUser.name,
        userRole: 'Secretary',
      }}
      topNavbar={{ title: activeLabel, subtitle: 'Secretary Dashboard' }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Secretary Command Center"
        subtitle="Student admissions, enrollments, payments, certificates, and reports."
        signals={[
          { label: 'Pending Admissions', value: '3', detail: 'awaiting processing', icon: UserPlus, tone: 'amber' },
          { label: 'Active Enrollments', value: '18', detail: 'current students', icon: Users, tone: 'emerald' },
          { label: "Today's Payments", value: '2', detail: 'cash recorded', icon: DollarSign, tone: 'blue' },
          { label: 'Certificates', value: '5', detail: 'ready to issue', icon: Award, tone: 'emerald' },
        ]}
      />
      {renderPage()}
    </AppLayout>
  );
}

/* ─── OVERVIEW ─── */

function Overview() {
  const recentAdmissions = [
    { name: 'Kidus G.', program: 'Python Beginner', date: 'Today', status: 'pending' as const, avatar: 'KG' },
    { name: 'Selam B.', program: 'Arduino Basics', date: 'Yesterday', status: 'completed' as const, avatar: 'SB' },
    { name: 'Yonas D.', program: 'VEX IQ', date: 'Jul 3', status: 'completed' as const, avatar: 'YD' },
    { name: 'Hana M.', program: 'VEX V5', date: 'Jul 1', status: 'pending' as const, avatar: 'HM' },
  ];

  const payments = [
    { name: 'Abebe K.', amount: '2,500 ETB', method: 'Cash', time: '10:30 AM' },
    { name: 'Selam B.', amount: '4,000 ETB', method: 'Cash', time: '2:15 PM' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Left Column */}
      <div className="lg:col-span-2 space-y-4">

        {/* Mini Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending Admissions', value: '3', icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Active Enrollment', value: '18', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Today\'s Payments', value: '6,500 ETB', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Certificates Issued', value: '12', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`${s.bg} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="font-bold text-lg text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Admissions */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-red-500" /> Recent Admissions
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Last 4 records</span>
          </div>
          <div className="space-y-2">
            {recentAdmissions.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs">{a.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                    <p className="text-[10px] text-slate-500">{a.program}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{a.date}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {a.status === 'pending' ? 'Pending' : 'Completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Payments */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Today's Cash Payments
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Total: 6,500 ETB</span>
          </div>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.method} · {p.time}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{p.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No payments recorded today</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-sm">
          <Shield className="w-6 h-6 text-white/70 mb-2" />
          <p className="text-xs text-white/70">Your Branch</p>
          <p className="font-bold text-lg">Bole Academy</p>
          <p className="text-[10px] text-white/60 mt-1">Secretary · Academic Operations</p>
          <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 bg-white/15 rounded-lg text-[10px] font-medium">Full Access</span>
            <span className="px-2 py-1 bg-white/15 rounded-lg text-[10px] font-medium">Today</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <h4 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-1.5">
            <Settings className="w-3 h-3 text-red-500" /> Quick Actions
          </h4>
          <div className="space-y-1.5">
            {[
              { label: 'New Admission', icon: UserPlus, color: 'text-red-500', desc: 'Register a new student' },
              { label: 'Record Payment', icon: DollarSign, color: 'text-emerald-600', desc: 'Log cash received' },
              { label: 'Issue Certificate', icon: Award, color: 'text-amber-600', desc: 'Generate & print' },
              { label: 'Print Report', icon: Printer, color: 'text-blue-600', desc: 'Monthly summary' },
            ].map((a, i) => {
              const AIcon = a.icon;
              return (
                <button key={i} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <AIcon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">{a.label}</p>
                    <p className="text-[9px] text-slate-400">{a.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Week at a Glance */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <h4 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-red-500" /> This Week
          </h4>
          <div className="space-y-2">
            {[
              { day: 'Mon', event: 'Staff Meeting', time: '9:00 AM' },
              { day: 'Wed', event: 'Admission Interviews', time: '2:00 PM' },
              { day: 'Fri', event: 'Payment Reconciliation', time: '11:00 AM' },
            ].map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-900">{w.day}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{w.event}</p>
                  <p className="text-[9px] text-slate-400"><Clock className="w-3 h-3 inline mr-0.5" />{w.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ADMISSIONS PANEL ─── */

function AdmissionsPanel() {
  const [allStudents, setAllStudents] = useState([
    { id: 's1', name: 'Kidus G.', email: 'kidus@email.com', phone: '+251-911-000001', program: 'Python Beginner', status: 'pending' as const, date: 'Today', avatar: 'KG' },
    { id: 's2', name: 'Hana M.', email: 'hana@email.com', phone: '+251-911-000002', program: 'Arduino Basics', status: 'completed' as const, date: 'Jul 3', avatar: 'HM' },
    { id: 's3', name: 'Yonas D.', email: 'yonas@email.com', phone: '+251-911-000003', program: 'VEX IQ', status: 'pending' as const, date: 'Jul 2', avatar: 'YD' },
    { id: 's4', name: 'Meklit A.', email: 'meklit@email.com', phone: '+251-911-000004', program: 'VEX V5', status: 'pending' as const, date: 'Jul 1', avatar: 'MA' },
    { id: 's5', name: 'Biruk T.', email: 'biruk@email.com', phone: '+251-911-000005', program: 'Python Beginner', status: 'completed' as const, date: 'Jun 29', avatar: 'BT' },
    { id: 's6', name: 'Tsion W.', email: 'tsion@email.com', phone: '+251-911-000006', program: 'Arduino Basics', status: 'completed' as const, date: 'Jun 27', avatar: 'TW' },
  ]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', program: 'Python Beginner' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = allStudents.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(s => s.id));
  };

  const bulkApprove = () => {
    setAllStudents(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, status: 'completed' as const } : s));
    setSelectedIds([]);
  };

  const handleSubmit = () => {
    setAllStudents(prev => [{ id: `s${Date.now()}`, name: `${form.first_name} ${form.last_name}`, email: form.email, phone: form.phone, program: form.program, status: 'pending', date: 'Today', avatar: `${form.first_name.charAt(0)}${form.last_name.charAt(0)}` }, ...prev]);
    setShowForm(false);
    setForm({ first_name: '', last_name: '', email: '', phone: '', program: 'Python Beginner' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Student Admissions</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Admission
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all capitalize ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-500" />
        </div>
        {selectedIds.length > 0 && (
          <button onClick={bulkApprove} className="flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll} className="rounded border-slate-300 accent-red-500" />
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Contact</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Program</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${s.status === 'pending' ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)}
                      className="rounded border-slate-300 accent-red-500" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">{s.avatar}</div>
                      <span className="text-sm font-medium text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500">{s.email}</span>
                      <span className="text-[10px] text-slate-400">{s.phone}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-700">{s.program}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 hidden sm:table-cell">{s.date}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      s.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.status === 'pending' && (
                      <button onClick={() => setAllStudents(prev => prev.map(x => x.id === s.id ? { ...x, status: 'completed' as const } : x))}
                        className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 transition-colors">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
          <span>{filtered.length} of {allStudents.length} students</span>
          <span className="text-amber-600 font-semibold">{allStudents.filter(s => s.status === 'pending').length} pending</span>
        </div>
      </div>

      {/* Admission Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Register New Student</h3>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">First Name *</label>
                      <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" placeholder="Kidus" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Last Name *</label>
                      <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" placeholder="G." />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Email *</label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" placeholder="kidus@email.com" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Phone</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" placeholder="+251-911-000001" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Program</label>
                    <select value={form.program} onChange={e => setForm(p => ({ ...p, program: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500">
                      <option>Python Beginner</option><option>Arduino Basics</option><option>VEX IQ</option><option>VEX V5</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSubmit} disabled={!form.first_name || !form.last_name || !form.email}
                    className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 shadow-sm">Create Student</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── ENROLLMENTS PANEL ─── */

function EnrollmentsPanel() {
  const allEnrollments = [
    { id: 'e1', student: 'Abebe K.', class: 'Python Group A', date: 'Jul 1, 2026', status: 'active' as const, fee: '2,500 ETB', term: 'Term 2' },
    { id: 'e2', student: 'Selam B.', class: 'Arduino Individual', date: 'Jun 28, 2026', status: 'active' as const, fee: '4,000 ETB', term: 'Term 2' },
    { id: 'e3', student: 'Yonas D.', class: 'VEX IQ Group', date: 'Jun 25, 2026', status: 'pending_payment' as const, fee: '3,500 ETB', term: 'Term 1' },
    { id: 'e4', student: 'Meklit A.', class: 'VEX V5 Advanced', date: 'Jun 22, 2026', status: 'active' as const, fee: '5,000 ETB', term: 'Term 2' },
    { id: 'e5', student: 'Biruk T.', class: 'Python Group B', date: 'Jun 20, 2026', status: 'pending_payment' as const, fee: '2,500 ETB', term: 'Term 2' },
  ];

  const [enrollments] = useState(allEnrollments);
  const [search, setSearch] = useState('');
  const [termFilter, setTermFilter] = useState<'all' | 'Term 1' | 'Term 2'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_payment'>('all');

  const filtered = enrollments.filter(e => {
    if (termFilter !== 'all' && e.term !== termFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search && !e.student.toLowerCase().includes(search.toLowerCase()) && !e.class.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalFees = filtered.reduce((sum, e) => sum + parseInt(e.fee.replace(/[^0-9]/g, '')), 0);
  const activeCount = filtered.filter(e => e.status === 'active').length;
  const pendingCount = filtered.filter(e => e.status === 'pending_payment').length;

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900">Enrollments</h2>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xl font-bold text-emerald-600">{enrollments.filter(e => e.status === 'active').length}</p>
          <p className="text-[10px] text-emerald-500 font-semibold">Active</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xl font-bold text-amber-600">{enrollments.filter(e => e.status === 'pending_payment').length}</p>
          <p className="text-[10px] text-amber-500 font-semibold">Pending Payment</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xl font-bold text-blue-600">{totalFees.toLocaleString()} ETB</p>
          <p className="text-[10px] text-blue-500 font-semibold">Total Fees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['all', 'Term 1', 'Term 2'] as const).map(t => (
            <button key={t} onClick={() => setTermFilter(t)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all ${termFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t === 'all' ? 'All Terms' : t}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['all', 'active', 'pending_payment'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all capitalize ${statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{s === 'all' ? 'All Status' : s.replace('_', ' ')}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or class..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Class</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Term</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Fee</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="w-14 px-4 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e, i) => {
                const statusLabel = e.status === 'active' ? 'Active' : 'Pending Payment';
                const statusColor = e.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{e.student}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{e.class}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{e.term}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{e.date}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 hidden md:table-cell">{e.fee}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span></td>
                    <td className="px-4 py-3">
                      <button className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No enrollments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
          <span>{filtered.length} enrollments · {activeCount} active · {pendingCount} pending payment</span>
          <span className="font-bold text-slate-900">{totalFees.toLocaleString()} ETB</span>
        </div>
      </div>
    </div>
  );
}

/* ─── PAYMENTS PANEL ─── */

function PaymentsPanel() {
  const [payments, setPayments] = useState([
    { id: 'p1', student: 'Abebe K.', amount: '2,500 ETB', method: 'Cash' as const, date: 'Jul 1, 2026', status: 'paid' as const, ref: 'RCPT-001' },
    { id: 'p2', student: 'Selam B.', amount: '4,000 ETB', method: 'Cash' as const, date: 'Jun 28, 2026', status: 'paid' as const, ref: 'RCPT-002' },
    { id: 'p3', student: 'Yonas D.', amount: '3,500 ETB', method: 'Bank Transfer' as const, date: 'Jun 25, 2026', status: 'pending' as const, ref: 'RCPT-003' },
    { id: 'p4', student: 'Meklit A.', amount: '5,000 ETB', method: 'Cash' as const, date: 'Jun 22, 2026', status: 'paid' as const, ref: 'RCPT-004' },
  ]);

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Cash' | 'Bank Transfer'>('all');
  const [showRecord, setShowRecord] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null);
  const [form, setForm] = useState({ student: '', amount: '' });

  const filtered = payments.filter(p => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (search && !p.student.toLowerCase().includes(search.toLowerCase()) && !p.ref.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCollected = filtered.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, '')), 0);
  const pendingTotal = filtered.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, '')), 0);

  const handleRecord = () => {
    if (!form.student || !form.amount) return;
    setPayments(prev => [{
      id: `p${Date.now()}`, student: form.student, amount: `${form.amount} ETB`, method: 'Cash',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'paid', ref: `RCPT-${String(prev.length + 1).padStart(3, '0')}`
    }, ...prev]);
    setForm({ student: '', amount: '' });
    setShowRecord(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Payments</h2>
        <button onClick={() => setShowRecord(true)} className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Record Cash Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-lg font-bold text-blue-600">{totalCollected.toLocaleString()} ETB</p>
          <p className="text-[10px] text-blue-500 font-semibold">Collected</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-lg font-bold text-amber-600">{pendingTotal.toLocaleString()} ETB</p>
          <p className="text-[10px] text-amber-500 font-semibold">Pending</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-lg font-bold text-emerald-600">{payments.filter(p => p.status === 'paid').length}</p>
          <p className="text-[10px] text-emerald-500 font-semibold">Paid</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-lg font-bold text-slate-600">{payments.length}</p>
          <p className="text-[10px] text-slate-500 font-semibold">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['all', 'Cash', 'Bank Transfer'] as const).map(m => (
            <button key={m} onClick={() => setMethodFilter(m)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all ${methodFilter === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {m === 'all' ? 'All Methods' : m}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or receipt..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Receipt</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Amount</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Method</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="w-14 px-4 py-2.5" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedPayment(p)}>
                  <td className="px-4 py-3 text-xs font-mono font-bold text-slate-500">{p.ref}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.student}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{p.amount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{p.method}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.date}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Printer className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
          <span>{filtered.length} payments</span>
          <span className="font-bold text-emerald-600">{totalCollected.toLocaleString()} ETB collected</span>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPayment(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white text-center">
                  <Receipt className="w-8 h-8 mx-auto mb-1" />
                  <h3 className="font-bold text-lg">Payment Receipt</h3>
                  <p className="text-xs text-white/70">{selectedPayment.ref}</p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Student</span><span className="font-bold text-slate-900">{selectedPayment.student}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Amount</span><span className="font-bold text-emerald-600">{selectedPayment.amount}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Method</span><span className="font-medium text-slate-900">{selectedPayment.method}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-medium text-slate-900">{selectedPayment.date}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><span className={`font-bold ${selectedPayment.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedPayment.status}</span></div>
                  <div className="border-t border-slate-100 pt-3 flex gap-2">
                    <button className="flex-1 bg-red-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button onClick={() => setSelectedPayment(null)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors">Close</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showRecord && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecord(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Record Cash Payment</h3>
                  <button onClick={() => setShowRecord(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Student Name *</label>
                    <input value={form.student} onChange={e => setForm(p => ({ ...p, student: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Abebe K." />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Amount (ETB) *</label>
                    <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" placeholder="e.g. 2500" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowRecord(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleRecord} disabled={!form.student || !form.amount}
                    className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 shadow-sm">Record Payment</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── CERTIFICATES PANEL ─── */

function CertificatesPanel() {
  const [certs] = useState([
    { id: 'c1', student: 'Abebe K.', program: 'Python Beginner', date: 'Jun 30, 2026', status: 'ready' as const, avatar: 'AK' },
    { id: 'c2', student: 'Selam B.', program: 'Arduino Basics', date: 'Jun 25, 2026', status: 'issued' as const, avatar: 'SB' },
    { id: 'c3', student: 'Yonas D.', program: 'VEX IQ', date: 'Jun 20, 2026', status: 'ready' as const, avatar: 'YD' },
    { id: 'c4', student: 'Meklit A.', program: 'VEX V5', date: 'Jun 15, 2026', status: 'issued' as const, avatar: 'MA' },
    { id: 'c5', student: 'Biruk T.', program: 'Python Beginner', date: 'Jun 10, 2026', status: 'ready' as const, avatar: 'BT' },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'issued'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewCert, setPreviewCert] = useState<typeof certs[0] | null>(null);

  const filtered = certs.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.student.toLowerCase().includes(search.toLowerCase()) && !c.program.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900">Issue Certificates</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xl font-bold text-amber-600">{certs.filter(c => c.status === 'ready').length}</p>
          <p className="text-[10px] text-amber-500 font-semibold">Ready to Issue</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xl font-bold text-emerald-600">{certs.filter(c => c.status === 'issued').length}</p>
          <p className="text-[10px] text-emerald-500 font-semibold">Issued</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xl font-bold text-blue-600">{certs.length}</p>
          <p className="text-[10px] text-blue-500 font-semibold">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['all', 'ready', 'issued'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all capitalize ${
                statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or program..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-500" />
        </div>
        {selectedIds.length > 0 && (
          <button className="flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors">
            <Award className="w-3.5 h-3.5" /> Issue ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(c => c.id))}
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  className="rounded border-slate-300 accent-red-500" />
              </th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Program</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)}
                      className="rounded border-slate-300 accent-red-500" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">{c.avatar}</div>
                      <span className="text-sm font-medium text-slate-900">{c.student}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-700">{c.program}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 hidden sm:table-cell">{c.date}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      c.status === 'ready' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {c.status === 'ready' ? (
                      <button onClick={() => setPreviewCert(c)}
                        className="text-[10px] font-bold text-white bg-red-500 px-2.5 py-1 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 mx-auto shadow-sm">
                        <Award className="w-3 h-3" /> Issue
                      </button>
                    ) : (
                      <button className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 mx-auto">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No certificates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      <AnimatePresence>
        {previewCert && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewCert(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
                <div className="border-4 border-red-500 m-4 rounded-xl p-6 text-center">
                  <Award className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <h3 className="font-bold text-lg text-slate-900">Certificate of Completion</h3>
                  <p className="text-xs text-slate-500 mt-1">This certifies that</p>
                  <p className="font-bold text-xl text-slate-900 my-2">{previewCert.student}</p>
                  <p className="text-xs text-slate-500">has successfully completed</p>
                  <p className="font-bold text-base text-red-500 my-1">{previewCert.program}</p>
                  <p className="text-[10px] text-slate-400 mt-2">Date: {previewCert.date}</p>
                </div>
                <div className="px-6 pb-4 flex gap-2">
                  <button className="flex-1 bg-red-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1 shadow-sm">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={() => setPreviewCert(null)} className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Close</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── REPORTS PANEL ─── */

function ReportsPanel() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'this-term' | 'custom'>('this-month');

  const reports = [
    { label: 'Student Roster', desc: 'All active students by program and grade level', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', count: '42 students' },
    { label: 'Enrollment Summary', desc: 'Current enrollment counts by program and term', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50', count: '6 programs' },
    { label: 'Payment Report', desc: 'Cash & online payment history with totals', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50', count: '128k ETB' },
    { label: 'Attendance Report', desc: 'Student attendance records by class and date', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50', count: '85% avg' },
    { label: 'Certificate Log', desc: 'All issued and pending certificates', icon: Award, color: 'text-red-500', bg: 'bg-red-50', count: '12 issued' },
    { label: 'Revenue Summary', desc: 'Monthly revenue breakdown by payment method', icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50', count: '42k ETB' },
    { label: 'Class Schedule', desc: 'Weekly class schedule with instructor assignments', icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50', count: '8 classes' },
    { label: 'Demographics', desc: 'Student distribution by grade, program, and branch', icon: PieChart, color: 'text-pink-500', bg: 'bg-pink-50', count: '3 branches' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Academic Reports</h2>
          <p className="text-xs text-slate-500">Generate and download reports from current data.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {([
            { value: 'this-month', label: 'This Month' },
            { value: 'last-month', label: 'Last Month' },
            { value: 'this-term', label: 'This Term' },
          ] as const).map(r => (
            <button key={r.value} onClick={() => setDateRange(r.value)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all ${
                dateRange === r.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reports.map((r, i) => {
          const RIcon = r.icon;
          return (
            <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedReport(selectedReport === r.label ? null : r.label)}
              className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer ${
                selectedReport === r.label ? 'border-red-300 shadow-sm ring-1 ring-red-200' : 'border-slate-200/60'
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center`}>
                  <RIcon className={`w-4 h-4 ${r.color}`} />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{r.count}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{r.label}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 mb-3">{r.desc}</p>
              <AnimatePresence>
                {selectedReport === r.label && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 pt-3 space-y-2 overflow-hidden">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Records</span>
                      <span className="font-bold text-slate-900">{r.count}</span>
                    </div>
                    <button className="w-full bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1 shadow-sm">
                      <Download className="w-3 h-3" /> Generate PDF
                    </button>
                    <button className="w-full bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
