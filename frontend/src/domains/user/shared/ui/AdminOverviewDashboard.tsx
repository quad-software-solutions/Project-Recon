import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users, GraduationCap, Award, DollarSign, BookOpen, Building, ClipboardList,
  Loader2, TrendingUp, Calendar, AlertTriangle, RefreshCw, Shield, Mail,
  Phone, MapPin, Clock, CheckCircle, XCircle, Plus, Star, UserCheck, Activity,
} from 'lucide-react';
import { fetchUsersApi, branchesApi, resolveRole, type AdminUserResponse, type BranchResponse } from '../api/adminApi';
import {
  fetchProgramsApi, fetchClassesApi, fetchEnrollmentsApi, fetchPaymentsApi,
} from '@/src/domains/learning/academics/api/academicApi';

type StatCard = {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  detail?: string;
};

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
      <span className="text-[10px] text-slate-400 w-12 text-right">{pct.toFixed(1)}%</span>
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
      <span className="text-[10px] text-slate-400 w-12 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

function EnrollmentByProgram({ data }: { data: { name: string; count: number; total: number }[] }) {
  return (
    <div className="space-y-2">
      {data.map((p) => {
        const pct = p.total > 0 ? (p.count / p.total) * 100 : 0;
        return (
          <div key={p.name} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-32 sm:w-40 shrink-0 truncate font-medium">{p.name}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-brand-red"
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 w-10 text-right">{p.count}</span>
          </div>
        );
      })}
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

export default function AdminOverviewDashboard() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetchUsersApi(),
      branchesApi.list(),
      fetchProgramsApi(),
      fetchClassesApi(),
      fetchEnrollmentsApi(),
      fetchPaymentsApi(),
    ])
      .then(([u, b, p, c, e, pay]) => {
        setUsers(Array.isArray(u) ? u : u?.results ?? []);
        setBranches(Array.isArray(b) ? b : []);
        setPrograms(Array.isArray(p) ? p : []);
        setClasses(Array.isArray(c) ? c : []);
        setEnrollments(Array.isArray(e) ? e : []);
        setPayments(Array.isArray(pay) ? pay : []);
      })
      .catch(() => {})
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
  const paidPayments = payments.filter((p: any) => p.status === 'PAID');
  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING');
  const totalRevenue = paidPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const enrollmentByProgram = useMemo(() => {
    const map: Record<string, number> = {};
    enrollments.forEach((e: any) => {
      const name = e.sub_program_name || e.program_name || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, total: enrollments.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [enrollments]);

  const stats: StatCard[] = [
    {
      label: 'Total Users', value: String(totalUsers), icon: Users,
      color: 'text-brand-blue', bg: 'bg-brand-blue/5',
      detail: `${Object.values(usersByRole).reduce((a, b) => a + b, 0)} accounts`,
    },
    {
      label: 'Students', value: String(usersByRole['Student'] || 0), icon: GraduationCap,
      color: 'text-emerald-600', bg: 'bg-emerald-50',
    },
    {
      label: 'Instructors', value: String(usersByRole['Instructor'] || 0), icon: Award,
      color: 'text-purple-600', bg: 'bg-purple-50',
      detail: `${usersByRole['Secretary'] || 0} secretaries`,
    },
    {
      label: 'Active Programs', value: String(programs.filter((p: any) => p.is_active !== false).length), icon: BookOpen,
      color: 'text-blue-600', bg: 'bg-blue-50',
      detail: `${programs.length} total`,
    },
    {
      label: 'Active Classes', value: String(classes.filter((c: any) => c.is_active !== false).length), icon: Calendar,
      color: 'text-amber-600', bg: 'bg-amber-50',
      detail: `${classes.length} total`,
    },
    {
      label: 'Enrollments', value: String(activeEnrollments.length), icon: ClipboardList,
      color: 'text-rose-600', bg: 'bg-rose-50',
      detail: `${enrollments.length} total`,
    },
    {
      label: 'Revenue', value: `${totalRevenue.toLocaleString()} ETB`, icon: DollarSign,
      color: 'text-emerald-600', bg: 'bg-emerald-50',
      detail: `${paidPayments.length} paid payments`,
    },
    {
      label: 'Branches', value: String(branches.filter((b: any) => b.status === 'Active').length), icon: Building,
      color: 'text-slate-700', bg: 'bg-slate-100',
      detail: `${branches.length} total`,
    },
  ];

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Platform summary at {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <StatCards stats={stats} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* User Distribution */}
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
            <RoleDistributionBar label="Students (Other)" count={usersByRole['Parent'] || 0} total={totalUsers} color="bg-sky-500" />
          </div>
        </div>

        {/* Payment Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Payment Overview</h3>
            <span className="text-[10px] font-semibold text-slate-400">{payments.length} total</span>
          </div>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <DollarSign className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No payment data yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <PaymentBar status="Paid" count={paidPayments.length} total={payments.length} color="bg-emerald-500" />
                <PaymentBar status="Pending" count={pendingPayments.length} total={payments.length} color="bg-amber-500" />
                <PaymentBar status="Other" count={payments.length - paidPayments.length - pendingPayments.length} total={payments.length} color="bg-slate-300" />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Total Revenue</span>
                  <span className="text-lg font-bold text-slate-900">{totalRevenue.toLocaleString()} ETB</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Enrollment by Program */}
        {enrollmentByProgram.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Enrollments by Program</h3>
              <span className="text-[10px] font-semibold text-slate-400">{enrollments.length} total</span>
            </div>
            <EnrollmentByProgram data={enrollmentByProgram} />
          </div>
        )}

        {/* Recent Users */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Recently Joined</h3>
            <span className="text-[10px] font-semibold text-slate-400">latest users</span>
          </div>
          {recentUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No users yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-red to-brand-red-dark flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                      {resolveRole(u.assignments || [])}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(u.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Branch quick view */}
      {branches.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Branches</h3>
            <span className="text-[10px] font-semibold text-slate-400">{branches.length} total</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {branches.slice(0, 8).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{b.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{b.code}</span>
                    {b.city && <><span>·</span><span>{b.city}</span></>}
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${b.status === 'Active' ? 'bg-emerald-500' : b.status === 'Inactive' ? 'bg-amber-500' : 'bg-slate-400'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
