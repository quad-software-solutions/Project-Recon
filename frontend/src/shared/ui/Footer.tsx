import { ActiveTab } from '../../shared/types';
import BrandLogo from './BrandLogo';
import { useBranding } from '@/shared/hooks/useBranding';

interface FooterProps { onNavigate: (tab: ActiveTab) => void; }

const FOOTER_LINKS: { label: string; tab: ActiveTab }[] = [
  { label: 'Home', tab: 'home' },
  { label: 'Programs', tab: 'about' },
  { label: 'Store', tab: 'store' },
  { label: 'Simulator', tab: 'simulator' },
  { label: 'Competitions', tab: 'competitions' },
  { label: 'Pricing', tab: 'about' },
];

export default function Footer({ onNavigate }: FooterProps) {
  const branding = useBranding();

  return (
    <footer className="bg-brand-blue text-white/70 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <BrandLogo className="h-8 w-[100px]" compact logoUrl={branding.logoUrl || undefined} />
          <p className="text-sm mt-3 leading-relaxed max-w-xs">Empowering the next generation of Ethiopian engineers through hands-on robotics education.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2">
            {FOOTER_LINKS.slice(0, 4).map(link => (
              <li key={link.label}><button onClick={() => onNavigate(link.tab)} className="text-sm hover:text-white transition-colors">{link.label}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">More</h4>
          <ul className="space-y-2">
            {FOOTER_LINKS.slice(4).map(link => (
              <li key={link.label}><button onClick={() => onNavigate(link.tab)} className="text-sm hover:text-white transition-colors">{link.label}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Contact</h4>
          <p className="text-sm">Bole, Addis Ababa</p>
          <p className="text-sm">Ethiopia</p>
          <p className="text-sm mt-2">info@ethiorobotics.com</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Ethio Robotics. All rights reserved.</p>
        <p className="mt-1.5 text-white/50 text-[10px] tracking-wide">Built by <a href="https://quad.pro.et" target="_blank" rel="noopener noreferrer" class="text-amber-300/80 hover:text-amber-200 font-semibold transition-colors">Quad Software Solutions</a></p>
      </div>
    </footer>
  );
}
