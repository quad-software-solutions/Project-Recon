import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ShoppingBag, GraduationCap, Trophy, Users, Wrench, ArrowRight } from 'lucide-react';
import type { ActiveTab } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  tab: ActiveTab;
  badge?: string;
}

export default function SearchOverlay({ isOpen, onClose, onNavigate }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [searchable, setSearchable] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      import('@/src/domains/store/products/api/productApi').then(m => m.getProducts()).then(products => {
        const results: SearchResult[] = (products || []).map(p => ({
          id: p.id, title: p.name, description: p.description,
          category: 'Store', icon: ShoppingBag, tab: 'store' as ActiveTab,
          badge: p.category
        }));
        setSearchable(prev => [...prev.filter(r => r.category !== 'Store'), ...results]);
      }).catch(() => {});
      import('@/src/domains/competition/api/competitionApi').then(async m => {
        const [ts, ws] = await Promise.all([m.getTournaments().catch(() => []), m.getWorkshops().catch(() => [])]);
        const results: SearchResult[] = [
          ...ts.map(t => ({ id: t.id, title: t.title, description: t.description, category: 'Tournaments' as const, icon: Trophy, tab: 'competitions' as ActiveTab, badge: t.storedStatus })),
          ...ws.map(w => ({ id: w.id, title: w.title, description: w.description, category: 'Workshops' as const, icon: Wrench, tab: 'competitions' as ActiveTab, badge: w.storedStatus })),
        ];
        setSearchable(prev => [...prev.filter(r => r.category !== 'Tournaments' && r.category !== 'Workshops'), ...results]);
      }).catch(() => {});
      import('@/src/domains/forum/posts/model/postApi').then(m => m.getForumPosts()).then(posts => {
        const results: SearchResult[] = (posts || []).map(f => ({
          id: f.id, title: f.title, description: f.content, category: 'Community', icon: Users, tab: 'community' as ActiveTab, badge: f.category
        }));
        setSearchable(prev => [...prev.filter(r => r.category !== 'Community'), ...results]);
      }).catch(() => {});
    } else {
      setQuery('');
      setSearchable([]);
    }
  }, [isOpen]);

  const filtered = query.trim()
    ? searchable.filter(item => {
        const q = query.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }).slice(0, 12)
    : [];

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-50/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed top-[5%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
          >
            <div className="bg-white rounded-2xl shadow-[0_30px_80px_-12px_rgba(0,0,0,0.3)] border border-brand-border/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue rounded-t-2xl" />
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search programs, products, workshops, tournaments..."
                  className="flex-1 text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
                <kbd className="hidden sm:inline-flex text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {query.trim() && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {filtered.length > 0 ? (
                    <div className="p-2">
                      {filtered.map((result) => {
                        const Icon = result.icon;
                        return (
                          <button
                            key={`${result.category}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0 group-hover:bg-brand-blue/20 transition-colors">
                              <Icon className="w-4 h-4 text-brand-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{result.title}</p>
                                {result.badge && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                                    {result.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{result.description}</p>
                              <span className="text-[10px] font-medium text-brand-blue mt-0.5 block">{result.category}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No results found for "<span className="font-semibold text-slate-700">{query}</span>"</p>
                      <p className="text-xs text-slate-400 mt-1">Try different keywords</p>
                    </div>
                  )}
                </div>
              )}

              {!query.trim() && (
                <div className="py-6 px-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Links</p>
                  <div className="flex flex-wrap gap-2">
                    {['VEX V5', 'Arduino', 'PID', 'Summer Camp', 'Tournament', 'Sensors', 'Python', 'Workshop'].map(term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-blue/10 hover:text-brand-blue transition-colors font-medium"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
