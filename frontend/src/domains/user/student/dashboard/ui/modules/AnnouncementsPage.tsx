import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Search, Loader2, ChevronRight } from 'lucide-react';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import PageHeader from '../../../shared/ui/PageHeader';
import EmptyState from '@/shared/ui/EmptyState';
import { GridSkeleton } from '../../../shared/ui/LoadingSkeleton';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category?: string;
}

export default function AnnouncementsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NewsItem | null>(null);

  useEffect(() => {
    setLoading(true);
    cmsPublicApi.getNews({ limit: '50' })
      .then(res => {
        const items = res?.results || [];
        setNews(items.map(n => ({
          id: n.id,
          title: n.title,
          excerpt: n.summary || '',
          content: n.content || n.summary || '',
          date: new Date(n.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          category: n.type,
        })));
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = news.filter(n => {
    const q = search.toLowerCase();
    return !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q);
  });

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 font-semibold mb-4 hover:underline">
          ← All announcements
        </button>
        <article className="bg-white border border-brand-border rounded-2xl p-6 md:p-8">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
            {selected.category || 'Announcement'}
          </p>
          <h2 className="font-black text-2xl text-slate-900 mb-3">{selected.title}</h2>
          <p className="text-sm text-slate-500 mb-6">{selected.date}</p>
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
            {selected.content}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Official updates and news from the institution"
        icon={Megaphone}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search announcements..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm focus:outline-none focus:border-blue-400"
        />
      </div>

      {loading ? (
        <GridSkeleton count={4} />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(item)}
              className="w-full text-left bg-white border border-brand-border rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {item.category && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{item.category}</span>
                  )}
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                  {item.excerpt && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.excerpt}</p>}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl">
          <EmptyState icon={Megaphone} title="No announcements found" description={search ? 'Try a different search term.' : 'Check back later for updates.'} />
        </div>
      )}
    </div>
  );
}
