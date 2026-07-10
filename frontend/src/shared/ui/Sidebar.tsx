import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X, Menu, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useBranding } from '@/src/shared/hooks/useBranding';

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
  vex: 'VEX',
  system: 'System',
};

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

  const grouped = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const g = item.group || 'main';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const handleNav = (id: string) => {
    onSectionChange(id);
    onDrawerToggle?.(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => onDrawerToggle?.(true)}
        className="sidebar-toggle fixed top-3 left-3 z-40 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-backdrop"
            onClick={() => onDrawerToggle?.(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${drawerOpen ? ' open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="flex items-center justify-end">
            <div className="sidebar-header-actions flex items-center">
              {/* Desktop collapse */}
              <button
                onClick={() => onCollapseToggle?.()}
                className="sidebar-collapse-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
              {/* Mobile close */}
              <button
                onClick={() => onDrawerToggle?.(false)}
                className="sidebar-close-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="sidebar-scroll">
          {Object.entries(grouped).map(([group, navItems]) => {
            const label = groupLabels[group] || group;
            return (
              <div key={group} className="mb-1">
                <div className="sidebar-group-label px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
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
                            ? 'bg-brand-red/8 text-brand-red'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-red"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive ? 'text-brand-red' : 'text-slate-400 group-hover:text-slate-600'
                        }`} />
                        <span className={`sidebar-nav-label text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
                          isActive ? 'font-semibold' : ''
                        }`}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center text-white font-bold text-xs shrink-0">
              {userName?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{userName || title}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{userRole || 'User'}</p>
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
              <LogOut className="w-3.5 h-3.5" />
              <span className="sidebar-logout-label">{!collapsed && 'Sign out'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/60 safe-area-bottom md:hidden">
        <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
          {items.slice(0, 5).map(item => {
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[44px] ${
                  isActive ? 'text-brand-red' : 'text-slate-400'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => onDrawerToggle?.(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-slate-400 min-w-[44px]"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
