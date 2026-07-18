import { useMemo } from 'react';
import { Calendar, BookOpen, Loader2 } from 'lucide-react';
import type { TeacherClassOption } from '../../api/teacherData';

interface Props {
  classes: TeacherClassOption[];
  loading?: boolean;
}

export default function TeacherCalendar({ classes, loading }: Props) {
  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-lg text-slate-900">My Classes</h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">{classes.length}</span>
      </div>
      {classes.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No classes assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map(c => (
            <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-bold text-sm text-slate-900">{c.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
