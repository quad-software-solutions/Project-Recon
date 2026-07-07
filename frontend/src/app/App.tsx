import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import Navbar from '../shared/ui/Navbar';
import AboutTab from '../domains/learning/programs/ui/AboutTab';
import StudentRegistration from '../domains/auth/register/ui/StudentRegistration';
import VexSimulator from '../domains/learning/simulator/ui/VexSimulator';
import LabConsultancy from '../domains/learning/consultancy/ui/LabConsultancy';
import EventCommandCenter from '../domains/competition/events/ui/EventCommandCenter';

import AnimatedParticles from '../shared/ui/AnimatedParticles';
import CartDrawer from '../domains/store/cart/ui/CartDrawer';
import ProgramDetailModal from '../domains/learning/programs/ui/ProgramDetailModal';
import Footer from '../shared/ui/Footer';

import HomePage from '../pages/HomePage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import StorePage from '../pages/store/StorePage';
import CompetitionPage from '../pages/competition/CompetitionPage';
import CommunityPage from '../pages/community/CommunityPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

import { useAuth } from '../shared/hooks/useAuth';
import { useCart } from '../shared/hooks/useCart';
import { useNavigation } from '../shared/hooks/useNavigation';

import { ActiveTab, CartItem, Program, UserProfile } from '../shared/types';

const LoginView = React.lazy(() => import('../domains/auth/login/ui/LoginView'));
const AuthModal = React.lazy(() => import('../domains/auth/modal/ui/AuthModal'));
const AiTutor = React.lazy(() => import('../domains/ai/tutor/ui/AiTutor'));

export default function App() {
  const {
    currentUser, setCurrentUser,
    authModalOpen, setAuthModalOpen, authInitialMode,
    handleAuthSuccess, handleLogout,
  } = useAuth();

  const {
    cart, setCart, cartOpen, checkoutStep, setCheckoutStep,
    handleAddToCart, handleUpdateCartQuantity, handleRemoveFromCart,
    getCartTotal, getCartItemsCount, openCart, closeCart,
  } = useCart();

  const { activeTab, handleTabChange } = useNavigation(currentUser);

  const handleLogoutAndNavigate = () => {
    handleLogout();
    handleTabChange('home');
  };

  const [selectedProgramSpec, setSelectedProgramSpec] = useState<Program | null>(null);

  const handleEnrollInProgram = (programId: string) => {
    if (!currentUser) {
      handleTabChange('login');
      return;
    }
    const alreadyEnrolled = currentUser.enrolledPrograms.includes(programId);
    if (alreadyEnrolled) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      enrolledPrograms: [...currentUser.enrolledPrograms, programId],
      xpPoints: currentUser.xpPoints + 50,
      badges: currentUser.badges.includes('Class Pioneer')
        ? currentUser.badges
        : [...currentUser.badges, 'Class Pioneer']
    };
    setCurrentUser(updatedUser);
    handleTabChange('dashboard');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('submitting');
    setTimeout(() => {
      setCheckoutStep('success');
      setCart([]);
      if (currentUser) {
        const updated = {
          ...currentUser,
          xpPoints: currentUser.xpPoints + 40,
          badges: currentUser.badges.includes('Tech Sponsor')
            ? currentUser.badges
            : [...currentUser.badges, 'Tech Sponsor']
        };
        setCurrentUser(updated);
      }
    }, 1500);
  };

  const onAuthSuccess = (userProfile: UserProfile) => {
    handleAuthSuccess(userProfile);
    handleTabChange('dashboard');
  };

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

  if (activeTab === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigateHome={() => handleTabChange('home')}
        onNavigateLogin={() => handleTabChange('login')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper text-brand-ink flex flex-col font-sans animated-grid-bg relative overflow-x-hidden" id="applet-viewport">
      <AnimatedParticles />

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onLogout={handleLogoutAndNavigate}
        onOpenAuth={(mode) => {
          handleTabChange(mode === 'register' ? 'registration' : 'login');
        }}
        cartCount={getCartItemsCount()}
        onOpenCart={openCart}
      />

      <main className={`flex-grow ${activeTab !== 'dashboard' && activeTab !== 'command-center' ? 'pt-[64px]' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && !currentUser && (
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
            <StorePage
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              cartTotal={getCartTotal()}
              onCheckout={() => setCart([])}
            />
          )}

          {activeTab === 'simulator' && (
            <motion.div key="simulator-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <VexSimulator />
            </motion.div>
          )}

          {activeTab === 'competitions' && (
            <CompetitionPage currentUser={currentUser} />
          )}

          {activeTab === 'community' && (
            <CommunityPage />
          )}

          {activeTab === 'consultancy' && (
            <motion.div key="consultancy-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <LabConsultancy />
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

          {activeTab === 'command-center' && currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Admin') && (
            <motion.div key="command-center-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <EventCommandCenter currentUser={currentUser} onLogout={handleLogoutAndNavigate} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CartDrawer
        cartOpen={cartOpen}
        cart={cart}
        checkoutStep={checkoutStep}
        currentUser={currentUser}
        getCartTotal={getCartTotal}
        onClose={closeCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onCheckoutSubmit={handleCheckoutSubmit}
        onSetCheckoutStep={setCheckoutStep}
        onSetCart={setCart}
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

      <AiTutor />
    </div>
  );
}
