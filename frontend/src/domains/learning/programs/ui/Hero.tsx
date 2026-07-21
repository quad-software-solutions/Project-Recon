import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Globe, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';

import untitledLogo from '@/assets/logo.svg';

import { cmsPublicApi, type HeroBannerResponse, type HomepageStats } from '../../../cms/public/api/cmsPublicApi';

const SLIDE_DURATION = 6000;

export function formatStatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

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


interface HeroProps {
  onDiscoverPrograms: () => void;
  onJoinCommunity: () => void;
  onShopStore?: () => void;
  homepageStats?: HomepageStats | null;
  statsLoading?: boolean;
}

export default function Hero({
  onDiscoverPrograms,
  onJoinCommunity,
  onShopStore,
  homepageStats = null,
  statsLoading = false,
}: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [banners, setBanners] = useState<HeroBannerResponse[]>([]);
  const [activeImages, setActiveImages] = useState<string[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const abort = new AbortController();
    cmsPublicApi.getHeroBanners(abort.signal).then((data) => {
      if (data && data.length > 0) {
        const usableBanners = data.filter(b => Boolean(b.image));
        setBanners(usableBanners);
        const images = usableBanners.map(b => b.image);
        setActiveImages(images);
        
        // Dynamically inject a preload link for the first image to improve LCP
        if (images[0] && !document.head.querySelector(`link[href="${images[0]}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = images[0];
          // React 19 / TS may need specific cast for fetchpriority but we can set it as attribute
          link.setAttribute('fetchpriority', 'high');
          document.head.appendChild(link);
        }
      }
    }).catch(err => { if (err.name !== 'AbortError') console.error(err); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (activeImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeImages.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [activeImages.length]);

  return (
    <section
      className="relative flex min-h-[85vh] lg:min-h-screen w-full flex-col overflow-x-hidden bg-[#0B1220]"
      id="hero-banner"
    >
      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {activeImages.length > 0 ? activeImages.map((src, idx) => (
          <motion.img
            key={src}
            src={src}
            alt={banners[idx]?.title || "Ethio Robotics community and competition moments"}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
            initial={false}
            animate={{ opacity: currentSlide === idx ? 1 : 0, scale: currentSlide === idx ? 1 : 1.05 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            fetchPriority={idx === 0 ? "high" : "auto"}
            loading={idx === 0 ? "eager" : "lazy"}
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        )) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#162044] to-[#0B1220]" />
        )}

        {/* Full overlay to ensure text contrast over any image (Mobile only) */}
        <div className="block lg:hidden absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Desktop: left-to-right scrim — dark behind text column, fades right so right 70% is bright */}
        <div className="hidden lg:block absolute inset-0 w-[80%] z-[1] bg-gradient-to-r from-[#0B1220]/95 via-[#0B1220]/50 to-transparent" />

        {/* Desktop: bottom scrim — dark behind stat cards + progress bar */}
        <div className="hidden lg:block absolute inset-x-0 bottom-0 h-[35%] z-[1] bg-gradient-to-t from-[#0B1220]/85 to-transparent" />

        {/* Mobile: single bottom-anchored scrim covering bottom 70% */}
        <div className="block lg:hidden absolute inset-x-0 bottom-0 h-[70%] z-[1] bg-gradient-to-t from-[#0B1220]/90 to-transparent" />

        <div
          className="absolute inset-0 z-[2] opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

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
      {activeImages.length > 0 && (
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
      )}

      {/* ── MAIN CONTENT ── */}
      {/*
        Mobile: content anchored to bottom so the upper photo stays visible.
        Desktop: content vertically centered with a left-aligned column.
      */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-end lg:justify-center px-4 sm:px-6 lg:px-16 pb-16 pt-8 lg:py-24">
        <div className="w-full max-w-xl text-left flex flex-col gap-4 lg:gap-7">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display font-bold text-white tracking-tight leading-[1.05] drop-shadow-lg"
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
              className="font-sans text-white/90 drop-shadow-md leading-relaxed"
              style={{ fontSize: 'clamp(15px, 1.5vw, 18px)' }}
              id="hero-quote"
            >
              {banners[currentSlide]?.subtitle
                ? `"${banners[currentSlide].subtitle}"`
                : 'Learn robotics, join competitions, and build the future with STEM.'}
            </motion.p>
          </AnimatePresence>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1"
            id="hero-actions"
          >
            {banners[currentSlide]?.button_text && banners[currentSlide]?.button_url ? (
              <a
                href={banners[currentSlide].button_url!}
                target="_blank" rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-[1] flex items-center gap-2">
                  {banners[currentSlide].button_text}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            ) : (
              <button
                onClick={onDiscoverPrograms}
                className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 overflow-hidden w-full sm:w-auto"
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
              className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-white/10 backdrop-blur-md border border-white/20 text-white px-7 py-3.5 rounded-xl hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 overflow-hidden w-full sm:w-auto"
              id="btn-join-community"
            >
              <span className="relative z-[1] flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Join Us
              </span>
            </button>

            <button
              onClick={onShopStore}
              className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-white/[0.06] backdrop-blur-md border border-white/15 text-white/60 px-5 py-3.5 rounded-xl hover:bg-white/15 hover:text-white hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 w-full sm:w-auto"
              id="btn-shop-store"
            >
              <span className="relative z-[1] flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                Shop Gear
              </span>
            </button>
          </motion.div>

          {/* Mission progress — from CMS homepage statistics API */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="w-full"
          >
            <div className="w-full bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-4">
              <div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center mb-1">
                  <span className="text-[9px] font-mono font-semibold text-white/60 uppercase tracking-[0.15em]">Mission Progress</span>
                  <span className="text-[11px] font-semibold text-white/80 font-mono tabular-nums break-all sm:text-right">
                    {statsLoading && !homepageStats
                      ? '…'
                      : `${(homepageStats?.mission.current ?? 0).toLocaleString()} / ${(homepageStats?.mission.target ?? 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    key={homepageStats?.mission.percentage ?? 'loading'}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, homepageStats?.mission.percentage ?? 0)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 rounded-full"
                  />
                </div>
                <p className="text-[8px] text-white/50 font-medium text-right mt-0.5">
                  {statsLoading && !homepageStats
                    ? '…'
                    : `${homepageStats?.mission.percentage ?? 0}% of National Goal`}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
