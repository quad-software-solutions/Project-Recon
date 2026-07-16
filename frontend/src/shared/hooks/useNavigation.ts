import { useState, useEffect, useCallback } from 'react';
import { ActiveTab, UserProfile } from '../types';
import { canAccessTab, getDefaultAuthenticatedTab } from '../auth/permissions';
import { getUserProfile } from '@/shared/utils/storage';

function tabFromPath(path: string): ActiveTab {
  if (path.startsWith('/store/orders/')) return 'store-order-detail';
  if (path.startsWith('/store/orders')) return 'store-orders';
  // Product + category deep links stay on the store tab; StoreTab parses the path.
  if (path.startsWith('/store/products/') || path.startsWith('/store/categories/') || path.startsWith('/store')) {
    return 'store';
  }
  if (path.startsWith('/about')) return 'about';
  if (path.startsWith('/simulator')) return 'simulator';
  if (path.startsWith('/command-center')) return 'command-center';
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
  if (tab === 'store-order-detail') return '/store/orders'; // Default path for the tab, we'll handle param separately
  if (tab === 'store-orders') return '/store/orders';
  if (tab === 'dashboard' && (currentUser?.role === 'Manager' || currentUser?.role === 'EventManager')) return '/manager';
  return tab === 'home' ? '/' : `/${tab}`;
}

export function useNavigation(currentUser: UserProfile | null) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const user = getUserProfile();
    let tab = tabFromPath(window.location.pathname);
    tab = canAccessTab(user, tab) ? tab : getDefaultAuthenticatedTab(user);
    const authRoutes: ActiveTab[] = ['login', 'register', 'forgot-password', 'reset-password', 'registration'];
    if (user && authRoutes.includes(tab)) {
      tab = 'dashboard';
      window.history.replaceState(null, '', pathFromTab(tab, user));
    }
    return tab;
  });

  useEffect(() => {
    const handlePopState = () => {
      const requestedTab = tabFromPath(window.location.pathname);
      let nextTab = canAccessTab(currentUser, requestedTab) ? requestedTab : getDefaultAuthenticatedTab(currentUser);
      const authRoutes: ActiveTab[] = ['login', 'register', 'forgot-password', 'reset-password', 'registration'];
      if (currentUser && authRoutes.includes(nextTab)) {
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
    const authRoutes: ActiveTab[] = ['login', 'register', 'forgot-password', 'reset-password', 'registration'];
    if (currentUser && authRoutes.includes(nextTab)) {
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

  /** Bypass all auth guards — used exclusively by logout to avoid stale-closure issues. */
  const forceNavigate = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    window.history.pushState(null, '', pathFromTab(tab, currentUser));
  }, [currentUser]);

  return { activeTab, handleTabChange, triggerAuthFlow, forceNavigate };
}
