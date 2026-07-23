import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, Loader2, AlertCircle, User, BookOpen, Calendar, Award,
  Target, Clock, CheckCircle2, Shield, TrendingUp, Pencil, Save,
  FileSpreadsheet, Lock, CreditCard, History,
} from 'lucide-react';
import type { StudentProfile, Enrollment, StudentCertificate, EnrollmentPayment, AttendanceRecord } from '@/shared/types';
import {
  fetchStudentsApi, fetchStudentApi, fetchEnrollmentsApi, fetchEnrollmentAttendanceSummaryApi,
  fetchEnrollmentAttendanceHistoryApi, fetchStudentProgressSummaryApi, fetchStudentCertificatesApi,
  updateStudentApi, fetchPaymentsListApi,
} from '@/domains/learning/academics/api/academicApi';
import { formatApiError } from '@/shared/utils/formatApiError';
import { isApiError, isForbiddenError } from '@/shared/api/http';
import { downloadCsv } from '@/shared/utils/export';
import { formatMoneyCompact } from '@/shared/utils/formatCurrency';
import {
  NA, displayValue, formatDate, formatDateTime, labelize,
  ENROLLMENT_STATUS_META, StatusBadge, FieldGrid, FieldItem, SectionCard,
} from './enrollmentShared';

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
  Object.entries(FIELD_MAP).map(([k, v]) => [v, k]),
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

type DetailTab = 'overview' | 'academic' | 'enrollments' | 'attendance' | 'payments' | 'certificates' | 'history';

const TABS: { id: DetailTab; label: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: TrendingUp },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'history', label: 'History', icon: History },
];

export default function StudentDetailPanel() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentData, setStudentData] = useState<{
    enrollments: Enrollment[];
    attendance: Record<string, unknown> | null;
    attendanceHistory: AttendanceRecord[];
    progress: Record<string, unknown> | null;
    certificates: StudentCertificate[];
    payments: EnrollmentPayment[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(INITIAL_EDIT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchStudentsApi().then(res => {
      if (cancelled) return;
      const list = Array.isArray(res) ? res : [];
      setStudents(list);
      const preselectedId = (() => { try { return sessionStorage.getItem('selectedStudentId'); } catch { return null; } })();
      if (preselectedId) {
        try { sessionStorage.removeItem('selectedStudentId'); } catch {}
        const found = list.find(s => s.id === preselectedId || s.user === preselectedId);
        if (found) loadStudentDetail(found);
      }
    }).catch((err: unknown) => {
      if (cancelled) return;
      if (isForbiddenError(err) || (isApiError(err) && err.status === 403)) {
        setPermissionDenied(true);
      } else {
        setError('Failed to load students');
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const loadStudentDetail = async (student: StudentProfile) => {
    setSelectedStudent(student);
    setDetailTab('overview');
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
      const [fresh, enrollments, allPayments, certs] = await Promise.all([
        fetchStudentApi(sid).catch(() => student),
        fetchEnrollmentsApi(sid).catch(() => [] as Enrollment[]),
        fetchPaymentsListApi().catch(() => [] as EnrollmentPayment[]),
        fetchStudentCertificatesApi(sid).catch(() => [] as StudentCertificate[]),
      ]);
      setSelectedStudent(fresh);
      const enrollmentList = Array.isArray(enrollments) ? enrollments : [];
      const primaryEnrollment =
        enrollmentList.find(e => e.status === 'ACTIVE') ||
        enrollmentList.find(e => e.status === 'COMPLETED') ||
        enrollmentList[0];

      const enrollmentIds = new Set(enrollmentList.map(e => e.id));
      const studentPayments = (Array.isArray(allPayments) ? allPayments : []).filter(
        p => enrollmentIds.has(p.enrollment) || enrollmentIds.has(p.enrollment_id || ''),
      );

      const [att, attHist, prog] = await Promise.all([
        primaryEnrollment
          ? fetchEnrollmentAttendanceSummaryApi(primaryEnrollment.id).catch(() => null)
          : Promise.resolve(null),
        primaryEnrollment
          ? fetchEnrollmentAttendanceHistoryApi(primaryEnrollment.id).catch(() => [] as AttendanceRecord[])
          : Promise.resolve([] as AttendanceRecord[]),
        primaryEnrollment
          ? fetchStudentProgressSummaryApi(primaryEnrollment.id).catch(() => null)
          : Promise.resolve(null),
      ]);

      setStudentData({
        enrollments: enrollmentList,
        attendance: att,
        attendanceHistory: Array.isArray(attHist) ? attHist : [],
        progress: prog,
        certificates: Array.isArray(certs) ? certs : [],
        payments: studentPayments,
      });
    } catch {
      setStudentData({
        enrollments: [], attendance: null, attendanceHistory: [], progress: null, certificates: [], payments: [],
      });
    }
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
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (e) {
      if (isApiError(e) && e.body && typeof e.body === 'object') {
        const body = e.body as Record<string, string[]>;
        const mapped: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(body)) {
          const formKey = FIELD_MAP[key];
          if (formKey) mapped[formKey] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        if (Object.keys(mapped).length > 0) setFieldErrors(mapped);
        else setSaveError(formatApiError(e));
      } else {
        setSaveError(formatApiError(e));
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => {
    if (statusFilter === 'active' && !s.is_active) return false;
    if (statusFilter === 'inactive' && s.is_active) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return `${s.first_name} ${s.last_name} ${s.email} ${s.phone_number || ''}`.toLowerCase().includes(q);
  });

  const totalActive = students.filter(s => s.is_active).length;

  const primaryEnrollment = useMemo(() => {
    const list = studentData?.enrollments || [];
    return list.find(e => e.status === 'ACTIVE') || list.find(e => e.status === 'COMPLETED') || list[0];
  }, [studentData]);

  const inputClass = (err?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
      err ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-blue/20'
    }`;

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-2">Access Restricted</h3>
        <p className="text-sm text-slate-500 max-w-md">
          You do not have permission to view student details. Contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  const fullName = selectedStudent
    ? `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim() || selectedStudent.email
    : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Student Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Search and view individual student records</p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(
            filtered.map(s => ({
              Name: `${s.first_name} ${s.last_name}`.trim(),
              Email: s.email,
              Branch: s.branch_name || '',
              Status: s.is_active ? 'Active' : 'Inactive',
              Phone: s.phone_number || '',
              Guardian: s.guardian_name || '',
            })),
            'students',
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
          <button type="button" onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Students', value: students.length, icon: User, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Active', value: totalActive, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: students.length - totalActive, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {([
            { id: 'all' as const, label: 'All', count: students.length },
            { id: 'active' as const, label: 'Active', count: totalActive },
            { id: 'inactive' as const, label: 'Inactive', count: students.length - totalActive },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === t.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
              <span className="ml-1.5 opacity-60">({t.count})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs focus:outline-none focus:border-blue-600" />
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Student</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Branch</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Contact</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No students matching' : 'No students found'}
                </td></tr>
              ) : filtered.map((s) => {
                const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => loadStudentDetail(s)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-bright flex items-center justify-center text-xs font-bold text-white">
                          {name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{displayValue(s.branch_name)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{displayValue(s.email)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={(e) => { e.stopPropagation(); loadStudentDetail(s); }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100">
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedStudent(null); setStudentData(null); }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}>
                {/* Profile header */}
                <div className="shrink-0 border-b border-brand-border bg-gradient-to-br from-blue-50 via-white to-white px-4 sm:px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-bright flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-sm">
                        {fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 truncate">{fullName}</h3>
                        <p className="text-[11px] font-mono text-slate-500 truncate">ID: {selectedStudent.id}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedStudent.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {selectedStudent.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {primaryEnrollment && (
                            <>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {displayValue(primaryEnrollment.program_name || primaryEnrollment.sub_program_name)}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {displayValue(primaryEnrollment.branch_name || selectedStudent.branch_name)}
                              </span>
                              <StatusBadge status={primaryEnrollment.status} map={ENROLLMENT_STATUS_META} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isEditing && (
                        <button type="button" onClick={handleEdit}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      <button type="button" onClick={() => { setSelectedStudent(null); setStudentData(null); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Tabs */}
                  {!isEditing && (
                    <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5 scrollbar-none">
                      {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = detailTab === tab.id;
                        return (
                          <button key={tab.id} type="button" onClick={() => setDetailTab(tab.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors ${
                              active ? 'bg-slate-900 text-white' : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
                            }`}>
                            <Icon className="w-3 h-3" /> {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  {detailLoading ? (
                    <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                  ) : isEditing ? (
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Guardian Phone</label>
                          <input value={editForm.guardianPhone} onChange={e => setEditForm(p => ({ ...p, guardianPhone: e.target.value }))} className={inputClass(fieldErrors.guardianPhone)} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Guardian Email</label>
                          <input value={editForm.guardianEmail} onChange={e => setEditForm(p => ({ ...p, guardianEmail: e.target.value }))} className={inputClass(fieldErrors.guardianEmail)} />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={saving}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {detailTab === 'overview' && (
                        <>
                          <SectionCard title="Personal Information" icon={<User className="w-3.5 h-3.5" />}>
                            <FieldGrid>
                              <FieldItem label="First Name" value={selectedStudent.first_name} />
                              <FieldItem label="Last Name" value={selectedStudent.last_name} />
                              <FieldItem label="Email" value={selectedStudent.email} />
                              <FieldItem label="Phone" value={selectedStudent.phone_number} />
                              <FieldItem label="Student ID" value={selectedStudent.id} mono />
                              <FieldItem label="User ID" value={selectedStudent.user} mono />
                              <FieldItem label="Branch" value={selectedStudent.branch_name} />
                              <FieldItem label="Branch ID" value={selectedStudent.branch} mono />
                              <FieldItem label="Date Joined" value={formatDate(selectedStudent.date_joined)} />
                              <FieldItem label="Status" value={selectedStudent.is_active ? 'Active' : 'Inactive'} />
                              <FieldItem label="Created At" value={formatDateTime(selectedStudent.created_at)} />
                              <FieldItem label="Updated At" value={formatDateTime(selectedStudent.updated_at)} />
                            </FieldGrid>
                          </SectionCard>
                          <SectionCard title="Guardian Information" icon={<Shield className="w-3.5 h-3.5" />}>
                            <FieldGrid>
                              <FieldItem label="Guardian Name" value={selectedStudent.guardian_name} />
                              <FieldItem label="Guardian Phone" value={selectedStudent.guardian_phone} />
                              <FieldItem label="Guardian Email" value={selectedStudent.guardian_email} />
                            </FieldGrid>
                          </SectionCard>
                          <SectionCard title="Quick Summary" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-lg font-bold text-slate-900">{studentData?.enrollments.length ?? 0}</p>
                                <p className="text-[10px] text-slate-500">Enrollments</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-lg font-bold text-slate-900">{studentData?.payments.length ?? 0}</p>
                                <p className="text-[10px] text-slate-500">Payments</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-lg font-bold text-slate-900">{studentData?.certificates.length ?? 0}</p>
                                <p className="text-[10px] text-slate-500">Certificates</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-lg font-bold text-emerald-600">{String(studentData?.attendance?.rate ?? NA)}</p>
                                <p className="text-[10px] text-slate-500">Attendance</p>
                              </div>
                            </div>
                          </SectionCard>
                        </>
                      )}

                      {detailTab === 'academic' && (
                        <>
                          <SectionCard title="Current Program" icon={<BookOpen className="w-3.5 h-3.5" />}>
                            {primaryEnrollment ? (
                              <FieldGrid>
                                <FieldItem label="Program" value={primaryEnrollment.program_name} />
                                <FieldItem label="Sub-Program" value={primaryEnrollment.sub_program_name} />
                                <FieldItem label="Class" value={primaryEnrollment.class_name} />
                                <FieldItem label="Class Type" value={labelize(primaryEnrollment.class_type)} />
                                <FieldItem label="Branch" value={primaryEnrollment.branch_name} />
                                <FieldItem label="Enrollment Status" value={labelize(primaryEnrollment.status)} />
                                <FieldItem label="Enrollment Number" value={primaryEnrollment.enrollment_number || primaryEnrollment.pending_code} mono />
                                <FieldItem label="Payment Status" value={labelize(primaryEnrollment.payment_status ? String(primaryEnrollment.payment_status) : null)} />
                              </FieldGrid>
                            ) : (
                              <p className="text-xs text-slate-400">{NA}</p>
                            )}
                          </SectionCard>
                          <SectionCard title="Progress Summary" icon={<Target className="w-3.5 h-3.5" />}>
                            {studentData?.progress ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div><p className="text-lg font-bold">{String(studentData.progress.completed ?? 0)}</p><p className="text-[10px] text-slate-500">Completed</p></div>
                                <div><p className="text-lg font-bold text-brand-blue">{String(studentData.progress.in_progress ?? 0)}</p><p className="text-[10px] text-slate-500">In Progress</p></div>
                                <div><p className="text-lg font-bold text-slate-400">{String(studentData.progress.not_started ?? 0)}</p><p className="text-[10px] text-slate-500">Not Started</p></div>
                                <div><p className="text-lg font-bold text-emerald-600">{String(studentData.progress.completion_rate ?? '0%')}</p><p className="text-[10px] text-slate-500">Rate</p></div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">{NA}</p>
                            )}
                          </SectionCard>
                        </>
                      )}

                      {detailTab === 'enrollments' && (
                        <SectionCard title={`Enrollment History (${studentData?.enrollments.length ?? 0})`} icon={<BookOpen className="w-3.5 h-3.5" />}>
                          {!studentData?.enrollments.length ? (
                            <p className="text-xs text-slate-400">{NA}</p>
                          ) : (
                            <div className="space-y-2">
                              {studentData.enrollments.map(e => (
                                <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-900 truncate">{displayValue(e.class_name || e.sub_program_name)}</p>
                                      <p className="text-[11px] text-slate-500">{displayValue(e.program_name)} · {displayValue(e.branch_name)}</p>
                                      <p className="text-[10px] font-mono text-brand-blue mt-1">{displayValue(e.enrollment_number || e.pending_code)}</p>
                                    </div>
                                    <StatusBadge status={e.status} map={ENROLLMENT_STATUS_META} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-500">
                                    <span>Enrolled: {formatDate(e.enrolled_at)}</span>
                                    <span>Payment: {labelize(e.payment_status ? String(e.payment_status) : null)}</span>
                                    <span>Verification: {labelize(e.verification_status)}</span>
                                    <span>Updated: {formatDate(e.updated_at)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </SectionCard>
                      )}

                      {detailTab === 'attendance' && (
                        <>
                          <SectionCard title="Attendance Summary" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                            {studentData?.attendance ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div><p className="text-lg font-bold">{String(studentData.attendance.present ?? 0)}</p><p className="text-[10px] text-slate-500">Present</p></div>
                                <div><p className="text-lg font-bold">{String(studentData.attendance.absent ?? 0)}</p><p className="text-[10px] text-slate-500">Absent</p></div>
                                <div><p className="text-lg font-bold">{String(studentData.attendance.late ?? studentData.attendance.excused ?? 0)}</p><p className="text-[10px] text-slate-500">Other</p></div>
                                <div><p className="text-lg font-bold text-emerald-600">{String(studentData.attendance.rate ?? '0%')}</p><p className="text-[10px] text-slate-500">Rate</p></div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">{NA}</p>
                            )}
                          </SectionCard>
                          <SectionCard title="Attendance History" icon={<Calendar className="w-3.5 h-3.5" />}>
                            {!studentData?.attendanceHistory.length ? (
                              <p className="text-xs text-slate-400">{NA}</p>
                            ) : (
                              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                {studentData.attendanceHistory.map(r => (
                                  <div key={r.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-xs">
                                    <span className="text-slate-600">{formatDate(r.created_at)}</span>
                                    <span className="font-bold text-slate-800">{labelize(r.status)}</span>
                                    <span className="text-slate-400 truncate max-w-[120px]">{displayValue(r.remarks)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </SectionCard>
                        </>
                      )}

                      {detailTab === 'payments' && (
                        <SectionCard title={`Payments (${studentData?.payments.length ?? 0})`} icon={<CreditCard className="w-3.5 h-3.5" />}>
                          {!studentData?.payments.length ? (
                            <p className="text-xs text-slate-400">{NA}</p>
                          ) : (
                            <div className="space-y-2">
                              {studentData.payments.map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-emerald-700">{formatMoneyCompact(p.amount)}</p>
                                    <p className="text-[10px] text-slate-500">{labelize(p.payment_method)} · {formatDate(p.payment_date || p.created_at)}</p>
                                    <p className="text-[10px] font-mono text-slate-400 truncate">{displayValue(p.transaction_reference)}</p>
                                  </div>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                    {labelize(String(p.status))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </SectionCard>
                      )}

                      {detailTab === 'certificates' && (
                        <SectionCard title={`Certificates (${studentData?.certificates.length ?? 0})`} icon={<Award className="w-3.5 h-3.5" />}>
                          {!studentData?.certificates.length ? (
                            <p className="text-xs text-slate-400">{NA}</p>
                          ) : (
                            <div className="space-y-2">
                              {studentData.certificates.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-xl text-xs border border-slate-100">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{displayValue(c.certificate_title || c.sub_program_name)}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{displayValue(c.certificate_number)}</p>
                                  </div>
                                  <span className="text-slate-400 shrink-0">{formatDate(c.issued_at)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </SectionCard>
                      )}

                      {detailTab === 'history' && (
                        <SectionCard title="Record Timeline" icon={<History className="w-3.5 h-3.5" />}>
                          <div className="space-y-3">
                            <FieldGrid>
                              <FieldItem label="Profile Created" value={formatDateTime(selectedStudent.created_at)} />
                              <FieldItem label="Profile Updated" value={formatDateTime(selectedStudent.updated_at)} />
                              <FieldItem label="Date Joined" value={formatDate(selectedStudent.date_joined)} />
                            </FieldGrid>
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Enrollment events</p>
                              {!studentData?.enrollments.length ? (
                                <p className="text-xs text-slate-400">{NA}</p>
                              ) : (
                                [...studentData.enrollments]
                                  .sort((a, b) => (b.enrolled_at || '').localeCompare(a.enrolled_at || ''))
                                  .map(e => (
                                    <div key={e.id} className="flex items-center gap-3 text-xs">
                                      <span className="text-slate-400 font-mono w-24 shrink-0">{formatDate(e.enrolled_at)}</span>
                                      <StatusBadge status={e.status} map={ENROLLMENT_STATUS_META} />
                                      <span className="text-slate-700 truncate">{displayValue(e.class_name)}</span>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        </SectionCard>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
