import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  ChevronDown,
  Filter,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import type { ForumPost } from '@/src/shared/types';
import { getForumPosts } from '../model/postApi';

type Category = 'All' | 'General' | 'Help' | 'Showcase' | 'Competition' | 'Tutorial';
const CATEGORIES: Category[] = ['All', 'General', 'Help', 'Showcase', 'Competition', 'Tutorial'];
const CAT_COLORS: Record<string, string> = {
  General: 'bg-slate-100 text-slate-700 ring-slate-200',
  Help: 'bg-red-50 text-red-700 ring-red-100',
  Showcase: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Competition: 'bg-amber-50 text-amber-700 ring-amber-100',
  Tutorial: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
};

export default function CommunityForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);

  useEffect(() => {
    getForumPosts().then(setPosts).catch(console.error);
  }, []);
  const [category, setCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<string>('General');
  const [replyText, setReplyText] = useState('');

  const filtered = posts
    .filter(p => category === 'All' || p.category === category)
    .filter(p => search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const submitPost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const post: ForumPost = { id: Date.now().toString(), author: 'You', authorRole: 'Student', avatar: '🙋', title: newTitle, content: newContent, category: newCategory as any, timestamp: 'Just now', likes: 0, replies: [], tags: [] };
    setPosts(prev => [post, ...prev]); setShowNew(false); setNewTitle(''); setNewContent('');
  };

  const addReply = (postId: string) => {
    if (!replyText.trim()) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...p.replies, { id: Date.now().toString(), author: 'You', authorRole: 'Student', content: replyText, timestamp: 'Just now', likes: 0 }] } : p));
    setReplyText('');
  };

  const likePost = (postId: string) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));

  const totalReplies = posts.reduce((sum, post) => sum + post.replies.length, 0);
  const pinnedPosts = posts.filter(post => post.pinned);
  const topContributors = Array.from(new Set(posts.map(post => post.author))).slice(0, 4);

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[28px] border border-brand-border-light/70 bg-white px-5 py-6 shadow-premium-sm sm:px-7 lg:px-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-brand-blue">Community</p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">Discussion Forum</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted-dark">
                Ask for help, share robot builds, follow competition updates, and learn from the Light Institute community.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              {[
                { label: 'Posts', value: posts.length },
                { label: 'Replies', value: totalReplies },
                { label: 'Pinned', value: pinnedPosts.length },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-brand-border-light/70 bg-brand-paper px-3 py-3 text-center">
                  <div className="font-display text-xl font-extrabold text-brand-ink">{stat.value}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="space-y-5 lg:col-span-8">
            <div className="rounded-3xl border border-brand-border-light/70 bg-white p-4 shadow-premium-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all ${
                        category === c
                          ? 'bg-brand-blue text-white shadow-premium-blue'
                          : 'border border-brand-border-light bg-white text-brand-muted-dark hover:border-brand-blue/30 hover:bg-brand-paper hover:text-brand-blue'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search discussions..."
                      className="h-11 w-full rounded-xl border border-brand-border-light bg-brand-paper pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                    />
                  </div>
                  <button
                    onClick={() => setShowNew(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white shadow-premium-blue transition-colors hover:bg-brand-blue-dark"
                  >
                    <Plus className="h-4 w-4" />
                    New Post
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showNew && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="overflow-hidden rounded-3xl border border-brand-border-light/70 bg-white p-5 shadow-premium-md sm:p-6"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-brand-ink">Create New Post</h3>
                      <p className="mt-1 text-xs text-brand-muted">Start a focused discussion for students, coaches, and teams.</p>
                    </div>
                    <button
                      onClick={() => setShowNew(false)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-brand-muted transition hover:bg-slate-100 hover:text-brand-ink"
                      aria-label="Close new post form"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Post title"
                    className="mb-3 h-11 w-full rounded-xl border border-brand-border-light bg-brand-paper px-4 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                  />
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={4}
                    placeholder="What do you want to discuss?"
                    className="mb-4 w-full resize-none rounded-xl border border-brand-border-light bg-brand-paper px-4 py-3 text-sm leading-6 text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="h-10 rounded-xl border border-brand-border-light bg-white px-3 text-xs font-bold text-brand-muted-dark outline-none focus:border-brand-blue"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button
                      onClick={submitPost}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-xs font-bold text-white transition hover:bg-brand-blue-dark"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Publish
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {filtered.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="overflow-hidden rounded-3xl border border-brand-border-light/70 bg-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:shadow-premium-md"
                >
                  <div className="cursor-pointer p-5 sm:p-6" onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-paper text-xl ring-1 ring-brand-border-light">{post.avatar}</div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {post.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100">
                              <Pin className="h-3 w-3" />
                              Pinned
                            </span>
                          )}
                          <span className="font-bold text-sm text-brand-ink">{post.author}</span>
                          <span className="text-[11px] font-medium text-brand-muted">{post.authorRole}</span>
                          <span className="text-[11px] text-brand-muted">{post.timestamp}</span>
                        </div>
                        <h4 className="font-display text-lg font-extrabold leading-snug text-brand-ink">{post.title}</h4>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-muted-dark">{post.content}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2.5">
                          <button
                            onClick={e => { e.stopPropagation(); likePost(post.id); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-brand-muted-dark transition hover:bg-brand-blue/10 hover:text-brand-blue"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {post.likes}
                          </button>
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-brand-muted-dark">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {post.replies.length}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${CAT_COLORS[post.category] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                            <Tag className="h-3 w-3" />
                            {post.category}
                          </span>
                          {post.tags.map(tag => (
                            <span key={tag} className="rounded-full bg-brand-paper px-2.5 py-1 text-[10px] font-bold text-brand-muted">#{tag}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-brand-muted transition-transform ${expandedPost === post.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedPost === post.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="border-t border-brand-border-light/70 bg-brand-paper/60 px-5 py-5 sm:px-6">
                          <div className="space-y-4 sm:ml-16">
                            {post.replies.length > 0 ? post.replies.map(reply => (
                              <div key={reply.id} className="border-l-2 border-brand-border pl-4">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-xs text-brand-ink">{reply.author}</span>
                                  <span className="text-[11px] text-brand-muted">{reply.authorRole}</span>
                                  <span className="text-[11px] text-brand-muted">{reply.timestamp}</span>
                                </div>
                                <p className="text-sm leading-6 text-brand-muted-dark">{reply.content}</p>
                                <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-muted transition hover:text-brand-blue">
                                  <ThumbsUp className="h-3 w-3" />
                                  {reply.likes}
                                </button>
                              </div>
                            )) : (
                              <div className="rounded-2xl border border-dashed border-brand-border bg-white px-4 py-4 text-sm text-brand-muted">
                                No replies yet. Be the first to help this discussion move forward.
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              <input
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addReply(post.id)}
                                placeholder="Write a reply..."
                                className="h-11 min-w-0 flex-1 rounded-xl border border-brand-border-light bg-white px-3 text-sm text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                              />
                              <button onClick={() => addReply(post.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-blue text-white transition hover:bg-brand-blue-dark" aria-label="Send reply">
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-dashed border-brand-border bg-white px-6 py-12 text-center shadow-premium-sm">
                  <Filter className="mx-auto h-8 w-8 text-brand-muted" />
                  <h3 className="mt-3 font-display text-lg font-extrabold text-brand-ink">No discussions found</h3>
                  <p className="mt-1 text-sm text-brand-muted">Try another category or search term.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-4">
            <div className="rounded-3xl border border-brand-border-light/70 bg-white p-5 shadow-premium-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-brand-ink">Community Pulse</h2>
                  <p className="text-xs text-brand-muted">Live summary from forum activity</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-brand-paper px-4 py-3">
                  <span className="text-sm font-bold text-brand-muted-dark">Active discussions</span>
                  <span className="font-display text-xl font-extrabold text-brand-ink">{filtered.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-brand-paper px-4 py-3">
                  <span className="text-sm font-bold text-brand-muted-dark">Total likes</span>
                  <span className="font-display text-xl font-extrabold text-brand-ink">{posts.reduce((sum, post) => sum + post.likes, 0)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-border-light/70 bg-white p-5 shadow-premium-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-brand-red">
                  <Pin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-brand-ink">Pinned</h2>
                  <p className="text-xs text-brand-muted">Important community updates</p>
                </div>
              </div>

              <div className="space-y-3">
                {pinnedPosts.length > 0 ? pinnedPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => setExpandedPost(post.id)}
                    className="w-full rounded-2xl border border-brand-border-light bg-white px-4 py-3 text-left transition hover:border-brand-blue/30 hover:bg-brand-paper"
                  >
                    <span className="block text-xs font-bold uppercase tracking-wide text-brand-blue">{post.category}</span>
                    <span className="mt-1 line-clamp-2 block text-sm font-bold leading-5 text-brand-ink">{post.title}</span>
                  </button>
                )) : (
                  <p className="rounded-2xl bg-brand-paper px-4 py-3 text-sm text-brand-muted">No pinned posts right now.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-border-light/70 bg-white p-5 shadow-premium-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-brand-ink">Contributors</h2>
                  <p className="text-xs text-brand-muted">People starting conversations</p>
                </div>
              </div>

              <div className="space-y-2">
                {topContributors.map((name, index) => (
                  <div key={name} className="flex items-center gap-3 rounded-2xl bg-brand-paper px-3 py-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-extrabold text-brand-blue ring-1 ring-brand-border-light">
                      {index + 1}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-brand-ink">{name}</span>
                    {index === 0 && <Award className="h-4 w-4 text-amber-500" />}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
