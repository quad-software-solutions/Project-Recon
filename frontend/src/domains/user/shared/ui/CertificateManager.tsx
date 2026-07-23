import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, AlertCircle, X, Activity, FileText, UserPlus, Award,
  CheckCircle2, RefreshCw, ShieldCheck,
} from 'lucide-react';
import type { Certificate, StudentCertificate, StudentProfile } from '@/shared/types';
import {
  fetchCertificateTemplatesApi, fetchSubProgramsApi, fetchStudentCertificatesApi,
  fetchStudentsApi, verifyCertificateApi,
} from '@/domains/learning/academics/api/academicApi';
import OverviewTab from './components/OverviewTab';
import TemplatesTab from './components/TemplatesTab';
import IssueTab from './components/IssueTab';
import IssuedTab from './components/IssuedTab';
import type { UserProfile } from '@/shared/types';
import { canManageCertificates } from '@/shared/auth/permissions';
import { formatApiError } from '@/shared/utils/formatApiError';
import { AdminOfflineBanner, AdminQueryLoading } from './adminQueryState';

type TabId = 'overview' | 'templates' | 'issue' | 'issued' | 'verify';

interface SubProgram {
  id: string;
  name: string;
}

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
  const [success, setSuccess] = useState<string | null>(null);
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyResult, setVerifyResult] = useState<Record<string, unknown> | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const canManage = currentUser
    ? canManageCertificates(currentUser)
    : !currentUserRole || currentUserRole === 'Admin' || currentUserRole === 'Manager' || currentUserRole === 'Secretary';

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(null);
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
    }).catch((e) => setError(formatApiError(e) || 'Failed to load certificate data')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const flashSuccess = (msg: string) => setSuccess(msg);

  const handleVerify = async () => {
    const number = verifyNumber.trim();
    if (!number) return;
    setVerifyBusy(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const res = await verifyCertificateApi(number);
      setVerifyResult(res && typeof res === 'object' ? res : { valid: true });
    } catch (e) {
      setVerifyError(formatApiError(e) || 'Certificate not found or invalid.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const activeTemplates = templates.filter(t => t.is_active !== false);
  const recentCerts = issuedCerts.filter(c => new Date(c.issued_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const uniqueStudents = new Set(issuedCerts.map(c => c.student));

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'templates', label: 'Templates', icon: FileText, count: templates.length },
    { id: 'issue', label: 'Issue', icon: UserPlus },
    { id: 'issued', label: 'Issued', icon: Award, count: issuedCerts.length },
    { id: 'verify', label: 'Verify', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col gap-5">
      <AdminOfflineBanner />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Certificate Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Templates, issuance, and verification — powered by academic certificate APIs.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!canManage && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          View-only access. Issuing and editing templates require certificate management permission.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={loadAll} className="font-bold underline shrink-0">Retry</button>
          <button type="button" onClick={() => setError(null)} className="shrink-0" aria-label="Dismiss">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800" role="status">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto" role="tablist" aria-label="Certificate sections">
        {tabs.map(tab => {
          const TIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TIcon className="w-3.5 h-3.5" />
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-slate-100 text-slate-600' : 'bg-white/70 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <AdminQueryLoading variant="skeleton" skeletonCount={6} label="Loading certificates" />
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              templates={templates}
              activeTemplates={activeTemplates}
              issuedCerts={issuedCerts}
              recentCerts={recentCerts}
              uniqueStudents={uniqueStudents.size}
              students={students}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'templates' && (
            <TemplatesTab
              templates={templates}
              subPrograms={subPrograms}
              onRefresh={loadAll}
              canManage={canManage}
              onError={setError}
              onSuccess={flashSuccess}
            />
          )}
          {activeTab === 'issue' && (
            <IssueTab
              templates={templates}
              students={students}
              onRefresh={loadAll}
              canManage={canManage}
              onError={setError}
              onSuccess={flashSuccess}
            />
          )}
          {activeTab === 'issued' && (
            <IssuedTab
              issuedCerts={issuedCerts}
              templates={templates}
              loading={loading}
              onRefresh={loadAll}
            />
          )}
          {activeTab === 'verify' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-xl">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verify Certificate
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Look up a certificate by its public number using the existing verify API.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  value={verifyNumber}
                  onChange={(e) => setVerifyNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                  placeholder="e.g. CERT-2024-0001"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifyBusy || !verifyNumber.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  {verifyBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Verify
                </button>
              </div>
              {verifyError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{verifyError}</div>
              )}
              {verifyResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Certificate found
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(verifyResult).slice(0, 10).map(([k, v]) => (
                      <div key={k} className="bg-white/80 rounded-lg px-2.5 py-2 border border-emerald-100">
                        <dt className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{k.replace(/_/g, ' ')}</dt>
                        <dd className="text-slate-800 font-medium mt-0.5 break-all">{String(v ?? '—')}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
