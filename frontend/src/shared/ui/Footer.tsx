import { ActiveTab } from '../../shared/types';
import BrandLogo from './BrandLogo';
import { useBranding } from '@/shared/hooks/useBranding';
import { Instagram, Youtube, Phone, Music2 } from 'lucide-react';

interface FooterProps { onNavigate: (tab: ActiveTab) => void }

const QUICK_LINKS: { label: string; tab: ActiveTab }[] = [
  { label: 'Home', tab: 'home' },
  { label: 'Programs', tab: 'about' },
  { label: 'Store', tab: 'store' },
  { label: 'Simulator', tab: 'simulator' },
  { label: 'Competitions', tab: 'competitions' },
];

const LEGAL_LINKS: { label: string; tab: ActiveTab }[] = [
  { label: 'Verify Certificate', tab: 'cert-verify' },
  { label: 'Privacy Policy', tab: 'privacy' },
  { label: 'Terms of Service', tab: 'terms' },
  { label: 'Help Center', tab: 'help' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/ethiorobotics', icon: Instagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@ethiorobotics', icon: Music2 },
  { label: 'YouTube', href: 'https://youtube.com/@ethio-roborobotics2722', icon: Youtube },
];

export default function Footer({ onNavigate }: FooterProps) {
  const branding = useBranding();

  return (
    <footer className="bg-brand-blue text-white/70 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <BrandLogo className="h-8 w-[100px]" compact logoUrl={branding.logoUrl || undefined} />
          <p className="text-sm mt-3 leading-relaxed max-w-xs">Empowering the next generation of Ethiopian engineers through hands-on robotics education.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2">
            {QUICK_LINKS.map(link => (
              <li key={link.label}><button onClick={() => onNavigate(link.tab)} className="text-sm hover:text-white transition-colors">{link.label}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2">
            {LEGAL_LINKS.map(link => (
              <li key={link.label}><button onClick={() => onNavigate(link.tab)} className="text-sm hover:text-white transition-colors">{link.label}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Follow Us</h4>
          <ul className="space-y-2">
            {SOCIAL_LINKS.map(s => {
              const SIcon = s.icon;
              return (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors">
                    <SIcon className="w-4 h-4" /> {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Locations</h4>
          <ul className="space-y-1.5 text-sm">
            <li>Bole Reality Plaza, 12th Floor</li>
            <li>CMC (Addis International Convention Center)</li>
            <li>Bole TK Building, 1st Floor</li>
            <li>Bisrate Gabriel, International Tennis Club, 3rd Floor</li>
            <li>Space Science and Geospatial Institute</li>
            <li>Burayu Talent Development Institute</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm">info@ethiorobotics.com</p>
            <a href="tel:+251911675401" className="inline-flex items-center gap-1.5 text-sm mt-1 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5" /> 0911 675 401</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Ethio Robotics. All rights reserved.</p>
        <p className="mt-1.5 text-white/50 text-[10px] tracking-wide">Built by <a href="https://quad.pro.et" target="_blank" rel="noopener noreferrer" className="text-amber-300/80 hover:text-amber-200 font-semibold transition-colors">Quad Software Solutions</a></p>
      </div>
    </footer>
  );
}
