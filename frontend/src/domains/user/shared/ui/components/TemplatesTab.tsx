import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Award, FileText, Eye, RotateCcw, X, CheckCircle2, Loader2, Upload, Shield } from 'lucide-react';
import { Certificate } from '@/shared/types';
import { decodeBodyWithSignatory, updateCertificateTemplateApi, createCertificateTemplateApi, setCertificateTemplateActiveApi } from '@/domains/learning/academics/api/academicApi';
import BrandLogo from '@/shared/ui/BrandLogo';

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

export default function TemplatesTab({ templates, subPrograms, onRefresh, canManage, onError }: {
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
