import { useState, useEffect, useCallback } from 'react';
import { ActiveTab, UserProfile } from '../types';

export function useNavigation(currentUser: UserProfile | null) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const path = window.location.pathname;
    const savedUser = localStorage.getItem('ethio_robotics_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (path.startsWith('/command-center') && (!user || (user.role !== 'Manager' && user.role !== 'Admin'))) return 'dashboard';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/store')) return 'store';
    if (path.startsWith('/simulator')) return 'simulator';
    if (path.startsWith('/dashboard') || path.startsWith('/manager')) return 'dashboard';
    if (path.startsWith('/login')) return 'login';
    if (path.startsWith('/register')) return 'register';
    if (path.startsWith('/forgot-password')) return 'forgot-password';
    if (path.startsWith('/reset-password')) return 'reset-password';
    if (path.startsWith('/command-center')) return 'command-center';
    if (path.startsWith('/registration')) return 'registration';
    return 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/command-center') && currentUser && currentUser.role !== 'Manager' && currentUser.role !== 'Admin') {
        setActiveTab('dashboard');
        window.history.replaceState(null, '', '/');
        return;
      }
      if (path.startsWith('/about')) setActiveTab('about');
      else if (path.startsWith('/store')) setActiveTab('store');
      else if (path.startsWith('/simulator')) setActiveTab('simulator');
      else if (path.startsWith('/dashboard') || path.startsWith('/manager')) setActiveTab('dashboard');
      else if (path.startsWith('/event')) setActiveTab('dashboard');
      else if (path.startsWith('/login')) setActiveTab('login');
      else if (path.startsWith('/register')) setActiveTab('register');
      else if (path.startsWith('/forgot-password')) setActiveTab('forgot-password');
      else if (path.startsWith('/reset-password')) setActiveTab('reset-password');
      else if (path.startsWith('/command-center')) setActiveTab('command-center');
      else if (path.startsWith('/registration')) setActiveTab('registration');
      else setActiveTab('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    if (tab === 'command-center' && currentUser && currentUser.role !== 'Manager' && currentUser.role !== 'Admin') {
      tab = 'dashboard';
    }
    setActiveTab(tab);
    let path = '/';
    if (tab === 'dashboard' && (currentUser?.role === 'Manager' || currentUser?.role === 'EventManager')) path = '/manager';
    else if (tab !== 'home') path = `/${tab}`;
    window.history.pushState(null, '', path);
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
