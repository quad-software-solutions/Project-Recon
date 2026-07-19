import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, ArrowRight, ShieldCheck, Sparkles, Info, CheckCircle, Lock
} from 'lucide-react';
import BrandLogo from '@/shared/ui/BrandLogo';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';

interface ForgotPasswordPageProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export default function ForgotPasswordPage({ onNavigateHome, onNavigateLogin }: ForgotPasswordPageProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);

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
        if (err.name !== 'AbortError') console.error('Failed to load bg:', err);
      });
    return () => abort.abort();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (phase === 1) {
      if (!email) {
        setError('Please enter your registered email address.');
        setLoading(false);
        return;
      }
      try {
        const { forgotPasswordApi } = await import('@/domains/auth/login/api/loginApi');
        await forgotPasswordApi(email);
        setPhase(2);
      } catch {
        setPhase(2);
      } finally {
        setLoading(false);
      }
    } else if (phase === 2) {
      if (!otp || !newPassword) {
        setError('Please fill in both OTP and new password.');
        setLoading(false);
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters.');
        setLoading(false);
        return;
      }
      try {
        const { resetPasswordApi } = await import('@/domains/auth/login/api/loginApi');
        await resetPasswordApi(otp, newPassword);
        setPhase(3);
      } catch (err) {
        const { formatApiError } = await import('@/shared/utils/formatApiError');
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-paper flex flex-col font-sans" id="forgot-password-viewport">
      <header className="relative z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 md:px-12 py-3 flex items-center justify-between h-[72px]">
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); onNavigateHome(); }}
          className="flex items-center transition-all duration-300 hover:opacity-80"
        >
          <BrandLogo className="h-9 w-[115px] md:h-[42px] md:w-[140px]" />
        </a>
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-brand-red transition-colors px-4 py-2"
          >
            Back to Home
          </button>
          <button
            onClick={onNavigateLogin}
            className="font-black text-[10px] uppercase tracking-[0.2em] text-white bg-gradient-to-r from-brand-red to-brand-red-dark px-5 py-2.5 rounded-xl shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/40 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
          >
            LOGIN
          </button>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence mode="popLayout">
            {bgImage && (
              <motion.img
                key={bgImage}
                src={bgImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-[4px] scale-110"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/60 via-white/85 to-brand-red/40" />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-brand-blue/25 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />



        <div className="max-w-md w-full relative z-10" id="forgot-password-card-box">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_30px_80px_-12px_rgba(0,0,0,0.08)] border border-slate-200 relative"
          >
            <div className="h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="p-8 md:p-10 relative">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="inline-flex w-14 h-14 bg-gradient-to-br from-brand-red/20 to-brand-red/5 rounded-2xl items-center justify-center text-brand-red mb-4 ring-1 ring-brand-red/20"
                >
                  {phase === 3 ? (
                    <CheckCircle className="w-7 h-7" />
                  ) : (
                    <Sparkles className="w-7 h-7" />
                  )}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="font-black text-slate-900 tracking-tight text-[28px] uppercase"
                >
                  {phase === 1 ? 'Restore Password' : phase === 2 ? 'Reset Code' : 'Password Restored'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto font-medium"
                >
                  {phase === 1
                    ? 'Input your registered email address. We will dispatch a 6-digit OTP verification key.'
                    : phase === 2
                    ? 'An OTP has been sent to your email. Enter it below along with your new password.'
                    : 'Your password has been successfully reset. You can now login with your new credentials.'}
                </motion.p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-brand-red/10 border border-brand-red/20 rounded-xl p-3.5 text-xs text-brand-red font-bold leading-relaxed flex items-start gap-2.5 overflow-hidden"
                  >
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 3 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-700 font-bold text-center leading-relaxed w-full">
                    Success! Your password has been successfully reset.
                  </div>
                  <button
                    onClick={onNavigateLogin}
                    className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-4 px-4 rounded-xl active:scale-[0.97] transition-all font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/45 group"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {phase === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1.5"
                    >
                      <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                        <input
                          type="email"
                          required
                          placeholder="student@ethiorobotics.org"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  {phase === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">6-Digit OTP</label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input
                            type="text"
                            required
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all tracking-[0.2em]"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                          >
                            {showPassword ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-4 px-4 rounded-xl active:scale-[0.97] transition-all font-black text-sm uppercase tracking-wider mt-2 flex items-center justify-center gap-2 shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/45 disabled:opacity-50 group"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2.5">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>{phase === 1 ? 'Sending OTP...' : 'Resetting Password...'}</span>
                        </span>
                      ) : (
                        <>
                          <span>{phase === 1 ? 'Send OTP' : 'Reset Password'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 pt-6 border-t border-slate-100 text-center"
              >
                <span className="text-xs text-slate-400 font-medium">
                  Remember your password?{' '}
                </span>
                <button
                  onClick={onNavigateLogin}
                  className="text-xs font-bold text-brand-red hover:underline transition-all"
                >
                  Log In Here
                </button>
              </motion.div>

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

      <footer className="bg-white/95 backdrop-blur-md border-t border-slate-100 py-8 text-center relative z-30">
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
    </div>
  );
}
