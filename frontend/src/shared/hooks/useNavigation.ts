import { useState, useEffect, useCallback } from 'react';
import { ActiveTab, UserProfile } from '../types';
import { canAccessTab, getDefaultAuthenticatedTab } from '../auth/permissions';

function tabFromPath(path: string): ActiveTab {
  if (path.startsWith('/about')) return 'about';
  if (path.startsWith('/store')) return 'store';
  if (path.startsWith('/simulator')) return 'simulator';
  if (path.startsWith('/dashboard') || path.startsWith('/manager')) return 'dashboard';
  if (path.startsWith('/event')) return 'dashboard';
  if (path.startsWith('/login')) return 'login';
  if (path.startsWith('/register')) return 'register';
  if (path.startsWith('/forgot-password')) return 'forgot-password';
  if (path.startsWith('/reset-password')) return 'reset-password';
  if (path.startsWith('/registration')) return 'registration';
  return 'home';
}

function pathFromTab(tab: ActiveTab, currentUser: UserProfile | null): string {
  if (tab === 'dashboard' && (currentUser?.role === 'Manager' || currentUser?.role === 'EventManager')) return '/manager';
  return tab === 'home' ? '/' : `/${tab}`;
}

export function useNavigation(currentUser: UserProfile | null) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedUser = localStorage.getItem('ethio_robotics_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    let tab = tabFromPath(window.location.pathname);
    tab = canAccessTab(user, tab) ? tab : getDefaultAuthenticatedTab(user);
    if (user && tab !== 'dashboard') {
      tab = 'dashboard';
      window.history.replaceState(null, '', pathFromTab(tab, user));
    }
    return tab;
  });

  useEffect(() => {
    const handlePopState = () => {
      const requestedTab = tabFromPath(window.location.pathname);
      let nextTab = canAccessTab(currentUser, requestedTab) ? requestedTab : getDefaultAuthenticatedTab(currentUser);
      if (currentUser && nextTab !== 'dashboard') {
        nextTab = 'dashboard';
      }
      setActiveTab(nextTab);
      if (nextTab !== requestedTab) window.history.replaceState(null, '', pathFromTab(nextTab, currentUser));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    let nextTab = canAccessTab(currentUser, tab) ? tab : getDefaultAuthenticatedTab(currentUser);
    if (currentUser && nextTab !== 'dashboard') {
      nextTab = 'dashboard';
    }
    setActiveTab(nextTab);
    window.history.pushState(null, '', pathFromTab(nextTab, currentUser));
  }, [currentUser]);

  const triggerAuthFlow = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      handleTabChange('registration');
    } else {
      handleTabChange('login');
    }
  };

  return { activeTab, handleTabChange, triggerAuthFlow };
}
