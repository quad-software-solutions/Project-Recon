import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users, GraduationCap, Award, DollarSign, BookOpen, Building, ClipboardList,
  Calendar, AlertTriangle, RefreshCw, Clock, CheckCircle, Zap, Megaphone,
  MessageSquare, FileText, UserPlus, Bell,
} from 'lucide-react';
import {
  fetchAllUsersApi, branchesApi, resolveRole, fetchAuditLogsApi,
  type AdminUserResponse, type BranchResponse, type AuditLogEntry,
} from '../api/adminApi';
import {
  fetchProgramsApi, fetchClassesApi, fetchEnrollmentsApi, fetchPaymentsApi,
} from '@/domains/learning/academics/api/academicApi';
import { cmsContactRequestsApi } from '@/domains/cms/shared/api/cmsApi';
import LiveLeaderboardWidget from '@/domains/competition/shared/LiveLeaderboardWidget';
import type { AdminSectionId } from '../adminCommandCenter';

type StatCard = {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  detail?: string;
};

interface Props {
  onNavigate?: (section: AdminSectionId) => void;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-slate-100 mb-2.5" />
      <div className="h-6 bg-slate-100 rounded w-16 mb-1" />
      <div className="h-4 bg-slate-100 rounded w-24" />
    </div>
  );
}

function StatCards({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s, i) => {
        const SIcon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow-sm transition-all"
          >
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2.5`}>
              <SIcon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{s.label}</p>
            {s.detail && (
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.detail}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function RoleDistributionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs sm:text-sm text-slate-600 w-24 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs sm:text-sm font-semibold text-slate-600 w-16 text-right">{count}</span>
    </div>
  );
}

function PaymentBar({ status, count, total, color }: { status: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-28 shrink-0 font-medium">{status}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-12 text-right">{count}</span>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr.slice(0, 10);
  }
}

const QUICK_ACTIONS: { id: AdminSectionId; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { id: 'users', label: 'User Management', desc: 'Accounts & staff', icon: Users, color: 'from-blue-500 to-blue-600' },
  { id: 'registrations', label: 'Enrollments', desc: 'Pending & active', icon: ClipboardList, color: 'from-emerald-500 to-emerald-600' },
  { id: 'communications', label: 'Contact Requests', desc: 'Inbound messages', icon: MessageSquare, color: 'from-cyan-500 to-cyan-600' },
  { id: 'announcements', label: 'Announcements', desc: 'Publish updates', icon: Megaphone, color: 'from-rose-500 to-pink-600' },
  { id: 'audit', label: 'System Logs', desc: 'Audit trail', icon: FileText, color: 'from-slate-500 to-slate-600' },
  { id: 'cms', label: 'Content Manager', desc: 'CMS & public content', icon: BookOpen, color: 'from-purple-500 to-purple-600' },
];

export default function AdminOverviewDashboard({ onNavigate }: Props) {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [contactRequests, setContactRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetchAllUsersApi().catch(() => [] as AdminUserResponse[]),
      branchesApi.list().catch(() => [] as BranchResponse[]),
      fetchProgramsApi().catch(() => []),
      fetchClassesApi().catch(() => []),
      fetchEnrollmentsApi().catch(() => []),
      fetchPaymentsApi().catch(() => []),
      fetchAuditLogsApi().catch(() => [] as AuditLogEntry[]),
      cmsContactRequestsApi.list().catch(() => []),
    ])
      .then(([u, b, p, c, e, pay, logs, contacts]) => {
        setUsers(Array.isArray(u) ? u : []);
        setBranches(Array.isArray(b) ? b : []);
        setPrograms(Array.isArray(p) ? p : []);
        setClasses(Array.isArray(c) ? c : []);
        setEnrollments(Array.isArray(e) ? e : []);
        setPayments(Array.isArray(pay) ? pay : []);
        setAuditLogs(Array.isArray(logs) ? logs : []);
        setContactRequests(Array.isArray(contacts) ? contacts : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const totalUsers = users.length;

  const usersByRole = useMemo(() => {
    const roles: Record<string, number> = {};
    users.forEach((u) => {
      const role = resolveRole(u.assignments || []);
      roles[role] = (roles[role] || 0) + 1;
    });
    return roles;
  }, [users]);

  const activeEnrollments = enrollments.filter((e: any) => e.status === 'ACTIVE');
  const pendingEnrollments = enrollments.filter((e: any) => e.status === 'PENDING_VERIFICATION');
  const paidPayments = payments.filter((p: any) => p.status === 'PAID');
  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING');
  const totalRevenue = paidPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const openContacts = contactRequests.filter((r: any) => r.status === 'OPEN' || r.status === 'IN_PROGRESS');

  const stats: StatCard[] = [
    { label: 'Total Users', value: String(totalUsers), icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
    { label: 'Students', value: String(usersByRole['Student'] || 0), icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Enrollments', value: String(activeEnrollments.length), icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-50', detail: `${pendingEnrollments.length} pending payment` },
    { label: 'Revenue', value: `${totalRevenue.toLocaleString()} Birr`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', detail: `${paidPayments.length} paid` },
    { label: 'Programs', value: String(programs.filter((p: any) => p.is_active !== false).length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Classes', value: String(classes.filter((c: any) => c.is_active !== false).length), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Open Messages', value: String(openContacts.length), icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Branches', value: String(branches.filter((b: any) => b.status === 'Active').length), icon: Building, color: 'text-slate-700', bg: 'bg-slate-100' },
  ];

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentAudit = [...auditLogs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const recentPending = [...pendingEnrollments]
    .sort((a: any, b: any) => new Date(b.enrolled_at || b.created_at || 0).getTime() - new Date(a.enrolled_at || a.created_at || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Platform summary at {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <StatCards stats={stats} />
      )}

      {onNavigate && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_ACTIONS.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  onClick={() => onNavigate(action.id)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-3 text-left border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                    <ActionIcon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-xs text-slate-900">{action.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{action.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveLeaderboardWidget maxRows={8} pollIntervalMs={20000} />

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Pending Requests
            </h3>
            {pendingEnrollments.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingEnrollments.length} awaiting payment
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}
            </div>
          ) : recentPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No pending enrollments</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {recentPending.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.student_name || e.student_email || 'Student'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{e.class_name || e.program_name || 'Enrollment'}</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 shrink-0">PENDING</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              Recent Activity
            </h3>
            {onNavigate && (
              <button onClick={() => onNavigate('audit')} className="text-[10px] font-bold text-blue-600 hover:underline">
                View all
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
            </div>
          ) : recentAudit.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No audit logs available</p>
          ) : (
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {recentAudit.map(log => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{log.action}</p>
                    <p className="text-[10px] text-slate-400">
                      {log.actor?.full_name || 'System'} · {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              Open Contact Requests
            </h3>
            {onNavigate && openContacts.length > 0 && (
              <button onClick={() => onNavigate('communications')} className="text-[10px] font-bold text-blue-600 hover:underline">
                Manage
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
            </div>
          ) : openContacts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No open contact requests</p>
          ) : (
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {openContacts.slice(0, 6).map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{r.subject}</p>
                    <p className="text-[10px] text-slate-400">{r.name} · {formatDate(r.created_at)}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">User Distribution</h3>
            <span className="text-[10px] font-semibold text-slate-400">{totalUsers} total</span>
          </div>
          <div className="space-y-3">
            <RoleDistributionBar label="Students" count={usersByRole['Student'] || 0} total={totalUsers} color="bg-emerald-500" />
            <RoleDistributionBar label="Instructors" count={usersByRole['Instructor'] || 0} total={totalUsers} color="bg-purple-500" />
            <RoleDistributionBar label="Managers" count={usersByRole['Manager'] || 0} total={totalUsers} color="bg-amber-500" />
            <RoleDistributionBar label="Secretaries" count={usersByRole['Secretary'] || 0} total={totalUsers} color="bg-rose-500" />
            <RoleDistributionBar label="Admins" count={usersByRole['Admin'] || 0} total={totalUsers} color="bg-red-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Payment Overview</h3>
            <span className="text-[10px] font-semibold text-slate-400">{payments.length} total</span>
          </div>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No payment data yet</p>
          ) : (
            <>
              <div className="space-y-3">
                <PaymentBar status="Paid" count={paidPayments.length} total={payments.length} color="bg-emerald-500" />
                <PaymentBar status="Pending" count={pendingPayments.length} total={payments.length} color="bg-amber-500" />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Total Revenue</span>
                <span className="text-lg font-bold text-slate-900">{totalRevenue.toLocaleString()} Birr</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-500" />
              Recently Joined
            </h3>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No users yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 shrink-0">
                    {resolveRole(u.assignments || [])}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {branches.length > 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Branches</h3>
            <span className="text-[10px] font-semibold text-slate-400">{branches.length} total</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {branches.slice(0, 8).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{b.name}</p>
                  <p className="text-[10px] text-slate-400">{b.code}{b.city ? ` · ${b.city}` : ''}</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${b.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
