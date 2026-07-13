import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Award, Download, Shield, FileText, Users, Calendar } from 'lucide-react';
import { StudentCertificate, StudentProfile, Certificate } from '@/src/shared/types';
import { fetchStudentCertificatesApi, fetchStudentsApi, fetchCertificateTemplatesApi, issueStudentCertificateApi, searchStudentsApi, fetchEnrollmentsApi } from '@/src/domains/learning/academics/api/academicApi';
import BrandLogo from '@/src/shared/ui/BrandLogo';

export default function CertificatesPanel() {
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showDetail, setShowDetail] = useState<StudentCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ student: '', certificate: '' });

  useEffect(() => {
    Promise.allSettled([
      fetchStudentCertificatesApi(),
      fetchStudentsApi(),
      fetchCertificateTemplatesApi(),
    ]).then(([certRes, studentRes, templateRes]) => {
      const studentList = studentRes.status === 'fulfilled' && Array.isArray(studentRes.value) ? studentRes.value : [];
      const templateList = templateRes.status === 'fulfilled' && Array.isArray(templateRes.value) ? templateRes.value : [];
      const certsData = certRes.status === 'fulfilled' && Array.isArray(certRes.value) ? certRes.value : [];
      const sorted = certsData.sort(
        (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
      );
      setCerts(sorted);
      setStudents(studentList);
      setTemplates(templateList.filter(t => t.is_active !== false));
      setForm({
        student: studentList[0]?.id || '',
        certificate: templateList.find(t => t.is_active !== false)?.id || '',
      });
    }).catch(() => setError('Failed to load certificates')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (studentSearch.trim().length < 2) { setStudentResults([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      searchStudentsApi(studentSearch).then(res => {
        setStudentResults(Array.isArray(res) ? res : []);
      }).catch(() => {}).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const handleSelectStudent = async (studentId: string, displayName: string) => {
    setForm(p => ({ ...p, student: studentId }));
    setStudentSearch(displayName);
    setStudentResults([]);
    // Auto-suggest template based on student's enrolled sub-programs
    try {
      const enrollments = await fetchEnrollmentsApi(studentId);
      const subProgramNames = enrollments.map(e => e.sub_program_name).filter(Boolean) as string[];
      if (subProgramNames.length > 0) {
        const match = templates.find(t =>
          subProgramNames.some(name => t.title.toLowerCase().includes(name.toLowerCase()))
        );
        if (match) setForm(p => ({ ...p, certificate: match.id }));
      }
    } catch { /* fallback — keep current template selection */ }
  };

  const handleIssue = async () => {
    if (!form.student || !form.certificate) return;
    setSubmitting(true);
    setError(null);
    try {
      const issued = await issueStudentCertificateApi(form);
      setCerts(prev => [issued, ...prev]);
      setShowIssue(false);
      setForm(p => ({ ...p, student: '', certificate: '' }));
      setStudentSearch('');
      setStudentResults([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue certificate');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = certs.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.student_name || '').toLowerCase().includes(q)
      || (c.certificate_title || '').toLowerCase().includes(q)
      || c.certificate_number.toLowerCase().includes(q);
  });

  const uniqueStudents = new Set(certs.map(c => c.student));
  const recentCount = certs.filter(c => {
    const d = new Date(c.issued_at);
    return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Student Certificates</h2>
        <button onClick={() => setShowIssue(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Issue Certificate
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Issued', value: certs.length, icon: Award, color: 'text-blue-600', bg: 'bg-blue-600/5' },
          { label: 'Students', value: uniqueStudents.size, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Last 30 Days', value: recentCount, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <p className="font-black text-xl text-slate-900">{s.value}</p>
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-brand-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search by student, certificate, or number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-brand-border rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-600"
            />
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Certificate</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">Issued</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Number</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No certificates match your search' : 'No certificates issued yet'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setShowDetail(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/5 flex items-center justify-center">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{c.student_name || c.student?.slice(0, 8) || 'Student'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{c.certificate_title || 'Certificate'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{c.issued_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{c.certificate_number}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.pdf ? (
                      <a href={c.pdf} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
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

      {/* Issue Certificate Modal */}
      <AnimatePresence>
        {showIssue && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowIssue(false); setStudentSearch(''); setStudentResults([]); }} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/5 flex items-center justify-center"><Award className="w-4 h-4 text-blue-600" /></div>
                    <h3 className="font-bold text-base text-slate-900">Issue Certificate</h3>
                  </div>
                  <button onClick={() => { setShowIssue(false); setStudentSearch(''); setStudentResults([]); }} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Student</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input type="text" placeholder="Search student by name or email..." value={studentSearch}
                        onChange={e => { setStudentSearch(e.target.value); setForm(p => ({ ...p, student: '' })); }}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
                    </div>
                    {studentResults.length > 0 && (
                      <div className="mt-1.5 border border-brand-border rounded-lg bg-white max-h-40 overflow-y-auto shadow-sm">
                        {studentResults.map(s => {
                          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                          return (
                            <button key={s.id} type="button"
                              onClick={() => handleSelectStudent(s.id, name)}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${form.student === s.id ? 'bg-blue-600/5 text-blue-600 font-semibold' : 'text-slate-700'}`}
                            >
                              <span>{name}</span>
                              <span className="text-[10px] text-slate-400">{s.email}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Certificate Template</label>
                    <select value={form.certificate} onChange={e => setForm(p => ({ ...p, certificate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    >
                      <option value="">Select template...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
                  <button onClick={() => { setShowIssue(false); setStudentSearch(''); setStudentResults([]); }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg">Cancel</button>
                  <button onClick={handleIssue} disabled={submitting || !form.student || !form.certificate}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Issuing...' : 'Issue Certificate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg overflow-hidden">
                <div className="relative bg-gradient-to-b from-brand-blue-dark via-brand-blue to-brand-blue-dark text-center">
                  {/* Ornamental top border */}
                  <div className="flex items-center justify-center gap-1 pt-6 px-8">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
                    <div className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rotate-45 bg-blue-600" />
                      <div className="w-1.5 h-1.5 rotate-45 bg-brand-cyan" />
                      <div className="w-1.5 h-1.5 rotate-45 bg-blue-600" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
                  </div>
                  <div className="px-8 pb-6 pt-4 flex flex-col items-center gap-2.5">
                    <div className="w-28 h-auto">
                      <BrandLogo className="w-full h-auto" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-brand-cyan rounded-full" />
                      <p className="font-mono text-[8px] text-brand-cyan uppercase tracking-[0.3em] font-bold">CERTIFICATE OF COMPLETION</p>
                      <div className="w-1 h-1 bg-brand-cyan rounded-full" />
                    </div>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
                    <p className="text-slate-300 text-[11px] tracking-wider">This certifies that</p>
                    <p className="font-black text-2xl text-white tracking-tight">{showDetail.student_name || 'Student'}</p>
                    <p className="text-slate-300 text-[11px] tracking-wider">has successfully completed</p>
                    <p className="font-bold text-base text-blue-600">{showDetail.certificate_title || showDetail.sub_program_name || 'Program'}</p>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent mt-1" />
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Shield className="w-2.5 h-2.5 text-brand-cyan" />
                        <p className="font-mono text-[9px]">{showDetail.certificate_number}</p>
                      </div>
                      <span className="text-slate-600 text-[9px]">|</span>
                      <p className="font-mono text-[9px] text-slate-400">{showDetail.issued_at?.slice(0, 10) || ''}</p>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-600 via-brand-cyan to-blue-600 opacity-60" />
                </div>
                <div className="p-4 flex items-center justify-between bg-slate-50 border-t border-brand-border-light">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                    <Shield className="w-3 h-3" /> Verified & Authentic
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowDetail(null)} className="px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg">
                      Close
                    </button>
                    {showDetail.pdf && (
                      <a href={showDetail.pdf} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="w-2.5 h-2.5" /> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}