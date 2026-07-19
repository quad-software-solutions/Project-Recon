import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, AlertCircle, User, Mail, Phone, BookOpen, Calendar, Award, Target, Clock, CheckCircle2, Shield, MapPin, TrendingUp, Pencil, Save, FileSpreadsheet } from 'lucide-react';
import { StudentProfile, Enrollment, AttendanceRecord, StudentProgress, StudentCertificate } from '@/shared/types';
import { fetchStudentsApi, fetchEnrollmentsApi, fetchEnrollmentAttendanceSummaryApi, fetchStudentProgressSummaryApi, fetchStudentCertificatesApi, updateStudentApi } from '@/domains/learning/academics/api/academicApi';
import { formatApiError } from '@/shared/utils/formatApiError';
import { isApiError } from '@/shared/api/http';
import { downloadCsv } from '@/shared/utils/export';

const FIELD_MAP: Record<string, string> = {
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  phone_number: 'phoneNumber',
  guardian_name: 'guardianName',
  guardian_phone: 'guardianPhone',
  guardian_email: 'guardianEmail',
};

const REVERSE_FIELD_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([k, v]) => [v, k])
);

type EditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
};

const INITIAL_EDIT_FORM: EditForm = {
  firstName: '', lastName: '', email: '', phoneNumber: '',
  guardianName: '', guardianPhone: '', guardianEmail: '',
};

export default function StudentDetailPanel() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentData, setStudentData] = useState<{
    enrollments: Enrollment[]; attendance: any; progress: any; certificates: StudentCertificate[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(INITIAL_EDIT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    fetchStudentsApi().then(res => {
      setStudents(Array.isArray(res) ? res : []);
    }).catch(() => setError('Failed to load students')).finally(() => setLoading(false));
  }, []);

  const loadStudentDetail = async (student: StudentProfile) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    setEditForm({
      firstName: student.first_name || '',
      lastName: student.last_name || '',
      email: student.email || '',
      phoneNumber: student.phone_number || '',
      guardianName: student.guardian_name || '',
      guardianPhone: student.guardian_phone || '',
      guardianEmail: student.guardian_email || '',
    });
    setFieldErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(false);
    const sid = student.id || student.user;
    try {
      const [enr, att, prog, certs] = await Promise.all([
        fetchEnrollmentsApi(sid).catch(() => []),
        fetchEnrollmentAttendanceSummaryApi(sid).catch(() => null),
        fetchStudentProgressSummaryApi(sid).catch(() => null),
        fetchStudentCertificatesApi(sid).catch(() => []),
      ]);
      setStudentData({
        enrollments: Array.isArray(enr) ? enr : [],
        attendance: att,
        progress: prog,
        certificates: Array.isArray(certs) ? certs : [],
      });
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const handleEdit = () => {
    if (!selectedStudent) return;
    setEditForm({
      firstName: selectedStudent.first_name || '',
      lastName: selectedStudent.last_name || '',
      email: selectedStudent.email || '',
      phoneNumber: selectedStudent.phone_number || '',
      guardianName: selectedStudent.guardian_name || '',
      guardianPhone: selectedStudent.guardian_phone || '',
      guardianEmail: selectedStudent.guardian_email || '',
    });
    setFieldErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setFieldErrors({});
    try {
      const payload: Record<string, string> = {};
      const snap = {
        firstName: selectedStudent.first_name || '',
        lastName: selectedStudent.last_name || '',
        email: selectedStudent.email || '',
        phoneNumber: selectedStudent.phone_number || '',
        guardianName: selectedStudent.guardian_name || '',
        guardianPhone: selectedStudent.guardian_phone || '',
        guardianEmail: selectedStudent.guardian_email || '',
      };
      for (const [camel, snake] of Object.entries(REVERSE_FIELD_MAP)) {
        if (editForm[camel as keyof EditForm] !== snap[camel as keyof EditForm]) {
          payload[snake] = editForm[camel as keyof EditForm];
        }
      }
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }
      const updated = await updateStudentApi(selectedStudent.id, payload);
      setSelectedStudent(updated);
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (e) {
      if (isApiError(e) && e.body && typeof e.body === 'object') {
        const body = e.body as Record<string, string[]>;
        const mapped: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(body)) {
          const formKey = FIELD_MAP[key];
          if (formKey) {
            mapped[formKey] = Array.isArray(msgs) ? msgs[0] : String(msgs);
          }
        }
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
        } else {
          setSaveError(formatApiError(e));
        }
      } else {
        setSaveError(formatApiError(e));
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => {
    if (statusFilter === 'active' && !s.is_active) return false;
    if (statusFilter === 'pending' && s.is_active) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(q);
  });

  const totalActive = students.filter(s => s.is_active).length;

  const inputClass = (error?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
      error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-blue/20'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Student Details</h2>
        <button
          type="button"
          onClick={() => downloadCsv(
            filtered.map(s => ({ Name: `${s.first_name} ${s.last_name}`.trim(), Email: s.email, Branch: s.branch_name || '', Status: s.is_active ? 'Active' : 'Pending', Phone: s.phone_number || '' })),
            'students'
          )}
          disabled={filtered.length === 0}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: students.length, icon: User, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Active', value: totalActive, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Enrolled', value: students.filter(s => s.is_active).length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pending', value: students.length - totalActive, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {(['all', 'active', 'pending'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setStatusFilter(t)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'All' : t === 'active' ? 'Active' : 'Pending'}
              <span className="ml-1.5 opacity-60">
                ({t === 'all' ? students.length : t === 'active' ? totalActive : students.length - totalActive})
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600" />
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden sm:table-cell">Branch</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase hidden md:table-cell">Contact</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                    {searchQuery ? 'No students matching' : 'No students found'}
                  </td></tr>
                ) : filtered.map((s, i) => {
                  const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => loadStudentDetail(s)}
                    >
                      <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-bright flex items-center justify-center text-xs font-bold text-white">{name.charAt(0)}</div>
                        <span className="text-xs font-semibold text-slate-900">{name}</span>
                      </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{s.branch_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{s.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {s.is_active ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={(e) => { e.stopPropagation(); loadStudentDetail(s); }} className="p-1 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10">
                          <User className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            {filtered.length} of {students.length} student{students.length !== 1 && 's'}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedStudent(null); setStudentData(null); }} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-bright flex items-center justify-center text-lg font-bold text-white">
                      {`${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim().charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{`${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim()}</h3>
                      <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button onClick={handleEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setSelectedStudent(null); setStudentData(null); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                  </div>
                </div>

                {detailLoading ? (
                  <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : (
                  <div className="p-4 space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        {saveSuccess && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Student updated successfully.
                          </div>
                        )}
                        {saveError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {saveError}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">First Name</label>
                            <input value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} className={inputClass(fieldErrors.firstName)} />
                            {fieldErrors.firstName && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.firstName}</p>}
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Last Name</label>
                            <input value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} className={inputClass(fieldErrors.lastName)} />
                            {fieldErrors.lastName && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.lastName}</p>}
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Email</label>
                            <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={inputClass(fieldErrors.email)} />
                            {fieldErrors.email && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.email}</p>}
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Phone</label>
                            <input value={editForm.phoneNumber} onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))} className={inputClass(fieldErrors.phoneNumber)} />
                            {fieldErrors.phoneNumber && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.phoneNumber}</p>}
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Guardian Name</label>
                            <input value={editForm.guardianName} onChange={e => setEditForm(p => ({ ...p, guardianName: e.target.value }))} className={inputClass(fieldErrors.guardianName)} />
                            {fieldErrors.guardianName && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.guardianName}</p>}
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Guardian Phone</label>
                            <input value={editForm.guardianPhone} onChange={e => setEditForm(p => ({ ...p, guardianPhone: e.target.value }))} className={inputClass(fieldErrors.guardianPhone)} />
                            {fieldErrors.guardianPhone && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.guardianPhone}</p>}
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Guardian Email</label>
                            <input value={editForm.guardianEmail} onChange={e => setEditForm(p => ({ ...p, guardianEmail: e.target.value }))} className={inputClass(fieldErrors.guardianEmail)} />
                            {fieldErrors.guardianEmail && <p className="mt-1 text-[10px] text-red-600">{fieldErrors.guardianEmail}</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-600">{selectedStudent.email || '—'}</span></div>
                            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-600">{selectedStudent.phone_number || '—'}</span></div>
                            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-600">{selectedStudent.branch_name || '—'}</span></div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-600">Joined {(selectedStudent.date_joined || selectedStudent.created_at)?.slice(0, 10) || '—'}</span></div>
                            <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-slate-400" /><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedStudent.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedStudent.is_active ? 'Active' : 'Pending'}</span></div>
                          </div>
                        </div>

                        {(selectedStudent.guardian_name || selectedStudent.guardian_phone || selectedStudent.guardian_email) && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Guardian</p>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              {selectedStudent.guardian_name && <div><span className="text-[10px] text-slate-400">Name</span><p className="font-medium">{selectedStudent.guardian_name}</p></div>}
                              {selectedStudent.guardian_phone && <div><span className="text-[10px] text-slate-400">Phone</span><p className="font-medium">{selectedStudent.guardian_phone}</p></div>}
                              {selectedStudent.guardian_email && <div><span className="text-[10px] text-slate-400">Email</span><p className="font-medium">{selectedStudent.guardian_email}</p></div>}
                            </div>
                          </div>
                        )}

                        {studentData?.enrollments && studentData.enrollments.length > 0 && (
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Enrollments ({studentData.enrollments.length})</h4>
                            <div className="space-y-1.5">
                              {studentData.enrollments.map(e => (
                                <div key={e.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-xs">
                                  <div>
                                    <span className="font-medium text-slate-700">{e.class_name || e.sub_program_name || 'Class'}</span>
                                    {e.pending_code && e.status === 'PENDING_VERIFICATION' && (
                                      <span className="block text-[10px] font-mono text-brand-blue mt-0.5">{e.pending_code}</span>
                                    )}
                                  </div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : e.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' : e.status === 'COMPLETED' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                    {e.status?.replace('_', ' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {studentData?.attendance && (
                          <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
                            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> Attendance</h4>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div><p className="text-lg font-bold text-slate-900">{studentData.attendance.present || 0}</p><p className="text-[10px] text-slate-500">Present</p></div>
                              <div><p className="text-lg font-bold text-slate-900">{studentData.attendance.absent || 0}</p><p className="text-[10px] text-slate-500">Absent</p></div>
                              <div><p className="text-lg font-bold text-emerald-600">{studentData.attendance.rate || '0%'}</p><p className="text-[10px] text-slate-500">Rate</p></div>
                            </div>
                          </div>
                        )}

                        {studentData?.progress && (
                          <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3">
                            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5"><Target className="w-4 h-4 text-brand-blue" /> Progress</h4>
                            <div className="grid grid-cols-4 gap-3 text-center">
                              <div><p className="text-lg font-bold text-slate-900">{studentData.progress.completed || 0}</p><p className="text-[10px] text-slate-500">Completed</p></div>
                              <div><p className="text-lg font-bold text-brand-blue">{studentData.progress.in_progress || 0}</p><p className="text-[10px] text-slate-500">In Progress</p></div>
                              <div><p className="text-lg font-bold text-slate-400">{studentData.progress.not_started || 0}</p><p className="text-[10px] text-slate-500">Not Started</p></div>
                              <div><p className="text-lg font-bold text-emerald-600">{studentData.progress.completion_rate || '0%'}</p><p className="text-[10px] text-slate-500">Rate</p></div>
                            </div>
                          </div>
                        )}

                        {studentData?.certificates && studentData.certificates.length > 0 && (
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5"><Award className="w-4 h-4" /> Certificates ({studentData.certificates.length})</h4>
                            <div className="space-y-1.5">
                              {studentData.certificates.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-xs">
                                  <span className="font-medium text-slate-700">{c.certificate_title || c.sub_program_name || 'Certificate'}</span>
                                  <span className="text-slate-400">{c.issued_at?.slice(0, 10)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!studentData?.enrollments?.length && !studentData?.attendance && !studentData?.progress && !studentData?.certificates?.length && (
                          <p className="text-center text-xs text-slate-400 py-4">No enrollment or academic data available</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
