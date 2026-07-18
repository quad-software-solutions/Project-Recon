import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Megaphone, Headphones, Loader2, ChevronRight } from 'lucide-react';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import PageHeader from '../../../shared/ui/PageHeader';
import TabBar from '../../../shared/ui/TabBar';
import EmptyState from '@/shared/ui/EmptyState';
import { GridSkeleton } from '../../../shared/ui/LoadingSkeleton';
import ParentFeedback from '../ParentFeedback';
import type { UserProfile } from '@/shared/types';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category?: string;
}

interface Props {
  currentUser?: UserProfile;
}

export default function MessagingModule({ currentUser }: Props) {
  const [tab, setTab] = useState('announcements');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  useEffect(() => {
    setLoading(true);
    cmsPublicApi.getNews({ limit: '20' })
      .then(res => {
        const items = res?.results || [];
        setNews(items.map(n => ({
          id: n.id,
          title: n.title,
          excerpt: n.summary || n.content?.slice(0, 150) || '',
          date: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          category: n.type,
        })));
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'support', label: 'Contact Support' },
  ];

  return (
    <div>
      <PageHeader
        title="Messaging & Communication"
        subtitle="Announcements from instructors, organizers, and support"
        icon={MessageCircle}
      />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'announcements' && (
        selected ? (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <button onClick={() => setSelected(null)} className="text-sm text-blue-600 font-semibold mb-4 hover:underline">
              ← Back to announcements
            </button>
            <h3 className="font-black text-xl text-slate-900 mb-2">{selected.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{selected.date}{selected.category && ` · ${selected.category}`}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{selected.excerpt}</p>
          </div>
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : news.length > 0 ? (
          <div className="space-y-3">
            {news.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(item)}
                className="w-full text-left bg-white border border-brand-border rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.excerpt}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-2xl">
            <EmptyState icon={Megaphone} title="No announcements" description="Check back for updates from your instructors and organizers." />
          </div>
        )
      )}

      {tab === 'support' && (
        <div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Headphones className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Need help?</p>
              <p className="text-xs text-slate-600 mt-0.5">Submit a support request and our team will get back to you.</p>
            </div>
          </div>
          <ParentFeedback currentUser={currentUser} />
        </div>
      )}
    </div>
  );
}
