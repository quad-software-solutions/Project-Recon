import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Globe, Award, ShoppingBag, Sparkles } from 'lucide-react';
import Robotics3DShowcase from '../../../store/products/ui/Robotics3DShowcase';
import BrandLogo from '@/shared/ui/BrandLogo';

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

const HERO_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  width: 2 + ((i * 7) % 5),
  left: (i * 23 + 11) % 100,
  top: (i * 31 + 17) % 100,
  drift: i % 2 === 0 ? 15 : -15,
  duration: 4 + (i % 5),
  delay: (i % 6) * 0.45,
  color: i % 3 === 0 ? 'rgba(237,28,36,0.3)' : i % 3 === 1 ? 'rgba(87,223,254,0.25)' : 'rgba(255,255,255,0.2)',
}));

const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' as const },
});

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
      className="relative flex min-h-[calc(100svh-32px)] w-full items-center justify-center overflow-hidden pt-12"
      id="hero-banner"
    >
      {/* Background Image Slider */}
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
        
        {/* Vibrant brand gradient overlay */}
        <div 
          className="absolute inset-0 z-[1]" 
          style={{ background: 'linear-gradient(135deg, rgba(11,18,50,0.78) 0%, rgba(17,26,95,0.58) 36%, rgba(8,12,50,0.54) 65%, rgba(237,28,36,0.18) 100%)' }}
        />
        <div 
          className="absolute inset-0 z-[2]" 
          style={{ background: 'linear-gradient(180deg, rgba(5,8,24,0.24) 0%, transparent 42%, rgba(5,8,24,0.62) 100%)' }}
        />

        {/* Watermark logo */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center opacity-[0.04] pointer-events-none">
          <img src={untitledLogo} alt="" className="w-[60%] max-w-[500px] object-contain" />
        </div>

        {/* Parallax particles */}
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
                y: [0, -30, 0],
                x: [0, particle.drift, 0],
                opacity: [0.2, 0.6, 0.2],
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

      {/* Slide indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {activeImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`rounded-full transition-all duration-500 ${
              idx === currentSlide 
                ? 'w-6 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                : 'w-2 h-2 bg-white/30 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 md:px-12 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.78fr)] lg:gap-12">
          <div className="flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
          
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -20 }}
              animate={mounted ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="rounded-xl bg-white/95 p-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] ring-1 ring-white/40"
            >
              <BrandLogo className="h-20 w-[220px] sm:h-24 sm:w-[270px]" />
            </motion.div>
          
            {/* Badge */}
            <motion.div
              {...stagger(0.15)}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full"
              id="hero-tag"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-mono text-xs font-semibold tracking-wide uppercase">Robotics Academy + Store</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              {...stagger(0.25)}
              className="font-display font-bold text-white tracking-tight"
              style={{ fontSize: 'clamp(32px, 6vw, 64px)', lineHeight: '1.1' }}
              id="hero-title"
            >
              {banners[currentSlide]?.title ? (
                <>{banners[currentSlide].title}</>
              ) : (
                <>ETHIO ROBOTICS <br />
                <span className="text-[#ed1c24] drop-shadow-[0_2px_14px_rgba(237,28,36,0.45)]">builds future engineers</span> <br />
                through real robots.</>
              )}
            </motion.h1>

            {/* Subtitle / Quote */}
            <AnimatePresence mode="wait">
              <motion.p
                key={banners[currentSlide]?.subtitle || 'default-subtitle'}
                {...stagger(0.35)}
                className="font-display font-semibold text-white/90 italic tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                style={{ fontSize: 'clamp(14px, 2vw, 20px)' }}
                id="hero-quote"
              >
                {banners[currentSlide]?.subtitle 
                  ? `"${banners[currentSlide].subtitle}"` 
                  : '"Encouraging creativity through Competition."'}
              </motion.p>
            </AnimatePresence>

            {/* Description */}
            <motion.p
              {...stagger(0.45)}
              className="font-sans text-slate-100/95 max-w-2xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
              style={{ fontSize: 'clamp(16px, 2.5vw, 19px)' }}
              id="hero-description"
            >
              Learn robotics, join competitions, and shop STEM kits, sensors, backpacks, tools, and lab-ready bundles from one polished platform.
            </motion.p>

            {/* Mission Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-2xl mt-2"
            >
              {/* Dynamic tagline */}
              <motion.p
                className="font-display font-bold text-white tracking-wide mb-3 flex flex-wrap"
                style={{
                  fontSize: 'clamp(15px, 2.2vw, 20px)',
                  textShadow: '0 0 20px rgba(237,28,36,0.5), 0 0 40px rgba(37,51,141,0.3)',
                }}
                id="hero-mission-tagline"
              >
                {'5 Million Engineers starts here'.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={mounted ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.8 + i * 0.035, ease: 'easeOut' }}
                    style={{ display: char === ' ' ? 'inline' : 'inline-block', whiteSpace: 'pre' }}
                  >
                    {char}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={mounted ? { opacity: [0, 1, 0] } : {}}
                  transition={{ duration: 0.8, delay: 2, repeat: Infinity, repeatDelay: 0.5 }}
                  className="inline-block ml-0.5 w-[2px] h-[1.1em] bg-[#ed1c24] align-middle"
                />
              </motion.p>

              <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-mono text-xs font-bold text-slate-900/70 uppercase tracking-wider">Mission Progress</span>
                  <span className="font-sans text-sm font-bold text-slate-900">1,240,500 / 5,000,000</span>
                </div>
                <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={mounted ? { width: '24.8%' } : {}}
                    transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#25338d] via-[#25338d] to-[#ed1c24] rounded-full"
                  />
                </div>
                <p className="text-[10px] text-slate-900/50 font-medium text-right mt-1.5">24.8% of National Goal Achieved</p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4"
              id="hero-actions"
            >
              {banners[currentSlide]?.button_text && banners[currentSlide]?.button_url ? (
                <a
                  href={banners[currentSlide].button_url!}
                  target="_blank" rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-gradient-to-r from-[#ed1c24] to-[#b5121b] text-white px-8 py-4 rounded-xl shadow-[0_4px_15px_-2px_rgba(237,28,36,0.35)] hover:shadow-[0_8px_25px_-2px_rgba(237,28,36,0.45)] hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-[1] flex items-center gap-2">
                    {banners[currentSlide].button_text}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              ) : (
                <button
                  onClick={onDiscoverPrograms}
                  className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-gradient-to-r from-[#ed1c24] to-[#b5121b] text-white px-8 py-4 rounded-xl shadow-[0_4px_15px_-2px_rgba(237,28,36,0.35)] hover:shadow-[0_8px_25px_-2px_rgba(237,28,36,0.45)] hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 overflow-hidden"
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
                className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-white text-[#25338d] px-8 py-4 rounded-xl shadow-[0_4px_15px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_-2px_rgba(0,0,0,0.15)] hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 overflow-hidden"
                id="btn-join-community"
              >
                <span className="relative z-[1] flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Join the Community
                </span>
              </button>

              <button
                onClick={onShopStore}
                className="group relative inline-flex items-center justify-center font-sans font-semibold text-sm bg-white/12 text-white border border-white/25 px-8 py-4 rounded-xl backdrop-blur-md hover:bg-white/20 hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 overflow-hidden"
                id="btn-shop-store"
              >
                <span className="relative z-[1] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Shop STEM Gear
                </span>
              </button>
            </motion.div>

          </div>

          {/* Product Card */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={mounted ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-xl mx-auto lg:max-w-none"
          >
            <Robotics3DShowcase variant="hero" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
