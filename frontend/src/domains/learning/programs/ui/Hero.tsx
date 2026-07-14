import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Globe, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';

import untitledLogo from '@/assets/Untitled.png';
import sliderImg1 from '@/assets/slider/faj.jpg';
import sliderImg2 from '@/assets/slider/photo_2026-06-15_14-40-10.jpg';
import sliderImg3 from '@/assets/slider/photo_2026-06-15_18-51-59.jpg';
import sliderImg4 from '@/assets/slider/photo_2026-06-15_18-52-03.jpg';
import sliderImg5 from '@/assets/slider/photo_2026-06-15_18-52-07.jpg';
import sliderImg6 from '@/assets/slider/photo_2026-06-15_18-52-11.jpg';
import sliderImg7 from '@/assets/slider/photo_2026-06-15_18-52-21.jpg';
import sliderImg8 from '@/assets/slider/photo_2026-06-15_18-52-25.jpg';

import { cmsPublicApi, type HeroBannerResponse } from '../../../cms/public/api/cmsPublicApi';

const SLIDER_IMAGES = [
  sliderImg1, sliderImg2, sliderImg3, sliderImg4,
  sliderImg5, sliderImg6, sliderImg7, sliderImg8,
];

const SLIDE_DURATION = 6000;

const HERO_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  width: 2 + ((i * 7) % 4),
  left: (i * 28 + 11) % 100,
  top: (i * 37 + 17) % 100,
  drift: i % 2 === 0 ? 12 : -12,
  duration: 5 + (i % 4),
  delay: (i % 5) * 0.6,
  color: i % 2 === 0 ? 'rgba(37,99,235,0.25)' : 'rgba(87,223,254,0.2)',
}));

const trustItems = ['Competitions', '120+ Labs', 'STEM Kits', 'Awards'];

const stats = [
  { value: '5M+', label: 'Future Engineers', accent: 'from-blue-300 to-blue-400' },
  { value: '120+', label: 'Programs', accent: 'from-cyan-300 to-cyan-400' },
  { value: '500+', label: 'Competitions', accent: 'from-indigo-300 to-indigo-400' },
];

interface HeroProps {
  onDiscoverPrograms: () => void;
  onJoinCommunity: () => void;
  onShopStore?: () => void;
}

export default function Hero({ onDiscoverPrograms, onJoinCommunity, onShopStore }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [banners, setBanners] = useState<HeroBannerResponse[]>([]);
  const [activeImages, setActiveImages] = useState<string[]>(SLIDER_IMAGES);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const abort = new AbortController();
    cmsPublicApi.getHeroBanners(abort.signal).then((data) => {
      if (data && data.length > 0) {
        setBanners(data);
        setActiveImages(data.map((b, i) => b.image || SLIDER_IMAGES[i % SLIDER_IMAGES.length]));
      }
    }).catch(err => { if (err.name !== 'AbortError') /* console.error */(err); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeImages.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [activeImages.length]);

  return (
    <section
      className="relative flex min-h-screen w-full flex-col overflow-hidden"
      id="hero-banner"
    >
      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentSlide}
            src={activeImages[currentSlide]}
            alt={banners[currentSlide]?.title || "Ethio Robotics community and competition moments"}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        </AnimatePresence>

        <div
          className="absolute inset-0 z-[1]"
          style={{ background: 'linear-gradient(135deg, rgba(8,12,30,0.88) 0%, rgba(15,22,60,0.65) 30%, rgba(8,12,50,0.50) 60%, rgba(20,50,120,0.20) 100%)' }}
        />
        <div
          className="absolute inset-0 z-[2]"
          style={{ background: 'linear-gradient(0deg, rgba(5,8,24,0.85) 0%, transparent 50%, rgba(5,8,24,0.30) 100%)' }}
        />

        <div
          className="absolute inset-0 z-[2] opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="absolute inset-0 z-[1] flex items-center justify-center opacity-[0.025] pointer-events-none">
          <img src={untitledLogo} alt="" className="w-[55%] max-w-[400px] object-contain" />
        </div>

        <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
          {HERO_PARTICLES.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${particle.width}px`,
                height: `${particle.width}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                background: particle.color,
              }}
              animate={{
                y: [0, -25, 0],
                x: [0, particle.drift, 0],
                opacity: [0.15, 0.5, 0.15],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── SLIDE DOTS ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {activeImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`rounded-full transition-all duration-500 ${
              idx === currentSlide
                ? 'w-10 h-1.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-24 lg:py-32">
        <div className="flex flex-col items-center text-center gap-7">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/[0.06] backdrop-blur-md border border-white/[0.12] text-white/70 rounded-full text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3 h-3 text-blue-300" />
              Robotics Academy
              <span className="w-px h-3 bg-white/15" />
              {/*<BrandLogo className="h-3.5 w-auto opacity-60" />*/}
              <span>🇪🇹</span>
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display font-bold text-white tracking-tight leading-[1.05] max-w-4xl"
            style={{ fontSize: 'clamp(34px, 5.5vw, 66px)' }}
            id="hero-title"
          >
            {banners[currentSlide]?.title ? (
              <>{banners[currentSlide].title}</>
            ) : (
              <>
                <span className="text-white">Ethio Robotics</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-100">
                  builds future engineers
                </span>
                <br />
                <span className="text-white/90">through real robots.</span>
              </>
            )}
          </motion.h1>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={banners[currentSlide]?.subtitle || 'default-subtitle'}
              initial={{ opacity: 0, y: 16 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-sans text-white/60 leading-relaxed max-w-2xl"
              style={{ fontSize: 'clamp(15px, 1.5vw, 18px)' }}
              id="hero-quote"
            >
              {banners[currentSlide]?.subtitle
                ? `"${banners[currentSlide].subtitle}"`
                : 'Learn robotics, join competitions, and build the future with STEM.'}
            </motion.p>
          </AnimatePresence>

          {/* Trust chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {trustItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.05] border border-white/[0.08] text-white/40 rounded-full text-[11px] font-medium"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-blue-300/50" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-1"
            id="hero-actions"
          >
            {banners[currentSlide]?.button_text && banners[currentSlide]?.button_url ? (
              <a
                href={banners[currentSlide].button_url!}
                target="_blank" rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-[1] flex items-center gap-2">
                  {banners[currentSlide].button_text}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            ) : (
              <button
                onClick={onDiscoverPrograms}
                className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 overflow-hidden"
                id="btn-discover-programs"
              >
                <span className="relative z-[1] flex items-center gap-2">
                  Explore Programs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            )}

            <button
              onClick={onJoinCommunity}
              className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 px-7 py-3.5 rounded-xl hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 overflow-hidden"
              id="btn-join-community"
            >
              <span className="relative z-[1] flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Join Us
              </span>
            </button>

            <button
              onClick={onShopStore}
              className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm text-white/50 border border-white/10 px-5 py-3.5 rounded-xl hover:bg-white/5 hover:text-white/80 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
              id="btn-shop-store"
            >
              <span className="relative z-[1] flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                Shop Gear
              </span>
            </button>
          </motion.div>

          {/* Stats + Progress */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="w-full pt-2 flex flex-col items-center gap-5"
          >
            {/* Floating metric cards */}
            <div className="inline-flex items-center gap-3">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={mounted ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.1 }}
                  className="card-float bg-white/[0.06] backdrop-blur-lg rounded-2xl border border-white/[0.08] px-5 py-3 text-center min-w-[110px]"
                >
                  <div className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.accent}`}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-white/40 font-medium mt-0.5 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Slim progress bar */}
            <div className="w-full max-w-sm bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] px-4 py-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono font-semibold text-white/30 uppercase tracking-[0.15em]">Mission Progress</span>
                <span className="text-[11px] font-semibold text-white/50 font-mono">1,240,500 / 5,000,000</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={mounted ? { width: '24.8%' } : {}}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 rounded-full"
                />
              </div>
              <p className="text-[8px] text-white/20 font-medium text-right mt-0.5">24.8% of National Goal</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
