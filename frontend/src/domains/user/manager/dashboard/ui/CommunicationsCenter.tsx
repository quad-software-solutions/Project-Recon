import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, XCircle, MessageSquare, Mail, Phone, Clock, AlertCircle,
  CheckCircle, Loader2, ArrowUpDown, ChevronDown, Paperclip, Lock, RefreshCw,
  Inbox, Send,
} from 'lucide-react';
import { cmsContactRequestsApi, ContactRequestResponse } from '../../../../cms/shared/api/cmsApi';
import type { UserProfile } from '@/shared/types';
import { canManageContactRequests } from '@/shared/auth/permissions';

interface Props { currentUser: UserProfile }

const STATUS_CFG: Record<string, { icon: typeof AlertCircle; label: string; color: string; dot: string }> = {
  OPEN:        { icon: AlertCircle,  label: 'Open',        color: 'text-blue-700 bg-blue-50 border-blue-200',   dot: 'bg-blue-500' },
  IN_PROGRESS: { icon: Clock,        label: 'In Progress', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  RESOLVED:    { icon: CheckCircle,  label: 'Resolved',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED:      { icon: XCircle,      label: 'Closed',      color: 'text-slate-500 bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
  DONE:        { icon: CheckCircle,  label: 'Done',        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-slate-400', MEDIUM: 'text-blue-600', HIGH: 'text-amber-600', URGENT: 'text-red-600',
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function CommunicationsCenter({ currentUser }: Props) {
  const canManage = canManageContactRequests(currentUser);
  const [requests, setRequests] = useState<ContactRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => { load(); }, [canManage]);

  const load = async () => {
    if (!canManage) { setRequests([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setRequests(await cmsContactRequestsApi.list()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    if (!canManage) return;
    setError(null);
    try {
      await cmsContactRequestsApi.update(id, { status } as Partial<ContactRequestResponse>);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to update'); }
  };

  const filtered = requests
    .filter(r => {
      const q = search.toLowerCase();
      return (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q))
        && (statusTab === 'all' || r.status === statusTab)
        && (priorityFilter === 'all' || r.priority === priorityFilter);
    })
    .sort((a, b) => {
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? -d : d;
    });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!canManage) return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
      <Lock className="w-5 h-5 shrink-0 mt-0.5" />
      <div><p className="font-bold">Not available for your role</p><p className="mt-1 text-amber-700">Contact management requires Super Admin or Branch Manager access.</p></div>
    </div>
  );

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-24" />)}</div>
      <div className="bg-white rounded-xl border border-slate-200 h-64" />
    </div>
  );

  const openCount = requests.filter(r => r.status === 'OPEN').length;
  const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const resolvedCount = requests.filter(r => r.status === 'RESOLVED' || r.status === 'DONE').length;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto p-0.5 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: requests.length, icon: Inbox, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Open', value: openCount, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: resolvedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2.5`}><Icon className={`w-4 h-4 ${s.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 mb-3 overflow-x-auto">
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => setStatusTab(tab.key)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  statusTab === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className={`ml-1.5 text-[10px] ${statusTab === tab.key ? 'text-white/70' : 'text-slate-400'}`}>
                    {tab.key === 'OPEN' ? openCount : tab.key === 'IN_PROGRESS' ? inProgressCount : tab.key === 'RESOLVED' ? resolvedCount : 0}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
            <div className="relative grow max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-400 placeholder:text-slate-400" />
            </div>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-sky-400"
            >
              <option value="all">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            ><ArrowUpDown className="w-3 h-3" /> {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            ><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /></button>
            <span className="text-[11px] text-slate-400 ml-auto">{filtered.length}/{requests.length}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-300">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-sm text-slate-400">No messages found</p>
            </div>
          ) : (
            filtered.map((r) => {
              const sc = STATUS_CFG[r.status] || STATUS_CFG.OPEN;
              const SI = sc.icon;
              const pc = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.LOW;
              const open = expanded === r.id;
              return (
                <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button onClick={() => setExpanded(open ? null : r.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 border border-slate-200 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-sky-600" />
                      </div>
                      <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${sc.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{r.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{r.ticket_number}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{r.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase ${pc}`}>{r.priority}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color}`}>
                        <SI className="w-3 h-3" /> {sc.label}
                      </span>
                      <span className="text-[10px] text-slate-400 w-12 text-right tabular-nums">{timeAgo(r.created_at)}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[52px] mr-4 pb-4">
                          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {r.email}</span>
                              {r.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {r.phone}</span>}
                              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-400" /> {new Date(r.created_at).toLocaleString()}</span>
                              <a href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.subject)}`}
                                className="ml-auto flex items-center gap-1 text-sky-600 font-medium hover:underline"
                              ><Send className="w-3 h-3" /> Reply</a>
                            </div>
                            {r.attachment && (
                              <a href={r.attachment} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
                              ><Paperclip className="w-3 h-3" /> Attachment</a>
                            )}
                            <div className="bg-white rounded-lg border border-slate-100 p-3">
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{r.description}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Status</p>
                              <div className="flex flex-wrap gap-1.5">
                                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(st => {
                                  const c = STATUS_CFG[st];
                                  const Ci = c.icon;
                                  return (
                                    <button key={st} onClick={() => updateStatus(r.id, st)}
                                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                        r.status === st
                                          ? `${c.color} ring-1 ring-inset ring-current shadow-sm`
                                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                      }`}
                                    ><Ci className="w-3 h-3 inline mr-1" /> {c.label}</button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
