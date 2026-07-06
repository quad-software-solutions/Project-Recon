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
import { ROBOTICS_PROGRAMS } from '../shared/constants/mock-data';
import { UserProfile, Program, ActiveTab } from '../shared/types';

import galleryImg1 from '../../assets/photo_2026-06-15_14-39-46.jpg';
import galleryImg2 from '../../assets/photo_2026-06-15_14-39-52.jpg';
import galleryImg3 from '../../assets/photo_2026-06-15_14-39-58.jpg';
import galleryImg4 from '../../assets/photo_2026-06-15_14-40-04.jpg';
import galleryImg5 from '../../assets/photo_2026-06-15_14-40-10.jpg';
import galleryImg6 from '../../assets/0M6A6595.00_00_03_09.Still001.jpg';
import galleryImg7 from '../../assets/0M6A6595.00_07_19_06.Still027.jpg';
import galleryImg8 from '../../assets/0M6A6595.00_13_52_12.Still006.jpg';
import demoVideo from '../../assets/video_2026-06-15_14-39-09.mp4';
import demoVideo2 from '../../assets/demo.mp4';

interface HomePageProps {
  currentUser: UserProfile | null;
  onEnrollInProgram: (programId: string) => void;
  onNavigate: (tab: ActiveTab) => void;
  onSetSelectedProgramSpec: (program: Program | null) => void;
}

export default function HomePage({ currentUser, onEnrollInProgram, onNavigate, onSetSelectedProgramSpec }: HomePageProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'subscribed'>('idle');
  const [contactMessage, setContactMessage] = useState({ name: '', email: '', body: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'success'>('idle');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('submitting');
    setTimeout(() => {
      setNewsletterStatus('subscribed');
      setNewsletterEmail('');
    }, 1200);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('success');
    setContactMessage({ name: '', email: '', body: '' });
    setTimeout(() => setContactStatus('idle'), 5000);
  };

  return (
    <motion.div
      key="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
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
        className="bg-gradient-to-r from-brand-blue via-brand-blue-dark to-brand-blue py-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: '500+', label: 'Students Trained', icon: Users },
              { value: '10+', label: 'Program Tracks', icon: BookOpen },
              { value: '25+', label: 'Partner Schools', icon: Globe },
              { value: '3+', label: 'Countries Reached', icon: Trophy },
            ].map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <StatIcon className="w-5 h-5 text-slate-900" />
                  </div>
                  <p className="font-black text-3xl md:text-4xl text-white tracking-tight">{stat.value}</p>
                  <p className="text-sm text-slate-900/70 font-medium mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <section className="border-y border-[#d9def4]/70 bg-white/80 py-10 overflow-hidden relative shadow-premium-sm" id="sponsor-banner">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#25338d]/5 to-transparent animate-glow-shift opacity-50" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center font-mono text-[10px] text-[#737686] mb-6 uppercase tracking-widest font-bold"
          >
            Trusted By Leaders in STEM
          </motion.p>

          <div className="hidden md:block overflow-hidden py-4 marquee-container">
            <div className="flex gap-16 items-center animate-marquee" style={{ width: 'max-content' }}>
              {[...Array(2)].map((_, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '0s' }}>
                    <img src="https://ethiorobotics.org/images/partners/minstry%20of%20inovation%20and%20technology.png" alt="Ministry of Innovation & Technology" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '0.4s' }}>
                    <img src="https://ethiorobotics.org/images/partners/vex.webp" alt="VEX Robotics" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '0.8s' }}>
                    <img src="https://ethiorobotics.org/images/partners/ethiopian_airlines.png" alt="Ethiopian Airlines" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '1.2s' }}>
                    <img src="https://ethiorobotics.org/images/partners/ethio-tele.png" alt="Ethio Telecom" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '0.2s' }}>
                    <img src="https://ethiorobotics.org/images/partners/aau.png" alt="Addis Ababa University" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '0.6s' }}>
                    <img src="https://ethiorobotics.org/images/partners/adama%20scienc%20and%20techology%20university.png" alt="Adama Science & Technology University" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                  <div className="flex items-center gap-16 animate-logo-float" style={{ animationDelay: '1.0s' }}>
                    <img src="https://ethiorobotics.org/images/partners/university%20of%20gonadar.png" alt="University of Gondar" className="h-10 md:h-14 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(37,51,141,0.5)]" />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-6 items-center">
            {[
              { src: 'https://ethiorobotics.org/images/partners/minstry%20of%20inovation%20and%20technology.png', alt: 'Ministry of Innovation & Technology', delay: '0s' },
              { src: 'https://ethiorobotics.org/images/partners/vex.webp', alt: 'VEX Robotics', delay: '0.3s' },
              { src: 'https://ethiorobotics.org/images/partners/ethiopian_airlines.png', alt: 'Ethiopian Airlines', delay: '0.6s' },
              { src: 'https://ethiorobotics.org/images/partners/ethio-tele.png', alt: 'Ethio Telecom', delay: '0.9s' },
              { src: 'https://ethiorobotics.org/images/partners/aau.png', alt: 'Addis Ababa University', delay: '1.2s' },
              { src: 'https://ethiorobotics.org/images/partners/adama%20scienc%20and%20techology%20university.png', alt: 'Adama Science & Technology University', delay: '1.5s' },
              { src: 'https://ethiorobotics.org/images/partners/university%20of%20gonadar.png', alt: 'University of Gondar', delay: '1.8s', colSpan: true },
            ].map((partner, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-center animate-logo-float ${partner.colSpan ? 'col-span-2 sm:col-span-3' : ''}`}
                style={{ animationDelay: partner.delay }}
              >
                <img src={partner.src} alt={partner.alt} className="h-8 md:h-10 object-contain brightness-90 hover:brightness-110 transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(37,51,141,0.4)]" />
              </motion.div>
            ))}
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

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20" id="academic-programs">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#25338d]">Coaching Curriculum</span>
          <h3 className="font-display font-medium text-slate-900 tracking-tight mt-1" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            World-Class Robotics Tracks
          </h3>
          <p className="font-sans text-sm text-[#434655] mt-2">
            Whether starting with snap-on blocks or compiling complex motor PID controllers in C++, choose a verified learning cohort to build physical automation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ROBOTICS_PROGRAMS.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-white rounded-[26px] shadow-premium-sm hover:shadow-premium-lg border border-[#e1e2ed]/45 overflow-hidden flex flex-col group h-full transition-all duration-500 card-float hover:shadow-[0_20px_60px_-8px_rgba(37,51,141,0.15)] hover:border-[#25338d]/20"
            >
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onSetSelectedProgramSpec(prog)}>
                <img src={prog.image} alt={prog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-white/95 px-2.5 py-1 rounded-full text-slate-800 shadow-sm border border-slate-100">{prog.category}</span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-[#25338d] text-white px-2.5 py-1 rounded-full shadow-sm">{prog.level}</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-3">
                <h4 onClick={() => onSetSelectedProgramSpec(prog)} className="font-display font-bold text-lg text-slate-900 hover:text-[#25338d] cursor-pointer transition-colors leading-snug line-clamp-1">{prog.title}</h4>
                <p className="font-sans text-xs text-[#434655] leading-relaxed line-clamp-3">{prog.description}</p>
                <div className="mt-4 pt-4 border-t border-[#e1e2ed]/40 flex items-center justify-between text-xs font-mono text-[#737686]">
                  <span>{prog.ageGroup}</span>
                  <span className="font-bold text-[#25338d]">{prog.duration}</span>
                </div>
              </div>

              <div className="px-6 pb-6 pt-1 flex items-center gap-2">
                <button
                  onClick={() => onEnrollInProgram(prog.id)}
                  className="btn-ripple flex-1 bg-[#25338d]/10 text-[#25338d] hover:bg-[#25338d] hover:text-slate-900 font-sans font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Reserve Enrollment Slot</span>
                </button>
                <button
                  onClick={() => onSetSelectedProgramSpec(prog)}
                  className="p-3 text-[#737686] hover:bg-[#faf8ff] hover:text-slate-900 rounded-xl border border-[#e1e2ed] transition-colors"
                  title="Curriculum Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-10" id="video-demo">
        {(() => {
          const DEMO_SLIDES = [
            {
              tag: 'Watch The Demo',
              title: 'Building the Next Generation',
              quote: '"Encouraging creativity through Competition."',
              body: 'Experience the innovation and teamwork that drive Ethio Robotics. From our advanced robotics labs to national championship arenas, see how we empower students to transform ideas into working mechatronic reality.',
              video: demoVideo,
            },
            {
              tag: 'Ethio Robotics Demo',
              title: 'Encouraging Creativity Through Competition',
              quote: '"5 Million Engineers Starts Here."',
              body: 'Watch our students compete, collaborate, and create at the highest levels. From autonomous driving challenges to VEX championship arenas — this is where future engineers are forged.',
              video: demoVideo2,
            },
          ];
          return <DemoSlider slides={DEMO_SLIDES} onCta={() => onEnrollInProgram('prog-vex-v5')} />;
        })()}
      </section>

      <Updates onCampRegisterAction={() => onEnrollInProgram('prog-enjoy-ai')} />

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20" id="photo-gallery">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#25338d]">Photo Gallery</span>
          <h3 className="font-display font-medium text-slate-900 tracking-tight mt-1" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Stories in Snapshots
          </h3>
          <p className="font-sans text-sm text-[#434655] mt-2">
            Relive the best moments from our competitions, championships, and community events across Ethiopia and beyond.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { src: galleryImg1, label: 'Preparation Day' },
            { src: galleryImg2, label: 'Friendship Winners' },
            { src: galleryImg3, label: 'Blue Vs Red Team' },
            { src: galleryImg4, label: 'Friendship Match' },
            { src: galleryImg5, label: 'Teams Celebration' },
            { src: galleryImg6, label: '3rd African Robotics Championship' },
            { src: galleryImg7, label: "Mentorship Session" },
            { src: galleryImg8, label: 'Student Teams' },
          ].map((photo, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group relative rounded-xl overflow-hidden border border-[#e1e2ed]/60 shadow-premium-sm hover:shadow-premium-md transition-all aspect-[4/3]"
            >
              <img src={photo.src} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="text-slate-900 font-sans font-bold text-xs">{photo.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
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
            className="bg-slate-900/40 backdrop-blur-md p-6 md:p-8 rounded-[28px] border border-slate-800/80"
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
              <button type="submit" className="bg-[#25338d] hover:bg-[#111a5f] text-white font-sans font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all self-end">
                <Send className="w-3.5 h-3.5" />
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
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}
