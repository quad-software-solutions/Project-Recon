import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, RefreshCw, Download, X, ChevronDown, ChevronUp,
  FileText, Edit3, Lock, AlertTriangle, Clock, User, Shield,
  Monitor, Globe, Loader2, Eye, EyeOff, Calendar, Activity
} from 'lucide-react';
import {
  fetchAuditLogsApi,
  type AuditLogEntry,
} from '../api/adminApi';

const typeBadge = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('create') || a.includes('generat')) return { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Create', dot: 'bg-emerald-500' };
  if (a.includes('update') || a.includes('change') || a.includes('edit')) return { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Update', dot: 'bg-amber-500' };
  if (a.includes('delet') || a.includes('remov') || a.includes('suspend') || a.includes('archive')) return { bg: 'bg-red-50', text: 'text-red-600', label: 'Delete', dot: 'bg-red-500' };
  if (a.includes('login') || a.includes('logout')) return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Auth', dot: 'bg-blue-500' };
  return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Info', dot: 'bg-slate-400' };
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const filterPresets = [
  { id: 'all', label: 'All Events', icon: Activity },
  { id: 'write', label: 'Writes', icon: Edit3 },
  { id: 'auth', label: 'Auth', icon: Lock },
  { id: 'danger', label: 'Danger', icon: AlertTriangle },
] as const;

export default function SystemLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'write' | 'auth' | 'danger'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogsApi();
      setLogs(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleLogs = logs.filter(log => {
    const action = log.action.toLowerCase();
    const matchesQuery = [log.action, log.actor?.full_name, log.resource_type, log.ip_address, log.actor?.email]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(query.toLowerCase()));
    const matchesFilter =
      actionFilter === 'all' ||
      (actionFilter === 'auth' && (action.includes('login') || action.includes('logout'))) ||
      (actionFilter === 'danger' && (action.includes('delete') || action.includes('remove') || action.includes('suspend') || action.includes('archive'))) ||
      (actionFilter === 'write' && (action.includes('create') || action.includes('update') || action.includes('change') || action.includes('edit')));
    return matchesQuery && matchesFilter;
  });

  const counts = {
    total: logs.length,
    writes: logs.filter(l => /create|update|change|edit/i.test(l.action)).length,
    auth: logs.filter(l => /login|logout/i.test(l.action)).length,
    danger: logs.filter(l => /delete|remove|suspend|archive/i.test(l.action)).length,
  };

  const handleExport = () => {
    const csv = [
      ['Action', 'Actor', 'Email', 'Resource', 'Resource ID', 'IP Address', 'User Agent', 'Date'],
      ...visibleLogs.map(l => [
        l.action,
        l.actor?.full_name || 'System',
        l.actor?.email || '',
        l.resource_type,
        l.resource_id || '',
        l.ip_address || '',
        l.user_agent || '',
        l.created_at,
      ]),
    ].map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: 'Total Entries', value: String(counts.total), icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Changes', value: String(counts.writes), icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Auth Events', value: String(counts.auth), icon: Lock, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Danger Ops', value: String(counts.danger), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
        ] as const).map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="font-black text-2xl text-slate-900 leading-none">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-1 rounded-lg hover:bg-red-100 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search action, actor, email, IP..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-blue/40 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filterPresets.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActionFilter(item.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-all ${
                  actionFilter === item.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
          <span className="text-xs text-slate-400 font-medium ml-1">{visibleLogs.length} entries</span>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={visibleLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Logs Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading audit logs...</p>
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No audit log entries found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Action</div>
              <div className="col-span-2">Actor</div>
              <div className="col-span-2">Resource</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">IP Address</div>
              <div className="col-span-1" />
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
              {visibleLogs.map((l, i) => {
                const badge = typeBadge(l.action);
                const isExpanded = expandedId === l.id;
                return (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : l.id)}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      {/* Mobile: stacked */}
                      <div className="md:hidden flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-[9px] font-black ${badge.text}`}>{badge.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{l.action}</p>
                          <p className="text-xs text-slate-500 truncate">{l.actor?.full_name || 'System'} · {l.resource_type}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{l.ip_address || '—'}</span>
                            {l.ip_address ? <span className="mx-1.5">·</span> : null}
                            {formatDate(l.created_at)}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </div>

                      {/* Desktop: grid */}
                      <div className="hidden md:flex md:col-span-3 items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-[9px] font-black ${badge.text}`}>{badge.label}</span>
                        </div>
                        <span className="font-semibold text-sm text-slate-900 truncate">{l.action}</span>
                      </div>
                      <div className="hidden md:flex md:col-span-2 items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{l.actor?.full_name || 'System'}</span>
                      </div>
                      <div className="hidden md:flex md:col-span-2 items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 truncate">{l.resource_type}</span>
                        {l.resource_id && <span className="text-[10px] text-slate-400 font-mono">#{l.resource_id.slice(0, 8)}</span>}
                      </div>
                      <div className="hidden md:flex md:col-span-2 items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600" title={formatFullDate(l.created_at)}>{formatDate(l.created_at)}</span>
                      </div>
                      <div className="hidden md:flex md:col-span-2 items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-mono text-slate-600">{l.ip_address || '—'}</span>
                      </div>
                      <div className="hidden md:flex md:col-span-1 justify-end">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-5 mb-3 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Actor</p>
                              <p className="font-semibold text-slate-900">{l.actor?.full_name || 'System'}</p>
                              {l.actor?.email && <p className="text-xs text-slate-500">{l.actor.email}</p>}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">IP Address</p>
                              <p className="font-mono text-xs text-slate-700">{l.ip_address || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resource ID</p>
                              <p className="font-mono text-xs text-slate-700">{l.resource_id || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">User Agent</p>
                              <p className="text-xs text-slate-600 truncate max-w-[200px]" title={l.user_agent || ''}>{l.user_agent || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timestamp</p>
                              <p className="text-xs text-slate-700">{formatFullDate(l.created_at)}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
