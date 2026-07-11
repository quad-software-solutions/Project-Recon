import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, Award, FileText, Eye, Image, RotateCcw, Shield, CheckCircle2 } from 'lucide-react';
import { Certificate } from '@/src/shared/types';
import { fetchCertificateTemplatesApi, createCertificateTemplateApi, updateCertificateTemplateApi, setCertificateTemplateActiveApi, fetchSubProgramsApi } from '@/src/domains/learning/academics/api/academicApi';

const defaultForm = {
  sub_program: '', title: '', background: '', institute_logo: '', signature: '', body_text: '',
};

export default function CertificateTemplateManager() {
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [subPrograms, setSubPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchCertificateTemplatesApi(),
      fetchSubProgramsApi(),
    ]).then(([t, sp]) => {
      setTemplates(Array.isArray(t) ? t : []);
      setSubPrograms(Array.isArray(sp) ? sp : []);
    }).catch(() => setError('Failed to load certificate templates')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (t: Certificate) => {
    setEditing(t);
    setForm({
      sub_program: (t as any).sub_program || '',
      title: t.title,
      background: (t as any).background || '',
      institute_logo: (t as any).institute_logo || '',
      signature: (t as any).signature || '',
      body_text: (t as any).body_text || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.sub_program) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateCertificateTemplateApi(editing.id, form);
      } else {
        await createCertificateTemplateApi(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: Certificate) => {
    try {
      await setCertificateTemplateActiveApi(t.id, t.is_active === false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle template');
    }
  };

  const filtered = templates.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Certificate Templates</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-red-dark transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Template
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
          { label: 'Total Templates', value: templates.length, icon: Award, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Active', value: templates.filter(t => t.is_active !== false).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: templates.filter(t => t.is_active === false).length, icon: RotateCcw, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-xl px-4 py-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="font-black text-lg text-slate-900">{s.value}</p>
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search templates..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-red" />
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Sub-Program</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No templates matching search' : 'No certificate templates yet'}
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Award className="w-3.5 h-3.5 text-amber-600" /></div>
                      <span className="text-xs font-semibold text-slate-900">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{(t as any).sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Edit"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(t)} className={`p-1 rounded-lg ${t.is_active !== false ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={t.is_active !== false ? 'Deactivate' : 'Activate'}>
                        {t.is_active !== false ? <X className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Award className="w-4 h-4 text-amber-600" /></div>
                    <h3 className="font-bold text-base text-slate-900">{editing ? 'Edit Template' : 'New Certificate Template'}</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Title</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="e.g. VEX V5 Completion Certificate" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Sub-Program</label>
                    <select value={form.sub_program} onChange={e => setForm(p => ({ ...p, sub_program: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red">
                      <option value="">Select sub-program...</option>
                      {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Body Text</label>
                    <textarea value={form.body_text} onChange={e => setForm(p => ({ ...p, body_text: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="Certificate body text..." /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Background Image URL</label>
                    <input value={form.background} onChange={e => setForm(p => ({ ...p, background: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="https://..." /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Institute Logo URL</label>
                    <input value={form.institute_logo} onChange={e => setForm(p => ({ ...p, institute_logo: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="https://..." /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Signature Image URL</label>
                    <input value={form.signature} onChange={e => setForm(p => ({ ...p, signature: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-red" placeholder="https://..." /></div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-brand-border">
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
    </div>
  );
}
