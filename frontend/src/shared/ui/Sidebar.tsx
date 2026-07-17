import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { LogOut, X, Menu, PanelLeftClose, PanelLeft, Search } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useBranding } from '@/shared/hooks/useBranding';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  group?: string;
}

interface SidebarProps {
  items: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  onLogout?: () => void;
  title: string;
  icon: React.ElementType;
  accentColor?: 'red' | 'blue';
  userName?: string;
  userRole?: string;
  collapsed?: boolean;
  drawerOpen?: boolean;
  onCollapseToggle?: () => void;
  onDrawerToggle?: (open: boolean) => void;
}

const groupLabels: Record<string, string> = {
  main: 'Main',
  core: 'Core System',
  admissions: 'Admissions & Students',
  users: 'User Administration',
  academic: 'Academics & Learning',
  teaching: 'Teaching & Classes',
  career: 'Career',
  finances: 'Payments & Finance',
  operations: 'Operations',
  competition: 'Competitions & Events',
  communication: 'Communication',
  partners: 'Partners & Sponsors',
  reports: 'Reports & Analytics',
  content: 'Content & Branches',
  branches: 'Branches',
  vex: 'VEX',
  system: 'System Configuration',
};

const GROUP_ORDER = [
  'main', 'core', 'admissions', 'users', 'academic', 'teaching', 'career',
  'finances', 'operations', 'competition', 'communication', 'partners',
  'reports', 'content', 'branches', 'vex', 'system',
];

function sortGroupEntries(entries: [string, NavItem[]][]): [string, NavItem[]][] {
  return [...entries].sort(([a], [b]) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    return (ia === -1 ? GROUP_ORDER.length : ia) - (ib === -1 ? GROUP_ORDER.length : ib);
  });
}

function buildMobileBarItems(items: NavItem[], activeSection: string): NavItem[] {
  const primary = items.filter(i => i.group !== 'system');
  const active = items.find(i => i.id === activeSection);
  const bar = new Map<string, NavItem>();

  [primary[0], primary[1], primary[2]].forEach(item => {
    if (item) bar.set(item.id, item);
  });
  if (active) bar.set(active.id, active);

  return Array.from(bar.values()).slice(0, 4);
}

export function Sidebar({
  items,
  activeSection,
  onSectionChange,
  onLogout,
  title,
  userName,
  userRole,
  collapsed = false,
  drawerOpen = false,
  onCollapseToggle,
  onDrawerToggle,
}: SidebarProps) {
  const branding = useBranding();
  const [navQuery, setNavQuery] = useState('');
  const showNavSearch = items.length > 8;

  const filteredItems = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.label.toLowerCase().includes(q));
  }, [items, navQuery]);

  const grouped = filteredItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const g = item.group || 'main';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const topGroups = sortGroupEntries(Object.entries(grouped).filter(([g]) => g !== 'system'));
  const bottomGroups = sortGroupEntries(Object.entries(grouped).filter(([g]) => g === 'system'));
  const mobileBarItems = useMemo(() => buildMobileBarItems(items, activeSection), [items, activeSection]);

  const handleNav = (id: string) => {
    onSectionChange(id);
    onDrawerToggle?.(false);
    setNavQuery('');
  };

  const renderNavGroup = ([group, navItems]: [string, NavItem[]]) => {
    const label = groupLabels[group] || group;
    return (
      <div key={group} className="mb-1">
        <div className="sidebar-group-label px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {!collapsed && <span>{label}</span>}
        </div>
        <div className="flex flex-col gap-px">
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`sidebar-nav-item group relative flex items-center w-full rounded-lg transition-all duration-150 ${
                  collapsed ? 'justify-center px-2 py-2.5 mx-auto' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-brand-blue/10 text-brand-blue shadow-sm ring-1 ring-brand-blue/10'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-blue"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                  isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-slate-700'
                }`} aria-hidden />
                <span className={`sidebar-nav-label text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
                  isActive ? 'font-semibold' : ''
                }`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => onDrawerToggle?.(true)}
        className="sidebar-toggle fixed top-3 left-3 z-40 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-backdrop"
            onClick={() => onDrawerToggle?.(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${drawerOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-2'}`}>
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <BrandLogo logoUrl={branding.logoUrl} className="h-7 w-auto shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{title}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userRole || 'Dashboard'}</p>
                </div>
              </div>
            )}
            <div className="sidebar-header-actions flex items-center shrink-0">
              <button
                onClick={() => onCollapseToggle?.()}
                className="sidebar-collapse-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDrawerToggle?.(false)}
                className="sidebar-close-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showNavSearch && !collapsed && (
            <div className="mt-3 px-1">
              <label className="sr-only" htmlFor="sidebar-nav-search">Search navigation</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden />
                <input
                  id="sidebar-nav-search"
                  type="search"
                  value={navQuery}
                  onChange={e => setNavQuery(e.target.value)}
                  placeholder="Search sections…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-blue/40 focus:ring-1 focus:ring-brand-blue/20"
                />
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-scroll">
          <LayoutGroup>
            {topGroups.length === 0 && bottomGroups.length === 0 ? (
              <p className="px-3 py-6 text-xs text-slate-400 text-center">No sections match your search.</p>
            ) : (
              <>
                {topGroups.map(renderNavGroup)}
                {bottomGroups.length > 0 && (
                  <>
                    <div className="sidebar-group-divider" />
                    {bottomGroups.map(renderNavGroup)}
                  </>
                )}
              </>
            )}
          </LayoutGroup>
        </div>

        <div className="sidebar-footer">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm" aria-hidden>
              {userName?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{userName || title}</p>
                <p className="text-[10px] font-medium text-slate-500 truncate">{userRole || 'User'}</p>
              </div>
            )}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 rounded-lg text-xs font-medium text-slate-400 hover:text-brand-red hover:bg-red-50/60 transition-colors mt-2 ${
                collapsed ? 'justify-center px-2 py-1.5 w-full' : 'px-3 py-1.5 w-full'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
              <span className="sidebar-logout-label">{!collapsed && 'Sign out'}</span>
            </button>
          )}
        </div>
      </aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/60 safe-area-bottom md:hidden"
        aria-label="Quick navigation"
      >
        <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
          {mobileBarItems.map(item => {
            const isActive = activeSection === item.id;
            const shortLabel = item.label.length > 10 ? item.label.split(' ')[0] : item.label;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                  isActive ? 'text-brand-blue' : 'text-slate-400'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} aria-hidden />
                <span className={`text-[9px] leading-tight max-w-[56px] truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {shortLabel}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => onDrawerToggle?.(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-slate-400 min-w-[44px] min-h-[44px] justify-center"
            aria-label="Open full navigation menu"
          >
            <Menu className="w-5 h-5" aria-hidden />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
