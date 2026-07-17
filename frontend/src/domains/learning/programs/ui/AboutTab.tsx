import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  Sparkles, 
  Globe, 
  Compass,
  Target,
  Eye,
} from 'lucide-react';

import imgAddis from '@/assets/photo_2026-06-15_14-39-18.jpg';
import imgUsa from '@/assets/0M6A6519.00_25_12_08.Still037.jpg';
import imgCanada from '@/assets/photo_2026-06-15_14-39-23.jpg';
import imgChina from '@/assets/photo_2026-06-15_14-39-40.jpg';

import { cmsPublicApi, type AboutUsResponse, type CmsPartnerResponse, type MapNodeResponse, type TeamMemberResponse } from '../../../cms/public/api/cmsPublicApi';

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

const matchSlugOrTitle = (slug: string) => (a: AboutUsResponse) =>
  a.slug === slug || a.slug.includes(slug) || a.title.toLowerCase().includes(slug);

export default function AboutTab() {
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0, lat: "8.9806° N", lng: "38.7578° E" });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [aboutData, setAboutData] = useState<AboutUsResponse[]>([]);
  const [partners, setPartners] = useState<CmsPartnerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [team, setTeam] = useState<{ name: string; role: string; bio: string; image: string }[]>([]);

  useEffect(() => {
    Promise.all([
      cmsPublicApi.getAboutUs(),
      cmsPublicApi.getPartners(),
      cmsPublicApi.getMapNodes(),
      cmsPublicApi.getTeamMembers(),
    ]).then(([aboutRes, partnersRes, nodesRes, teamRes]) => {
      setAboutData((Array.isArray(aboutRes) ? aboutRes : []).filter(a => a.is_active));
      setPartners((Array.isArray(partnersRes) ? partnersRes : []).filter(p => p.is_active));
      setMapNodes((Array.isArray(nodesRes) ? nodesRes : []).filter(n => n.is_active).map(n => ({
        id: n.id, city: n.city, country: n.country, title: n.title,
        achievement: n.achievement, x: n.x, y: n.y, lat: n.lat, lng: n.lng,
        image: n.image, category: n.category as MapNode['category'],
      })));
      setTeam((Array.isArray(teamRes) ? teamRes : []).filter(m => m.is_active).map(m => ({
        name: m.name, role: m.role, bio: m.bio, image: m.image,
      })));
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
                      {section.mission && (
                        <div className="group relative bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-100/60 hover:border-blue-200 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Target className="w-4 h-4 text-brand-blue" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-brand-blue uppercase tracking-wider mb-0.5">Mission</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{section.mission}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {section.vision && (
                        <div className="group relative bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-100/60 hover:border-amber-200 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Eye className="w-4 h-4 text-amber-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Vision</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{section.vision}</p>
                            </div>
                          </div>
                        </div>
                      )}
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
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-100/60">
                  <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-brand-blue uppercase tracking-wider mb-0.5">Mission</p>
                      <p className="text-sm text-slate-700">To inspire and equip the next generation of African innovators with STEM and robotics skills.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-100/60">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Vision</p>
                      <p className="text-sm text-slate-700">A world where every African student has access to quality STEM education and robotics training.</p>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Leadership Team Section */}
      <section id="about-team" className="max-w-7xl mx-auto px-6 md:px-12 py-20 mt-10 border-t border-slate-200">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">Leadership Team</h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Meet the visionary educators and engineers driving Ethio Robotics forward.</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-slate-200 mb-4" />
                <div className="h-5 bg-slate-200 rounded w-32 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-full mb-1" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : team.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md transition-all">
                <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-brand-blue/10" />
                <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
                <span className="text-brand-blue text-sm font-semibold mb-3">{member.role}</span>
                <p className="text-slate-600 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm font-medium">No team members listed yet</p>
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
