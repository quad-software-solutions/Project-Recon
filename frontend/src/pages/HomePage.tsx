import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, BookOpen, Globe, Trophy, ArrowUpRight,
  Globe2, Send, Loader, CheckCircle2,
  ChevronRight, Sparkles
} from 'lucide-react';
import Hero from '../domains/learning/programs/ui/Hero';
import DemoSlider from '../domains/learning/programs/ui/DemoSlider';
import Updates from '../domains/learning/programs/ui/Updates';
import { UserProfile, ActiveTab, type ProgramDisplay } from '../shared/types';
import { getPrograms } from '../domains/learning/programs/api/programApi';
import { cmsPublicApi, type CmsPartnerResponse, type FaqResponse, type PlatformStats, type GalleryItemResponse } from '../domains/cms/public/api/cmsPublicApi';
import { ChevronDown, Image } from 'lucide-react';

interface HomePageProps {
  currentUser: UserProfile | null;
  onEnrollInProgram: (programId: string) => void;
  onNavigate: (tab: ActiveTab) => void;
  onSetSelectedProgramSpec: (program: ProgramDisplay) => void;
}

export default function HomePage({ currentUser, onEnrollInProgram, onNavigate, onSetSelectedProgramSpec }: HomePageProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'subscribed'>('idle');
  const [contactMessage, setContactMessage] = useState({ name: '', email: '', body: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [partners, setPartners] = useState<CmsPartnerResponse[]>([]);
  const [faqs, setFaqs] = useState<FaqResponse[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramDisplay[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState<GalleryItemResponse[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    students_trained: 0,
    program_tracks: 0,
    partner_schools: 0,
    countries_reached: 0,
  });

  React.useEffect(() => {
    const abort = new AbortController();
    const { signal } = abort;

    cmsPublicApi.getPartners(signal)
      .then(data => setPartners(data.filter(p => p.is_active)))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    cmsPublicApi.getFaqs(signal)
      .then(data => setFaqs(data.filter(f => f.is_active).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    cmsPublicApi.getPlatformStats(signal)
      .then(data => setStats(data))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    setProgramsLoading(true);
    getPrograms(signal)
      .then(data => setPrograms(data))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setProgramsLoading(false));

    cmsPublicApi.getGallery(signal)
      .then(data => setGalleryItems(data.filter(g => g.is_active)))
      .catch(() => {});

    return () => abort.abort();
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('submitting');
    setTimeout(() => {
      setNewsletterStatus('subscribed');
      setNewsletterEmail('');
    }, 1200);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('submitting');
    try {
      await cmsPublicApi.submitContactRequest({
        name: contactMessage.name,
        email: contactMessage.email,
        description: contactMessage.body,
        subject: 'General Inquiry',
      });
      setContactStatus('success');
      setContactMessage({ name: '', email: '', body: '' });
      setTimeout(() => setContactStatus('idle'), 5000);
    } catch (error) {
      console.error('Contact submission error:', error);
      setContactStatus('error');
      setTimeout(() => setContactStatus('idle'), 5000);
    }
  };

  return (
    <>
      <Hero
        onDiscoverPrograms={() => {
          const el = document.getElementById('academic-programs');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onJoinCommunity={() => onNavigate('registration')}
        onShopStore={() => onNavigate('store')}
      />

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-slate-950 py-12"
      >
        <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: `${stats.students_trained}+`, label: 'Students Trained', icon: Users },
              { value: `${stats.program_tracks}+`, label: 'Program Tracks', icon: BookOpen },
              { value: `${stats.partner_schools}+`, label: 'Partner Schools', icon: Globe },
              { value: `${stats.countries_reached}+`, label: 'Countries Reached', icon: Trophy },
            ].map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.1, 0.6) }}
                  className="text-center"
                >
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl ring-1 ring-white/15 flex items-center justify-center mx-auto mb-3">
                    <StatIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-black text-3xl md:text-4xl text-white tracking-tight">{stat.value}</p>
                  <p className="text-sm text-white/70 font-medium mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>


      <section className="border-y border-brand-border/70 bg-white/90 py-10 overflow-hidden relative shadow-premium-sm" id="sponsor-banner">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#25338d]/5 to-transparent animate-glow-shift opacity-50" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center font-mono text-[10px] text-brand-muted mb-6 uppercase tracking-widest font-bold"
          >
            Trusted By Leaders in STEM
          </motion.p>

          <div className="hidden md:block overflow-hidden py-4 marquee-container">
            <div className="flex gap-16 items-center animate-marquee" style={{ width: 'max-content' }}>
              {[...Array(partners.length > 4 ? 2 : 1)].map((_, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  {partners.length > 0 ? partners.map((partner, idx) => (
                    <div key={`${groupIdx}-${partner.id}`} className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: `${(idx % 4) * 0.4}s` }}>
                      {partner.image ? <img src={partner.image} alt={partner.title} className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" /> : <span className="text-sm font-bold text-slate-400">{partner.title}</span>}
                    </div>
                  )) : (
                    <div className="flex items-center gap-16 animate-logo-float"><span className="text-sm font-semibold text-slate-400">Loading partners...</span></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-6 items-center">
            {partners.length > 0 ? partners.slice(0, 7).map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                  transition={{ delay: Math.min(idx * 0.1, 0.6) }}
                className={`flex items-center justify-center animate-logo-float ${idx === 6 ? 'col-span-2 sm:col-span-3' : ''}`}
                style={{ animationDelay: `${(idx % 4) * 0.3}s` }}
              >
                {partner.image ? <img src={partner.image} alt={partner.title} className="h-8 md:h-10 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(37,51,141,0.4)]" /> : <span className="text-sm font-bold text-slate-400">{partner.title}</span>}
              </motion.div>
            )) : (
              <span className="text-sm font-semibold text-slate-400 col-span-2 sm:col-span-3 text-center">Loading partners...</span>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => {
                const el = document.getElementById('section-newsletter');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setContactMessage(prev => ({ ...prev, body: 'We are interested in partnering with Ethio Robotics...' }));
              }}
              className="text-xs font-sans font-bold text-[#25338d] bg-[#25338d]/10 hover:bg-[#25338d]/20 px-5 py-2 rounded-full transition-colors inline-flex items-center gap-2 group"
            >
              <span>Become an Institutional Partner</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      <section className="section-shell py-20" id="academic-programs">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <span className="eyebrow">Coaching Curriculum</span>
          <h3 className="font-display font-semibold text-slate-950 tracking-tight mt-2" style={{ fontSize: 'clamp(28px, 4vw, 38px)' }}>
            World-Class Robotics Tracks
          </h3>
          <p className="font-sans text-sm text-brand-muted-dark mt-2">
            Whether starting with snap-on blocks or compiling complex motor PID controllers in C++, choose a verified learning cohort to build physical automation.
          </p>
        </motion.div>

        {programsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((item) => (
              <div key={item} className="surface-card rounded-card overflow-hidden">
                <div className="aspect-video w-full bg-slate-100 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-28 rounded-full bg-slate-100 animate-pulse" />
                  <div className="h-6 w-4/5 rounded bg-slate-100 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
                  </div>
                  <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : programs.length === 0 ? (
            <div className="surface-card rounded-card border-dashed px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#25338d]/10">
              <BookOpen className="h-5 w-5 text-[#25338d]" />
            </div>
            <h4 className="font-display text-xl font-bold text-slate-900">Programs are being prepared</h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted-dark">
              The academic catalog is connected, but no active programs are available to display yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programs.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(idx * 0.15, 0.6) }}
              className="surface-card interactive-lift rounded-card overflow-hidden flex flex-col group h-full"
            >
              <div className="relative aspect-video w-full overflow-hidden cursor-pointer" onClick={() => onSetSelectedProgramSpec(prog)}>
                {prog.image ? (
                  <img src={prog.image} alt={prog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-blue/20 via-brand-red/10 to-slate-100 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-slate-400/40" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-white/95 px-2.5 py-1 rounded-full text-slate-800 shadow-sm border border-slate-100">{prog.category}</span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-[#25338d] text-white px-2.5 py-1 rounded-full shadow-sm">{prog.level}</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-3">
                <h4 onClick={() => onSetSelectedProgramSpec(prog)} className="font-display font-bold text-lg text-slate-900 hover:text-[#25338d] cursor-pointer transition-colors leading-snug line-clamp-1">{prog.title}</h4>
                <p className="font-sans text-xs text-brand-muted-dark leading-relaxed line-clamp-3">{prog.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {prog.supports_group && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Group
                    </span>
                  )}
                  {prog.supports_individual && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      <Users className="h-3 w-3" />
                      Private
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-brand-border-light/40 flex items-center justify-between text-xs font-mono text-brand-muted">
                  <span>{prog.ageGroup}</span>
                  <span className="font-bold text-[#25338d]">{prog.duration}</span>
                </div>
              </div>

              <div className="px-6 pb-6 pt-1 flex items-center gap-2">
                <button
                  onClick={() => onEnrollInProgram(prog.id)}
                  className="btn-ripple flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white hover:shadow-lg hover:shadow-brand-red/25 font-sans font-semibold text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Enroll Now</span>
                </button>
                <button
                  onClick={() => onSetSelectedProgramSpec(prog)}
                  className="p-3 text-slate-400 hover:text-brand-red hover:bg-brand-red/5 rounded-lg border border-slate-200 transition-colors"
                  title="View Curriculum Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="section-shell py-10" id="video-demo">
        {(() => {
          const videoItems = galleryItems.filter(g => g.video_url);
          const imageItems = galleryItems.filter(g => g.image);
          const DEMO_SLIDES = [
            {
              tag: 'Watch The Demo',
              title: 'Building the Next Generation',
              quote: '"Encouraging creativity through Competition."',
              body: 'Experience the innovation and teamwork that drive Ethio Robotics. From our advanced robotics labs to national championship arenas, see how we empower students to transform ideas into working mechatronic reality.',
              video: videoItems[0]?.video_url ?? null,
              poster: imageItems[0]?.image ?? undefined,
            },
            {
              tag: 'Ethio Robotics Demo',
              title: 'Encouraging Creativity Through Competition',
              quote: '"5 Million Engineers Starts Here."',
              body: 'Watch our students compete, collaborate, and create at the highest levels. From autonomous driving challenges to VEX championship arenas — this is where future engineers are forged.',
              video: videoItems[1]?.video_url ?? null,
              poster: imageItems[1]?.image ?? undefined,
            },
          ];
          return <DemoSlider slides={DEMO_SLIDES} onCta={() => onEnrollInProgram('prog-vex-v5')} />;
        })()}
      </section>

      <Updates onCampRegisterAction={() => onEnrollInProgram('summer-camp-001')} />

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="bg-white py-16 md:py-24 px-4 md:px-12 border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">
                Frequently Asked <span className="text-brand-blue">Questions</span>
              </h2>
              <p className="text-slate-500 mt-3 font-medium">Find answers to common questions about our programs and events.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-slate-200 rounded-card overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <button 
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left font-sans font-semibold text-slate-900 focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === faq.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-shell py-20" id="photo-gallery">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <span className="eyebrow">Photo Gallery</span>
          <h3 className="font-display font-semibold text-slate-950 tracking-tight mt-2" style={{ fontSize: 'clamp(28px, 4vw, 38px)' }}>
            Stories in Snapshots
          </h3>
          <p className="font-sans text-sm text-brand-muted-dark mt-2">
            Relive the best moments from our competitions, championships, and community events across Ethiopia and beyond.
          </p>
        </motion.div>

        {galleryItems.length === 0 ? (
          <p className="text-center text-sm text-slate-400">Gallery coming soon...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {galleryItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.08, 0.6) }}
                className="group relative rounded-card overflow-hidden border border-brand-border-light/60 shadow-premium-sm hover:shadow-premium-md transition-all aspect-[4/3] cursor-pointer"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : item.video_url ? (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <Image className="w-8 h-8 text-white/40" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Image className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white font-sans font-bold text-xs">{item.title}</span>
                </div>
                {item.video_url && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Video</div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-slate-950 text-white py-16 md:py-24 relative overflow-hidden" id="section-newsletter"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ed1c24]/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#25338d]/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col gap-5"
          >
            <span className="font-mono text-xs font-bold text-[#ed1c24] uppercase tracking-wider">Stay Tuned to Ethio Robotics</span>
            <h3 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(28px, 4.5vw, 40px)' }}>
              Inspiring the Next Generation of Thinkers.
            </h3>
            <p className="font-sans text-slate-300 text-sm md:text-base leading-relaxed">
              Subscribe to our bi-weekly newsletter digest to receive community updates, coding challenges, upcoming tournament schedules, and direct educational guide downloads.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mt-2">
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === 'subscribed'}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#ed1c24] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'submitting' || newsletterStatus === 'subscribed'}
                className="bg-[#25338d] hover:bg-[#111a5f] text-white font-sans font-semibold text-sm px-5 py-3 rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
              >
                {newsletterStatus === 'submitting' && <Loader className="w-4 h-4 animate-spin" />}
                {newsletterStatus === 'subscribed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                <span>{newsletterStatus === 'subscribed' ? 'Subscribed' : 'Join'}</span>
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-modal border border-slate-800/80 shadow-2xl shadow-black/20"
          >
            <h4 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#ed1c24]" />
              <span>Contact Regional Coordinator</span>
            </h4>
            <p className="font-sans text-slate-400 text-xs mb-5">Have a question about tournament rulebooks or school bulk supplies? Let us help.</p>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" required placeholder="Your Name" value={contactMessage.name}
                  onChange={(e) => setContactMessage({ ...contactMessage, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#ed1c24]" />
                <input type="email" required placeholder="Email" value={contactMessage.email}
                  onChange={(e) => setContactMessage({ ...contactMessage, email: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#ed1c24]" />
              </div>
              <textarea required rows={3} placeholder="Tell us what you need help with..." value={contactMessage.body}
                onChange={(e) => setContactMessage({ ...contactMessage, body: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#ed1c24] resize-none" />
              <button type="submit" disabled={contactStatus === 'submitting'} className="bg-[#25338d] hover:bg-[#111a5f] text-white font-sans font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all self-end disabled:opacity-50">
                {contactStatus === 'submitting' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Message</span>
              </button>
            </form>

            <AnimatePresence>
              {contactStatus === 'success' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3.5 bg-[#25338d]/20 border border-[#ed1c24]/30 p-3 rounded-xl text-xs text-white font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Message dispatched completely! Our helpdesk will email you at your earliest convenience.</span>
                </motion.div>
              )}
              {contactStatus === 'error' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3.5 bg-red-900/30 border border-red-500/50 p-3 rounded-xl text-xs text-red-200 font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 opacity-0" />
                  <span>Failed to send message. Please try again.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
