import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { Certificate } from '@/shared/types';
import { searchStudentsApi, issueStudentCertificateApi } from '@/domains/learning/academics/api/academicApi';
import { adminGetRegistrations, type BackendEventRegistration } from '@/domains/competition/api/eventsApi';

export default function EventIssuePanel({ mode, templates, onRefresh, onError }: {
  mode: 'event' | 'tournament' | 'workshop';
  templates: Certificate[];
  onRefresh: () => void;
  onError: (msg: string | null) => void;
}) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[]>([]);

  useEffect(() => {
    adminGetRegistrations({ event_type: mode.toUpperCase() })
      .then(data => setRegistrations(Array.isArray(data) ? data : (data as Record<string, unknown>).results as EventRegistration[] || []))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [mode]);

  const pendingRegs = registrations.filter(r => r.registration_status === 'APPROVED' || r.registration_status === 'PENDING');

  const handleIssueAll = async () => {
    if (!selectedTemplate || pendingRegs.length === 0) return;
    setIssuing(true);
    setResults([]);
    const res: { email: string; success: boolean; error?: string }[] = [];
    for (const reg of pendingRegs) {
      try {
        const email = reg.student_email || reg.public_email;
        if (email) {
          const students = await searchStudentsApi(email);
          const student = Array.isArray(students) ? students[0] : null;
          if (student) {
            await issueStudentCertificateApi({ student: student.id, certificate: selectedTemplate });
            res.push({ email, success: true });
          } else {
            res.push({ email, success: false, error: 'No student profile found' });
          }
        } else {
          res.push({ email: reg.id, success: false, error: 'No email' });
        }
      } catch (e) {
        res.push({ email: reg.student_email || reg.id, success: false, error: e instanceof Error ? e.message : 'Failed' });
      }
    }
    setResults(res);
    setIssuing(false);
    onRefresh();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 capitalize">Generate for {mode} Participants</h4>
          <p className="text-xs text-slate-500">{pendingRegs.length} approved registration(s) found</p>
        </div>
      </div>

      {pendingRegs.length > 0 ? (
        <>
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Certificate Template</label>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
              <option value="">Select template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <button onClick={handleIssueAll} disabled={issuing || !selectedTemplate}
            className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
            {issuing && <Loader2 className="w-3 h-3 animate-spin" />}
            {issuing ? 'Issuing...' : `Issue Certificates to ${pendingRegs.length} Participants`}
          </button>

          {results.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                <p className="text-xs font-bold text-slate-700">Results ({results.filter(r => r.success).length}/{results.length} succeeded)</p>
              </div>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-slate-700">{r.email}</span>
                    {r.success ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Issued
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600" title={r.error}>Failed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-400 text-center py-6">No approved registrations to issue certificates for</p>
      )}
    </div>
  );
}
