import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, X, Loader2, AlertCircle, Award, Download, Shield,
  FileText, Eye, RotateCcw, CheckCircle2, Users, Calendar, Hash,
  Building, BookOpen, UserPlus, ChevronRight, Activity, Sparkles, Upload
} from 'lucide-react';
import type { Certificate, StudentCertificate, StudentProfile } from '@/src/shared/types';
import {
   fetchCertificateTemplatesApi, createCertificateTemplateApi, updateCertificateTemplateApi,
   setCertificateTemplateActiveApi, fetchSubProgramsApi, fetchStudentCertificatesApi,
   fetchStudentsApi, searchStudentsApi, issueStudentCertificateApi,
   fetchEnrollmentsApi, downloadCertificateReportPdf, decodeBodyWithSignatory
 } from '@/src/domains/learning/academics/api/academicApi';
 import { adminGetRegistrations } from '@/src/domains/competition/api/eventsApi';
 import BrandLogo from '@/src/shared/ui/BrandLogo';

type TabId = 'overview' | 'templates' | 'issue' | 'issued';

interface Props {
  currentUserRole?: string;
}

interface TemplateForm {
  sub_program: string;
  title: string;
  body_text: string;
  signatory_name: string;
  signatory_title: string;
}

const defaultTemplateForm: TemplateForm = {
  sub_program: '', title: '', body_text: '', signatory_name: '', signatory_title: '',
};

export default function CertificateManager({ currentUserRole }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<StudentCertificate[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
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
    }).catch(e => setError('Failed to load certificate data')).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const canManage = !currentUserRole || currentUserRole === 'Admin' || currentUserRole === 'Manager' || currentUserRole === 'Secretary';

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

/* ───── Overview Tab ───── */

function OverviewTab({ templates, activeTemplates, issuedCerts, recentCerts, uniqueStudents, students }: {
  templates: Certificate[];
  activeTemplates: Certificate[];
  issuedCerts: StudentCertificate[];
  recentCerts: StudentCertificate[];
  uniqueStudents: number;
  students: StudentProfile[];
}) {
  const stats = [
    { label: 'Total Templates', value: templates.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Templates', value: activeTemplates.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Certificates Issued', value: issuedCerts.length, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Students Certified', value: uniqueStudents, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Issued (30d)', value: recentCerts.length, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Students', value: students.length, icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-dark rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Certificate Management</h2>
            <p className="text-sm text-white/70">Create templates, issue certificates, and manage credentials</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-3"
            >
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-1.5`}>
                <SIcon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="font-bold text-xl text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recent Certificates
          </h4>
          {recentCerts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No certificates issued in the last 30 days</p>
          ) : (
            <div className="space-y-2">
              {recentCerts.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{c.student_name || 'Student'}</p>
                    <p className="text-[10px] text-slate-400">{c.certificate_title}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{c.issued_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Template Summary
          </h4>
          {templates.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No templates yet</p>
          ) : (
            <div className="space-y-2">
              {templates.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-7 h-7 rounded-lg ${t.is_active !== false ? 'bg-emerald-50' : 'bg-slate-100'} flex items-center justify-center`}>
                    <FileText className={`w-3.5 h-3.5 ${t.is_active !== false ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-400">{t.sub_program_name || '—'}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {t.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Templates Tab ───── */

function TemplatesTab({ templates, subPrograms, onRefresh, canManage, onError }: {
  templates: Certificate[];
  subPrograms: any[];
  onRefresh: () => void;
  canManage: boolean;
  onError: (msg: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultTemplateForm);
  const [preview, setPreview] = useState<Certificate | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const filtered = templates.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.sub_program_name || '').toLowerCase().includes(q);
  });

  const resetFileState = () => {
    setBackgroundFile(null);
    setLogoFile(null);
    setSignatureFile(null);
    setBackgroundPreview(null);
    setLogoPreview(null);
    setSignaturePreview(null);
  };

  const openCreate = () => { setEditing(null); setForm(defaultTemplateForm); resetFileState(); setShowForm(true); };
  const openEdit = (t: Certificate) => {
    setEditing(t);
    const decoded = decodeBodyWithSignatory(t.body_text || '');
    setForm({
      sub_program: t.sub_program || '',
      title: t.title,
      body_text: decoded.body,
      signatory_name: decoded.signatory_name,
      signatory_title: decoded.signatory_title,
    });
    resetFileState();
    setBackgroundPreview(t.background_url || null);
    setLogoPreview(t.institute_logo_url || null);
    setSignaturePreview(t.signature_url || null);
    setShowForm(true);
  };

  const buildPayload = () => ({
    sub_program: form.sub_program,
    title: form.title,
    body_text: form.body_text,
    background: backgroundFile,
    institute_logo: logoFile,
    signature: signatureFile,
    signatory_name: form.signatory_name,
    signatory_title: form.signatory_title,
  });

  const handleSave = async () => {
    if (!form.title || !form.sub_program) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCertificateTemplateApi(editing.id, buildPayload());
      } else {
        await createCertificateTemplateApi(buildPayload());
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultTemplateForm);
      resetFileState();
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: Certificate) => {
    try {
      await setCertificateTemplateActiveApi(t.id, t.is_active === false);
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to toggle template');
    }
  };

  const duplicateTemplate = async (t: Certificate) => {
    try {
      const decoded = decodeBodyWithSignatory(t.body_text || '');
      await createCertificateTemplateApi({
        sub_program: t.sub_program || '',
        title: `${t.title} (Copy)`,
        body_text: decoded.body,
        signatory_name: decoded.signatory_name,
        signatory_title: decoded.signatory_title,
      });
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to duplicate template');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600" />
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Sub-Program</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Body</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-400">
                  {search ? 'No templates matching search' : 'No certificate templates yet'}
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{t.sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-[10px] text-slate-400">{t.body_text ? `${t.body_text.slice(0, 30)}...` : '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      t.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setPreview(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Preview">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Edit">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => duplicateTemplate(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Duplicate">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleActive(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10"
                            title={t.is_active !== false ? 'Deactivate' : 'Activate'}>
                            {t.is_active !== false ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{editing ? 'Edit Template' : 'New Certificate Template'}</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Template Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      placeholder="e.g. VEX V5 Completion Certificate" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program *</label>
                    <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                      <option value="">Select sub-program...</option>
                      {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Body Text</label>
                    <textarea value={form.body_text} onChange={e => setForm(p => ({ ...p, body_text: e.target.value }))} rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 resize-none"
                      placeholder="e.g. This certifies that {{participant_name}} has completed {{workshop_name}}" />
                    <p className="text-[10px] text-slate-400 mt-1">Use placeholders: {'{{participant_name}}'}, {'{{event_name}}'}, {'{{workshop_name}}'}, {'{{issue_date}}'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Signatory Name</label>
                      <input value={form.signatory_name} onChange={e => setForm(p => ({ ...p, signatory_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        placeholder="e.g. Dr. John Smith" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Signatory Title</label>
                      <input value={form.signatory_title} onChange={e => setForm(p => ({ ...p, signatory_title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        placeholder="e.g. Principal, Director" />
                    </div>
                  </div>
                  {/* Background Image */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Background Image</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{backgroundFile ? backgroundFile.name : 'Choose file...'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0] || null;
                          setBackgroundFile(f);
                          if (f) setBackgroundPreview(URL.createObjectURL(f));
                        }} />
                      </label>
                      {(backgroundPreview || editing) && !backgroundFile && (
                        <span className="text-[10px] text-slate-400">Current image preserved if no new file selected</span>
                      )}
                    </div>
                    {backgroundPreview && (
                      <img src={backgroundPreview} alt="Background preview" className="mt-2 max-h-24 rounded-lg object-cover border border-slate-200" />
                    )}
                  </div>
                  {/* Institute Logo */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Institute Logo</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoFile ? logoFile.name : 'Choose file...'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0] || null;
                          setLogoFile(f);
                          if (f) setLogoPreview(URL.createObjectURL(f));
                        }} />
                      </label>
                      {logoPreview && !logoFile && (
                        <span className="text-[10px] text-slate-400">Current image preserved</span>
                      )}
                    </div>
                    {logoPreview && (
                      <img src={logoPreview} alt="Logo preview" className="mt-2 max-h-24 rounded-lg object-cover border border-slate-200" />
                    )}
                  </div>
                  {/* Signature Image */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Signature Image</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{signatureFile ? signatureFile.name : 'Choose file...'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0] || null;
                          setSignatureFile(f);
                          if (f) setSignaturePreview(URL.createObjectURL(f));
                        }} />
                      </label>
                      {signaturePreview && !signatureFile && (
                        <span className="text-[10px] text-slate-400">Current image preserved</span>
                      )}
                    </div>
                    {signaturePreview && (
                      <img src={signaturePreview} alt="Signature preview" className="mt-2 max-h-24 rounded-lg object-cover border border-slate-200" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => { setShowForm(false); resetFileState(); }} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title || !form.sub_program}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg overflow-hidden">
                {(() => {
                  const decoded = decodeBodyWithSignatory(preview.body_text || '');
                  return (
                    <>
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
                          <p className="font-black text-2xl text-white tracking-tight">[Student Name]</p>
                          <p className="text-slate-300 text-[11px] tracking-wider">has successfully completed</p>
                          <p className="font-bold text-base text-blue-600">{preview.title}</p>
                          {decoded.body && (
                            <p className="text-slate-400 text-[10px] max-w-xs leading-relaxed">{decoded.body}</p>
                          )}
                          <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent mt-1" />
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Shield className="w-2.5 h-2.5 text-brand-cyan" />
                              <p className="font-mono text-[9px]">CERT-XXXX-0001</p>
                            </div>
                            <span className="text-slate-600 text-[9px]">|</span>
                            <p className="font-mono text-[9px] text-slate-400">{new Date().toISOString().slice(0, 10)}</p>
                          </div>
                          {/* Signature area */}
                          {(preview.signature_url || decoded.signatory_name) && (
                            <div className="flex items-end justify-center gap-8 mt-2 pt-2 border-t border-white/10 w-full max-w-xs">
                              {decoded.signatory_name && (
                                <div className="text-center">
                                  {preview.signature_url && (
                                    <img src={preview.signature_url} alt="Signature" className="h-8 mx-auto mb-0.5 object-contain" />
                                  )}
                                  <div className="w-20 h-px bg-white/30 mx-auto mb-0.5" />
                                  <p className="text-white text-[9px] font-bold leading-tight">{decoded.signatory_name}</p>
                                  <p className="text-brand-cyan text-[7px] uppercase tracking-wider font-bold">{decoded.signatory_title || 'Principal'}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-600 via-brand-cyan to-blue-600 opacity-60" />
                      </div>
                      <div className="p-3 flex items-center justify-between bg-slate-50 border-t border-brand-border-light">
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Template Preview
                        </span>
                        <button onClick={() => setPreview(null)} className="px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg">Close</button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Issue Tab ───── */

function IssueTab({ templates, students, onRefresh, canManage, onError }: {
  templates: Certificate[];
  students: StudentProfile[];
  onRefresh: () => void;
  canManage: boolean;
  onError: (msg: string | null) => void;
}) {
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ student: '', certificate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkTemplate, setBulkTemplate] = useState('');
  const [bulkResults, setBulkResults] = useState<{ studentId: string; name: string; success: boolean; error?: string }[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [eventMode, setEventMode] = useState<'student' | 'event' | 'tournament' | 'workshop'>('student');

  const activeTemplates = templates.filter(t => t.is_active !== false);

  /* Student search for individual mode */
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

  const handleSelectStudent = (studentId: string, displayName: string) => {
    setForm(p => ({ ...p, student: studentId }));
    setStudentSearch(displayName);
    setStudentResults([]);
    const matched = templates.find(t => t.is_active !== false);
    if (matched && !form.certificate) setForm(p => ({ ...p, certificate: matched.id }));
  };

  const handleIssueIndividual = async () => {
    if (!form.student || !form.certificate) return;
    setSubmitting(true);
    try {
      await issueStudentCertificateApi({ student: form.student, certificate: form.certificate });
      setForm({ student: '', certificate: '' });
      setStudentSearch('');
      setStudentResults([]);
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to issue certificate');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBulkStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleBulkIssue = async () => {
    if (selectedStudents.length === 0 || !bulkTemplate) return;
    setBulkRunning(true);
    setBulkResults([]);
    const results: { studentId: string; name: string; success: boolean; error?: string }[] = [];
    for (const studentId of selectedStudents) {
      try {
        await issueStudentCertificateApi({ student: studentId, certificate: bulkTemplate });
        const s = students.find(st => st.id === studentId);
        results.push({ studentId, name: s ? `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email : studentId, success: true });
      } catch (e) {
        results.push({ studentId, name: studentId, success: false, error: e instanceof Error ? e.message : 'Failed' });
      }
    }
    setBulkResults(results);
    setBulkRunning(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['student', 'event', 'tournament', 'workshop'] as const).map(m => (
          <button key={m} onClick={() => setEventMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
              eventMode === m ? 'bg-brand-blue text-white' : 'text-slate-500 hover:text-brand-blue'
            }`}
          >{m === 'student' ? 'Individual' : `From ${m}s`}</button>
        ))}
      </div>

      {eventMode === 'student' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('individual')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'individual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Single Issue
            </button>
            <button onClick={() => setMode('bulk')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'bulk' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Bulk Issue
            </button>
          </div>

          {mode === 'individual' ? (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Search student by name or email..." value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); setForm(p => ({ ...p, student: '' })); }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600" />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>
                {studentResults.length > 0 && (
                  <div className="mt-1.5 border border-slate-200 rounded-lg bg-white max-h-40 overflow-y-auto shadow-sm">
                    {studentResults.map(s => {
                      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                      return (
                        <button key={s.id} type="button" onClick={() => handleSelectStudent(s.id, name)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                            form.student === s.id ? 'bg-blue-600/5 text-blue-600 font-semibold' : 'text-slate-700'
                          }`}>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                  <option value="">Select template...</option>
                  {activeTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <button onClick={handleIssueIndividual} disabled={submitting || !form.student || !form.certificate}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {submitting ? 'Issuing...' : 'Issue Certificate'}
                </button>
              </div>
            </div>
          ) : (
            /* Bulk Issue */
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Select Students</label>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No students available</p>
                  ) : students.map(s => {
                    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                    const selected = selectedStudents.includes(s.id);
                    return (
                      <label key={s.id} className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        selected ? 'bg-blue-600/5 text-blue-600 font-semibold' : 'text-slate-700'
                      }`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleBulkStudent(s.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                        <span>{name}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{s.email}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{selectedStudents.length} student(s) selected</p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Certificate Template</label>
                <select value={bulkTemplate} onChange={e => setBulkTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                  <option value="">Select template...</option>
                  {activeTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <button onClick={handleBulkIssue} disabled={bulkRunning || selectedStudents.length === 0 || !bulkTemplate}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                  {bulkRunning && <Loader2 className="w-3 h-3 animate-spin" />}
                  {bulkRunning ? `Issuing (0/${selectedStudents.length})...` : `Issue to ${selectedStudents.length} Students`}
                </button>
              </div>

              {bulkResults.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                    <p className="text-xs font-bold text-slate-700">Results</p>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {bulkResults.map(r => (
                      <div key={r.studentId} className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs text-slate-700">{r.name}</span>
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
            </div>
          )}
        </div>
      )}

      {eventMode !== 'student' && (
        <EventIssuePanel
          mode={eventMode}
          templates={activeTemplates}
          onRefresh={onRefresh}
          onError={onError}
        />
      )}
    </div>
  );
}

/* ───── Event Issue Panel ───── */

function EventIssuePanel({ mode, templates, onRefresh, onError }: {
  mode: 'event' | 'tournament' | 'workshop';
  templates: Certificate[];
  onRefresh: () => void;
  onError: (msg: string | null) => void;
}) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[]>([]);

  useEffect(() => {
    adminGetRegistrations({ event_type: mode.toUpperCase() })
      .then(data => setRegistrations(Array.isArray(data) ? data : (data as any).results || []))
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

/* ───── Issued Tab ───── */

function IssuedTab({ issuedCerts, loading, onRefresh }: {
  issuedCerts: StudentCertificate[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState<StudentCertificate | null>(null);

  const filtered = issuedCerts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.student_name || '').toLowerCase().includes(q)
      || (c.certificate_title || '').toLowerCase().includes(q)
      || c.certificate_number.toLowerCase().includes(q);
  });

  const uniqueStudents = new Set(issuedCerts.map(c => c.student));
  const recentCount = issuedCerts.filter(c => {
    const d = new Date(c.issued_at);
    return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Issued', value: issuedCerts.length, icon: Award, color: 'text-blue-600', bg: 'bg-blue-600/5' },
          { label: 'Students', value: uniqueStudents.size, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Last 30 Days', value: recentCount, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-1`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <p className="font-bold text-xl text-slate-900">{s.value}</p>
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input type="text" placeholder="Search by student, certificate, or number..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certificate</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Issued</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Number</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
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
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{c.certificate_number}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={e => { e.stopPropagation(); setShowDetail(c); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {c.pdf && (
                        <a href={c.pdf} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Download PDF">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetail(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
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
                    <CheckCircle2 className="w-3 h-3" /> Verified & Authentic
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowDetail(null)} className="px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg">Close</button>
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
