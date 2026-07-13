import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Users, BookOpen, DollarSign, Award, Download, Loader2 } from 'lucide-react';
import { Enrollment, EnrollmentPayment, StudentProfile, StudentCertificate, AcademicClass, UserProfile } from '@/src/shared/types';
import {
  fetchEnrollmentsApi, fetchPaymentsApi, fetchStudentsApi, fetchStudentCertificatesApi,
  fetchClassesApi, fetchProgramsApi, fetchSubProgramsApi,
  downloadStudentReportPdf, downloadEnrollmentReportPdf,
  downloadAttendanceReportPdf, downloadProgressReportPdf,
  downloadCertificateReportPdf, downloadClassReportPdf,
  downloadSubProgramReportPdf, downloadProgramReportPdf
} from '@/src/domains/learning/academics/api/academicApi';
import type { Program, SubProgram } from '@/src/shared/types';

export default function ReportsPanel({ currentUser }: { currentUser?: UserProfile }) {
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
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<StudentProfile[]>([]);

  useEffect(() => {
    const isSecretary = currentUser?.role === 'Secretary';
    Promise.allSettled([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
      fetchStudentsApi(),
      fetchStudentCertificatesApi(),
      isSecretary ? Promise.resolve([]) : fetchClassesApi(),
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
  const pendingEnrollments = enrollments.filter(e => e.status === 'PENDING_PAYMENT');
  const cashPayments = payments.filter(p => p.payment_method === 'CASH');

  const doDownload = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    try { await fn(); } catch (e) { console.error('Download failed', e); }
    setTimeout(() => setDownloading(null), 1500);
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
        { label: 'Total Collected', value: `${totalPaid.toLocaleString()} Birr`, color: 'text-emerald-600' },
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

  const handleDownloadAggregate = () => {
    switch (reportType) {
      case 'student':
        if (selectedStudent) {
          doDownload('academic', () => downloadStudentReportPdf(selectedStudent));
          doDownload('enrollments', () => downloadEnrollmentReportPdf(selectedStudent));
          doDownload('attendance', () => downloadAttendanceReportPdf(selectedStudent));
          doDownload('progress', () => downloadProgressReportPdf(selectedStudent));
          doDownload('certificates', () => downloadCertificateReportPdf(selectedStudent));
        }
        break;
      case 'class':
        if (selectedClass) doDownload('class', () => downloadClassReportPdf(selectedClass));
        break;
      case 'subprogram':
        if (selectedSubProgram) doDownload('subprogram', () => downloadSubProgramReportPdf(selectedSubProgram));
        break;
      case 'program':
        if (selectedProgram) doDownload('program', () => downloadProgramReportPdf(selectedProgram));
        break;
    }
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

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">Download Reports</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {downloadOptions.map(opt => (
            <button key={opt.type} onClick={() => setReportType(opt.type)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${reportType === opt.type ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            {reportType === 'student' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Select Student</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose student...</option>
                  {students.map(s => {
                    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                    return <option key={s.id} value={s.id}>{name}</option>;
                  })}
                </select>
              </div>
            )}
            {reportType === 'class' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Select Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.branch_name || 'Branch'}</option>)}
                </select>
              </div>
            )}
            {reportType === 'subprogram' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Select Sub-Program</label>
                <select value={selectedSubProgram} onChange={e => setSelectedSubProgram(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose sub-program...</option>
                  {subPrograms.map(sp => <option key={sp.id} value={sp.id}>{sp.name} — {sp.program_name || 'Program'}</option>)}
                </select>
              </div>
            )}
            {reportType === 'program' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Select Program</label>
                <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                  <option value="">Choose program...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <button onClick={handleDownloadAggregate} disabled={
            (reportType === 'student' && !selectedStudent) ||
            (reportType === 'class' && !selectedClass) ||
            (reportType === 'subprogram' && !selectedSubProgram) ||
            (reportType === 'program' && !selectedProgram) ||
            !!downloading
          } className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0">
            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
            {downloading ? 'Downloading...' : 'Download Report'}
          </button>
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
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : e.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' : e.status === 'COMPLETED' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-red-100 text-red-600'}`}>
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
