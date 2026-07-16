import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search, X, Megaphone, Calendar, EyeOff,
  CheckCircle, XCircle, Filter,
} from 'lucide-react';
import { cmsPublicApi } from '../../../../cms/public/api/cmsPublicApi';
import type { NewsArticleResponse } from '../../../../cms/shared/api/cmsApi';
export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<NewsArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cmsPublicApi.getNews({ limit: '50' });
      const items = (res?.results || []) as NewsArticleResponse[];
      setAnnouncements(items.filter(a => a.type === 'ANNOUNCEMENT' || !a.type));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load announcements');
    }
    setLoading(false);
  };

  const filtered = announcements.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && a.is_active) ||
      (statusFilter === 'draft' && !a.is_active);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-24" />
        ))}
        <div className="col-span-full bg-white rounded-xl border border-slate-200 h-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: announcements.length, icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Published', value: announcements.filter(a => a.is_active).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Drafts', value: announcements.filter(a => !a.is_active).length, icon: EyeOff, color: 'text-slate-400', bg: 'bg-slate-50' },
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
              <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400 w-[200px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-400"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No announcements match your filters</p>
            </div>
          ) : (
            filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{a.title}</h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${a.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {a.is_active ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(a.published_at || a.created_at)}</span>
                    {a.summary && <span className="truncate ml-1">· {a.summary}</span>}
                  </div>
                </div>

              </motion.div>
            ))
          )}
        </div>
      </div>


    </div>
  );
}
