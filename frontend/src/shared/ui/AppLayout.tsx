import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar, NavItem } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { getSidebarCollapsed, setSidebarCollapsed as persistSidebarCollapsed } from '@/shared/utils/storage';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') return window.matchMedia(query).matches;
    return false;
  });
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

interface AppLayoutProps {
  sidebar: {
    items: NavItem[];
    activeSection: string;
    onSectionChange: (id: string) => void;
    title: string;
    icon: React.ElementType;
    accentColor?: 'red' | 'blue';
    userName?: string;
    userRole?: string;
  };
  topNavbar: {
    title: string;
    subtitle?: string;
    onSearch?: (query: string) => void;
    searchValue?: string;
    actions?: React.ReactNode;
  };
  onLogout?: () => void;
  children: ReactNode;
}

export function AppLayout({ sidebar, topNavbar, onLogout, children }: AppLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getSidebarCollapsed());

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCollapseToggle = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      persistSidebarCollapsed(next);
      return next;
    });
  }, []);

  const handleDrawerToggle = useCallback((open: boolean) => {
    if (!isDesktop) setDrawerOpen(open);
  }, [isDesktop]);

  const handleSectionChange = useCallback((id: string) => {
    sidebar.onSectionChange(id);
    if (!isDesktop) setDrawerOpen(false);
  }, [isDesktop, sidebar.onSectionChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="app-layout bg-brand-surface">
      <Sidebar
        items={sidebar.items}
        activeSection={sidebar.activeSection}
        onSectionChange={handleSectionChange}
        onLogout={onLogout}
        title={sidebar.title}
        icon={sidebar.icon}
        accentColor={sidebar.accentColor}
        userName={sidebar.userName}
        userRole={sidebar.userRole}
        collapsed={sidebarCollapsed}
        drawerOpen={drawerOpen && !isDesktop}
        onCollapseToggle={handleCollapseToggle}
        onDrawerToggle={handleDrawerToggle}
      />

      <div className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}>
        <TopNavbar
          title={topNavbar.title}
          subtitle={topNavbar.subtitle}
          onSearch={topNavbar.onSearch}
          searchValue={topNavbar.searchValue}
          actions={topNavbar.actions}
          userName={sidebar.userName}
          userRole={sidebar.userRole}
          onLogout={onLogout}
        />

        <main className="main-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={topNavbar.title}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
