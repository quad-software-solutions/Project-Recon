import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X, Activity, FileText, UserPlus, Award } from 'lucide-react';
import type { Certificate, StudentCertificate, StudentProfile } from '@/shared/types';
import {
   fetchCertificateTemplatesApi, fetchSubProgramsApi, fetchStudentCertificatesApi,
   fetchStudentsApi,
 } from '@/domains/learning/academics/api/academicApi';

import OverviewTab from './components/OverviewTab';
import TemplatesTab from './components/TemplatesTab';
import IssueTab from './components/IssueTab';
import IssuedTab from './components/IssuedTab';

type TabId = 'overview' | 'templates' | 'issue' | 'issued';

interface SubProgram {
  id: string;
  name: string;
}

import type { UserProfile } from '@/shared/types';
import { canManageCertificates } from '@/shared/auth/permissions';

interface Props {
  currentUser?: UserProfile;
  /** @deprecated Use currentUser instead */
  currentUserRole?: string;
}

export default function CertificateManager({ currentUser, currentUserRole }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<StudentCertificate[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetchCertificateTemplatesApi(),
      fetchStudentCertificatesApi(),
      fetchStudentsApi(),
      fetchSubProgramsApi(),
    ]).then(([t, c, s, sp]) => {
      setTemplates(Array.isArray(t) ? t : []);
      setIssuedCerts(Array.isArray(c) ? c.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()) : []);
      setStudents(Array.isArray(s) ? s : []);
      setSubPrograms(Array.isArray(sp) ? sp : []);
    }).catch(() => setError('Failed to load certificate data')).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const canManage = currentUser
    ? canManageCertificates(currentUser)
    : !currentUserRole || currentUserRole === 'Admin' || currentUserRole === 'Manager' || currentUserRole === 'Secretary';

  const activeTemplates = templates.filter(t => t.is_active !== false);
  const recentCerts = issuedCerts.filter(c => new Date(c.issued_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const uniqueStudents = new Set(issuedCerts.map(c => c.student));

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'issue', label: 'Issue', icon: UserPlus },
    { id: 'issued', label: 'Issued', icon: Award },
  ];

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const TIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-brand-blue text-white' : 'text-slate-500 hover:text-brand-blue'
              }`}
            >
              <TIcon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              templates={templates} activeTemplates={activeTemplates}
              issuedCerts={issuedCerts} recentCerts={recentCerts}
              uniqueStudents={uniqueStudents.size} students={students}
            />
          )}
          {activeTab === 'templates' && (
            <TemplatesTab
              templates={templates} subPrograms={subPrograms}
              onRefresh={loadAll} canManage={canManage}
              onError={setError}
            />
          )}
          {activeTab === 'issue' && (
            <IssueTab
              templates={templates} students={students}
              onRefresh={loadAll} canManage={canManage}
              onError={setError}
            />
          )}
          {activeTab === 'issued' && (
            <IssuedTab
              issuedCerts={issuedCerts} loading={loading}
              onRefresh={loadAll}
            />
          )}
        </>
      )}
    </div>
  );
}
