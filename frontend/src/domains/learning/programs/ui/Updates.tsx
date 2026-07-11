import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Tent, Shield, ArrowRight, X, Clock, MapPin, Sparkles, ChevronRight } from 'lucide-react';
import { cmsPublicApi, type NewsArticleResponse } from '../../../cms/public/api/cmsPublicApi';

interface UpdatesProps {
  onCampRegisterAction: () => void;
}

const ICONS = { calendar: Calendar, camping: Tent, security: Shield };
const COLORS: Record<string, { border: string; bg: string; text: string; icon: string; gradient: string }> = {
  calendar: { border: 'border-brand-blue/30', bg: 'bg-brand-blue/10', text: 'text-brand-blue', icon: 'text-brand-blue', gradient: 'from-brand-blue to-brand-blue-dark' },
  camping: { border: 'border-brand-red/30', bg: 'bg-brand-red/10', text: 'text-brand-red', icon: 'text-brand-red', gradient: 'from-brand-red to-brand-red-dark' },
  security: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'text-cyan-400', gradient: 'from-cyan-500 to-cyan-700' },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.3 } }
};
const cardUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export default function Updates({ onCampRegisterAction }: UpdatesProps) {
  const [selectedPost, setSelectedPost] = useState<NewsArticleResponse | null>(null);
  const [news, setNews] = useState<NewsArticleResponse[]>([]);

  useEffect(() => {
    const abort = new AbortController();
    cmsPublicApi.getNews(abort.signal)
      .then(res => setNews((res.results ?? []).filter(n => n.is_active)))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
    return () => abort.abort();
  }, []);

  return (
    <section className="relative bg-brand-paper py-16 md:py-20 px-4 md:px-12 overflow-hidden" id="section-updates">
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/8 via-[#080808] to-brand-red/5 pointer-events-none" />
      <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-5%] w-[350px] h-[350px] bg-brand-red/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-full mb-3">
              <Sparkles className="w-3 h-3" />
              <span className="font-black text-[9px] uppercase tracking-[0.2em]">Stay Informed</span>
            </div>
            <h2 className="font-black text-3xl md:text-4xl text-white tracking-tight">
              Latest <span className="text-brand-red">Updates</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-md text-sm font-medium">
            Read current stories about upcoming regional robotic leagues, physical stem laboratory seminars, and active code camps.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {news.length > 0 ? news.map((post, idx) => {
            const iconKey = post.type?.toLowerCase().includes('camp') ? 'camping' : 
                            post.type?.toLowerCase().includes('security') ? 'security' : 'calendar';
            const Icon = ICONS[iconKey as keyof typeof ICONS] || ICONS.calendar;
            const c = COLORS[iconKey] || COLORS.calendar;

            return (
              <motion.div
                key={post.id}
                variants={cardUp}
                onClick={() => setSelectedPost(post)}
                className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 hover:border-brand-red/30 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col gap-4"
              >
                {/* Gradient accent top */}
                <div className={`absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r ${c.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.type || 'Update'}</span>
                  <h3 className="font-black text-lg text-slate-900 leading-snug group-hover:text-brand-red transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">
                    {post.summary}
                  </p>
                </div>

                {/* Read more */}
                <div className="pt-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-brand-red transition-colors">
                  <span>Read More</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          }) : (
            <div className="col-span-1 md:col-span-3 text-center text-slate-400 py-8">
              No news or updates available at the moment.
            </div>
          )}
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {selectedPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPost(null)}
                className="absolute inset-0 bg-white/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl shadow-slate-300/50 p-8 z-10"
              >
                {/* Close */}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5 mb-6">
                  {(() => {
                    const iconKey = selectedPost.type?.toLowerCase().includes('camp') ? 'camping' : 
                                    selectedPost.type?.toLowerCase().includes('security') ? 'security' : 'calendar';
                    const Icon = ICONS[iconKey as keyof typeof ICONS] || ICONS.calendar;
                    const c = COLORS[iconKey] || COLORS.calendar;
                    return (
                      <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${c.icon}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">{selectedPost.type || 'Update'}</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">
                        {selectedPost.published_at 
                          ? new Date(selectedPost.published_at).toLocaleDateString() 
                          : new Date(selectedPost.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-6 pr-8">
                  {selectedPost.title}
                </h3>

                <div className="max-h-[300px] overflow-y-auto pr-2 text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-8 border-t border-slate-100 pt-6 scrollbar-thin">
                  {selectedPost.image && (
                    <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-auto rounded-xl mb-4 object-cover max-h-64" />
                  )}
                  <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brand-red" />
                    Ethio Robotics News Hub
                  </span>

                  {selectedPost.button_url ? (
                    <a
                      href={selectedPost.button_url}
                      className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 transition-all"
                    >
                      {selectedPost.button_text || 'Learn More'}
                    </a>
                  ) : selectedPost.type?.toLowerCase().includes('camp') ? (
                    <button
                      onClick={() => { setSelectedPost(null); onCampRegisterAction(); }}
                      className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 transition-all"
                    >
                      Register for Summer Camp
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/40 transition-all"
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
