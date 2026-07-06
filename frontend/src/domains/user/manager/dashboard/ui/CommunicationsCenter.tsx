import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search, X, XCircle, MessageSquare, Mail, Phone, Clock, AlertCircle,
  CheckCircle, Loader2, ArrowUpDown, ChevronDown, Tag, Paperclip
} from 'lucide-react';
import { cmsContactRequestsApi, ContactRequestResponse } from '../../../../cms/shared/api/cmsApi';

const STATUS_STYLES: Record<string, { icon: React.ElementType; label: string; bg: string; text: string }> = {
  OPEN: { icon: AlertCircle, label: 'Open', bg: 'bg-blue-50', text: 'text-blue-700' },
  IN_PROGRESS: { icon: Clock, label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700' },
  RESOLVED: { icon: CheckCircle, label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  CLOSED: { icon: XCircle, label: 'Closed', bg: 'bg-slate-50', text: 'text-slate-500' },
  DONE: { icon: CheckCircle, label: 'Done', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const PRIORITY_STYLES: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'text-slate-500' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600' },
  HIGH: { label: 'High', color: 'text-amber-600' },
  URGENT: { label: 'Urgent', color: 'text-red-600' },
};

export default function CommunicationsCenter() {
  const [requests, setRequests] = useState<ContactRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ContactRequestResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cmsContactRequestsApi.list();
      setRequests(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contact requests');
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setError(null);
    try {
      await cmsContactRequestsApi.update(id, { status } as Partial<ContactRequestResponse>);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const filtered = requests
    .filter(r => {
      const q = search.toLowerCase();
      const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Messages', value: requests.length, icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Open', value: requests.filter(r => r.status === 'OPEN').length, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', value: requests.filter(r => r.status === 'IN_PROGRESS').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: requests.filter(r => r.status === 'RESOLVED' || r.status === 'DONE').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => {
          const SIcon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}><SIcon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 w-[180px]"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No messages found</p>
            </div>
          ) : (
            filtered.map((r) => {
              const sCfg = STATUS_STYLES[r.status] || STATUS_STYLES.OPEN;
              const StatusIcon = sCfg.icon;
              const pCfg = PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.LOW;
              const isOpen = expanded === r.id;
              return (
                <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-slate-50 last:border-b-0"
                >
                  <button onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{r.name}</h4>
                        <span className="text-xs text-slate-400">· {r.ticket_number}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{r.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase ${pCfg.color}`}>{r.priority}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sCfg.bg} ${sCfg.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sCfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400 w-14 text-right">{formatDate(r.created_at)}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-4 pt-0"
                    >
                      <div className="ml-[52px] bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.email}</span>
                          {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        {r.attachment && (
                          <div className="flex items-center gap-1 text-xs text-sky-600">
                            <Paperclip className="w-3 h-3" />
                            <a href={r.attachment} target="_blank" rel="noopener noreferrer" className="hover:underline">Attachment</a>
                          </div>
                        )}
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{r.description}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => {
                            const cfg = STATUS_STYLES[status];
                            const CfgIcon = cfg.icon;
                            return (
                              <button key={status} onClick={() => updateStatus(r.id, status)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${r.status === status ? `${cfg.bg} ${cfg.text} ring-1 ring-inset ring-current` : 'text-slate-500 hover:bg-slate-100'}`}
                              >
                                <CfgIcon className="w-3 h-3 inline mr-0.5" />
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
