import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserPlus, Users, DollarSign, Award, FileText, LayoutDashboard, RefreshCw, Shield, Calendar, Search, ArrowRightLeft } from 'lucide-react';
import { UserProfile } from '@/shared/types';
import { AppLayout } from '@/shared/ui/AppLayout';
import { NavItem } from '@/shared/ui/Sidebar';
import DashboardCommandCenter from '@/shared/ui/DashboardCommandCenter';
import InlineAlert from '@/shared/ui/InlineAlert';
import PermissionDenied from '@/shared/ui/PermissionDenied';
import AdminAccount from '@/domains/user/shared/ui/AdminAccount';
import RegistrationManager from '@/domains/competition/admin/RegistrationManager';
import TransferRequestsPanel from '@/domains/user/shared/ui/TransferRequestsPanel';
import {
  fetchEnrollmentsApi, fetchPaymentsApi, fetchStudentCertificatesApi,
  fetchCertificateTemplatesApi, fetchEnrollmentPeriodsApi,
} from '@/domains/learning/academics/api/academicApi';
import {
  getSecretaryCommandCenter,
  type SecretarySectionId,
  type SecretaryHubStats,
} from '../secretaryCommandCenter';

import Overview from './Overview';
import AdmissionsPanel from './AdmissionsPanel';
import EnrollmentsPanel from './EnrollmentsPanel';
import PaymentsPanel from './PaymentsPanel';
import ReportsPanel from './ReportsPanel';
import CertificateManager from '@/domains/user/shared/ui/CertificateManager';
import CertificateTemplateManager from './CertificateTemplateManager';
import EnrollmentPeriodsPanel from './EnrollmentPeriodsPanel';
import StudentDetailPanel from './StudentDetailPanel';

interface Props { currentUser: UserProfile; onLogout: () => void; }

/** Nav and hub stats use only APIs the Secretary role can access (backend permissions). */
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'admissions', label: 'Admissions', icon: UserPlus, group: 'admissions' },
  { id: 'students', label: 'Student Details', icon: Search, group: 'admissions' },
  { id: 'enrollments', label: 'Enrollments', icon: Users, group: 'admissions' },
  { id: 'transfers', label: 'Branch Transfers', icon: ArrowRightLeft, group: 'admissions' },
  { id: 'periods', label: 'Enrollment Periods', icon: Calendar, group: 'admissions' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'academic' },
  { id: 'templates', label: 'Cert. Templates', icon: Award, group: 'academic' },
  { id: 'payments', label: 'Payments', icon: DollarSign, group: 'finances' },
  { id: 'event-registrations', label: 'Event Registrations', icon: UserPlus, group: 'competition' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'reports' },
  { id: 'account', label: 'Account', icon: Shield, group: 'system' },
];

export default function SecretaryDashboard({ currentUser, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SecretarySectionId>('overview');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hubStats, setHubStats] = useState<SecretaryHubStats>({
    pendingPayments: 0,
    activeEnrollments: 0,
    todayPayments: 0,
    certificatesIssued: 0,
    templates: 0,
    periods: 0,
    loading: true,
  });

  const refreshSignals = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setHubStats(prev => ({ ...prev, loading: true }));

    Promise.allSettled([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchStudentCertificatesApi(),
      fetchCertificateTemplatesApi(),
      fetchEnrollmentPeriodsApi(),
    ]).then(([enr, pay, certs, templates, periods]) => {
      const enrollments = enr.status === 'fulfilled' && Array.isArray(enr.value) ? enr.value : [];
      const payments = pay.status === 'fulfilled' && Array.isArray(pay.value) ? pay.value : [];
      const certificates = certs.status === 'fulfilled' && Array.isArray(certs.value) ? certs.value : [];
      const tpl = templates.status === 'fulfilled' && Array.isArray(templates.value) ? templates.value : [];
      const per = periods.status === 'fulfilled' && Array.isArray(periods.value) ? periods.value : [];

      const coreFailed = enr.status === 'rejected' && pay.status === 'rejected';
      const partialCoreFailed = enr.status === 'rejected' || pay.status === 'rejected';

      if (coreFailed) {
        setLoadError('Unable to load dashboard data. Check your connection and try again.');
      } else if (partialCoreFailed) {
        setLoadError('Enrollment or payment data could not be loaded. Some figures may be incomplete.');
      }

      const today = new Date().toISOString().slice(0, 10);
      setHubStats({
        pendingPayments: enrollments.filter(e => e.status === 'PENDING_VERIFICATION').length,
        activeEnrollments: enrollments.filter(e => e.status === 'ACTIVE').length,
        todayPayments: payments.filter(p => p.payment_date?.startsWith(today)).length,
        certificatesIssued: certificates.length,
        templates: tpl.length,
        periods: per.length,
        loading: false,
      });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refreshSignals(); }, [refreshSignals]);

  const commandCenter = useMemo(
    () => getSecretaryCommandCenter(activeSection, hubStats),
    [activeSection, hubStats],
  );

  const renderPage = () => {
    switch (activeSection) {
      case 'overview': return <Overview />;
      case 'admissions': return <AdmissionsPanel currentUser={currentUser} />;
      case 'enrollments': return <EnrollmentsPanel currentUser={currentUser} />;
      case 'transfers': return <TransferRequestsPanel />;
      case 'payments': return <PaymentsPanel />;
      case 'certificates': return <CertificateManager currentUserRole={currentUser.role} />;
      case 'templates': return <CertificateTemplateManager />;
      case 'periods': return <EnrollmentPeriodsPanel currentUser={currentUser} />;
      case 'students': return <StudentDetailPanel />;
      case 'event-registrations': return <RegistrationManager />;
      case 'reports': return <ReportsPanel currentUser={currentUser} />;
      case 'account': return <AdminAccount currentUser={currentUser} />;
      default: return <PermissionDenied title="Section not found" message="This secretary section does not exist or is no longer available." />;
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label ?? '';

  return (
    <AppLayout
      sidebar={{
        items: NAV_ITEMS,
        activeSection,
        onSectionChange: (id) => setActiveSection(id as SecretarySectionId),
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
      {loadError && (
        <InlineAlert tone="warning" message={loadError} onRetry={refreshSignals} onDismiss={() => setLoadError(null)} />
      )}

      {commandCenter && (
        <DashboardCommandCenter
          title={commandCenter.title}
          subtitle={commandCenter.subtitle}
          signals={commandCenter.signals}
          loading={hubStats.loading}
        />
      )}
      {renderPage()}
    </AppLayout>
  );
}
