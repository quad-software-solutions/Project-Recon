import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from '../shared/ui/ErrorBoundary';

import Navbar from '../shared/ui/Navbar';
import AboutTab from '../domains/learning/programs/ui/AboutTab';
import StudentRegistration from '../domains/auth/register/ui/StudentRegistration';
import VexSimulator from '../domains/learning/simulator/ui/VexSimulator';

import EventCommandCenter from '../domains/competition/events/ui/EventCommandCenter';

import AnimatedParticles from '../shared/ui/AnimatedParticles';
import CartDrawer from '../domains/store/cart/ui/CartDrawer';
import ProgramDetailModal from '../domains/learning/programs/ui/ProgramDetailModal';
import Footer from '../shared/ui/Footer';

import HomePage from '../pages/HomePage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import StorePage from '../pages/store/StorePage';
import CompetitionPage from '../pages/competition/CompetitionPage';
import CertificateVerifyPage from '../pages/certificate/CertificateVerifyPage';

import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import OrderHistoryPage from '../domains/store/orders/ui/OrderHistoryPage';
import OrderDetailPage from '../domains/store/orders/ui/OrderDetailPage';
import PrivacyPage from '../pages/legal/PrivacyPage';
import TermsPage from '../pages/legal/TermsPage';
import HelpPage from '../pages/legal/HelpPage';
import CookieConsent from '../shared/ui/CookieConsent';

import { useAuth } from '../shared/hooks/useAuth';
import { CartProvider, useCartContext } from '../shared/context/CartContext';
import { useNavigation } from '../shared/hooks/useNavigation';
import { hasPermission } from '../shared/auth/permissions';

import { ActiveTab, UserProfile, ProgramDisplay, PendingOrder } from '../shared/types';

const LoginView = React.lazy(() => import('../domains/auth/login/ui/LoginView'));
const AuthModal = React.lazy(() => import('../domains/auth/modal/ui/AuthModal'));

export default function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </ErrorBoundary>
  );
}

function AppInner() {
  const {
    currentUser, setCurrentUser,
    authModalOpen, setAuthModalOpen, authInitialMode,
    handleAuthSuccess, handleLogout,
  } = useAuth();

  const {
    cart, cartOpen, loading,
    fetchCart, handleAddToCart, handleUpdateQuantity, handleRemoveFromCart, clearCart,
    openCart, closeCart,
  } = useCartContext();

  const handleCheckoutSuccess = (_pendingOrder: PendingOrder) => {
    fetchCart();
  };

  const { activeTab, handleTabChange, forceNavigate } = useNavigation(currentUser);

  const handleLogoutAndNavigate = async () => {
    await handleLogout();
    forceNavigate('login');
  };

  const [selectedProgramSpec, setSelectedProgramSpec] = useState<ProgramDisplay | null>(null);

  const handleEnrollInProgram = (_programId: string) => {
    if (!currentUser) {
      handleTabChange('register');
      return;
    }
    handleTabChange('dashboard');
  };

  const onAuthSuccess = (userProfile: UserProfile) => {
    handleAuthSuccess(userProfile);
  };

  const prevUser = useRef(currentUser);
  useEffect(() => {
    if (currentUser && !prevUser.current) {
      handleTabChange('dashboard');
    }
    prevUser.current = currentUser;
  }, [currentUser, handleTabChange]);

  useEffect(() => {
    const onLogout = () => handleLogoutAndNavigate();
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (activeTab === 'login' || activeTab === 'register') {
    return (
      <React.Suspense fallback={null}>
        <LoginView
          onAuthSuccess={onAuthSuccess}
          onNavigateHome={() => handleTabChange('home')}
          onNavigateRegister={() => handleTabChange('registration')}
          onNavigateForgotPassword={() => handleTabChange('forgot-password')}
          initialView={activeTab}
        />
      </React.Suspense>
    );
  }

  if (activeTab === 'forgot-password' || activeTab === 'reset-password') {
    return (
      <ForgotPasswordPage
        onNavigateHome={() => handleTabChange('home')}
        onNavigateLogin={() => handleTabChange('login')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper text-brand-ink flex flex-col font-sans relative overflow-x-hidden" id="applet-viewport">

      {activeTab !== 'dashboard' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentUser={currentUser}
          onLogout={handleLogoutAndNavigate}
          onOpenAuth={(mode) => {
            handleTabChange(mode === 'register' ? 'registration' : 'login');
          }}
          cartCount={cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
          onOpenCart={openCart}
        />
      )}

      <main className={`flex-grow ${activeTab !== 'dashboard' && activeTab !== 'command-center' ? 'pt-[64px]' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomePage
              currentUser={currentUser}
              onEnrollInProgram={handleEnrollInProgram}
              onNavigate={handleTabChange}
              onSetSelectedProgramSpec={setSelectedProgramSpec}
            />
          )}

          {activeTab === 'about' && (
            <motion.div key="about-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <AboutTab />
            </motion.div>
          )}

          {activeTab === 'store' && (
            <StorePage openCart={openCart} />
          )}

          {activeTab === 'store-orders' && (
            <motion.div key="store-orders-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <OrderHistoryPage />
            </motion.div>
          )}

          {activeTab === 'store-order-detail' && (
            <motion.div key="store-order-detail-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <OrderDetailPage />
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div key="simulator-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <VexSimulator />
            </motion.div>
          )}

          {activeTab === 'competitions' && (
            <CompetitionPage
              currentUser={currentUser}
              onNavigateLogin={() => handleTabChange('login')}
            />
          )}

          {activeTab === 'cert-verify' && (
            <motion.div key="cert-verify-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <CertificateVerifyPage onNavigateHome={() => handleTabChange('home')} />
            </motion.div>
          )}

          {activeTab === 'registration' && (
            <motion.div key="registration-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <StudentRegistration />
            </motion.div>
          )}

          {activeTab === 'dashboard' && currentUser && (
            <motion.div key="dashboard-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <DashboardPage currentUser={currentUser} onLogout={handleLogoutAndNavigate} />
            </motion.div>
          )}

          {activeTab === 'command-center' && currentUser && hasPermission(currentUser, 'command-center:view') && (
            <motion.div key="command-center-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <EventCommandCenter currentUser={currentUser} onLogout={handleLogoutAndNavigate} />
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div key="privacy-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <PrivacyPage onNavigate={handleTabChange} />
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div key="terms-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <TermsPage onNavigate={handleTabChange} />
            </motion.div>
          )}

          {activeTab === 'help' && (
            <motion.div key="help-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <HelpPage onNavigate={handleTabChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CartDrawer
        cartOpen={cartOpen}
        cart={cart}
        loading={loading}
        onClose={closeCart}
        currentUser={currentUser}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      <ProgramDetailModal
        program={selectedProgramSpec}
        onClose={() => setSelectedProgramSpec(null)}
        onEnroll={handleEnrollInProgram}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onAuthSuccess={onAuthSuccess}
      />

      {!currentUser && <Footer onNavigate={handleTabChange} />}

      <CookieConsent onNavigate={handleTabChange} />

    </div>
  );
}
