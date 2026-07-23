import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Users, BookOpen, DollarSign, Award, Download, Loader2, CalendarCheck, GraduationCap, Layers3 } from 'lucide-react';
import { Enrollment, EnrollmentPayment, StudentProfile, StudentCertificate, AcademicClass, UserProfile } from '@/shared/types';
import {
  fetchEnrollmentsPaginatedApi, fetchPaymentsApi, fetchStudentsApi, fetchStudentCertificatesApi,
  fetchClassesApi, fetchProgramsApi, fetchSubProgramsApi,
  downloadStudentReportPdf, downloadEnrollmentReportPdf,
  downloadAttendanceReportPdf, downloadProgressReportPdf,
  downloadCertificateReportPdf, downloadClassReportPdf,
  downloadSubProgramReportPdf, downloadProgramReportPdf
} from '@/domains/learning/academics/api/academicApi';
import { fetchAllPages } from '@/shared/api/pagination';
import { formatMoneyCompact } from '@/shared/utils/formatCurrency';
import type { Program, SubProgram } from '@/shared/types';

export default function ReportsPanel({ currentUser: _currentUser }: { currentUser?: UserProfile }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<EnrollmentPayment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [certs, setCerts] = useState<StudentCertificate[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubProgram, setSelectedSubProgram] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [reportType, setReportType] = useState<'student' | 'class' | 'subprogram' | 'program'>('student');

  useEffect(() => {
    Promise.allSettled([
      fetchAllPages((p) => fetchEnrollmentsPaginatedApi(p)),
      fetchPaymentsApi(),
      fetchStudentsApi(),
      fetchStudentCertificatesApi(),
      fetchClassesApi(),
      fetchProgramsApi(),
      fetchSubProgramsApi(),
    ]).then(([enr, pay, stu, cer, cls, prog, sub]) => {
      const enrV = enr.status === 'fulfilled' && Array.isArray(enr.value) ? enr.value : [];
      const payV = pay.status === 'fulfilled' && Array.isArray(pay.value) ? pay.value : [];
      const stuV = stu.status === 'fulfilled' && Array.isArray(stu.value) ? stu.value : [];
      const cerV = cer.status === 'fulfilled' && Array.isArray(cer.value) ? cer.value : [];
      const clsV = cls.status === 'fulfilled' && Array.isArray(cls.value) ? cls.value : [];
      const progV = prog.status === 'fulfilled' && Array.isArray(prog.value) ? prog.value : [];
      const subV = sub.status === 'fulfilled' && Array.isArray(sub.value) ? sub.value : [];
      setEnrollments(enrV);
      setPayments(payV);
      setStudents(stuV);
      setCerts(cerV);
      setClasses(clsV);
      setPrograms(progV);
      setSubPrograms(subV);
      if (stuV.length > 0) setSelectedStudent(stuV[0].id);
      if (clsV.length > 0) setSelectedClass(clsV[0].id);
      if (subV.length > 0) setSelectedSubProgram(subV[0].id);
      if (progV.length > 0) setSelectedProgram(progV[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const activeStudents = students.filter(s => s.is_active);
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_VERIFICATION');
  const cashPayments = payments.filter(p => p.payment_method === 'CASH');

  const doDownload = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    try { await fn(); } catch (e) { console.error('Download failed', e); }
    setTimeout(() => setDownloading(null), 1500);
  };

  const downloadAllStudentReports = async () => {
    if (!selectedStudent) return;
    await downloadStudentReportPdf(selectedStudent);
    await downloadEnrollmentReportPdf(selectedStudent);
    await downloadAttendanceReportPdf(selectedStudent);
    await downloadProgressReportPdf(selectedStudent);
    await downloadCertificateReportPdf(selectedStudent);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const reportCards = [
    {
      key: 'students', label: 'Student Roster', icon: Users,
      stats: [
        { label: 'Total', value: students.length, color: 'text-brand-blue' },
        { label: 'Active', value: activeStudents.length, color: 'text-emerald-600' },
        { label: 'Inactive', value: students.length - activeStudents.length, color: 'text-slate-500' },
      ],
    },
    {
      key: 'enrollments', label: 'Enrollment Summary', icon: BookOpen,
      stats: [
        { label: 'Total', value: enrollments.length, color: 'text-brand-blue' },
        { label: 'Active', value: activeEnrollments.length, color: 'text-emerald-600' },
        { label: 'Pending', value: pendingEnrollments.length, color: 'text-amber-600' },
        { label: 'Completed', value: enrollments.filter(e => e.status === 'COMPLETED').length, color: 'text-purple-600' },
      ],
    },
    {
      key: 'payments', label: 'Payment Report', icon: DollarSign,
      stats: [
        { label: 'Total Collected', value: formatMoneyCompact(totalPaid), color: 'text-emerald-600' },
        { label: 'Transactions', value: payments.length, color: 'text-brand-blue' },
        { label: 'Cash', value: cashPayments.length, color: 'text-amber-600' },
        { label: 'Paid', value: payments.filter(p => p.status === 'PAID').length, color: 'text-emerald-600' },
      ],
    },
    {
      key: 'certificates', label: 'Certificate Log', icon: Award,
      stats: [
        { label: 'Total Issued', value: certs.length, color: 'text-purple-600' },
        { label: 'Last Issued', value: certs[0]?.issued_at?.slice(0, 10) || '—', color: 'text-slate-600' },
      ],
    },
  ];

  const downloadOptions: { type: typeof reportType; label: string }[] = [
    { type: 'student', label: 'Per Student' },
    { type: 'class', label: 'By Class' },
    { type: 'subprogram', label: 'By Sub-Program' },
    { type: 'program', label: 'By Program' },
  ];

  const reportActions = {
    student: [
      { key: 'student-academic', title: 'Complete Student Report', desc: 'Profile, enrollment, attendance, progress, and certificates.', icon: FileText, disabled: !selectedStudent, download: () => downloadStudentReportPdf(selectedStudent) },
      { key: 'student-enrollment', title: 'Enrollment History', desc: 'All enrollment records and payment status for the student.', icon: BookOpen, disabled: !selectedStudent, download: () => downloadEnrollmentReportPdf(selectedStudent) },
      { key: 'student-attendance', title: 'Attendance Summary', desc: 'Present, absent, late, and excused attendance totals.', icon: CalendarCheck, disabled: !selectedStudent, download: () => downloadAttendanceReportPdf(selectedStudent) },
      { key: 'student-progress', title: 'Progress Report', desc: 'Milestone status and learning progress details.', icon: GraduationCap, disabled: !selectedStudent, download: () => downloadProgressReportPdf(selectedStudent) },
      { key: 'student-certificates', title: 'Certificate Report', desc: 'Issued certificate numbers, dates, and issuing staff.', icon: Award, disabled: !selectedStudent, download: () => downloadCertificateReportPdf(selectedStudent) },
    ],
    class: [
      { key: 'class-report', title: 'Class Report', desc: 'Roster, attendance sessions, and class learning progress.', icon: Users, disabled: !selectedClass, download: () => downloadClassReportPdf(selectedClass) },
    ],
    subprogram: [
      { key: 'subprogram-report', title: 'Sub-Program Report', desc: 'Sub-program details, classes, enrollment totals, and capacity.', icon: Layers3, disabled: !selectedSubProgram, download: () => downloadSubProgramReportPdf(selectedSubProgram) },
    ],
    program: [
      { key: 'program-report', title: 'Program Report', desc: 'Program overview, sub-program list, and enrollment totals.', icon: BookOpen, disabled: !selectedProgram, download: () => downloadProgramReportPdf(selectedProgram) },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Academic Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time summaries with PDF export</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((r, i) => {
          const RIcon = r.icon;
          return (
            <motion.div key={r.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/5 flex items-center justify-center">
                  <RIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="font-bold text-base text-slate-900">{r.label}</h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {r.stats.map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/5 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Download Reports</h3>
              <p className="text-xs text-slate-500 mt-0.5">Separate PDFs by student, class, sub-program, and program.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {downloadOptions.map(opt => (
              <button key={opt.type} onClick={() => setReportType(opt.type)}
                className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${reportType === opt.type ? 'bg-brand-blue text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-0">
          <div className="p-5 border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-50/60">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Report Subject</p>
            {reportType === 'student' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Student</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose student...</option>
                  {students.map(s => {
                    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                    return <option key={s.id} value={s.id}>{name}</option>;
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-2">{students.length} students available</p>
              </div>
            )}
            {reportType === 'class' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.branch_name || 'Branch'}</option>)}
                </select>
                <p className="text-[11px] text-slate-500 mt-2">{classes.length} classes available</p>
              </div>
            )}
            {reportType === 'subprogram' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Sub-Program</label>
                <select value={selectedSubProgram} onChange={e => setSelectedSubProgram(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose sub-program...</option>
                  {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name} - {sp.program_name || 'Program'}</option>)}
                </select>
                <p className="text-[11px] text-slate-500 mt-2">{subPrograms.length} sub-programs available</p>
              </div>
            )}
            {reportType === 'program' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Program</label>
                <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose program...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <p className="text-[11px] text-slate-500 mt-2">{programs.length} programs available</p>
              </div>
            )}
          </div>

          <div className="p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Single PDF Downloads</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {reportActions[reportType].map(action => {
                const ActionIcon = action.icon;
                const isDownloading = downloading === action.key;
                return (
                  <button key={action.key}
                    onClick={() => doDownload(action.key, action.download)}
                    disabled={action.disabled || !!downloading}
                    className="group flex min-h-[92px] items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white shrink-0">
                        <ActionIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{action.title}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-5">{action.desc}</p>
                      </div>
                    </div>
                    <div className="h-8 min-w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {reportType === 'student' && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Bulk Student Pack</p>
                      <p className="text-xs text-slate-500 mt-1 leading-5">Downloads complete, enrollment, attendance, progress, and certificate PDFs for the selected student.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => doDownload('student-bulk', downloadAllStudentReports)}
                    disabled={!selectedStudent || !!downloading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {downloading === 'student-bulk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Download Pack
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Recent Enrollments</h3>
          <span className="text-[10px] text-slate-500">{enrollments.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Student</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Class</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">Date</th>
              <th className="text-center px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">No enrollments</td></tr>
              ) : enrollments.slice(0, 10).map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{e.student_name || e.student_email || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{e.class_name || e.sub_program_name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 hidden sm:table-cell">{e.enrolled_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : e.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' : e.status === 'COMPLETED' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-red-100 text-red-600'}`}>
                      {e.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
