import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, DollarSign, Loader2, RefreshCw, Calendar } from 'lucide-react';
import {
  fetchEnrollmentsApi,
  fetchPaymentsListApi,
  fetchAttendanceSessionsApi,
} from '@/domains/learning/academics/api/academicApi';

const ICON_MAP: Record<string, { icon: typeof CheckCircle2; bg: string; color: string }> = {
  ENROLLMENT: { icon: CheckCircle2, bg: 'bg-blue-100', color: 'text-blue-600' },
  PAYMENT: { icon: DollarSign, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  ATTENDANCE: { icon: Calendar, bg: 'bg-green-100', color: 'text-green-600' },
};

type FeedItem = { icon: typeof CheckCircle2; bg: string; color: string; bold: string; text: string; time: string; ts: number };

interface Props {
  mode?: 'staff' | 'instructor';
  classId?: string;
}

export default function ActivityFeed({ mode = 'staff', classId = '' }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  function toTs(val: string | undefined | null): number {
    if (!val) return 0;
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function fmtDate(val: string | undefined | null): string {
    if (!val) return '';
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const loadActivity = () => {
    setLoading(true);

    if (mode === 'instructor') {
      fetchAttendanceSessionsApi(classId || undefined)
        .then(sessions => {
          const arr = Array.isArray(sessions) ? sessions : [];
          const feed: FeedItem[] = arr.slice(0, 10).map(s => {
            const style = ICON_MAP.ATTENDANCE;
            return {
              icon: style.icon,
              bg: style.bg,
              color: style.color,
              bold: s.class_name || 'Class',
              text: s.topic || 'Attendance session',
              time: fmtDate(s.session_date),
              ts: toTs(s.session_date),
            };
          });
          setItems(feed);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([fetchEnrollmentsApi(), fetchPaymentsListApi()])
      .then(([enr, pay]) => {
        const enrollments = Array.isArray(enr) ? enr : [];
        const payments = Array.isArray(pay) ? pay : [];
        const feed: FeedItem[] = [];

        enrollments.slice(0, 5).forEach(e => {
          const s = ICON_MAP.ENROLLMENT;
          feed.push({
            icon: s.icon, bg: s.bg, color: s.color,
            bold: e.student_name || 'Student',
            text: `enrolled in ${e.class_name || e.sub_program_name || 'class'}`,
            time: fmtDate(e.enrolled_at),
            ts: toTs(e.enrolled_at),
          });
        });

        payments.slice(0, 3).forEach(p => {
          const s = ICON_MAP.PAYMENT;
          feed.push({
            icon: s.icon, bg: s.bg, color: s.color,
            bold: p.student_name || 'Student',
            text: `${p.status === 'PAID' ? 'completed' : 'initiated'} payment of ${Number(p.amount).toLocaleString()} Birr`,
            time: fmtDate(p.payment_date),
            ts: toTs(p.payment_date),
          });
        });

        feed.sort((a, b) => b.ts - a.ts);

        setItems(feed.slice(0, 10));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadActivity(); }, [mode, classId]);

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
            <div key={i} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-bold text-slate-900">{item.bold}</span> {item.text}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
