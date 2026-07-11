import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ethio-cms-branding';

interface BrandingData {
  slogan: string;
  vision: string;
  programDesc: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
}

const defaults: BrandingData = {
  slogan: 'Empowering the Next Generation of Innovators',
  vision: 'We believe that every student has the potential to shape the future of technology in Ethiopia and beyond.',
  programDesc: 'An introductory robotics course designed for young learners to build foundational STEM skills through hands-on VEX IQ kits.',
  primaryColor: '#ed1c24',
  secondaryColor: '#1e293b',
  fontFamily: 'Inter',
  logoUrl: '',
  heroTitle: 'Welcome to STEM Center',
  heroSubtitle: 'Building the Future, One Robot at a Time',
};

export function useBranding(): BrandingData {
  const [data, setData] = useState<BrandingData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setData(e.newValue ? { ...defaults, ...JSON.parse(e.newValue) } : defaults);
        } catch {
          setData(defaults);
        }
      }
    };
    
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<BrandingData>;
      setData(customEvent.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('branding-updated', handleCustom);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('branding-updated', handleCustom);
    };
  }, []);

  return data;
}

export function saveBranding(data: BrandingData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('branding-updated', { detail: data }));
}

export function resetBranding() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('branding-updated', { detail: defaults }));
}

export type { BrandingData };
