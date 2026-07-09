import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Edit3, Award, UserPlus, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { fetchEnrollmentsApi, fetchPaymentsApi, fetchStudentProgressApi } from '@/src/domains/learning/academics/api/academicApi';

const ICON_MAP: Record<string, { icon: typeof CheckCircle2; bg: string; color: string }> = {
  ENROLLMENT: { icon: UserPlus, bg: 'bg-blue-100', color: 'text-blue-600' },
  PROGRESS: { icon: Edit3, bg: 'bg-purple-100', color: 'text-purple-600' },
  PAYMENT: { icon: DollarSign, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  COMPLETION: { icon: Award, bg: 'bg-amber-100', color: 'text-amber-600' },
  ATTENDANCE: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
};

export default function ActivityFeed() {
  const [items, setItems] = useState<{ icon: typeof CheckCircle2; bg: string; color: string; bold: string; text: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = () => {
    setLoading(true);
    Promise.all([
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
    ]).then(([enr, pay]) => {
      const enrollments = Array.isArray(enr) ? enr : [];
      const payments = Array.isArray(pay) ? pay : [];
      const feed: typeof items = [];

      enrollments.slice(0, 5).forEach(e => {
        const s = ICON_MAP.ENROLLMENT;
        feed.push({
          icon: s.icon, bg: s.bg, color: s.color,
          bold: e.student_name || 'Student',
          text: `enrolled in ${e.class_name || e.sub_program_name || 'class'}`,
          time: e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'recent',
        });
      });

      payments.slice(0, 3).forEach(p => {
        const s = ICON_MAP.PAYMENT;
        feed.push({
          icon: s.icon, bg: s.bg, color: s.color,
          bold: p.student_name || 'Student',
          text: `${p.status === 'PAID' ? 'completed' : 'initiated'} payment of ${Number(p.amount).toLocaleString()} ETB`,
          time: p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'recent',
        });
      });

      feed.sort((a, b) => {
        const dateA = new Date(a.time).getTime();
        const dateB = new Date(b.time).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) return dateB - dateA;
        return 0;
      });

      setItems(feed.slice(0, 10));
    }).catch(() => {
      setItems([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadActivity(); }, []);

  return (
    <div className="bg-white rounded-[24px] border border-brand-border-light p-6 shadow-sm" id="section-activity">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-blue" /> Recent Activity
        </h3>
        <button onClick={loadActivity} disabled={loading} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No recent activity</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`w-6 h-6 rounded-full ${item.bg} flex items-center justify-center ${item.color} shrink-0`}>
                <item.icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-sans text-xs text-slate-800 leading-snug">
                  <span className="font-bold">{item.bold} </span>{item.text}
                </p>
                <span className="font-mono text-[9px] text-brand-muted mt-0.5 block">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
