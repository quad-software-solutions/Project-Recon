import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Eye, EyeOff, Mail, ArrowRight,
  ShieldCheck, Sparkles, Info
} from 'lucide-react';
import { UserProfile } from '@/src/shared/types';
import BrandLogo from '@/src/shared/ui/BrandLogo';

import slide1 from '@/assets/slider/faj.jpg';
import slide2 from '@/assets/slider/photo_2026-06-15_14-40-10.jpg';
import slide3 from '@/assets/slider/photo_2026-06-15_18-51-59.jpg';
import slide4 from '@/assets/slider/photo_2026-06-15_18-52-03.jpg';
import slide5 from '@/assets/slider/photo_2026-06-15_18-52-07.jpg';
import slide6 from '@/assets/slider/photo_2026-06-15_18-52-11.jpg';
import slide7 from '@/assets/slider/photo_2026-06-15_18-52-21.jpg';
import slide8 from '@/assets/slider/photo_2026-06-15_18-52-25.jpg';

const SLIDER_IMAGES = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8];

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

interface LoginViewProps {
  onAuthSuccess: (user: UserProfile) => void;
  onNavigateHome: () => void;
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
  initialView?: 'login' | 'register';
}

export default function LoginView({ onAuthSuccess, onNavigateHome, onNavigateRegister, onNavigateForgotPassword, initialView = 'login' }: LoginViewProps) {
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'email-verify'>(initialView === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhase, setResetPhase] = useState<1 | 2 | 3>(1);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    setViewMode(initialView);
    setErrorMsg('');
  }, [initialView]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please populate all mandatory inputs.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password should be at least 8 characters long.');
      return;
    }

    setLoading(true);

    if (viewMode !== 'login') {
      setLoading(false);
      onNavigateRegister?.();
      return;
    }

    import('../api/loginApi').then(({ loginApi, EmailNotVerifiedError, requestEmailVerificationApi }) => {
      loginApi({ email, password })
        .then(({ user }) => {
          onAuthSuccess(user);
        })
        .catch((err) => {
          if (err instanceof EmailNotVerifiedError) {
            // Trigger OTP dispatch and switch to OTP view
            requestEmailVerificationApi(err.email)
              .then(() => {
                setViewMode('email-verify');
                setLoading(false);
              })
              .catch(() => {
                setErrorMsg('Failed to send verification email. Please try again.');
                setLoading(false);
              });
            return;
          }
          setErrorMsg(err instanceof Error ? err.message : 'Login failed. Please try again.');
          setLoading(false);
        });
    });
  };

  const handleEmailVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailOtp) {
      setErrorMsg('Please enter the OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const { verifyEmailOtpApi } = await import('../api/loginApi');
      const { user } = await verifyEmailOtpApi(email, emailOtp);
      onAuthSuccess(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'OTP verification failed.');
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    if (resetPhase === 1) {
      if (!resetEmail) {
        setResetLoading(false);
        return;
      }
      try {
        const { forgotPasswordApi } = await import('../api/loginApi');
        await forgotPasswordApi(resetEmail);
        setResetPhase(2);
      } catch (err) {
        // Fallthrough to phase 2 even on error to prevent enumeration
        setResetPhase(2);
      } finally {
        setResetLoading(false);
      }
    } else if (resetPhase === 2) {
      if (!resetOtp || !resetNewPassword) {
        setResetError('Please fill in both OTP and new password.');
        setResetLoading(false);
        return;
      }
      try {
        const { resetPasswordApi } = await import('../api/loginApi');
        await resetPasswordApi(resetOtp, resetNewPassword);
        setResetPhase(3);
        setTimeout(() => {
          setIsForgotPasswordOpen(false);
          setResetPhase(1);
          setResetEmail('');
          setResetOtp('');
          setResetNewPassword('');
        }, 3000);
      } catch (err) {
        setResetError(err instanceof Error ? err.message : 'Invalid OTP or password');
      } finally {
        setResetLoading(false);
      }
    }
  };

  const closeResetModal = () => {
    setIsForgotPasswordOpen(false);
    setTimeout(() => {
      setResetPhase(1);
      setResetEmail('');
      setResetOtp('');
      setResetNewPassword('');
      setResetError('');
    }, 200);
  };

  return (
    <div className="min-h-screen bg-brand-paper flex flex-col font-sans" id="dedicated-auth-viewport">

      {/* Header */}
      <header className="relative z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 md:px-12 py-3 flex items-center justify-between h-[72px]">
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); onNavigateHome(); }}
          className="flex items-center transition-all duration-300 hover:opacity-80"
          id="login-brand-logo"
        >
          <BrandLogo className="h-9 w-[115px] md:h-[42px] md:w-[140px]" />
        </a>

        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-brand-red transition-colors px-4 py-2"
            id="btn-login-back-home"
          >
            Back to Home
          </button>
          <button
            onClick={() => {
              if (viewMode === 'login' && onNavigateRegister) {
                onNavigateRegister();
              } else {
                setViewMode(viewMode === 'login' ? 'register' : 'login');
                setErrorMsg('');
              }
            }}
            className="font-black text-[10px] uppercase tracking-[0.2em] text-white bg-gradient-to-r from-brand-red to-brand-red-dark px-5 py-2.5 rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
            id="btn-login-toolbar-toggle"
          >
            {viewMode === 'login' ? 'REGISTER' : 'LOGIN'}
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-grow flex items-center justify-center py-12 px-4 relative overflow-hidden">

        {/* Background slider */}
        <div className="absolute inset-0">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentSlide}
              src={SLIDER_IMAGES[currentSlide]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-[4px] scale-110"
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </AnimatePresence>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/60 via-white/85 to-brand-red/40" />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Dramatic ambient glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-brand-blue/25 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Slide dots */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {SLIDER_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-500 ${
                idx === currentSlide
                  ? 'w-8 h-2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                  : 'w-2 h-2 bg-white/25 hover:bg-slate-1000'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="max-w-md w-full relative z-10" id="login-container-card-box">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_80px_-12px_rgba(0,0,0,0.08)] border border-slate-200 relative"
          >
            {/* Decorative gradient line */}
            <div className="h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />

            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="p-8 md:p-10 relative">

              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="inline-flex w-14 h-14 bg-gradient-to-br from-brand-red/20 to-brand-red/5 rounded-2xl items-center justify-center text-brand-red mb-4 ring-1 ring-brand-red/20"
                >
                  <ShieldCheck className="w-7 h-7" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="font-black text-slate-900 tracking-tight text-[28px] uppercase"
                >
                  {viewMode === 'login' ? 'Welcome Back' : viewMode === 'email-verify' ? 'Verify Email' : 'Join the Lab'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto font-medium"
                >
                  {viewMode === 'login'
                    ? 'Access your engineering dashboard & simulation laboratories.'
                    : viewMode === 'email-verify'
                    ? 'Please enter the 6-digit verification code sent to your email.'
                    : 'Submit a student registration request for administrator review.'}
                </motion.p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-brand-red/10 border border-brand-red/20 rounded-xl p-3.5 text-xs text-brand-red font-bold leading-relaxed flex items-start gap-2.5 overflow-hidden"
                    id="login-error-alert"
                  >
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={viewMode === 'email-verify' ? handleEmailVerifySubmit : handleFormSubmit} className="flex flex-col gap-5">
                <motion.div
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06 } }
                  }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-5"
                >
                  {viewMode === 'email-verify' ? (
                    <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Verification Code</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                        <input
                          type="text"
                          placeholder="6-Digit OTP"
                          required
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all tracking-[0.2em]"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Email */}
                      <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Username / ID</label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input
                            type="email"
                            placeholder="Enter your ID or Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
                          />
                        </div>
                      </motion.div>

                      {/* Password */}
                      <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Password</label>
                          {viewMode === 'login' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateForgotPassword) {
                                  onNavigateForgotPassword();
                                } else {
                                  setIsForgotPasswordOpen(true);
                                  setErrorMsg('');
                                }
                              }}
                              className="text-[10px] font-bold text-brand-red hover:underline"
                              id="btn-login-forgot"
                            >
                              Forgot Password?
                            </button>
                          )}
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Role */}
                  {/* Submit */}
                  <motion.div variants={staggerItem}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-4 px-4 rounded-xl active:scale-[0.97] transition-all font-black text-sm uppercase tracking-wider mt-2 flex items-center justify-center gap-2 shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/45 disabled:opacity-50 group"
                      id="btn-submit-active-login"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2.5">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>{viewMode === 'email-verify' ? 'Verifying...' : 'Verifying Credentials...'}</span>
                        </span>
                      ) : (
                        <>
                          <span>{viewMode === 'email-verify' ? 'Verify Code' : viewMode === 'login' ? 'Access Dashboard' : 'Open Registration'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.div>

                </motion.div>
              </form>

              {/* Toggle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 pt-6 border-t border-slate-100 text-center"
              >
                <span className="text-xs text-slate-400 font-medium">
                  {viewMode === 'email-verify' ? 'Want to use a different account?' : viewMode === 'login' ? "No account?" : "Already possess account?"}{' '}
                </span>
                <button
                  onClick={() => {
                    if (viewMode === 'email-verify') {
                      setViewMode('login');
                      setEmailOtp('');
                      setErrorMsg('');
                      return;
                    }
                    if (viewMode === 'login' && onNavigateRegister) {
                      onNavigateRegister();
                    } else {
                      setViewMode(viewMode === 'login' ? 'register' : 'login');
                      setErrorMsg('');
                    }
                  }}
                  className="text-xs font-bold text-brand-red hover:underline transition-all"
                  id="btn-login-bottom-toggle"
                >
                  {viewMode === 'email-verify' ? 'Back to Login' : viewMode === 'login' ? 'Register Here' : 'Log In Here'}
                </button>
              </motion.div>

              {/* Security notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Your credentials are secured with JWT authentication and encrypted token storage.
                  Use the email and password provided by your institution administrator.
                </p>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-md border-t border-slate-100 py-8 text-center relative z-30" id="dedicated-login-partners-footer">
        <div className="max-w-7xl mx-auto px-6">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] block mb-4">
            Trusted By Global Engineering Partners
          </span>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-60 hover:opacity-90 transition-opacity duration-500">
            {[
              { text: 'MINT', className: 'text-slate-600' },
              { text: 'VEX ROBOTICS', className: 'text-brand-red' },
              { text: 'ENJOY AI', className: 'text-teal-500' },
              { text: 'ELITE UNIVERSITIES', className: 'text-slate-400' },
            ].map((partner, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`font-black text-sm md:text-base tracking-widest uppercase ${partner.className}`}
              >
                {partner.text}
              </motion.span>
            ))}
          </div>
        </div>
      </footer>

      {/* Forgot Password Dialog */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute inset-0 bg-white/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 z-10"
              id="dialog-forgot-password-box"
            >
              <h3 className="font-black text-slate-900 text-lg mb-1 flex items-center gap-2 uppercase tracking-tight">
                <Sparkles className="w-5 h-5 text-brand-red" />
                <span>{resetPhase === 3 ? 'Password Restored' : 'Restore Password'}</span>
              </h3>
              
              {resetPhase === 1 && (
                <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                  Input your registered email address. We will dispatch a 6-digit OTP verification key.
                </p>
              )}
              {resetPhase === 2 && (
                <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                  An OTP has been sent to your email. Enter it below along with your new password.
                </p>
              )}

              {resetPhase === 3 ? (
                <div className="bg-brand-red/10 border border-brand-red/20 p-3 rounded-lg text-xs text-brand-red font-bold">
                  Success! Your password has been successfully reset. You can now login.
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3">
                  {resetError && (
                    <div className="text-[10px] text-brand-red font-bold px-1 bg-red-50 p-2 rounded-md">
                      {resetError}
                    </div>
                  )}

                  {resetPhase === 1 && (
                    <input
                      type="email"
                      required
                      placeholder="student@ethiorobotics.org"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red font-medium"
                    />
                  )}

                  {resetPhase === 2 && (
                    <>
                      <input
                        type="text"
                        required
                        placeholder="6-Digit OTP"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red font-medium"
                      />
                      <input
                        type="password"
                        required
                        placeholder="New Password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red font-medium"
                      />
                    </>
                  )}

                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-red to-brand-red-dark text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 transition-all disabled:opacity-50"
                    >
                      {resetLoading ? 'Loading...' : resetPhase === 1 ? 'Send OTP' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
