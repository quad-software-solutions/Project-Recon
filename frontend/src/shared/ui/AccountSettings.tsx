import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Mail, Smartphone, ShieldCheck, Key, Loader2, Check, X,
  Eye, EyeOff, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import { securityApi } from '@/src/domains/auth/login/api/securityApi';

interface TrustedDevice {
  id: string;
  device_name: string;
  device_type: string;
  ip_address?: string;
  last_used_at: string;
  is_active: boolean;
}

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState<'password' | 'email' | 'devices'>('password');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        {([
          { id: 'password', label: 'Password', icon: Lock },
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'devices', label: 'Devices', icon: Smartphone },
        ] as const).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider transition-all ${isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'password' && <ChangePasswordForm />}
      {activeTab === 'email' && <EmailVerificationForm />}
      {activeTab === 'devices' && <TrustedDevicesPanel />}
    </div>
  );
}

function ChangePasswordForm() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setError('All fields are required');
      return;
    }
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await securityApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
          <Key className="w-4 h-4 text-brand-red" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900">Change Password</h3>
          <p className="text-[11px] text-slate-500">Update your account password</p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-1.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
            <Check className="w-3.5 h-3.5 shrink-0" />Password changed successfully
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Current Password</label>
          <input type="password" value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">New Password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Confirm New Password</label>
          <input type="password" value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all"
          />
        </div>
        <button type="submit" disabled={submitting}
          className="self-start px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-brand-red-dark disabled:opacity-50 transition-all"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

function EmailVerificationForm() {
  const [step, setStep] = useState<'idle' | 'sent' | 'verify'>('idle');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequest = async () => {
    setSubmitting(true);
    setError('');
    try {
      await securityApi.requestEmailVerification();
      setStep('sent');
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to send verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) { setError('Enter the OTP code'); return; }
    setSubmitting(true);
    setError('');
    try {
      await securityApi.verifyEmail(otp);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
          <Mail className="w-4 h-4 text-brand-blue" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900">Email Verification</h3>
          <p className="text-[11px] text-slate-500">Verify your email address</p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {success ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-emerald-700">Email Verified!</p>
        </div>
      ) : step === 'idle' ? (
        <div>
          <p className="text-xs text-slate-600 mb-3">Request a verification OTP sent to your registered email address.</p>
          <button onClick={handleRequest} disabled={submitting}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-brand-blue-dark disabled:opacity-50 transition-all"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {submitting ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-slate-600 mb-3">Enter the 6-digit code sent to your email.</p>
          <div className="flex gap-2">
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000"
              maxLength={6} className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-brand-blue/40"
            />
            <button onClick={handleVerify} disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Verify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrustedDevicesPanel() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await securityApi.listDevices();
      setDevices(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: string) => {
    try {
      await securityApi.revokeDevice(id);
      setDevices(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke device');
    }
  };

  const handleRevokeAll = async () => {
    try {
      await securityApi.revokeAllDevices();
      setDevices([]);
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke all');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Trusted Devices</h3>
            <p className="text-[11px] text-slate-500">Manage devices authorized to access your account</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {devices.length > 0 && (
            <button onClick={handleRevokeAll} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Revoke all">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400">
          <Smartphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No trusted devices</p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.device_name}</p>
                  <p className="text-[10px] text-slate-400">{d.device_type} · {d.ip_address || '—'}</p>
                </div>
              </div>
              <button onClick={() => handleRevoke(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Revoke">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
