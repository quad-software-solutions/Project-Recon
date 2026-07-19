import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Sparkles, 
  Compass,
  Target,
  Eye,
  Lightbulb,
  Users,
  Heart,
  Award,
  Quote,
  Play,
} from 'lucide-react';

import imgAddis from '@/assets/photo_2026-06-15_14-39-18.jpg';
import imgUsa from '@/assets/0M6A6519.00_25_12_08.Still037.jpg';
import imgCanada from '@/assets/photo_2026-06-15_14-39-23.jpg';
import imgChina from '@/assets/photo_2026-06-15_14-39-40.jpg';

import { cmsPublicApi, type AboutUsResponse, type CmsPartnerResponse, type MapNodeResponse, type TestimonialResponse } from '../../../cms/public/api/cmsPublicApi';

interface MapNode {
  id: string;
  city: string;
  country: string;
  title: string;
  achievement: string;
  x: number; // percentage width
  y: number; // percentage height
  lat: string;
  lng: string;
  image: string;
  category: 'Championship' | 'Academic' | 'Research' | 'Strategy' | 'Alliance';
}

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function MissionVisionPair({ mission, vision }: { mission?: string; vision?: string }) {
  if (!mission && !vision) return null;
  return (
    <div className="grid grid-cols-1 gap-3 mt-1">
      {mission && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#25338d] to-[#1a2670] p-5 text-white shadow-md">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100 mb-1">Our Mission</p>
              <p className="text-sm text-white/95 leading-relaxed">{mission}</p>
            </div>
          </div>
        </div>
      )}
      {vision && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-[#c9a227] to-[#a67c1a] p-5 text-white shadow-md">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-50 mb-1">Our Vision</p>
              <p className="text-sm text-white/95 leading-relaxed">{vision}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const OUR_VALUES = [
  { title: 'Innovation', desc: 'We push creative problem-solving in every build, lesson, and competition.', icon: Lightbulb },
  { title: 'Teamwork', desc: 'We grow stronger by mentoring, collaborating, and competing together.', icon: Users },
  { title: 'Inclusivity', desc: 'We open STEM doors for every student who wants to learn and lead.', icon: Heart },
  { title: 'Excellence', desc: 'We hold a high bar for how we teach, mentor, and compete.', icon: Award },
];

export default function AboutTab() {
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0, lat: "8.9806° N", lng: "38.7578° E" });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [aboutData, setAboutData] = useState<AboutUsResponse[]>([]);
  const [partners, setPartners] = useState<CmsPartnerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialResponse[]>([]);

  useEffect(() => {
    Promise.all([
      cmsPublicApi.getAboutUs(),
      cmsPublicApi.getPartners(),
      cmsPublicApi.getMapNodes(),
      cmsPublicApi.getTestimonials(),
    ]).then(([aboutRes, partnersRes, nodesRes, testimonialsRes]) => {
      setAboutData((Array.isArray(aboutRes) ? aboutRes : []).filter(a => a.is_active));
      setPartners((Array.isArray(partnersRes) ? partnersRes : []).filter(p => p.is_active));
      setMapNodes((Array.isArray(nodesRes) ? nodesRes : []).filter(n => n.is_active).map(n => ({
        id: n.id, city: n.city, country: n.country, title: n.title,
        achievement: n.achievement, x: n.x, y: n.y, lat: n.lat, lng: n.lng,
        image: n.image, category: n.category as MapNode['category'],
      })));
      const activeTestimonials = (Array.isArray(testimonialsRes) ? testimonialsRes : []).filter(t => t.is_active);
      setTestimonials(activeTestimonials);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Dynamically calculate lat/lng depending on mouse coords relative to container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Map percentage coordinates into simulated lat/lng coordinates
    const latSim = (90 - (yPct / 100) * 180).toFixed(4);
    const lngSim = ((xPct / 100) * 360 - 180).toFixed(4);

    setMouseCoords({
      x: xPct,
      y: yPct,
      lat: `${Math.abs(Number(latSim))}° ${Number(latSim) >= 0 ? 'N' : 'S'}`,
      lng: `${Math.abs(Number(lngSim))}° ${Number(lngSim) >= 0 ? 'E' : 'W'}`
    });
  };

  const adbNode = mapNodes[0] ?? { x: 0, y: 0 } as MapNode; // Addis Ababa coordinates
  return (
    <div className="bg-[#faf8ff] text-[#191b23] relative border-y border-brand-border-light/80 py-16 overflow-hidden" id="about-mission">
      {/* Blueprint background grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative flex flex-col lg:flex-row items-center gap-10">
        
        {/* Left Side: Map Container */}
        <div className="w-full lg:w-[65%] flex flex-col gap-4">
          <div>
            <h1 className="font-display font-bold text-slate-900 tracking-tight leading-tight text-[clamp(24px,4vw,34px)] text-center lg:text-left text-brand-blue">
              OUR GLOBAL JOURNEY & ACHIEVEMENT RECORDS
            </h1>
          </div>
          
          <div 
            ref={mapContainerRef}
            onMouseMove={handleMouseMove}
            className="w-full relative bg-brand-surface overflow-hidden border border-[#e2e4ed] rounded-2xl cursor-crosshair group flex items-center justify-center select-none shadow-sm"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-10" />
            
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWgdVFndBUNlNV9eIO2rJrJ6ZMUr1rYW5aNtWkNWsNnCxdVo1LfrWx1j_NG95L-qb3Q3gjhJ5fGtz1r6p_tJCaWWDN504rg8UJKqgmHusbY6G-CNFef5c7SciVdBxxABBRoW_w-JxCxdClCbwBiOIdZdl8hR8llVYgUXw-B5gK5NJn0vWVsUKX_Lcx-6Av43mGDc_0EZw_8Rq_xlPbV3qtR1qT4_Pr6Ue6q1bdVGPlkHPZgOdtLWZv0rqK_27qkGVHeiPrBRbWpU7M"
              alt="World Map Base Canvas"
              className="w-full h-auto block select-none pointer-events-none opacity-80"
            />

            {mapNodes.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {mapNodes.map((node) => {
                  if (node.id === 'addis-ababa') return null;
                  const x1 = adbNode.x;
                  const y1 = adbNode.y;
                  const x2 = node.x;
                  const y2 = node.y;
                  const isHovered = hoveredNode?.id === node.id;
                  const cx = (x1 + x2) / 2;
                  const cy = Math.min(y1, y2) - Math.abs(x1 - x2) * 0.15;
                  return (
                    <g key={`path-${node.id}`}>
                      <path
                        d={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                        fill="none"
                        stroke={isHovered ? '#25338d' : '#cbd2e1'}
                        strokeWidth={isHovered ? 2.5 : 1.25}
                        className="transition-all duration-300"
                        opacity={isHovered ? 0.8 : 0.45}
                      />
                      {isHovered && (
                        <path
                          d={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                          fill="none"
                          stroke="#00687a"
                          strokeWidth={2.5}
                          strokeDasharray="12, 12"
                          className="animate-[dash_2s_linear_infinite]"
                          style={{
                            animation: 'dash 1.2s linear infinite',
                            strokeDashoffset: 100,
                          }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            )}

            {mapNodes.length > 0 ? (
              <div className="absolute inset-0 z-20 pointer-events-auto">
                {mapNodes.map((node) => {
                  const isCenterNode = node.id === 'addis-ababa';
                  const isHovered = hoveredNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                        <span className={`absolute inset-0 rounded-full scale-[2.2] opacity-40 transition-all ${
                          isCenterNode ? 'bg-amber-400 animate-ping' : isHovered ? 'bg-[#25338d] animate-pulse' : 'bg-slate-400 group-hover:bg-[#25338d]/45'
                        }`} style={{ width: '12px', height: '12px' }} />
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-all duration-300 ${
                          isCenterNode ? 'bg-amber-500 scale-125' : isHovered ? 'bg-[#25338d] scale-135' : 'bg-slate-500 group-hover:bg-[#25338d]'
                        }`} />
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur px-2 py-0.5 rounded border border-slate-200/50 shadow-xs whitespace-nowrap text-[9px] font-mono leading-none transition-all ${
                          isHovered ? 'scale-110 font-bold border-[#25338d] text-[#25338d]' : 'text-slate-600'
                        }`}>
                          {node.city}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-slate-400 bg-white/80 px-4 py-2 rounded-lg border border-slate-200">No global locations mapped yet</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-xl border border-brand-border-light p-2.5 text-[#191b23] z-30 shadow-md text-left font-mono max-w-[240px] hidden sm:block">
              <span className="text-[8px] uppercase tracking-widest font-bold text-[#25338d] block mb-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#25338d] animate-spin" style={{ animationDuration: '6s' }} />
                <span>COORDINATE TERMINAL</span>
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                <span className="text-slate-400 font-medium">CURSOR LAT:</span>
                <span className="text-slate-800 text-right">{mouseCoords.lat}</span>
                <span className="text-slate-400 font-medium">CURSOR LNG:</span>
                <span className="text-slate-800 text-right">{mouseCoords.lng}</span>
              </div>
            </div>

            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-40 bg-white/95 backdrop-blur-xl border border-blue-200 rounded-2xl shadow-2xl p-3 w-64 text-left pointer-events-none"
                  style={{
                    right: hoveredNode.x > 50 ? 'auto' : '12px',
                    left: hoveredNode.x > 50 ? '12px' : 'auto',
                    top: '12px',
                  }}
                >
                  <div className="relative aspect-video rounded-lg bg-slate-100 overflow-hidden mb-2 shadow-sm">
                    <img
                      src={hoveredNode.image}
                      alt={hoveredNode.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-slate-900/85 backdrop-blur px-1.5 py-0.5 rounded-full text-[7px] font-mono text-white tracking-widest font-bold uppercase border border-white/20">
                      {hoveredNode.category}
                    </div>
                  </div>
                  <span className="font-mono text-[7px] text-brand-blue font-bold tracking-widest uppercase block">
                    {hoveredNode.city}, {hoveredNode.country}
                  </span>
                  <h3 className="font-display font-bold text-slate-900 text-xs mt-0.5 leading-tight">
                    {hoveredNode.title}
                  </h3>
                  <p className="font-sans text-[10px] text-slate-600 mt-1 leading-snug pb-2 border-b border-slate-200/40">
                    {hoveredNode.achievement}
                  </p>
                  <div className="flex items-center justify-between text-[7px] font-mono text-slate-400 pt-1.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 text-rose-500" />
                      <span>{hoveredNode.lat}, {hoveredNode.lng}</span>
                    </span>
                    <span className="text-[#25338d] font-bold">VERIFIED</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: About Content */}
        <div className="w-full lg:w-[35%] flex flex-col items-center lg:items-start text-center lg:text-left mt-4 lg:mt-0">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1a2670] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-4 inline-block shadow-sm">
            ABOUT ETHIO ROBOTICS:
          </span>
          {loading ? (
            <div className="w-full space-y-4 animate-pulse">
              <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>
          ) : aboutData.length > 0 ? (
            <div className="w-full space-y-8">
              {aboutData.map((section, idx) => (
                <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-shadow">
                  {section.image && (
                    <div className="relative h-52 overflow-hidden">
                      <img src={section.image} alt={section.title}
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="font-display font-bold text-slate-900 tracking-tight leading-tight mb-3 text-[22px] md:text-[26px]">
                      {section.title}
                    </h2>
                    <div 
                      className="font-sans text-sm md:text-base text-slate-600 leading-relaxed mb-5 about-content"
                      dangerouslySetInnerHTML={{ __html: section.content || section.description || '' }}
                    />
                    <div className="flex flex-col gap-3">
                      <MissionVisionPair mission={section.mission} vision={section.vision} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h2 className="font-display font-bold text-slate-900 tracking-tight leading-tight mb-5 text-[28px] md:text-[34px]">
                Who We Are & Our Vision
              </h2>
              <p className="font-sans text-sm md:text-base text-slate-600 leading-relaxed mb-4">
                Ethio Robo Robotics is the premier education-focused organization in Ethiopia specializing in STEM, advanced robotics training, and high-impact competitions. We build the next generation of African innovators by fostering technical skills and leadership.
              </p>
              <p className="font-sans text-sm md:text-base text-slate-600 leading-relaxed mb-6">
                From organizing the landmark <strong>African Robotics Championship (ARC)</strong> to coaching teams for the <strong>USA VEX Robotics Competition</strong> and <strong>ENJOY AI Global</strong>, we bridge the gap between theoretical knowledge and practical hardware execution. Our hands-on curriculums, mentorship programs, and retail toolkits empower students from elementary to university levels.
              </p>
              <MissionVisionPair
                mission="To inspire and equip the next generation of African innovators with STEM and robotics skills."
                vision="A world where every African student has access to quality STEM education and robotics training."
              />
            </div>
          )}
          
          <div className="font-display font-extrabold tracking-tight text-3xl md:text-4xl leading-none my-8 text-transparent bg-clip-text bg-gradient-to-r from-[#b5852a] to-[#d6a54a] uppercase drop-shadow-sm">
            INNOVATION FIRST
          </div>

          <a 
            href="#section-newsletter"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('section-newsletter')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#25338d] text-white font-sans font-bold text-sm tracking-wide px-8 py-3.5 rounded-xl hover:bg-[#1a2670] transition-all hover:scale-105 duration-300 shadow-md flex items-center gap-2 group cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>JOIN US</span>
          </a>
        </div>

      </div>

      {/* Our Values */}
      <section id="about-values" className="max-w-7xl mx-auto px-6 md:px-12 py-20 mt-10 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">Our Values</h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            Innovation, teamwork, inclusivity, and excellence—guiding how we teach, mentor, and compete.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {OUR_VALUES.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-blue" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="about-testimonials" className="max-w-7xl mx-auto px-6 md:px-12 py-20 border-t border-slate-200">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">Testimonials</h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            Stories and videos from students, parents, and partners in our robotics community.
          </p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="aspect-video bg-slate-200" />
                <div className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-5/6 mb-6" />
                  <div className="h-5 bg-slate-200 rounded w-32 mb-1" />
                  <div className="h-4 bg-slate-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Quote className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm font-medium">No testimonials published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((t) => {
              const embed = t.video_url ? getVideoEmbed(t.video_url) : null;
              const isDirectVideo = t.video_url && /\.(mp4|webm|ogg)(\?|$)/i.test(t.video_url);
              return (
                <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all group">
                  {embed ? (
                    <div className="relative aspect-video bg-slate-900">
                      <iframe
                        src={embed}
                        title={`${t.name} testimonial`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : isDirectVideo && t.video_url ? (
                    <div className="relative aspect-video bg-slate-900">
                      <video controls className="absolute inset-0 w-full h-full object-cover" src={t.video_url} poster={t.image ?? undefined} />
                    </div>
                  ) : t.video_url ? (
                    <a
                      href={t.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video bg-slate-900 flex items-center justify-center group/play"
                    >
                      {t.image && <img src={t.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                      <span className="relative z-10 w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-brand-blue ml-0.5" fill="currentColor" />
                      </span>
                    </a>
                  ) : t.image ? (
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-[5/2] bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                      <Quote className="w-10 h-10 text-brand-blue/25" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-slate-700 text-sm leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      {t.image ? (
                        <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue font-bold text-sm">
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{t.name}</h3>
                        <span className="text-slate-500 text-xs">{t.role}</span>
                      </div>
                      {t.video_url && (
                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2 py-1 rounded-full">
                          <Play className="w-3 h-3" /> Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Partners Section */}
      <section id="about-partners" className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">Our Partners</h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Collaborating with industry leaders to bring world-class STEM education to Ethiopia.</p>
          </div>
          {loading ? (
            <div className="flex flex-wrap justify-center gap-12 items-center animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-32 bg-slate-200 rounded" />)}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-70 hover:opacity-100 transition-opacity">
              {partners.length > 0 ? (
                partners.map(partner =>
                    partner.image ? <img key={partner.id} src={partner.image} alt={partner.title} className="h-16 object-contain" /> : null
                  )
              ) : (
                <>
                  <img src="https://ethiorobotics.org/images/partners/minstry%20of%20inovation%20and%20technology.png" alt="Ministry of Innovation" className="h-16 object-contain" />
                  <img src="https://ethiorobotics.org/images/partners/vex.webp" alt="VEX Robotics" className="h-16 object-contain" />
                  <img src="https://ethiorobotics.org/images/partners/ethiopian_airlines.png" alt="Ethiopian Airlines" className="h-16 object-contain" />
                  <img src="https://ethiorobotics.org/images/partners/aau.png" alt="Addis Ababa University" className="h-16 object-contain" />
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="about-gallery" className="max-w-7xl mx-auto px-6 md:px-12 py-20 border-t border-slate-200">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">Gallery</h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Moments of innovation and teamwork from our various competitions and workshops.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <img src={imgAddis} alt="Addis Ababa" className="w-full h-48 object-cover rounded-xl shadow-sm hover:scale-[1.02] transition-transform" />
          <img src={imgUsa} alt="USA Competition" className="w-full h-48 object-cover rounded-xl shadow-sm hover:scale-[1.02] transition-transform" />
          <img src={imgCanada} alt="Canada Workshop" className="w-full h-48 object-cover rounded-xl shadow-sm hover:scale-[1.02] transition-transform" />
          <img src={imgChina} alt="China Summit" className="w-full h-48 object-cover rounded-xl shadow-sm hover:scale-[1.02] transition-transform" />
        </div>
      </section>
    </div>
  );
}
