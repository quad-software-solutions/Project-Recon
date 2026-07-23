import type { ElementType } from 'react';
import { motion } from 'motion/react';
import {
  FileText, CheckCircle2, Award, Users, Calendar, Building, Sparkles, BookOpen,
  UserPlus, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { Certificate, StudentCertificate, StudentProfile } from '@/shared/types';

type NavTab = 'templates' | 'issue' | 'issued' | 'verify';

export default function OverviewTab({
  templates, activeTemplates, issuedCerts, recentCerts, uniqueStudents, students, onNavigate,
}: {
  templates: Certificate[];
  activeTemplates: Certificate[];
  issuedCerts: StudentCertificate[];
  recentCerts: StudentCertificate[];
  uniqueStudents: number;
  students: StudentProfile[];
  onNavigate?: (tab: NavTab) => void;
}) {
  const stats = [
    { label: 'Total Templates', value: templates.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Templates', value: activeTemplates.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Certificates Issued', value: issuedCerts.length, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Students Certified', value: uniqueStudents, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Issued (30d)', value: recentCerts.length, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Students', value: students.length, icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const actions: { id: NavTab; label: string; desc: string; icon: ElementType }[] = [
    { id: 'templates', label: 'Manage Templates', desc: 'Create or edit certificate designs', icon: FileText },
    { id: 'issue', label: 'Issue Certificate', desc: 'Award credentials to students', icon: UserPlus },
    { id: 'issued', label: 'View Issued', desc: 'Browse and export issued certs', icon: Award },
    { id: 'verify', label: 'Verify Number', desc: 'Look up a public certificate', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Credentials at a glance</h2>
            <p className="text-sm text-slate-500">Templates, issuance volume, and recent activity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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

      {onNavigate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onNavigate(a.id)}
                className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
                <p className="font-bold text-sm text-slate-900 mt-3">{a.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{a.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recent Certificates
            </h4>
            {onNavigate && recentCerts.length > 0 && (
              <button type="button" onClick={() => onNavigate('issued')} className="text-[10px] font-bold text-blue-600 hover:underline">
                View all
              </button>
            )}
          </div>
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
                    <p className="text-[10px] text-slate-400 truncate">{c.certificate_title}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{c.issued_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Template Summary
            </h4>
            {onNavigate && templates.length > 0 && (
              <button type="button" onClick={() => onNavigate('templates')} className="text-[10px] font-bold text-blue-600 hover:underline">
                Manage
              </button>
            )}
          </div>
          {templates.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-slate-400">No templates yet</p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('templates')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Create your first template
                </button>
              )}
            </div>
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
