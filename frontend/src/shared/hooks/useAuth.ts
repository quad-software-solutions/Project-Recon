import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { clearTokens } from '@/shared/utils/auth';
import { getUserProfile, setUserProfile, clearUserProfile } from '@/shared/utils/storage';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getUserProfile());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (currentUser) {
      setUserProfile(currentUser);
    } else {
      clearUserProfile();
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
