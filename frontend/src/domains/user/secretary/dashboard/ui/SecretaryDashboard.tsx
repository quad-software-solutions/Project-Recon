import React, { useState, useEffect } from 'react';
import { UserPlus, Users, DollarSign, Award, FileText, LayoutDashboard, RefreshCw, Shield } from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import { AppLayout } from '@/src/shared/ui/AppLayout';
import { NavItem } from '@/src/shared/ui/Sidebar';
import DashboardCommandCenter from '@/src/shared/ui/DashboardCommandCenter';
import AdminAccount from '@/src/domains/user/shared/ui/AdminAccount';
import { fetchEnrollmentsApi, fetchPaymentsApi, fetchStudentCertificatesApi } from '@/src/domains/learning/academics/api/academicApi';

import Overview from './Overview';
import AdmissionsPanel from './AdmissionsPanel';
import EnrollmentsPanel from './EnrollmentsPanel';
import PaymentsPanel from './PaymentsPanel';
import CertificatesPanel from './CertificatesPanel';
import ReportsPanel from './ReportsPanel';

interface Props { currentUser: UserProfile; onLogout: () => void; }

type SectionId = 'overview' | 'admissions' | 'enrollments' | 'payments' | 'certificates' | 'reports' | 'account';

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'admissions', label: 'Admissions', icon: UserPlus, group: 'main' },
  { id: 'enrollments', label: 'Enrollments', icon: Users, group: 'main' },
  { id: 'payments', label: 'Payments', icon: DollarSign, group: 'main' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'main' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'main' },
  { id: 'account', label: 'Account', icon: Shield, group: 'system' },
];

export default function SecretaryDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState([
    { label: 'Pending Payments', value: '—', detail: 'loading...', icon: UserPlus, tone: 'amber' as const },
    { label: 'Active Enrollments', value: '—', detail: 'loading...', icon: Users, tone: 'emerald' as const },
    { label: 'Today\'s Payments', value: '—', detail: 'loading...', icon: DollarSign, tone: 'blue' as const },
    { label: 'Certificates', value: '—', detail: 'loading...', icon: Award, tone: 'emerald' as const },
  ]);

  const refreshSignals = () => {
    setLoading(true);
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
    }).catch(() => {}).finally(() => setLoading(false));
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
      case 'account': return <AdminAccount currentUser={currentUser} />;
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
        actions: (
          <button onClick={refreshSignals} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        ),
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
