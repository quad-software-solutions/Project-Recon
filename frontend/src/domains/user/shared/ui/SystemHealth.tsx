import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Server, Database, Zap, Wifi, HardDrive, Mail,
  CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw,
  Download, Trash2, Shield, BarChart3, Cpu, Thermometer,
  FolderOpen, Upload, Users, Globe, Loader2
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  icon: React.ElementType;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  latency: string;
  uptime: string;
}

interface HealthMetric {
  label: string;
  value: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'stable';
  color: string;
  detail: string;
}

interface SystemEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
}

const initialServices: ServiceStatus[] = [
  { name: 'API Server', icon: Server, status: 'operational', latency: '42ms', uptime: '99.97%' },
  { name: 'Database', icon: Database, status: 'operational', latency: '12ms', uptime: '99.99%' },
  { name: 'Cache (Redis)', icon: Zap, status: 'operational', latency: '3ms', uptime: '100%' },
  { name: 'Storage (S3)', icon: HardDrive, status: 'operational', latency: '85ms', uptime: '99.95%' },
  { name: 'Email (SMTP)', icon: Mail, status: 'degraded', latency: '320ms', uptime: '98.2%' },
  { name: 'CDN', icon: Globe, status: 'operational', latency: '28ms', uptime: '99.99%' },
];

const initialEvents: SystemEvent[] = [
  { id: '1', type: 'success', message: 'Automated backup completed successfully', timestamp: '2 min ago' },
  { id: '2', type: 'info', message: 'Cache warmed for 14 programs', timestamp: '15 min ago' },
  { id: '3', type: 'warning', message: 'Email queue depth: 14 pending messages', timestamp: '32 min ago' },
  { id: '4', type: 'success', message: 'SSL certificate renewed for ethiorobotics.com', timestamp: '2 hours ago' },
  { id: '5', type: 'error', message: 'Failed payment webhook retry (3 attempts)', timestamp: '4 hours ago' },
  { id: '6', type: 'info', message: 'Database vacuum completed', timestamp: '6 hours ago' },
];

export default function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [events, setEvents] = useState<SystemEvent[]>(initialEvents);
  const [backupRunning, setBackupRunning] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const overallHealth = (() => {
    const down = services.filter(s => s.status === 'down').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    if (down > 0) return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', icon: XCircle };
    if (degraded > 0) return { label: 'Degraded', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', icon: AlertTriangle };
    return { label: 'All Operational', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle };
  })();

  const metrics: HealthMetric[] = [
    { label: 'Server Uptime', value: '99.97%', icon: Activity, trend: 'up', color: 'text-emerald-500', detail: 'Last 30 days' },
    { label: 'Avg Response', value: '124ms', icon: Cpu, trend: 'down', color: 'text-emerald-500', detail: 'Across all endpoints' },
    { label: 'Error Rate', value: '0.02%', icon: AlertTriangle, trend: 'down', color: 'text-emerald-500', detail: 'Last 24 hours' },
    { label: 'Active Users', value: '47', icon: Users, trend: 'up', color: 'text-blue-500', detail: 'Currently online' },
    { label: 'Queue Depth', value: '14', icon: Clock, trend: 'up', color: 'text-amber-500', detail: 'Pending tasks' },
    { label: 'Cache Hit Rate', value: '87%', icon: Zap, trend: 'up', color: 'text-emerald-500', detail: 'Above threshold' },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1200));
    setRefreshing(false);
  };

  const handleBackup = async () => {
    setBackupRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setEvents(prev => [{ id: Date.now().toString(), type: 'success', message: 'Manual backup completed', timestamp: 'Just now' }, ...prev]);
    setBackupRunning(false);
  };

  const handleClearCache = async () => {
    setCacheClearing(true);
    await new Promise(r => setTimeout(r, 1500));
    setEvents(prev => [{ id: Date.now().toString(), type: 'info', message: 'Cache cleared for all programs', timestamp: 'Just now' }, ...prev]);
    setCacheClearing(false);
  };

  const StatusIcon = overallHealth.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Overall Status Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${overallHealth.bg} ${overallHealth.border} border rounded-2xl p-5 flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${overallHealth.bg} border ${overallHealth.border} flex items-center justify-center`}>
            <StatusIcon className={`w-6 h-6 ${overallHealth.color}`} />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">System Status: <span className={overallHealth.color}>{overallHealth.label}</span></h3>
            <p className="text-sm text-slate-600 mt-0.5">{services.length} services · {services.filter(s => s.status === 'operational').length} operational · {services.filter(s => s.status !== 'operational').length} issues</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="font-black text-2xl text-slate-900 tracking-tight">{m.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{m.detail}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Services + Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Service Statuses */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-blue" />
              <h3 className="font-black text-lg text-slate-900">Service Status</h3>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              const statusColors = {
                operational: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Operational' },
                degraded: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Degraded' },
                down: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600', label: 'Down' },
                maintenance: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', label: 'Maintenance' },
              };
              const sc = statusColors[svc.status];
              return (
                <motion.div
                  key={svc.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg ${sc.bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${sc.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{svc.name}</h4>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{svc.latency} response · {svc.uptime} uptime</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono">{svc.latency}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Events + Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recent Events */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex-1">
            <h3 className="font-black text-lg text-slate-900 mb-4">Recent Events</h3>
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {events.map((ev) => {
                const typeStyles = {
                  success: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle },
                  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertTriangle },
                  error: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
                  info: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', icon: Clock },
                };
                const ts = typeStyles[ev.type];
                const Icon = ts.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-7 h-7 rounded-lg ${ts.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${ts.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 leading-relaxed">{ev.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{ev.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-black text-lg text-slate-900 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button onClick={handleBackup} disabled={backupRunning}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-blue/30 hover:bg-blue-50/30 transition-all disabled:opacity-50 group">
                <div className="w-9 h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-colors">
                  <Upload className="w-4.5 h-4.5 text-brand-blue" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-slate-900">Run Backup</p>
                  <p className="text-xs text-slate-500">Full system backup to S3</p>
                </div>
                {backupRunning ? <Loader2 className="w-4 h-4 animate-spin text-brand-blue" /> : <span className="text-xs font-bold text-brand-blue">Run</span>}
              </button>

              <button
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50/30 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Download className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-slate-900">Export Logs</p>
                  <p className="text-xs text-slate-500">Download system audit logs</p>
                </div>
                <Download className="w-4 h-4 text-emerald-500" />
              </button>

              <button onClick={handleClearCache} disabled={cacheClearing}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-500/30 hover:bg-amber-50/30 transition-all disabled:opacity-50 group">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Trash2 className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-slate-900">Clear Cache</p>
                  <p className="text-xs text-slate-500">Flush all cached data</p>
                </div>
                {cacheClearing ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <span className="text-xs font-bold text-amber-500">Clear</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
