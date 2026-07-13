import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { clearTokens } from '@/src/shared/utils/auth';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ethio_robotics_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ethio_robotics_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ethio_robotics_user');
    }
  }, [currentUser]);

  const handleAuthSuccess = (userProfile: UserProfile) => {
    setCurrentUser(userProfile);
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { logoutApi } = await import('../../domains/auth/login/api/loginApi');
      await logoutApi();
    } catch {
      // Even if backend call fails, still clear local state
    }
    clearTokens();
    setCurrentUser(null);
  };

  const triggerAuthFlow = (mode: 'login' | 'register') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  return {
    currentUser,
    setCurrentUser,
    authModalOpen,
    setAuthModalOpen,
    authInitialMode,
    handleAuthSuccess,
    handleLogout,
    triggerAuthFlow,
  };
}
