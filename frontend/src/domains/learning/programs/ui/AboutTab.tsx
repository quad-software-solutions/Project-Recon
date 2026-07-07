import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  Users, 
  Target, 
  MapPin, 
  Sparkles, 
  ArrowUpRight, 
  Globe, 
  Compass,
  Cpu, 
  Activity, 
  Shield, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

import imgAddis from '@/assets/photo_2026-06-15_14-39-18.jpg';
import imgUsa from '@/assets/0M6A6519.00_25_12_08.Still037.jpg';
import imgCanada from '@/assets/photo_2026-06-15_14-39-23.jpg';
import imgChina from '@/assets/photo_2026-06-15_14-39-40.jpg';

import { cmsPublicApi, type AboutUsResponse, type CmsPartnerResponse } from '../../../cms/public/api/cmsPublicApi';

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

export default function AboutTab() {
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [activeTab, setActiveTabTab] = useState<'mission' | 'vision'>('mission');
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0, lat: "8.9806° N", lng: "38.7578° E" });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [aboutData, setAboutData] = useState<AboutUsResponse[]>([]);
  const [partners, setPartners] = useState<CmsPartnerResponse[]>([]);

  useEffect(() => {
    cmsPublicApi.getAboutUs().then(data => setAboutData(data.filter(a => a.is_active))).catch(console.error);
    cmsPublicApi.getPartners().then(data => setPartners(data.filter(p => p.is_active))).catch(console.error);
  }, []);

  // Strategic Global Instances
  const mapNodes: MapNode[] = [
    {
      id: 'addis-ababa',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      title: 'Ethio Robotics Master Hub',
      achievement: 'Cybernetics, Automated Systems & Outreach HQ initiating 5M+ young minds.',
      x: 58,
      y: 58,
      lat: '8.9806° N',
      lng: '38.7578° E',
      image: imgAddis,
      category: 'Alliance'
    },
    {
      id: 'usa',
      city: 'Dallas',
      country: 'USA',
      title: 'VEX World Championship',
      achievement: 'Clinched the legendary Gold Category overall precision robotics trophy.',
      x: 18,
      y: 45,
      lat: '32.7767° N',
      lng: '96.7970° W',
      image: imgUsa,
      category: 'Championship'
    },
    {
      id: 'canada',
      city: 'Toronto',
      country: 'Canada',
      title: 'North American Expansion',
      achievement: 'Developing cross-border learning curriculums for global reach.',
      x: 23,
      y: 35,
      lat: '43.6510° N',
      lng: '79.3470° W',
      image: imgCanada,
      category: 'Academic'
    },
    {
      id: 'china',
      city: 'Beijing',
      country: 'China',
      title: 'Enjoy AI Global Summit',
      achievement: 'Design strategy gold winner for extreme line-tracking cybernetic vehicles.',
      x: 77,
      y: 38,
      lat: '39.9042° N',
      lng: '116.4074° E',
      image: imgChina,
      category: 'Championship'
    }
  ];

  const team = [
    {
      name: 'Dr. Kidus Gidey',
      role: 'Founder & Chief Engineering Mentor',
      bio: 'Ph.D. in Cybernetics from EPFL. Spent 10 years building automated flight control setups.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Selam Berhe',
      role: 'Director of Curriculum & Pedagogy',
      bio: 'Former school principal, specialized in early blockly teaching schemas and STEM equality.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Nebil Mohammed',
      role: 'Lead Hardware Systems Fabricator',
      bio: 'Self-proclaimed micro-soldering wizard, VEX V5 system expert, and mentor for competitive matches.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
  ];

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

  const adbNode = mapNodes[0]; // Addis Ababa coordinates
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

        {/* Right Side: Text Content */}
        <div className="w-full lg:w-[35%] flex flex-col items-center lg:items-start text-center lg:text-left mt-4 lg:mt-0">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1a2670] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-4 inline-block shadow-sm">
            ABOUT ETHIO ROBOTICS:
          </span>
          {aboutData.length > 0 ? (
            aboutData.map((section, idx) => (
              <div key={section.id} className="mb-6">
                <h2 className="font-display font-bold text-slate-900 tracking-tight leading-tight mb-4 text-[24px] md:text-[30px]">
                  {section.title}
                </h2>
                <div 
                  className="font-sans text-sm md:text-base text-brand-muted-dark leading-relaxed mb-5 about-content"
                  dangerouslySetInnerHTML={{ __html: section.content }} 
                />
              </div>
            ))
          ) : (
            <>
              <h2 className="font-display font-bold text-slate-900 tracking-tight leading-tight mb-5 text-[28px] md:text-[34px]">
                Who We Are & Our Vision
              </h2>
              <p className="font-sans text-sm md:text-base text-brand-muted-dark leading-relaxed mb-5">
                Ethio Robo Robotics is the premier education-focused organization in Ethiopia specializing in STEM, advanced robotics training, and high-impact competitions. We build the next generation of African innovators by fostering technical skills and leadership.
              </p>
              <p className="font-sans text-sm md:text-base text-brand-muted-dark leading-relaxed mb-8">
                From organizing the landmark <strong>African Robotics Championship (ARC)</strong> to coaching teams for the <strong>USA VEX Robotics Competition</strong> and <strong>ENJOY AI Global</strong>, we bridge the gap between theoretical knowledge and practical hardware execution. Our hands-on curriculums, mentorship programs, and retail toolkits empower students from elementary to university levels.
              </p>
            </>
          )}
          
          <div className="font-display font-extrabold tracking-tight text-3xl md:text-4xl leading-none mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#b5852a] to-[#d6a54a] uppercase drop-shadow-sm">
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
      </section>

      {/* Partners Section */}
      <section id="about-partners" className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-slate-900 tracking-tight text-3xl md:text-4xl">Our Partners</h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Collaborating with industry leaders to bring world-class STEM education to Ethiopia.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-12 items-center opacity-70 hover:opacity-100 transition-opacity">
            {partners.length > 0 ? (
              partners.map(partner => (
                <img key={partner.id} src={partner.image || ''} alt={partner.title} className="h-16 object-contain" />
              ))
            ) : (
              <>
                <img src="https://ethiorobotics.org/images/partners/minstry%20of%20inovation%20and%20technology.png" alt="Ministry of Innovation" className="h-16 object-contain" />
                <img src="https://ethiorobotics.org/images/partners/vex.webp" alt="VEX Robotics" className="h-16 object-contain" />
                <img src="https://ethiorobotics.org/images/partners/ethiopian_airlines.png" alt="Ethiopian Airlines" className="h-16 object-contain" />
                <img src="https://ethiorobotics.org/images/partners/aau.png" alt="Addis Ababa University" className="h-16 object-contain" />
              </>
            )}
          </div>
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
