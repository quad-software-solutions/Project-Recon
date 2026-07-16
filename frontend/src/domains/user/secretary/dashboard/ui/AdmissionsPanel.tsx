import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, X, Loader2, AlertCircle, UserPlus, Users, Mail, Phone, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { StudentProfile, UserProfile } from '@/shared/types';
import { fetchStudentsApi, admitStudentApi, fetchClassesApi } from '@/domains/learning/academics/api/academicApi';
import { branchesApi } from '@/domains/user/shared/api/adminApi';
import { cacheStudentId } from '@/domains/user/student/api/studentContext';

export default function AdmissionsPanel({ currentUser }: { currentUser?: UserProfile }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '',
    branch: '', guardian_name: '', guardian_phone: '', guardian_email: '',
  });

  useEffect(() => {
    if (currentUser?.role === 'Secretary') {
      setBranchesError('Branches unavailable — not accessible for secretaries');
      return;
    }
    branchesApi.list().then(res => {
      const list = Array.isArray(res) ? res : (res as any).results || [];
      setBranches(list.map((b: any) => ({ id: b.id, name: b.name })));
      if (list.length > 0) setForm(p => ({ ...p, branch: list[0].id }));
    }).catch(() => {
      fetchClassesApi().then(classes => {
        const map = new Map<string, string>();
        classes.forEach(c => { if (c.branch && c.branch_name) map.set(c.branch, c.branch_name); });
        const list = Array.from(map, ([id, name]) => ({ id, name }));
        setBranches(list);
        if (list.length > 0) setForm(p => ({ ...p, branch: list[0].id }));
        else setBranchesError('Branches unavailable — check permissions');
      }).catch(() => {
        setBranchesError('Branches unavailable — check permissions');
      });
    });
  }, [currentUser]);

  const loadStudents = () => {
    setLoading(true);
    fetchStudentsApi().then(res => {
      setStudents(Array.isArray(res) ? res : []);
    }).catch(() => setError('Failed to load students')).finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.branch) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await admitStudentApi(form);
      if (created?.id && created?.email) {
        cacheStudentId(created.email, created.id);
      }
      loadStudents();
      setForm(prev => ({
        first_name: '', last_name: '', email: '', phone_number: '', password: '',
        branch: prev.branch, guardian_name: '', guardian_phone: '', guardian_email: '',
      }));
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to admit student');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = searchQuery.trim()
    ? students.filter(s =>
        `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  const staticStats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Active', value: students.filter(s => s.is_active).length, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'With Guardian', value: students.filter(s => s.guardian_name).length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900">Student Admissions</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors self-start">
          <Plus className="w-3.5 h-3.5" /> New Admission
        </button>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-bold text-slate-900">Student approval flow</p>
            <div className="mt-1 grid gap-1 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
              <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Public requests arrive under Admin CMS Contact Requests.</p>
              <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Admin reviews and confirms the request details.</p>
              <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Admin, Manager, or Secretary creates the student here.</p>
              <p className="flex gap-1.5"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /> Enrollment becomes pending until payment is recorded or verified.</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {staticStats.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}><SIcon className={`w-4 h-4 ${s.color}`} /></div>
                <div><p className="text-lg font-bold text-slate-900">{s.value}</p><p className="text-[10px] text-slate-500">{s.label}</p></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Branch</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No students matching your search' : 'No students found'}
                </td></tr>
              ) : filtered.map(s => {
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedStudent(s)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-bright flex items-center justify-center text-xs font-bold text-white">{name.charAt(0)}</div>
                        <span className="text-sm font-medium text-slate-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-500">{s.email}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-700">{s.branch_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{(s.created_at || s.date_joined)?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.is_active ? 'active' : 'pending'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedStudent(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Student Details</h3>
                  <button onClick={() => setSelectedStudent(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-bright flex items-center justify-center text-lg font-bold text-white">
                      {`${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim().charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{`${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim()}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Phone</p><p className="text-slate-800">{selectedStudent.phone_number || '—'}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Branch</p><p className="text-slate-800">{selectedStudent.branch_name || '—'}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Joined</p><p className="text-slate-800">{(selectedStudent.created_at || selectedStudent.date_joined)?.slice(0, 10) || '—'}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Status</p><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedStudent.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedStudent.is_active ? 'Active' : 'Pending'}</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Guardian Info</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-[10px] text-slate-500">Name</p><p className="text-slate-800">{selectedStudent.guardian_name || '—'}</p></div>
                      <div><p className="text-[10px] text-slate-500">Phone</p><p className="text-slate-800">{selectedStudent.guardian_phone || '—'}</p></div>
                      <div className="col-span-2"><p className="text-[10px] text-slate-500">Email</p><p className="text-slate-800">{selectedStudent.guardian_email || '—'}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Register New Student</h3>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">First Name</label><input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Kidus" /></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Last Name</label><input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="G." /></div>
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Email</label><input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="kidus@email.com" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Phone</label><input value={form.phone_number} onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="+251-911-000001" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Temporary Password</label><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Set login password" /></div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Branch</label>
                    {branchesError ? (
                      <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {branchesError}
                      </div>
                    ) : (
                      <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Guardian Name</label><input value={form.guardian_name} onChange={e => setForm(p => ({ ...p, guardian_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Parent or guardian" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Guardian Phone</label><input value={form.guardian_phone} onChange={e => setForm(p => ({ ...p, guardian_phone: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="+251..." /></div>
                    <div><label className="text-[11px] font-bold text-slate-600 mb-1 block">Guardian Email</label><input value={form.guardian_email} onChange={e => setForm(p => ({ ...p, guardian_email: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="parent@email.com" /></div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSubmit} disabled={!form.first_name || !form.last_name || !form.email || !form.password || !form.branch || submitting}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {submitting ? 'Creating...' : 'Create Student'}
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
