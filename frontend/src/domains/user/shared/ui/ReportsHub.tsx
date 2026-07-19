import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, GraduationCap, BookOpen, FileText, DollarSign, Award, Calendar,
  Trophy, BarChart3, Activity, Shield, AlertTriangle, X, Loader2, Search,
  ChevronRight, Download,   FileSpreadsheet, Code, Eye, LayoutGrid, RefreshCw,
} from 'lucide-react';
import { fetchAllUsersApi, branchesApi, type AdminUserResponse, type BranchResponse } from '../api/adminApi';
import { fetchAllPages } from '@/shared/api/pagination';
import { fetchEnrollmentsPaginatedApi, fetchPaymentsApi, fetchProgramsApi, fetchClassesApi } from '@/domains/learning/academics/api/academicApi';
import { downloadCsv, downloadJson, downloadPdf } from '@/shared/utils/export';
import ReportFilters, { DATE_PRESETS } from '@/shared/ui/ReportFilters';

type ReportCategory = 'users' | 'academic' | 'events' | 'finance' | 'system';

interface ReportData {
  title: string;
  rows: Record<string, any>[];
  filename: string;
}

const CATEGORIES: { id: ReportCategory; label: string; icon: any; color: string; reports: { id: string; label: string; icon: any }[] }[] = [
  { id: 'users', label: 'Users & Accounts', icon: Users, color: 'text-blue-600',
    reports: [
      { id: 'all-users', label: 'All Users', icon: Users },
      { id: 'active-users', label: 'Active Users', icon: Shield },
      { id: 'pending-users', label: 'Pending Users', icon: AlertTriangle },
      { id: 'by-role', label: 'Users by Role', icon: GraduationCap },
      { id: 'branches', label: 'Branch Statistics', icon: BarChart3 },
    ] },
  { id: 'academic', label: 'Academic', icon: BookOpen, color: 'text-emerald-600',
    reports: [
      { id: 'programs', label: 'Programs', icon: BookOpen },
      { id: 'classes', label: 'Classes', icon: GraduationCap },
      { id: 'enrollments', label: 'Enrollments', icon: FileText },
      { id: 'payments', label: 'Payments', icon: DollarSign },
    ] },
  { id: 'events', label: 'Events & Competitions', icon: Trophy, color: 'text-amber-600',
    reports: [
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    ] },
  { id: 'system', label: 'System', icon: Activity, color: 'text-purple-600',
    reports: [
      { id: 'audit', label: 'Audit Logs', icon: FileText },
      { id: 'activity', label: 'Activity Logs', icon: Activity },
    ] },
];

interface Props { currentUser: import('@/shared/types').UserProfile; }

export default function ReportsHub({ currentUser }: Props) {
  const [activeCategory, setActiveCategory] = useState<ReportCategory | null>(null);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('30');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetchAllUsersApi().catch(() => []),
      branchesApi.list().catch(() => []),
      fetchProgramsApi().catch(() => []),
      fetchClassesApi().catch(() => []),
      fetchAllPages(p => fetchEnrollmentsPaginatedApi(p)).catch(() => []),
      fetchPaymentsApi().catch(() => []),
    ]).then(([u, b, pr, cl, en, pa]) => {
      setAllUsers(Array.isArray(u) ? u : []);
      setBranches(Array.isArray(b) ? b : []);
      setPrograms(Array.isArray(pr) ? pr : []);
      setClasses(Array.isArray(cl) ? cl : []);
      setEnrollments(Array.isArray(en) ? en : []);
      setPayments(Array.isArray(pa) ? pa : []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const filterByDate = <T extends Record<string, any>>(items: T[], dateField: string): T[] => {
    const days = parseInt(datePreset);
    if (datePreset === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime() + 86400000;
      return items.filter(i => { const d = new Date(i[dateField]).getTime(); return d >= from && d <= to; });
    }
    if (days === 0) return items;
    const cutoff = Date.now() - days * 86400000;
    return items.filter(i => new Date(i[dateField]).getTime() >= cutoff);
  };

  const generateReport = (reportId: string) => {
    setError(null);
    let data: ReportData = { title: '', rows: [], filename: '' };

    switch (reportId) {
      case 'all-users': {
        const rows = filterByDate(allUsers, 'created_at').map(u => ({
          Name: u.full_name, Email: u.email, Status: u.status,
          Role: u.assignments?.find(a => a.is_active)?.role || 'Unassigned',
          Email_Verified: u.is_email_verified ? 'Yes' : 'No',
          Registered: u.created_at?.slice(0, 10) || '',
        }));
        data = { title: 'All Users Report', rows, filename: 'all-users' };
        break;
      }
      case 'active-users': {
        const rows = filterByDate(allUsers.filter(u => u.status === 'Active'), 'created_at').map(u => ({
          Name: u.full_name, Email: u.email,
          Role: u.assignments?.find(a => a.is_active)?.role || '—',
          Registered: u.created_at?.slice(0, 10) || '',
        }));
        data = { title: 'Active Users Report', rows, filename: 'active-users' };
        break;
      }
      case 'pending-users': {
        const rows = filterByDate(allUsers.filter(u => u.status === 'Pending' || !u.assignments?.some(a => a.is_active)), 'created_at').map(u => ({
          Name: u.full_name, Email: u.email,
          Status: u.status, Registered: u.created_at?.slice(0, 10) || '',
        }));
        data = { title: 'Pending Users Report', rows, filename: 'pending-users' };
        break;
      }
      case 'by-role': {
        const roleCount: Record<string, { count: number; active: number }> = {};
        allUsers.forEach(u => {
          const r = u.assignments?.find(a => a.is_active)?.role || 'Unassigned';
          if (!roleCount[r]) roleCount[r] = { count: 0, active: 0 };
          roleCount[r].count++;
          if (u.status === 'Active') roleCount[r].active++;
        });
        const rows = Object.entries(roleCount).map(([role, stats]) => ({
          Role: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          Total: stats.count, Active: stats.active,
          Inactive: stats.count - stats.active,
        }));
        data = { title: 'Users by Role', rows, filename: 'users-by-role' };
        break;
      }
      case 'branches': {
        const rows = (Array.isArray(branches) ? branches : []).map(b => ({
          Name: b.name, Code: b.code, City: b.city || '—',
          Status: b.status, Email: b.email || '—',
          Users: allUsers.filter(u => u.assignments?.some(a => a.branch_name === b.name)).length,
        }));
        data = { title: 'Branch Statistics', rows, filename: 'branches' };
        break;
      }
      case 'programs': {
        const rows = (Array.isArray(programs) ? programs : []).map((p: any) => ({
          Name: p.name || p.title || '—',
          Code: p.code || '—',
          Status: p.is_active ? 'Active' : 'Inactive',
          Created: p.created_at?.slice(0, 10) || '—',
        }));
        data = { title: 'Programs Report', rows, filename: 'programs' };
        break;
      }
      case 'classes': {
        const rows = (Array.isArray(classes) ? classes : []).map((c: any) => ({
          Name: c.name || c.title || '—',
          Program: c.program_name || c.program || '—',
          Status: c.is_active ? 'Active' : 'Inactive',
          Created: c.created_at?.slice(0, 10) || '—',
        }));
        data = { title: 'Classes Report', rows, filename: 'classes' };
        break;
      }
      case 'enrollments': {
        const rows = (Array.isArray(enrollments) ? enrollments : []).map((e: any) => ({
          Student: e.student_name || e.student || '—',
          Program: e.program_name || e.program || '—',
          Class: e.class_name || e.class || '—',
          Status: e.status || '—',
          Date: e.created_at?.slice(0, 10) || '—',
        }));
        data = { title: 'Enrollments Report', rows, filename: 'enrollments' };
        break;
      }
      case 'payments': {
        const rows = (Array.isArray(payments) ? payments : []).map((p: any) => ({
          Student: p.student_name || p.student || '—',
          Amount: p.amount || '—',
          Status: p.status || '—',
          Method: p.payment_method || '—',
          Date: p.created_at?.slice(0, 10) || '—',
        }));
        data = { title: 'Payments Report', rows, filename: 'payments' };
        break;
      }
      default:
        data = { title: 'Report', rows: [], filename: 'report' };
    }

    const searched = search ? data.rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) : data.rows;
    setReportData({ ...data, rows: searched });
    setActiveReport(reportId);
  };

  const backToCategory = () => { setActiveReport(null); setReportData(null); };
  const backToGrid = () => { setActiveCategory(null); setActiveReport(null); setReportData(null); };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-xl w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}
      </div>
    </div>
  );

  if (activeReport && reportData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={backToGrid} className="text-slate-500 hover:text-slate-700 font-medium">Reports</button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          {activeCategory && <button onClick={backToCategory} className="text-slate-500 hover:text-slate-700 font-medium">{CATEGORIES.find(c => c.id === activeCategory)?.label}</button>}
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">{reportData.title}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{reportData.title}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadCsv(reportData.rows, reportData.filename)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={() => downloadJson(reportData.rows, reportData.filename)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <Code className="w-3.5 h-3.5" /> JSON
            </button>
            <button onClick={() => downloadPdf(reportData.title, reportData.rows)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <p className="text-xs text-slate-500">Generated: {new Date().toLocaleString()} | Rows: {reportData.rows.length}</p>

        {reportData.rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">No Data</h3>
            <p className="text-sm text-slate-500">No records match the current filters.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {Object.keys(reportData.rows[0]).map(k => (
                      <th key={k} className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{k.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">{String(v ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
              {reportData.rows.length} row{reportData.rows.length !== 1 && 's'}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reports Center</h2>
          <p className="text-sm text-slate-500 mt-0.5">Export and analyze platform data.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <ReportFilters
        search={search} onSearchChange={setSearch}
        datePreset={datePreset} onDatePresetChange={setDatePreset}
        dateFrom={dateFrom} dateTo={dateTo}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
      />

      <div className="space-y-8">
        {CATEGORIES.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-4">
              <cat.icon className={`w-5 h-5 ${cat.color}`} />
              <h3 className="font-bold text-lg text-slate-900">{cat.label}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {cat.reports.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setActiveCategory(cat.id); generateReport(r.id); }}
                  className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-900 hover:shadow-sm transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <r.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
