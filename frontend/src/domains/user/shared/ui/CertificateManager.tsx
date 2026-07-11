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
  fetchEnrollmentsApi, downloadCertificateReportPdf
} from '@/src/domains/learning/academics/api/academicApi';
import { adminGetRegistrations } from '@/src/domains/competition/api/eventsApi';

type TabId = 'overview' | 'templates' | 'issue' | 'issued';

interface Props {
  currentUserRole?: string;
}

const defaultTemplateForm = {
  sub_program: '', title: '', background: '', institute_logo: '', signature: '', body_text: '',
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
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                    <p className="text-[10px] text-slate-400">{(t as any).sub_program_name || '—'}</p>
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

  const filtered = templates.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || ((t as any).sub_program_name || '').toLowerCase().includes(q);
  });

  const openCreate = () => { setEditing(null); setForm(defaultTemplateForm); setShowForm(true); };
  const openEdit = (t: Certificate) => {
    setEditing(t);
    setForm({
      sub_program: (t as any).sub_program || '',
      title: t.title,
      background: (t as any).background || '',
      institute_logo: (t as any).institute_logo || '',
      signature: (t as any).signature || '',
      body_text: t.body_text || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.sub_program) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCertificateTemplateApi(editing.id, form);
      } else {
        await createCertificateTemplateApi(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultTemplateForm);
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
      await createCertificateTemplateApi({
        sub_program: (t as any).sub_program || '',
        title: `${t.title} (Copy)`,
        background: (t as any).background || '',
        institute_logo: (t as any).institute_logo || '',
        signature: (t as any).signature || '',
        body_text: t.body_text || '',
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
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-red" />
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-red-dark transition-colors">
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
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{(t as any).sub_program_name || '—'}</td>
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
                          <button onClick={() => duplicateTemplate(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50" title="Duplicate">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleActive(t)}
                            className={`p-1.5 rounded-lg ${t.is_active !== false ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
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
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Template Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red"
                      placeholder="e.g. VEX V5 Completion Certificate" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program *</label>
                    <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select sub-program...</option>
                      {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Body Text</label>
                    <textarea value={form.body_text} onChange={e => setForm(p => ({ ...p, body_text: e.target.value }))} rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red resize-none"
                      placeholder="e.g. This certifies that {{participant_name}} has completed {{workshop_name}}" />
                    <p className="text-[10px] text-slate-400 mt-1">Use placeholders: {'{{participant_name}}'}, {'{{event_name}}'}, {'{{workshop_name}}'}, {'{{issue_date}}'}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Background Image URL</label>
                    <input value={form.background} onChange={e => setForm(p => ({ ...p, background: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red"
                      placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Institute Logo URL</label>
                    <input value={form.institute_logo} onChange={e => setForm(p => ({ ...p, institute_logo: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red"
                      placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Signature Image URL</label>
                    <input value={form.signature} onChange={e => setForm(p => ({ ...p, signature: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red"
                      placeholder="https://..." />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title || !form.sub_program}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
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
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-blue p-8 text-center">
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                      <p className="font-mono text-[10px] text-amber-300 uppercase tracking-[0.3em] font-bold">CERTIFICATE</p>
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-7 h-7 text-amber-400" />
                    </div>
                    <h2 className="font-black text-2xl text-white mb-2 tracking-tight">ETHIO ROBOTICS</h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4" />
                    <p className="text-slate-300 text-sm mb-1">This certifies that</p>
                    <p className="font-bold text-2xl text-white mb-1">[Student Name]</p>
                    <p className="text-slate-300 text-sm mb-3">has completed</p>
                    <p className="font-bold text-lg text-amber-300">{preview.title}</p>
                    {preview.body_text && (
                      <p className="text-slate-400 text-xs mt-3 max-w-sm mx-auto">{preview.body_text}</p>
                    )}
                    <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                      <Shield className="w-4 h-4" />
                      <p className="font-mono text-xs">CERT-XXXX-0001</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between bg-slate-50">
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Template Preview
                  </span>
                  <button onClick={() => setPreview(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
                </div>
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
              eventMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >{m === 'student' ? 'Individual' : `From ${m}s`}</button>
        ))}
      </div>

      {eventMode === 'student' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('individual')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'individual' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600'}`}>
              Single Issue
            </button>
            <button onClick={() => setMode('bulk')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'bulk' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600'}`}>
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
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>
                {studentResults.length > 0 && (
                  <div className="mt-1.5 border border-slate-200 rounded-lg bg-white max-h-40 overflow-y-auto shadow-sm">
                    {studentResults.map(s => {
                      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                      return (
                        <button key={s.id} type="button" onClick={() => handleSelectStudent(s.id, name)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                            form.student === s.id ? 'bg-brand-red/5 text-brand-red font-semibold' : 'text-slate-700'
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                  <option value="">Select template...</option>
                  {activeTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <button onClick={handleIssueIndividual} disabled={submitting || !form.student || !form.certificate}
                  className="bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
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
                        selected ? 'bg-brand-red/5 text-brand-red font-semibold' : 'text-slate-700'
                      }`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleBulkStudent(s.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-brand-red focus:ring-brand-red" />
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
                  <option value="">Select template...</option>
                  {activeTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <button onClick={handleBulkIssue} disabled={bulkRunning || selectedStudents.length === 0 || !bulkTemplate}
                  className="bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red">
              <option value="">Select template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <button onClick={handleIssueAll} disabled={issuing || !selectedTemplate}
            className="bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-1.5">
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
          { label: 'Total Issued', value: issuedCerts.length, icon: Award, color: 'text-brand-red', bg: 'bg-brand-red/5' },
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
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-red" />
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
                      <div className="w-7 h-7 rounded-full bg-brand-red/5 flex items-center justify-center">
                        <Award className="w-3.5 h-3.5 text-brand-red" />
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Download PDF">
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
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-blue p-8 text-center">
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                      <p className="font-mono text-[10px] text-amber-300 uppercase tracking-[0.3em] font-bold">CERTIFICATE</p>
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-7 h-7 text-amber-400" />
                    </div>
                    <h2 className="font-black text-2xl text-white mb-2 tracking-tight">ETHIO ROBOTICS</h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4" />
                    <p className="text-slate-300 text-sm mb-1">This certifies that</p>
                    <p className="font-bold text-2xl text-white mb-1">{showDetail.student_name || 'Student'}</p>
                    <p className="text-slate-300 text-sm mb-3">has completed</p>
                    <p className="font-bold text-lg text-amber-300">{showDetail.certificate_title || showDetail.sub_program_name || 'Program'}</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                      <Shield className="w-4 h-4" />
                      <p className="font-mono text-xs">{showDetail.certificate_number}</p>
                    </div>
                    <p className="text-slate-500 text-[10px] mt-2">{showDetail.issued_at?.slice(0, 10) || ''}</p>
                  </div>
                </div>
                <div className="p-5 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Verified & Authentic
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDetail(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
                    {showDetail.pdf && (
                      <a href={showDetail.pdf} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-red px-4 py-1.5 rounded-lg hover:bg-brand-red-dark transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download PDF
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
