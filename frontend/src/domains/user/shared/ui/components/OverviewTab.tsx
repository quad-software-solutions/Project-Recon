import { motion } from 'motion/react';
import { FileText, CheckCircle2, Award, Users, Calendar, Building, Sparkles, BookOpen } from 'lucide-react';
import { Certificate, StudentCertificate, StudentProfile } from '@/shared/types';

export default function OverviewTab({ templates, activeTemplates, issuedCerts, recentCerts, uniqueStudents, students }: {
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
