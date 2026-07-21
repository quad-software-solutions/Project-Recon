import React, { useState } from 'react';
import { Sparkles, Award, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface DemoSlide {
  tag: string;
  title: string;
  quote: string;
  body: string;
  video?: string | null;
  poster?: string;
}

interface DemoSliderProps {
  slides: DemoSlide[];
  onCta: () => void;
}

export default function DemoSlider({ slides, onCta }: DemoSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedVideos, setFailedVideos] = useState<Record<number, boolean>>({});

  const markVideoFailed = (idx: number) => {
    setFailedVideos(prev => (prev[idx] ? prev : { ...prev, [idx]: true }));
  };

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, slides.length - 1)));
  };

  return (
    <div className="relative">
      {/* Main Card */}
      <div className="rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* Slide Track */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="w-full flex-shrink-0 bg-slate-900 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB]/40 to-indigo-800/20 pointer-events-none" />
              <div className="flex flex-col md:flex-row items-stretch relative z-10">
                {/* Text Content */}
                <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#57dffe] mb-3 block">
                    {slide.tag}
                  </span>
                  <h3 className="font-display font-medium text-white tracking-tight text-[clamp(28px,4vw,36px)] leading-tight mb-3">
                    {slide.title}
                  </h3>
  
                  <p className="font-sans text-sm text-slate-300 leading-relaxed mb-8">
                    {slide.body}
                  </p>
                  <button
                    onClick={onCta}
                    className="bg-[#2563EB] hover:bg-blue-500 text-white font-sans font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 w-fit"
                  >
                    <Award className="w-4 h-4" />
                    <span>Start Your Journey</span>
                  </button>
                </div>
                {/* Video / poster panel */}
                <div className="w-full md:w-1/2 relative aspect-video md:aspect-auto md:min-h-[450px] bg-slate-900 overflow-hidden">
                  {slide.video && !failedVideos[idx] ? (
                    (() => {
                      const ytMatch = slide.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
                      if (ytMatch) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`}
                            className="w-full h-full border-0 opacity-90 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      }
                      return (
                        <video
                          key={slide.video}
                          src={slide.video}
                          poster={slide.poster}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          onError={() => markVideoFailed(idx)}
                          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                        />
                      );
                    })()
                  ) : slide.poster ? (
                    <img
                      src={slide.poster}
                      alt={slide.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 gap-2">
                      <Play className="w-10 h-10 opacity-40" />
                      <span className="text-sm">Demo video coming soon</span>
                    </div>
                  )}
                  {/* Gradient edge for seamless blend */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows — inside the card, always visible */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-white/15 backdrop-blur-md border border-slate-200 text-slate-900 hover:bg-white/30 shadow-lg ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-white/15 backdrop-blur-md border border-slate-200 text-slate-900 hover:bg-white/30 shadow-lg ${activeIndex === slides.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Indicator Dots + Slide Counter — below the card */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`rounded-full transition-all duration-300 ${idx === activeIndex
                  ? 'w-9 h-3 bg-[#2563EB] shadow-md shadow-[#2563EB]/30'
                  : 'w-3 h-3 bg-slate-300 hover:bg-slate-400'
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          <span className="ml-2 font-mono text-xs text-slate-400 font-bold">{activeIndex + 1} / {slides.length}</span>
        </div>
      )}
    </div>
  );
}
