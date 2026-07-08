import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus, Users, DollarSign, Award, FileText, LayoutDashboard, LogOut,
  Plus, Search, X, CheckCircle2, Loader2, Calendar, Mail, Phone, MapPin,
  CreditCard, Printer, Download, Eye, User, BookOpen, Shield, AlertCircle, Check, Settings,
  RefreshCw, Filter, Edit3
} from 'lucide-react';
import { UserProfile, Enrollment, EnrollmentPayment, StudentCertificate, StudentProfile, AcademicClass, Certificate } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import AccountSettings from '@/src/shared/ui/AccountSettings';
import ProfileOverview from '@/src/domains/user/student/dashboard/ui/ProfileOverview';
import {
  fetchEnrollmentsApi, cancelEnrollmentApi, completeEnrollmentApi,
  fetchPaymentsApi,
  fetchStudentCertificatesApi, fetchStudentsApi, searchStudentsApi,
  fetchClassesApi, enrollStudentApi, admitStudentApi,
  fetchCertificateTemplatesApi, issueStudentCertificateApi,
  createCashPaymentApi,
  downloadStudentReportPdf, downloadEnrollmentReportPdf,
  downloadAttendanceReportPdf, downloadProgressReportPdf,
  downloadCertificateReportPdf, downloadClassReportPdf,
  downloadSubProgramReportPdf, downloadProgramReportPdf
} from '@/src/domains/learning/academics/api/academicApi';


interface Props { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'overview' | 'admissions' | 'enrollments' | 'payments' | 'certificates' | 'reports' | 'profile' | 'settings';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'admissions', label: 'Admissions', icon: UserPlus, group: 'main' },
  { id: 'enrollments', label: 'Enrollments', icon: Users, group: 'main' },
  { id: 'payments', label: 'Payments', icon: DollarSign, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'main' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'main' },
  { id: 'profile', label: 'My Profile', icon: User, group: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'system' },
];

export default function SecretaryDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [signals, setSignals] = useState([
    { label: 'Pending Payments', value: '—', detail: 'loading...', icon: UserPlus, tone: 'amber' as const },
    { label: 'Active Enrollments', value: '—', detail: 'loading...', icon: Users, tone: 'emerald' as const },
    { label: 'Today\'s Payments', value: '—', detail: 'loading...', icon: DollarSign, tone: 'blue' as const },
    { label: 'Certificates', value: '—', detail: 'loading...', icon: Award, tone: 'emerald' as const },
  ]);

  const refreshSignals = () => {
    Promise.all([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchStudentCertificatesApi(),
    ]).then(([enr, pay, certs]) => {
      const enrollments = Array.isArray(enr) ? enr : [];
      const payments = Array.isArray(pay) ? pay : [];
      const certificates = Array.isArray(certs) ? certs : [];
      const active = enrollments.filter(e => e.status === 'ACTIVE');
      const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
      const todayPay = payments.filter(p =>
        p.payment_date?.startsWith(new Date().toISOString().slice(0, 10))
      );
      setSignals([
        { label: 'Pending Payments', value: String(pendingEnrollments.length), detail: 'awaiting payment', icon: UserPlus, tone: 'amber' },
        { label: 'Active Enrollments', value: String(active.length), detail: 'current students', icon: Users, tone: 'emerald' },
        { label: 'Today\'s Payments', value: String(todayPay.length), detail: 'recorded today', icon: DollarSign, tone: 'blue' },
        { label: 'Certificates Issued', value: String(certificates.length), detail: 'total issued', icon: Award, tone: 'emerald' },
      ]);
    }).catch(() => {});
  };

  useEffect(() => { refreshSignals(); }, []);

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <Overview />;
      case 'admissions': return <AdmissionsPanel />;
      case 'enrollments': return <EnrollmentsPanel />;
      case 'payments': return <PaymentsPanel />;
      case 'certificates': return <CertificatesPanel />;
      case 'reports': return <ReportsPanel />;
      case 'profile': return <ProfileOverview currentUser={currentUser} />;
      case 'settings': return <AccountSettings />;
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
      topNavbar={{
        title: activeLabel,
        subtitle: 'Secretary Dashboard',
        actions: activeSection !== 'overview' ? (
          <button onClick={refreshSignals} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        ) : undefined,
      }}
      onLogout={onLogout}
    >
      <DashboardCommandCenter
        title="Secretary Command Center"
        subtitle="Student admissions, enrollments, payments, certificates, and reports."
        signals={signals}
      />
      {renderPage()}
    </AppLayout>
  );
}

/* ─── OVERVIEW ─── */

function Overview() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [certs, setCerts] = useState<StudentCertificate[]>([]);

  useEffect(() => {
    Promise.all([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchStudentsApi(),
      fetchStudentCertificatesApi(),
    ]).then(([enr, pay, stu, cer]) => {
      setEnrollments(Array.isArray(enr) ? enr : []);
      setPayments(Array.isArray(pay) ? pay : []);
      setStudents(Array.isArray(stu) ? stu : []);
      setCerts(Array.isArray(cer) ? cer : []);
    }).catch(() => {});
  }, []);

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingPayments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');

  const statCards = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Enrollments', value: activeEnrollments.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Payments', value: pendingPayments.length, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Certificates Issued', value: certs.length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${s.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-red" /> Recent Enrollments
            </h3>
            {enrollments.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No enrollments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {enrollments.slice(0, 6).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-black text-xs">
                        {(e.student_name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{e.student_name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{e.class_name || e.sub_program_name || '—'}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : e.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {e.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-brand-red" /> Recent Payments
            </h3>
            {payments.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.student_name || 'Student'}</p>
                      <p className="text-[10px] text-slate-500">{p.payment_date?.slice(0, 10) || '—'} · {p.payment_method}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{Number(p.amount).toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-brand-red to-brand-red-dark rounded-2xl p-5 text-white">
            <Shield className="w-6 h-6 text-white/70 mb-2" />
            <p className="text-xs text-white/70">Your Role</p>
            <p className="font-bold text-lg">Secretary</p>
            <p className="text-[10px] text-white/60 mt-1">Academic Operations</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-brand-red" />Today's Summary</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">New Admissions</span><span className="font-semibold">{students.filter(s => (s.created_at || '')?.startsWith(new Date().toISOString().slice(0, 10))).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payments Today</span><span className="font-semibold">{payments.filter(p => p.payment_date?.startsWith(new Date().toISOString().slice(0, 10))).length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Active Classes</span><span className="font-semibold">{new Set(enrollments.filter(e => e.status === 'ACTIVE').map(e => e.class_name)).size}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Certificates Today</span><span className="font-semibold">{certs.filter(c => c.issued_at?.startsWith(new Date().toISOString().slice(0, 10))).length}</span></div>
            </div>
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
    </div>
  );
}

/* ─── ADMISSIONS PANEL ─── */

function AdmissionsPanel() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '',
    branch: '', guardian_name: '', guardian_phone: '', guardian_email: '',
  });

  useEffect(() => {
    fetchClassesApi().then(classes => {
      const map = new Map<string, string>();
      classes.forEach(c => { if (c.branch && c.branch_name) map.set(c.branch, c.branch_name); });
      const list = Array.from(map, ([id, name]) => ({ id, name }));
      setBranches(list);
      if (list.length > 0 && !form.branch) setForm(p => ({ ...p, branch: list[0].id }));
    }).catch(() => {});
  }, []);

  const loadStudents = () => {
    setLoading(true);
    fetchStudentsApi().then(res => {
      setStudents(Array.isArray(res) ? res : []);
    }).catch(() => setError('Failed to load students')).finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.branch) return;
    setSubmitting(true);
    setError(null);
    try {
      await admitStudentApi(form);
      loadStudents();
      setForm(prev => ({
        first_name: '', last_name: '', email: '', phone_number: '', password: '',
        branch: prev.branch, guardian_name: '', guardian_phone: '', guardian_email: '',
      }));
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to admit student');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = searchQuery.trim()
    ? students.filter(s =>
        `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Student Admissions</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors self-start">
          <Plus className="w-3.5 h-3.5" /> New Admission
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search students by name or email..." 
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Branch</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No students matching your search' : 'No students found'}
                </td></tr>
              ) : filtered.map(s => {
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{name.charAt(0)}</div><span className="text-sm font-medium text-slate-900">{name}</span></div></td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-500">{s.email}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-700">{s.branch_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{(s.created_at || s.date_joined)?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.is_active ? 'active' : 'pending'}</span></td>
                  </tr>
                );
              })}
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
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Phone</label><input value={form.phone_number} onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="+251-911-000001" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Temporary Password</label><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="Set login password" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Branch</label>
                    <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Guardian Name</label><input value={form.guardian_name} onChange={e => setForm(p => ({ ...p, guardian_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="Parent or guardian" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Guardian Phone</label><input value={form.guardian_phone} onChange={e => setForm(p => ({ ...p, guardian_phone: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="+251..." /></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Guardian Email</label><input value={form.guardian_email} onChange={e => setForm(p => ({ ...p, guardian_email: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="parent@email.com" /></div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSubmit} disabled={!form.first_name || !form.last_name || !form.email || !form.password || !form.branch || submitting}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {submitting ? 'Creating...' : 'Create Student'}
                  </button>
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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ student: '', enrolled_class: '', remarks: '' });

  useEffect(() => {
    Promise.all([
      fetchEnrollmentsApi(),
      fetchStudentsApi(),
      fetchClassesApi(),
    ]).then(([enrollmentRes, studentRes, classRes]) => {
      const studentList = Array.isArray(studentRes) ? studentRes : [];
      const classList = (Array.isArray(classRes) ? classRes : []).filter(c => c.is_active !== false);
      setEnrollments(Array.isArray(enrollmentRes) ? enrollmentRes : []);
      setStudents(studentList);
      setClasses(classList);
      setForm(prev => ({
        ...prev,
        student: prev.student || studentList[0]?.id || '',
        enrolled_class: prev.enrolled_class || classList[0]?.id || '',
      }));
    }).catch(() => setError('Failed to load enrollment data')).finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    if (s === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
    if (s === 'PENDING_PAYMENT') return 'bg-amber-100 text-amber-700';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-600';
    if (s === 'COMPLETED') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
  };

  const handleCancel = async (id: string) => {
    try { await cancelEnrollmentApi(id); setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'CANCELLED' as any } : e)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to cancel enrollment'); }
  };

  const handleComplete = async (id: string) => {
    try { await completeEnrollmentApi(id); setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'COMPLETED' as any } : e)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to complete enrollment'); }
  };

  const handleEnroll = async () => {
    if (!form.student || !form.enrolled_class) return;
    setSubmitting(true);
    setError(null);
    try {
      const enrollment = await enrollStudentApi(form);
      setEnrollments(prev => [enrollment, ...prev]);
      setForm(prev => ({ ...prev, remarks: '' }));
      setShowEnroll(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = enrollments.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${e.student_name || ''} ${e.class_name || ''} ${e.sub_program_name || ''}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Enrollments</h2>
        <button onClick={() => setShowEnroll(true)} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors self-start">
          <Plus className="w-3.5 h-3.5" /> Enroll Student
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search enrollments..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Class</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">No enrollments found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{e.student_name || e.student_email || 'Unknown'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{e.class_name || e.sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{e.enrolled_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(e.status)}`}>{e.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(e)} className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50" title="View details"><Eye className="w-3.5 h-3.5" /></button>
                      {e.status === 'ACTIVE' && (
                        <button onClick={() => handleComplete(e.id)} className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50" title="Mark completed"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                      )}
                      {(e.status === 'ACTIVE' || e.status === 'PENDING_PAYMENT') && (
                        <button onClick={() => handleCancel(e.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Cancel enrollment"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">{selected.student_name || 'Enrollment'}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-medium">{selected.student_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{selected.student_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Class</span><span>{selected.class_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Program</span><span>{selected.program_name || selected.sub_program_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Branch</span><span>{selected.branch_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Enrolled</span><span>{selected.enrolled_at?.slice(0, 10) || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(selected.status)}`}>{selected.status?.replace('_', ' ')}</span></div>
              {selected.payment_status && <div className="flex justify-between"><span className="text-slate-500">Payment</span><span>{selected.payment_status}</span></div>}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showEnroll && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnroll(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Enroll Student</h3>
                  <button onClick={() => setShowEnroll(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Student</label>
                    <select value={form.student} onChange={e => setForm(p => ({ ...p, student: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select student...</option>
                      {students.map(s => {
                        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                        return <option key={s.id} value={s.id}>{name}</option>;
                      })}
                    </select>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Class</label>
                    <select value={form.enrolled_class} onChange={e => setForm(p => ({ ...p, enrolled_class: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select class...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {c.sub_program_name || 'Program'} · {c.branch_name || 'Branch'}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Remarks</label><input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="Optional note" /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowEnroll(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleEnroll} disabled={submitting || !form.student || !form.enrolled_class}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">{submitting ? 'Enrolling...' : 'Enroll'}</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── PAYMENTS PANEL ─── */

function PaymentsPanel() {
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ enrollment: '', amount: '' });
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchPaymentsApi(),
      fetchEnrollmentsApi(),
    ]).then(([pay, enr]) => {
      setPayments(Array.isArray(pay) ? pay : []);
      setEnrollments(Array.isArray(enr) ? enr.filter(e => e.status === 'ACTIVE' || e.status === 'PENDING_PAYMENT') : []);
    }).catch(() => setError('Failed to load payments')).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleRecord = async () => {
    if (!form.enrollment || !form.amount) return;
    try {
      await createCashPaymentApi({ enrollment: form.enrollment, amount: form.amount });
      setForm({ enrollment: '', amount: '' });
      setShowRecord(false);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment');
    }
  };

  const filtered = searchQuery.trim()
    ? payments.filter(p =>
        `${p.student_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : payments;

  const totalAmount = filtered.reduce((sum, p) => sum + (p.status === 'PAID' ? Number(p.amount) : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">In-Person Payments</h2>
        <button onClick={() => setShowRecord(true)} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors self-start">
          <Plus className="w-3.5 h-3.5" /> Record Cash Payment
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-200 rounded-xl p-3"><p className="text-lg font-bold text-slate-900">{payments.length}</p><p className="text-[10px] text-slate-500">Total Transactions</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-3"><p className="text-lg font-bold text-emerald-600">{totalAmount.toLocaleString()} ETB</p><p className="text-[10px] text-slate-500">Total Collected</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-3"><p className="text-lg font-bold text-blue-600">{payments.filter(p => p.payment_method === 'CASH').length}</p><p className="text-[10px] text-slate-500">Cash Payments</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-3"><p className="text-lg font-bold text-amber-600">{payments.filter(p => p.status !== 'PAID').length}</p><p className="text-[10px] text-slate-500">Pending</p></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by student name..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
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
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">No payments found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.student_name || p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{Number(p.amount).toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{p.payment_method}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.payment_date?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span></td>
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
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Enrollment</label>
                    <select value={form.enrollment} onChange={e => setForm(p => ({ ...p, enrollment: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select enrollment...</option>
                      {enrollments.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.student_name || e.student_email || 'Unknown'} — {e.class_name || e.sub_program_name || 'Class'} ({e.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Amount (ETB)</label><input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. 2500" /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowRecord(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleRecord} disabled={!form.enrollment || !form.amount}
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
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ student: '', certificate: '' });

  useEffect(() => {
    Promise.all([
      fetchStudentCertificatesApi(),
      fetchStudentsApi(),
      fetchCertificateTemplatesApi(),
    ]).then(([certRes, studentRes, templateRes]) => {
      const studentList = Array.isArray(studentRes) ? studentRes : [];
      const templateList = Array.isArray(templateRes) ? templateRes : [];
      setCerts(Array.isArray(certRes) ? certRes : []);
      setStudents(studentList);
      setTemplates(templateList.filter(t => t.is_active !== false));
      setForm({
        student: studentList[0]?.id || '',
        certificate: templateList.find(t => t.is_active !== false)?.id || '',
      });
    }).catch(() => setError('Failed to load certificates')).finally(() => setLoading(false));
  }, []);

  const handleIssue = async () => {
    if (!form.student || !form.certificate) return;
    setSubmitting(true);
    setError(null);
    try {
      const issued = await issueStudentCertificateApi(form);
      setCerts(prev => [issued, ...prev]);
      setShowIssue(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue certificate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Student Certificates</h2>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <button onClick={() => setShowIssue(true)} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Issue Certificate
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Certificate</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Number</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">No certificates issued yet</td></tr>
              ) : certs.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.student_name || c.student?.slice(0, 8) || 'Student'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{c.certificate_title || 'Certificate'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{c.issued_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center"><span className="text-[10px] font-mono text-slate-500">{c.certificate_number}</span></td>
                  <td className="px-4 py-3 text-center">
                    {c.pdf ? (
                      <a href={c.pdf} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 mx-auto w-fit">
                        <Download className="w-3 h-3" /> PDF
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showIssue && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIssue(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Issue Certificate</h3>
                  <button onClick={() => setShowIssue(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Student</label>
                    <select value={form.student} onChange={e => setForm(p => ({ ...p, student: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select student...</option>
                      {students.map(s => {
                        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                        return <option key={s.id} value={s.id}>{name}</option>;
                      })}
                    </select>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Certificate Template</label>
                    <select value={form.certificate} onChange={e => setForm(p => ({ ...p, certificate: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select template...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowIssue(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleIssue} disabled={submitting || !form.student || !form.certificate}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50">{submitting ? 'Issuing...' : 'Issue'}</button>
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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchStudentsApi(),
      fetchStudentCertificatesApi(),
    ]).then(([enr, pay, stu, cer]) => {
      setEnrollments(Array.isArray(enr) ? enr : []);
      setPayments(Array.isArray(pay) ? pay : []);
      setStudents(Array.isArray(stu) ? stu : []);
      setCerts(Array.isArray(cer) ? cer : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const activeStudents = students.filter(s => s.is_active);
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
  const cashPayments = payments.filter(p => p.payment_method === 'CASH');

  const doDownload = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    try { await fn(); } catch {}
    setTimeout(() => setDownloading(null), 1000);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const reportCards = [
    {
      key: 'students', label: 'Student Roster', icon: Users,
      stats: [
        { label: 'Total', value: students.length, color: 'text-blue-600' },
        { label: 'Active', value: activeStudents.length, color: 'text-emerald-600' },
        { label: 'Inactive', value: students.length - activeStudents.length, color: 'text-slate-500' },
      ],
      download: () => students[0] && doDownload('students', () => downloadStudentReportPdf(students[0].id)),
    },
    {
      key: 'enrollments', label: 'Enrollment Summary', icon: BookOpen,
      stats: [
        { label: 'Total', value: enrollments.length, color: 'text-blue-600' },
        { label: 'Active', value: activeEnrollments.length, color: 'text-emerald-600' },
        { label: 'Pending', value: pendingEnrollments.length, color: 'text-amber-600' },
        { label: 'Completed', value: completedEnrollments.length, color: 'text-purple-600' },
      ],
      download: () => doDownload('enrollments', () => downloadEnrollmentReportPdf(students[0]?.id)),
    },
    {
      key: 'payments', label: 'Payment Report', icon: DollarSign,
      stats: [
        { label: 'Total Collected', value: `${totalPaid.toLocaleString()} ETB`, color: 'text-emerald-600' },
        { label: 'Transactions', value: payments.length, color: 'text-blue-600' },
        { label: 'Cash', value: cashPayments.length, color: 'text-amber-600' },
        { label: 'Paid', value: payments.filter(p => p.status === 'PAID').length, color: 'text-emerald-600' },
      ],
      download: () => doDownload('payments', () => downloadEnrollmentReportPdf(students[0]?.id)),
    },
    {
      key: 'certificates', label: 'Certificate Log', icon: Award,
      stats: [
        { label: 'Total Issued', value: certs.length, color: 'text-purple-600' },
        { label: 'Last Issued', value: certs[0]?.issued_at?.slice(0, 10) || '—', color: 'text-slate-600' },
      ],
      download: () => doDownload('certificates', () => downloadCertificateReportPdf(students[0]?.id)),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Academic Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time summaries with PDF export</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((r, i) => {
          const RIcon = r.icon;
          const isDl = downloading === r.key;
          return (
            <motion.div key={r.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-red/5 flex items-center justify-center">
                  <RIcon className="w-5 h-5 text-brand-red" />
                </div>
                <button onClick={r.download} disabled={isDl || students.length === 0}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-red bg-brand-red/10 px-2.5 py-1.5 rounded-lg hover:bg-brand-red/20 disabled:opacity-50 transition-colors"
                >
                  <Download className={`w-3 h-3 ${isDl ? 'animate-bounce' : ''}`} />
                  {isDl ? 'Downloading...' : 'PDF'}
                </button>
              </div>
              <h3 className="font-bold text-base text-slate-900">{r.label}</h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {r.stats.map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">Recent Enrollments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Class</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">No enrollments</td></tr>
              ) : enrollments.slice(0, 10).map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{e.student_name || e.student_email || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{e.class_name || e.sub_program_name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 hidden sm:table-cell">{e.enrolled_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : e.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' : e.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {e.status.replace('_', ' ')}
                    </span>
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
