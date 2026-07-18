import { useMemo } from 'react';
import {
  Users, GraduationCap, Calendar, BookOpen, Target, Clock, CheckCircle, Loader2,
} from 'lucide-react';
import type { Enrollment, StudentProfile } from '@/shared/types';
import type { TeacherClassOption } from '../../api/teacherData';

interface Props {
  students: StudentProfile[];
  enrollments: Enrollment[];
  classes: TeacherClassOption[];
  selectedClassId: string;
  mode: 'staff' | 'instructor';
  loading: boolean;
}

export default function DashboardOverview({ students, enrollments, classes, mode, loading }: Props) {
  const stats = useMemo(() => {
    const active = enrollments.filter(e => e.status === 'ACTIVE');
    const pending = enrollments.filter(e => e.status === 'PENDING_VERIFICATION');
    const completed = enrollments.filter(e => e.status === 'COMPLETED');
    const uniqueStudents = new Set(enrollments.map(e => e.student)).size;
    return { active: active.length, pending: pending.length, completed: completed.length, uniqueStudents };
  }, [enrollments]);

  const cards = [
    { label: 'Total Students', value: mode === 'staff' ? students.length : stats.uniqueStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Enrollments', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Classes', value: classes.length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completed', value: stats.completed, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
              <p className="font-black text-2xl text-slate-900 mt-0.5">{String(c.value)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 mb-3">
            <Target className="w-4 h-4 text-slate-400" />
            Enrollment Status
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Active', count: stats.active, color: 'bg-emerald-500' },
              { label: 'Pending', count: stats.pending, color: 'bg-amber-500' },
              { label: 'Completed', count: stats.completed, color: 'bg-blue-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 w-20">{s.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`}
                    style={{ width: `${enrollments.length ? (s.count / enrollments.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Take Attendance', icon: Calendar, desc: 'Mark today\'s class' },
              { label: 'View Roster', icon: Users, desc: 'Student list' },
              { label: 'Upload Material', icon: BookOpen, desc: 'Share resources' },
              { label: 'Class Report', icon: GraduationCap, desc: 'Download PDF' },
            ].map(a => {
              const AIcon = a.icon;
              return (
                <div key={a.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <AIcon className="w-4 h-4 text-blue-600 mb-1" />
                  <p className="text-xs font-bold text-slate-800">{a.label}</p>
                  <p className="text-[10px] text-slate-400">{a.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
