import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Eye, EyeOff, Mail,
  Sparkles, Info, RefreshCw
} from 'lucide-react';
import { UserProfile } from '@/shared/types';
import BrandLogo from '@/shared/ui/BrandLogo';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';

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
  const [viewMode, setViewMode] = useState<'login' | 'email-verify'>('login');
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
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const abort = new AbortController();
    cmsPublicApi.getHeroBanners(abort.signal)
      .then(banners => {
        const activeBanners = banners.filter(b => b.is_active !== false && b.image);
        if (activeBanners.length > 0) {
          setBgImage(activeBanners[0].image!);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Failed to load login bg:', err);
      });
    return () => abort.abort();
  }, []);
  
  React.useEffect(() => {
    if (initialView === 'register') {
      onNavigateRegister?.();
      return;
    }
    setViewMode(initialView);
    setErrorMsg('');
  }, [initialView, onNavigateRegister]);

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

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => setResendCooldown(p => p - 1), 1000);
      return () => clearInterval(cooldownRef.current);
    }
  }, [resendCooldown > 0]);

  const handleResendEmailVerify = async () => {
    setErrorMsg('');
    const { requestEmailVerificationApi } = await import('../api/loginApi');
    try {
      await requestEmailVerificationApi(email);
      setResendCooldown(60);
    } catch {
      setErrorMsg('Failed to resend verification code.');
    }
  };

  const handleResendForgotPassword = async () => {
    setResetError('');
    const { forgotPasswordApi } = await import('../api/loginApi');
    try {
      await forgotPasswordApi(resetEmail);
      setResendCooldown(60);
    } catch {
      setResetError('Failed to resend OTP.');
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
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-white" id="dedicated-auth-viewport">
      
      {/* Left side: Login form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen min-h-dvh relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-6 py-4 sm:py-6 md:px-12 md:py-8 flex items-center justify-between">
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); onNavigateHome(); }}
            className="transition-opacity hover:opacity-80"
            id="login-brand-logo"
          >
            <BrandLogo className="h-8 md:h-10" />
          </a>
          <button
            onClick={onNavigateHome}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            id="btn-login-back-home"
          >
            Back to Home
          </button>
        </header>

        {/* Form Container */}
        <div className="flex-grow flex items-center justify-center px-4 sm:px-12 py-8 sm:py-10">
          <div className="w-full max-w-md">
            {/* Title */}
            <div className="mb-8 sm:mb-10">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight"
              >
                {viewMode === 'login' ? 'Sign in' : 'Verify Email'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base text-slate-600"
              >
                {viewMode === 'email-verify' ? (
                  'Please enter the 6-digit verification code sent to your email.'
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateRegister) onNavigateRegister();
                      }}
                      className="font-semibold text-brand-blue hover:underline"
                    >
                      Register now
                    </button>
                  </>
                )}
              </motion.p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium flex items-start gap-3 overflow-hidden"
                  id="login-error-alert"
                >
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={viewMode === 'email-verify' ? handleEmailVerifySubmit : handleFormSubmit} className="space-y-5">
              <motion.div
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                {viewMode === 'email-verify' ? (
                  <motion.div variants={staggerItem} className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Verification Code</label>
                    <input
                      type="text"
                      placeholder="6-Digit OTP"
                      required
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all tracking-[0.2em]"
                    />
                  </motion.div>
                ) : (
                  <>
                    {/* Email/ID Input */}
                    <motion.div variants={staggerItem} className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">E-mail or ID</label>
                      <input
                        type="email"
                        placeholder="example@ethiorobotics.org"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all"
                      />
                    </motion.div>

                    {/* Password Input */}
                    <motion.div variants={staggerItem} className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </motion.div>

                    {/* Options row */}
                    <motion.div variants={staggerItem} className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20 transition-colors" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                      </label>
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
                        className="text-sm font-semibold text-slate-900 hover:text-brand-blue hover:underline transition-colors"
                        id="btn-login-forgot"
                      >
                        Forgot Password?
                      </button>
                    </motion.div>
                  </>
                )}

                {/* Submit Button */}
                <motion.div variants={staggerItem} className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    id="btn-submit-active-login"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>{viewMode === 'email-verify' ? 'Verifying...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <span>{viewMode === 'email-verify' ? 'Verify Code' : 'Sign in'}</span>
                    )}
                  </button>
                </motion.div>

                {/* Resend + Back to login toggle (if verify) */}
                {viewMode === 'email-verify' && (
                   <motion.div variants={staggerItem} className="text-center pt-2 space-y-2">
                     <button
                       type="button"
                       onClick={handleResendEmailVerify}
                       disabled={resendCooldown > 0}
                       className="text-sm font-medium text-brand-blue hover:text-brand-blue-dark transition-colors disabled:text-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                     >
                       <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? '' : 'group-hover:animate-spin'}`} />
                       {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                     </button>
                     <div>
                       <button
                          type="button"
                          onClick={() => {
                            setViewMode('login');
                            setEmailOtp('');
                            setErrorMsg('');
                          }}
                          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                       >
                          Want to use a different account? Back to Login
                       </button>
                     </div>
                   </motion.div>
                )}
              </motion.div>
            </form>
          </div>
        </div>
      </div>

      {/* Right side: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        {bgImage ? (
          <motion.img
            key={bgImage}
            src={bgImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 1.2 }}
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/90 via-slate-900/80 to-slate-900/90" />
        
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          >
             <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
               Accelerate your robotics journey
             </h2>
             <p className="text-slate-300 text-lg mb-10 leading-relaxed">
               Access comprehensive engineering curriculum, powerful simulation labs, and join a community of innovators shaping the future of technology in Africa.
             </p>

             <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6">
                <div className="bg-brand-red/20 p-4 rounded-xl shrink-0">
                   <Sparkles className="w-8 h-8 text-brand-red" />
                </div>
                <div>
                   <p className="text-sm font-medium text-slate-400 mb-1">Become a problem solver </p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white max-w-sm w-full rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 z-10 mx-0 sm:mx-4"
              id="dialog-forgot-password-box"
            >
              <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-blue" />
                <span>{resetPhase === 3 ? 'Password Restored' : 'Restore Password'}</span>
              </h3>
              
              {resetPhase === 1 && (
                <p className="text-sm text-slate-500 mb-4">
                  Input your registered email address. We will dispatch a 6-digit OTP verification key.
                </p>
              )}
              {resetPhase === 2 && (
                <p className="text-sm text-slate-500 mb-4">
                  An OTP has been sent to your email. Enter it below along with your new password.
                </p>
              )}

              {resetPhase === 3 ? (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-sm text-green-700 font-medium">
                  Success! Your password has been successfully reset. You can now login.
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {resetError && (
                    <div className="text-sm text-red-600 font-medium px-3 bg-red-50 py-2 rounded-lg">
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all"
                    />
                  )}

                  {resetPhase === 2 && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        required
                        placeholder="6-Digit OTP"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all"
                      />
                      <input
                        type="password"
                        required
                        placeholder="New Password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleResendForgotPassword}
                        disabled={resendCooldown > 0}
                        className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors disabled:text-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'group-hover:animate-spin'}`} />
                        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
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
