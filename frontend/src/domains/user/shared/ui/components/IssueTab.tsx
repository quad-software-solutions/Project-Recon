import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import type { Certificate, StudentProfile } from '@/shared/types';
import { searchStudentsApi, issueStudentCertificateApi } from '@/domains/learning/academics/api/academicApi';
import EventIssuePanel from './EventIssuePanel';

export default function IssueTab({ templates, students, onRefresh, canManage, onError }: {
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
