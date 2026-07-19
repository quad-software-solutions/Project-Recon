import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image, FileText, Handshake, Building,
  MessageSquare, HelpCircle, MapPin, X, CheckCircle, AlertCircle, Lock, Camera, MessageSquareQuote,
} from 'lucide-react';
import HeroBannerManager from './HeroBannerManager';
import NewsManager from './NewsManager';
import CmsPartnerManager from './CmsPartnerManager';
import AboutUsManager from './AboutUsManager';
import ContactRequestManager from './ContactRequestManager';
import FaqManager from './FaqManager';
import MapNodeManager from './MapNodeManager';
import GalleryManager from './GalleryManager';
import TestimonialManager from './TestimonialManager';
import { api } from '../api/cmsApi';
import type { UserProfile } from '@/shared/types';
import { canManageCms } from '@/shared/auth/permissions';

type CmsSection = 'hero-banners' | 'news' | 'partners' | 'about' | 'map-nodes' | 'faqs' | 'contact-requests' | 'gallery' | 'testimonials';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface CmsSubNavItem {
  id: CmsSection;
  label: string;
  icon: React.ElementType;
}

interface SectionCounts {
  'hero-banners': number;
  news: number;
  partners: number;
  faqs: number;
  'contact-requests': number;
  'map-nodes': number;
  gallery: number;
  testimonials: number;
}

const SUB_NAV: CmsSubNavItem[] = [
  { id: 'hero-banners', label: 'Hero Banners', icon: Image },
  { id: 'news', label: 'News & Announcements', icon: FileText },
  { id: 'partners', label: 'Partners & Sponsors', icon: Handshake },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'about', label: 'About Us', icon: Building },
  { id: 'map-nodes', label: 'Map Nodes', icon: MapPin },
  { id: 'gallery', label: 'Gallery', icon: Camera },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'contact-requests', label: 'Contact Requests', icon: MessageSquare },
];

const STAT_SECTIONS: { key: keyof SectionCounts; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'hero-banners', label: 'Hero Banners', icon: Image, color: 'text-violet-500 bg-violet-50' },
  { key: 'news', label: 'Articles', icon: FileText, color: 'text-blue-500 bg-blue-50' },
  { key: 'partners', label: 'Partners', icon: Handshake, color: 'text-amber-500 bg-amber-50' },
  { key: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote, color: 'text-indigo-500 bg-indigo-50' },
  { key: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'text-cyan-500 bg-cyan-50' },
  { key: 'contact-requests', label: 'Contacts', icon: MessageSquare, color: 'text-rose-500 bg-rose-50' },
  { key: 'map-nodes', label: 'Map Nodes', icon: MapPin, color: 'text-orange-500 bg-orange-50' },
  { key: 'gallery', label: 'Gallery', icon: Camera, color: 'text-pink-500 bg-pink-50' },
];

let toastCounter = 0;

interface Props {
  currentUser: UserProfile;
}

export default function CmsDashboard({ currentUser }: Props) {
  const canManage = canManageCms(currentUser);
  const [section, setSection] = useState<CmsSection>('hero-banners');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [counts, setCounts] = useState<SectionCounts>({
    'hero-banners': -1, news: -1, partners: -1, faqs: -1, 'contact-requests': -1, 'map-nodes': -1, gallery: -1, testimonials: -1,
  });

  useEffect(() => {
    (async () => {
      try {
        const [heroBanners, news, partners, faqs, contactRequests, mapNodes, gallery, testimonials] = await Promise.all([
          api.getAll('hero-banners'), api.getAll('news'), api.getAll('partners'),
          api.getAll('faqs'), api.getAll('contact-requests'), api.getAll('map-nodes'), api.getAll('gallery'),
          api.getAll('testimonials').catch(() => []),
        ]);
        setCounts({
          'hero-banners': heroBanners.length,
          news: news.length,
          partners: partners.length,
          faqs: faqs.length,
          'contact-requests': contactRequests.length,
          'map-nodes': mapNodes.length,
          gallery: gallery.length,
          testimonials: testimonials.length,
        });
      } catch {
        setCounts(prev => Object.fromEntries(Object.entries(prev).map(([k]) => [k, 0])) as SectionCounts);
      }
    })();
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!canManage) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="mt-1 text-amber-700">CMS administration is only available to Super Admin users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
        {STAT_SECTIONS.map(({ key, label, icon: Icon, color }) => {
          const c = counts[key];
          return (
            <button key={key} onClick={() => setSection(key)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                section === key
                  ? 'border-blue-500/30 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
                <p className="text-sm font-bold text-slate-800">
                  {c < 0 ? <span className="text-slate-300">...</span> : c}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SUB_NAV.map(item => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {section === 'hero-banners' && <HeroBannerManager addToast={addToast} />}
            {section === 'news' && <NewsManager addToast={addToast} />}
            {section === 'partners' && <CmsPartnerManager addToast={addToast} />}
            {section === 'testimonials' && <TestimonialManager addToast={addToast} />}
            {section === 'about' && <AboutUsManager addToast={addToast} />}
            {section === 'faqs' && <FaqManager addToast={addToast} />}
            {section === 'contact-requests' && <ContactRequestManager addToast={addToast} />}
            {section === 'map-nodes' && <MapNodeManager addToast={addToast} />}
            {section === 'gallery' && <GalleryManager addToast={addToast} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 100, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={`flex items-start gap-2 p-3 rounded-xl shadow-lg border ${
                toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
