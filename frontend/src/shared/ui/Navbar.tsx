import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, LogOut, Menu, X,
  Info, ShoppingBag, Bot, Trophy, Users, LayoutDashboard,
  LogIn, UserPlus, Home, ChevronDown, GraduationCap,
  Cpu, Globe, Wrench, Laptop, Sparkles,
  Award, Calendar, MapPin, Search, ShieldCheck,
} from 'lucide-react';

import SearchOverlay from './SearchOverlay';
import BrandLogo from './BrandLogo';
import { useBranding } from '@/shared/hooks/useBranding';
import { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  cartCount: number;
  onOpenCart: () => void;
}

type MegaItem = {
  label: string;
  desc: string;
  icon: React.ElementType;
  tab: ActiveTab;
  section?: string;
  /** Optional absolute path for deep links (e.g. /store/orders) */
  href?: string;
};

const MEGA_MENUS: Record<string, { items: MegaItem[]; viewAllTab?: ActiveTab }> = {
  about: {
    viewAllTab: 'about',
    items: [
      { label: 'Our Mission', desc: 'Vision, values & impact', icon: Sparkles, tab: 'about', section: 'about-mission' },
      { label: 'Leadership Team', desc: 'Meet our instructors & staff', icon: Users, tab: 'about', section: 'about-team' },
      { label: 'Partners', desc: 'Global engineering partners', icon: Globe, tab: 'about', section: 'about-partners' },
      { label: 'Gallery', desc: 'Events & competition photos', icon: Award, tab: 'about', section: 'about-gallery' },
    ],
  },
  programs: {
    viewAllTab: 'registration',
    items: [
      { label: 'VEX V5 Competitive', desc: 'Professional metallic builds & C++', icon: Cpu, tab: 'registration' },
      { label: 'VEX IQ Junior', desc: 'Mechanical assembly & block programming', icon: Cpu, tab: 'registration' },
      { label: 'Enjoy AI Autonomous', desc: 'Autonomous driving & computer vision', icon: Bot, tab: 'registration' },
      { label: 'Python Programming', desc: 'Algorithms, data structures & AI', icon: Laptop, tab: 'registration' },
      { label: 'C++ Engineering', desc: 'Low-level hardware control', icon: Laptop, tab: 'registration' },
    ],
  },
  store: {
    viewAllTab: 'store',
    items: [
      { label: 'All products', desc: 'Browse the full catalog', icon: ShoppingBag, tab: 'store', href: '/store' },
      { label: 'My orders', desc: 'Track paid and pickup orders', icon: Award, tab: 'store-orders', href: '/store/orders' },
      { label: 'Sensors & kits', desc: 'Parts for competition builds', icon: Cpu, tab: 'store', href: '/store' },
      { label: 'Apparel & bags', desc: 'Branded merch', icon: ShoppingBag, tab: 'store', href: '/store' },
    ],
  },
  events: {
    viewAllTab: 'competitions',
    items: [
      { label: 'Competitions', desc: 'VEX & Enjoy AI tournaments', icon: Trophy, tab: 'competitions', section: 'live-matches' },
      { label: 'Workshops', desc: 'Hands-on training sessions', icon: GraduationCap, tab: 'competitions', section: 'events' },
      { label: 'Event Calendar', desc: 'Upcoming dates & deadlines', icon: Calendar, tab: 'competitions', section: 'events' },
      { label: 'Venues', desc: 'Lab locations & maps', icon: MapPin, tab: 'competitions', section: 'venues' },
      { label: 'Verify Certificate', desc: 'Check certificate authenticity', icon: ShieldCheck, tab: 'cert-verify' },
    ],
  },
};

type NavItem = { tab: ActiveTab; label: string; icon: React.ElementType; mega?: string; auth: 'always' | 'guest' | 'user'; roles?: string[] };

const NAV_ITEMS: NavItem[] = [
  { tab: 'home', label: 'Home', icon: Home, auth: 'guest' },
  { tab: 'about', label: 'About', icon: Info, mega: 'about', auth: 'guest' },
  { tab: 'registration', label: 'Programs', icon: GraduationCap, mega: 'programs', auth: 'guest' },
  { tab: 'store', label: 'Store', icon: ShoppingBag, mega: 'store', auth: 'guest' },
  { tab: 'competitions', label: 'Events', icon: Trophy, mega: 'events', auth: 'guest' },
  { tab: 'cert-verify', label: 'Verify', icon: ShieldCheck, auth: 'guest' },
];

const getMegaPanelAlignment = (mega?: string) =>
  mega === 'store' || mega === 'events' ? 'right-0' : 'left-0';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAuth,
  cartCount,
  onOpenCart,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [mobileMegaOpen, setMobileMegaOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const megaTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const branding = useBranding();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (tab: ActiveTab, section?: string, href?: string) => {
    setMobileMenuOpen(false);
    setMobileMegaOpen(null);
    setOpenMega(null);
    if (href) {
      window.history.pushState(null, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab(tab);
    if (section) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(section);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const visibleItems = NAV_ITEMS.filter(l => {
    if (l.auth === 'always') return true;
    if (l.auth === 'guest' && !currentUser) return true;
    if (l.auth === 'user' && currentUser) {
      if (l.roles && !l.roles.includes(currentUser.role)) return false;
      return true;
    }
    return false;
  });

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-brand-border/40 shadow-[0_4px_20px_-4px_rgba(16,20,38,0.08)]'
            : 'bg-white/80 backdrop-blur-md border-b border-transparent'
        }`}
      >
        {/* Brand accent bar: blue-red-blue like the logo gear */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />

        <div className="flex items-center justify-between px-5 md:px-10 py-2.5 max-w-7xl mx-auto h-[68px]">
          
          <a 
            href="#home"
            onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}
            className="transition-all duration-300 hover:opacity-85 flex items-center shrink-0"
            id="nav-logo"
          >
            <BrandLogo className="h-9 w-[115px] md:h-[42px] md:w-[140px]" logoUrl={branding.logoUrl || undefined} />
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 h-full">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const hasMega = item.mega && MEGA_MENUS[item.mega];
              const isActive = activeTab === item.tab;
              return (
                <div
                  key={item.tab}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => {
                    if (megaTimeout.current) clearTimeout(megaTimeout.current);
                    if (hasMega) setOpenMega(item.mega!);
                  }}
                  onMouseLeave={() => {
                    megaTimeout.current = setTimeout(() => setOpenMega(null), 220);
                  }}
                  onFocus={() => {
                    if (megaTimeout.current) clearTimeout(megaTimeout.current);
                    if (hasMega) setOpenMega(item.mega!);
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      megaTimeout.current = setTimeout(() => setOpenMega(null), 120);
                    }
                  }}
                >
                  <a
                    href={`#${item.tab}`}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item.tab); }}
                    aria-haspopup={hasMega ? 'menu' : undefined}
                    aria-expanded={hasMega ? openMega === item.mega : undefined}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-brand-blue'
                        : 'text-brand-muted-darker hover:text-brand-blue hover:bg-brand-blue/5'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-lg bg-brand-blue/8 border border-brand-blue/15"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-[1] flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-blue' : ''}`} />
                      <span>{item.label}</span>
                      {hasMega && <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openMega === item.mega ? 'rotate-180' : ''}`} />}
                    </span>
                  </a>

                  {/* Active tab red dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-dot"
                      className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-brand-red"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {hasMega && openMega === item.mega && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute top-full ${getMegaPanelAlignment(item.mega)} mt-1 w-[min(540px,calc(100vw-2rem))] overflow-hidden`}
                      role="menu"
                      onMouseEnter={() => { if (megaTimeout.current) clearTimeout(megaTimeout.current); }}
                      onMouseLeave={() => setOpenMega(null)}
                    >
                      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-brand-border/50 shadow-[0_24px_70px_-12px_rgba(16,20,38,0.18)] overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-1">
                            {MEGA_MENUS[item.mega!].items.map((sub, i) => {
                              const SubIcon = sub.icon;
                              return (
                                <a
                                  key={i}
                                  href={`#${sub.tab}${sub.section ? `/${sub.section}` : ''}`}
                                  onClick={(e) => { e.preventDefault(); handleNavClick(sub.tab, sub.section, sub.href); }}
                                  role="menuitem"
                                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-blue/[0.06] transition-all duration-150 group"
                                >
                                  <div className="w-9 h-9 rounded-lg bg-brand-blue/[0.08] flex items-center justify-center shrink-0 group-hover:bg-brand-blue/[0.14] transition-colors">
                                    <SubIcon className="w-[16px] h-[16px] text-brand-blue" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-blue transition-colors leading-snug">{sub.label}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sub.desc}</p>
                                  </div>
                                </a>
                              );
                            })}
                          </div>

                          {MEGA_MENUS[item.mega!].viewAllTab && (
                            <div className="mt-1.5 pt-3 border-t border-brand-border/30">
                              <a
                                href={`#${MEGA_MENUS[item.mega!].viewAllTab}`}
                                onClick={(e) => { e.preventDefault(); handleNavClick(MEGA_MENUS[item.mega!].viewAllTab!); }}
                                className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500 hover:text-brand-blue rounded-lg transition-colors"
                              >
                                View all
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side: search, notifications, auth */}
          <div className="flex items-center gap-1">
            {/* Search and cart triggers removed to make header clean */}

            {/* Cart button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-lg text-brand-muted hover:text-brand-blue hover:bg-brand-blue/5 transition-all duration-200"
              aria-label="Cart"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {!currentUser && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-muted-dark px-3.5 py-1.5 rounded-lg hover:text-brand-blue transition-all duration-200"
                    id="btn-nav-login"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Login
                  </button>
                  <button
                    onClick={() => handleNavClick('registration')}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-red to-brand-red-dark px-4 py-1.5 rounded-lg shadow-[0_3px_10px_-2px_rgba(237,28,36,0.25)] hover:shadow-[0_5px_15px_-2px_rgba(237,28,36,0.35)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
                    id="btn-nav-register"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-brand-muted-dark hover:text-brand-red hover:bg-brand-red/5 transition-all duration-200"
              id="btn-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden border-t border-brand-border/30 bg-white/95 backdrop-blur-xl overflow-hidden shadow-[0_12px_30px_-8px_rgba(16,20,38,0.1)]"
              id="mobile-drawer"
            >
              <div className="px-5 py-4 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto">
                {/* Mobile search */}
                <button
                  onClick={() => { setSearchOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-brand-muted-dark hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all mb-2 border border-brand-blue/10"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Search anything...</span>
                  <kbd className="ml-auto text-[9px] font-mono text-brand-muted bg-white px-1 py-0.5 rounded border border-slate-200">⌘K</kbd>
                </button>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const hasMega = item.mega && MEGA_MENUS[item.mega];
                  const isMegaOpen = mobileMegaOpen === item.mega;
                  const isActive = activeTab === item.tab;
                  return (
                    <div key={item.tab}>
                      <a
                        href={`#${item.tab}`}
                        onClick={(e) => {
                          if (hasMega) {
                            e.preventDefault();
                            setMobileMegaOpen(isMegaOpen ? null : item.mega!);
                          } else {
                            handleNavClick(item.tab);
                          }
                        }}
                        className={`flex items-center justify-between py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'text-brand-blue bg-brand-blue/8 border-l-[3px] border-brand-red'
                            : 'text-brand-muted-dark hover:text-brand-blue hover:bg-brand-blue/5 border-l-[3px] border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-brand-blue' : ''}`} />
                          {item.label}
                        </span>
                        {hasMega && <ChevronDown className={`w-4 h-4 transition-transform ${isMegaOpen ? 'rotate-180' : ''}`} />}
                      </a>

                      <AnimatePresence>
                        {hasMega && isMegaOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-3 mt-1 mb-2 flex flex-col gap-0.5 border-l-2 border-brand-blue/15 pl-3">
                              {MEGA_MENUS[item.mega!].items.map((sub, i) => {
                                const SubIcon = sub.icon;
                                return (
                                  <a
                                    key={i}
                                    href={`#${sub.tab}${sub.section ? `/${sub.section}` : ''}`}
                                    onClick={(e) => { e.preventDefault(); handleNavClick(sub.tab, sub.section, sub.href); }}
                                    className="flex items-center gap-2.5 py-2 px-2.5 text-sm text-slate-600 hover:text-brand-blue rounded-lg hover:bg-brand-blue/[0.04] transition-all"
                                  >
                                    <SubIcon className="w-3.5 h-3.5 text-brand-blue/50" />
                                    <div>
                                      <p className="font-medium text-slate-700">{sub.label}</p>
                                      <p className="text-[10px] text-slate-400">{sub.desc}</p>
                                    </div>
                                  </a>
                                );
                              })}
                              {MEGA_MENUS[item.mega!].viewAllTab && (
                                <a
                                  href={`#${MEGA_MENUS[item.mega!].viewAllTab}`}
                                  onClick={(e) => { e.preventDefault(); handleNavClick(MEGA_MENUS[item.mega!].viewAllTab!); }}
                                  className="flex items-center gap-1 py-1.5 px-2.5 text-xs font-medium text-slate-500 hover:text-brand-blue rounded-lg transition-colors"
                                >
                                  View all
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <div className="mt-3 pt-3 border-t border-brand-border/30 flex flex-col gap-1.5">
                  {currentUser ? (
                    <>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate leading-tight">{currentUser.name}</p>
                          <p className="text-[10px] text-brand-muted">{currentUser.role}</p>
                        </div>
                      </div>
                      <button onClick={() => handleNavClick('dashboard')} className="w-full text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-blue-dark rounded-lg shadow-sm">
                        <LayoutDashboard className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                        Dashboard
                      </button>
                      <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full text-center py-2.5 text-sm font-medium text-brand-red hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }} className="w-full text-center py-2.5 text-sm font-semibold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition-all">
                        <LogIn className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                        Login
                      </button>
                      <button onClick={() => handleNavClick('registration')} className="w-full text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-red to-brand-red-dark rounded-lg shadow-[0_3px_10px_-2px_rgba(237,28,36,0.25)]">
                        <UserPlus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                        Register
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {searchOpen && (
        <SearchOverlay
          isOpen={true}
          onClose={() => setSearchOpen(false)}
          onNavigate={handleNavClick}
        />
      )}
    </>
  );
}
