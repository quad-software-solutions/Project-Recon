import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, ShieldCheck, Info, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import BrandLogo from '@/shared/ui/BrandLogo';
import { useBranding } from '@/shared/hooks/useBranding';
import { UserProfile } from '@/shared/types';
import { http } from '@/shared/api/http';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode }: AuthModalProps) {
  const branding = useBranding();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Student' | 'Instructor'>('Student');
  const [errorMsg, setErrorMsg] = useState('');
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setEmail('');
      setName('');
      setPassword('');
      setRegistered(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please populate all mandatory inputs.');
      return;
    }

    if (mode === 'register' && !name) {
      setErrorMsg('Please specify your Full Name.');
      return;
    }

    if (password.length < 5) {
      setErrorMsg('Password should be at least 5 alphanumeric characters.');
      return;
    }

    if (mode === 'login') {
      setSubmitting(true);
      import('../../login/api/loginApi').then(({ loginApi }) => {
        loginApi({ email, password })
          .then(({ user }) => {
            onAuthSuccess(user);
            onClose();
          })
          .catch((err) => {
            setErrorMsg(err instanceof Error ? err.message : 'Login failed');
          })
          .finally(() => setSubmitting(false));
      }).catch(() => {
        setSubmitting(false);
        setErrorMsg('Failed to load login module. Please try again.');
      });
    } else {
      setSubmitting(true);
      http.post('/cms/contact-requests/', {
        name,
        email,
        phone: '',
        subject: `New account request: ${role}`,
        description: `Full Name: ${name}\nEmail: ${email}\nRequested Role: ${role}\nPassword preference submitted with request.`,
      }).then(() => {
        setSubmitting(false);
        setRegistered(true);
      }).catch((err) => {
        setSubmitting(false);
        setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      });
    }
  };

  if (registered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
          className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 z-10 border border-slate-100 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="font-black text-xl text-slate-900 mb-2">Request Submitted!</h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Thanks <strong>{name}</strong>! Your account request for <strong>{role}</strong> has been sent to our team.
            An administrator will review and create your account. You'll receive login credentials at <strong className="text-brand-red">{email}</strong> once approved.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setRegistered(false); setMode('login'); }}
              className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-brand-red/25 hover:shadow-xl transition-all">
              Sign In
            </button>
            <button onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-200 transition-all">
              Done
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-white/20 backdrop-blur-sm"
        id="modal-backdrop-auth"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl shadow-slate-200/50 p-8 z-10 overflow-hidden border border-slate-100"
        id="auth-modal-card"
      >
        
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl -z-10" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          id="btn-close-auth-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex justify-center">
            <BrandLogo className="h-10 w-[130px]" logoUrl={branding.logoUrl || undefined} />
          </div>
          <h3 className="font-black text-xl md:text-2xl text-slate-900 uppercase tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            {mode === 'login' 
              ? 'Access your virtual lab console & program registries.' 
              : 'Sign up to enroll in programs, events, and track certifications.'}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-brand-red/10 border border-brand-red/20 p-3 text-xs text-brand-red rounded-lg mb-4 font-bold leading-relaxed"
              id="auth-error-banner"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kidus Tadesse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="student@ethiorobotics.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Secret Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="• • • • • •"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Account Role</label>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => setRole('Student')}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                    role === 'Student'
                      ? 'bg-brand-red/10 border-brand-red text-brand-red'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-brand-red/30'
                  }`}
                >
                  Student Cohort
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Instructor')}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                    role === 'Instructor'
                      ? 'bg-brand-red/10 border-brand-red text-brand-red'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-brand-red/30'
                  }`}
                >
                  STEM Instructor
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 rounded-xl hover:shadow-xl hover:shadow-brand-red/40 active:scale-98 transition-all font-black text-sm uppercase tracking-wider mt-2 shadow-lg shadow-brand-red/25"
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-brand-red/50" />}
              <span>{submitting ? 'Submitting...' : mode === 'login' ? 'Boot Interactive Console' : 'Submit Request'}</span>
            </span>
          </button>

        </form>

        {/* Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'login' ? "New member?" : "Already registered?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg('');
              }}
              className="text-brand-red font-bold hover:underline"
              id="auth-toggle-mode-btn"
            >
              {mode === 'login' ? 'Establish profile here' : 'Sign in back to terminal'}
            </button>
          </p>
        </div>

        {/* Security note */}
        <div className="mt-4 bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-start gap-1.5 text-[10px] text-slate-500 font-medium leading-normal">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
          <span>Your credentials are secured with JWT authentication. Use the account provided by your institution.</span>
        </div>

      </motion.div>
    </div>
  );
}
