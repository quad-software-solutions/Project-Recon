import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus, Users, DollarSign, Award, FileText, LayoutDashboard, LogOut,
  Plus, Search, X, CheckCircle2, Loader2, Calendar, Mail, Phone, MapPin,
  CreditCard, Printer, Download, Eye, User, BookOpen, Shield, AlertCircle, Check
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
          { label: 'Today\'s Payments', value: '2', detail: 'cash recorded', icon: DollarSign, tone: 'blue' },
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
    { name: 'Kidus G.', program: 'Python Beginner', date: 'Today', status: 'pending' as const },
    { name: 'Selam B.', program: 'Arduino Basics', date: 'Yesterday', status: 'completed' as const },
    { name: 'Yonas D.', program: 'VEX IQ', date: 'Jul 3', status: 'completed' as const },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-brand-red" /> Recent Admissions
          </h3>
          <div className="space-y-2">
            {recentAdmissions.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-black text-xs">{a.name.charAt(0)}</div>
                  <div><p className="text-sm font-semibold text-slate-900">{a.name}</p><p className="text-[10px] text-slate-500">{a.program}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{a.date}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-brand-red" /> Today's Cash Payments
          </h3>
          <div className="text-center py-6 text-slate-400">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No payments recorded today</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="bg-gradient-to-br from-brand-red to-brand-red-dark rounded-2xl p-5 text-white">
          <Shield className="w-6 h-6 text-white/70 mb-2" />
          <p className="text-xs text-white/70">Your Branch</p>
          <p className="font-bold text-lg">Bole Academy</p>
          <p className="text-[10px] text-white/60 mt-1">Secretary · Academic Operations</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-brand-red" />Quick Actions</h4>
          <div className="space-y-1.5">
            {[
              { label: 'New Admission', icon: UserPlus, color: 'text-brand-red' },
              { label: 'Record Payment', icon: DollarSign, color: 'text-emerald-600' },
              { label: 'Issue Certificate', icon: Award, color: 'text-amber-600' },
            ].map((a, i) => {
              const AIcon = a.icon;
              return (
                <button key={i} className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  <AIcon className={`w-3.5 h-3.5 ${a.color}`} />{a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ADMISSIONS PANEL ─── */

function AdmissionsPanel() {
  const [students] = useState([
    { id: 's1', name: 'Kidus G.', email: 'kidus@email.com', phone: '+251-911-000001', program: 'Python Beginner', status: 'pending' as const, date: 'Today' },
    { id: 's2', name: 'Hana M.', email: 'hana@email.com', phone: '+251-911-000002', program: 'Arduino Basics', status: 'completed' as const, date: 'Jul 3' },
    { id: 's3', name: 'Yonas D.', email: 'yonas@email.com', phone: '+251-911-000003', program: 'VEX IQ', status: 'pending' as const, date: 'Jul 2' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', program: 'Python Beginner' });

  const handleSubmit = () => {
    setShowForm(false);
    setForm({ first_name: '', last_name: '', email: '', phone: '', program: 'Python Beginner' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Student Admissions</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Admission
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Program</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{s.name.charAt(0)}</div><span className="text-sm font-medium text-slate-900">{s.name}</span></div></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-500">{s.email}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-700">{s.program}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{s.date}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Register New Student</h3>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">First Name</label><input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="Kidus" /></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Last Name</label><input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="G." /></div>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Email</label><input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="kidus@email.com" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="+251-911-000001" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Program</label>
                    <select value={form.program} onChange={e => setForm(p => ({ ...p, program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option>Python Beginner</option><option>Arduino Basics</option><option>VEX IQ</option><option>VEX V5</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSubmit} disabled={!form.first_name || !form.last_name || !form.email}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">Create Student</button>
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
  const [enrollments] = useState([
    { id: 'e1', student: 'Abebe K.', class: 'Python Group A', date: 'Jul 1, 2026', status: 'active' as const, fee: '2,500 ETB' },
    { id: 'e2', student: 'Selam B.', class: 'Arduino Individual', date: 'Jun 28, 2026', status: 'active' as const, fee: '4,000 ETB' },
    { id: 'e3', student: 'Yonas D.', class: 'VEX IQ Group', date: 'Jun 25, 2026', status: 'pending_payment' as const, fee: '3,500 ETB' },
  ]);

  const statusBadge = (s: string) => {
    if (s === 'active') return 'bg-emerald-100 text-emerald-700';
    if (s === 'pending_payment') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900">Enrollments</h2>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Class</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Fee</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{e.student}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{e.class}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{e.date}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-900 hidden md:table-cell">{e.fee}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(e.status)}`}>{e.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── PAYMENTS PANEL ─── */

function PaymentsPanel() {
  const [payments, setPayments] = useState([
    { id: 'p1', student: 'Abebe K.', amount: '2,500 ETB', method: 'Cash' as const, date: 'Jul 1, 2026', status: 'paid' as const },
    { id: 'p2', student: 'Selam B.', amount: '4,000 ETB', method: 'Cash' as const, date: 'Jun 28, 2026', status: 'paid' as const },
  ]);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({ student: '', amount: '' });

  const handleRecord = () => {
    if (!form.student || !form.amount) return;
    setPayments(prev => [{ id: `p${Date.now()}`, student: form.student, amount: `${form.amount} ETB`, method: 'Cash', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'paid' }, ...prev]);
    setForm({ student: '', amount: '' });
    setShowRecord(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">In-Person Payments</h2>
        <button onClick={() => setShowRecord(true)} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Record Cash Payment
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Amount</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Method</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.student}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{p.amount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{p.method}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.date}</td>
                  <td className="px-4 py-3 text-center"><span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Paid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showRecord && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRecord(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Record Cash Payment</h3>
                  <button onClick={() => setShowRecord(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Student Name</label><input value={form.student} onChange={e => setForm(p => ({ ...p, student: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. Abebe K." /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Amount (ETB)</label><input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. 2500" /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowRecord(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleRecord} disabled={!form.student || !form.amount}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">Record Payment</button>
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
    { id: 'c1', student: 'Abebe K.', program: 'Python Beginner', date: 'Jun 30, 2026', status: 'ready' as const },
    { id: 'c2', student: 'Selam B.', program: 'Arduino Basics', date: 'Jun 25, 2026', status: 'issued' as const },
  ]);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900">Issue Certificates</h2>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Program</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {certs.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.student}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{c.program}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{c.date}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'ready' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.status}</span></td>
                  <td className="px-4 py-3 text-center">
                    {c.status === 'ready' ? (
                      <button className="text-[10px] font-bold text-white bg-brand-red px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 mx-auto"><Award className="w-3 h-3" /> Issue</button>
                    ) : (
                      <button className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 mx-auto"><Download className="w-3 h-3" /> PDF</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── REPORTS PANEL ─── */

function ReportsPanel() {
  const reports = [
    { label: 'Student Roster', desc: 'All active students by program', icon: Users },
    { label: 'Enrollment Summary', desc: 'Current enrollment counts', icon: BookOpen },
    { label: 'Payment Report', desc: 'Cash & online payment history', icon: DollarSign },
    { label: 'Attendance Report', desc: 'Student attendance records', icon: Calendar },
    { label: 'Certificate Log', desc: 'All issued certificates', icon: Award },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900">Academic Reports</h2>
      <p className="text-xs text-slate-500">Reports are generated dynamically from current data.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {reports.map((r, i) => {
          const RIcon = r.icon;
          return (
            <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-red/5 flex items-center justify-center mb-2">
                <RIcon className="w-4 h-4 text-brand-red" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{r.label}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
              <button className="mt-3 text-[10px] font-bold text-brand-red bg-brand-red/5 px-2 py-1 rounded-lg hover:bg-brand-red/10 transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> Generate PDF
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
