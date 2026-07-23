import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, Calendar, Shield, Edit3, Save, X, Loader2, Camera,
  Lock, Key, Smartphone, Eye, EyeOff, AlertCircle, Check, RefreshCw,
  ShieldCheck, Award, Zap, TrendingUp, BookOpen, Star, CheckCircle2,
  LogOut, Monitor
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { updateUserProfile } from '@/shared/utils/storage';
import { updateUserApi, uploadProfilePictureApi } from '@/domains/user/shared/api/adminApi';
import { formatApiError } from '@/shared/utils/formatApiError';
import { securityApi } from '@/domains/auth/login/api/securityApi';
const profileImg = "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff";

interface Props {
  currentUser: UserProfile;
  onUserUpdate?: (user: UserProfile) => void;
}

interface TrustedDevice {
  id: string;
  device_name: string;
  device_type: string;
  ip_address?: string;
  last_used_at: string;
  is_active: boolean;
}

export default function AdminAccount({ currentUser, onUserUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [accountTab, setAccountTab] = useState<'profile' | 'password' | 'email' | 'devices' | 'theme'>('profile');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: currentUser.first_name || currentUser.name.split(' ')[0] || '',
    last_name: currentUser.last_name || currentUser.name.split(' ').slice(1).join(' ') || '',
    phone_number: currentUser.phone_number || '',
    date_of_birth: currentUser.date_of_birth || '',
    gender: currentUser.gender || '',
  });

  const handleSaveProfile = async () => {
    if (!currentUser.id) { setError('User ID not available.'); return; }
    setSaving(true);
    setError('');
    try {
      // Sanitize empty strings to null for backend validation
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
      };
      await updateUserApi(currentUser.id, payload);
      const newName = `${form.first_name} ${form.last_name}`.trim();
      const updatedUser: UserProfile = {
        ...currentUser,
        first_name: form.first_name,
        last_name: form.last_name,
        name: newName || currentUser.name,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
      };
      updateUserProfile(updatedUser);
      onUserUpdate?.(updatedUser);
      setEditing(false);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser.id) return;
    if (!file.type.startsWith('image/')) { setError('Only image files are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setUploading(true);
    setError('');
    try {
      const updated = await uploadProfilePictureApi(currentUser.id, file);
      const merged: UserProfile = {
        ...currentUser,
        profile_picture: updated.profile_picture || currentUser.profile_picture,
      };
      updateUserProfile(merged);
      onUserUpdate?.(merged);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelEdit = () => {
    setForm({
      first_name: currentUser.first_name || '',
      last_name: currentUser.last_name || '',
      phone_number: currentUser.phone_number || '',
      date_of_birth: currentUser.date_of_birth || '',
      gender: currentUser.gender || '',
    });
    setError('');
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Profile Header ── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
        {!editing && (
          <button onClick={() => { setEditing(true); setAccountTab('profile'); }}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all" title="Edit Profile">
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-50 shadow-md shrink-0 group">
          <img src={currentUser.profile_picture || profileImg} alt="" className="w-full h-full object-cover" />
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadPicture} className="hidden" />
          </label>
        </div>

        <div className="flex flex-col flex-1 text-center md:text-left w-full">
          {editing ? (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="First Name"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-brand-blue" />
                <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Last Name"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-brand-blue" />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-slate-400" />
                <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                  placeholder="Phone Number"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{error}</motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 pt-2">
                <button onClick={cancelEdit} disabled={saving}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveProfile} disabled={saving}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-display font-bold text-slate-900 text-3xl md:text-4xl uppercase tracking-tight">{currentUser.name}</h3>
              <p className="font-sans text-brand-muted text-sm mt-1">{currentUser.role}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {currentUser.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentUser.phone_number || 'Not provided'}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-lg ${currentUser.gender ? 'text-slate-700' : 'text-slate-400'}`}>
                  <User className="w-3.5 h-3.5 text-slate-400" /> {currentUser.gender || 'Gender not set'}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-lg ${currentUser.date_of_birth ? 'text-slate-700' : 'text-slate-400'}`}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {currentUser.date_of_birth ? new Date(currentUser.date_of_birth).toLocaleDateString() : 'No DOB'}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                  currentUser.status === 'Active'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${currentUser.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  {currentUser.status || 'Active'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Role</p>
            <p className="font-bold text-slate-900 text-xl leading-tight mt-0.5">{currentUser.role}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Access</p>
            <p className="font-bold text-slate-900 text-xl leading-tight mt-0.5 uppercase">{currentUser.subscriptionTier || 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* ── Account Settings Tabs ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-border-light/60 overflow-hidden">
        <div className="flex gap-1 bg-slate-100 p-1 mx-4 mt-4 rounded-lg w-fit">
          {([
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Password', icon: Lock },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'devices', label: 'My Devices', icon: Smartphone },
            { id: 'theme', label: 'Theme', icon: Zap },
          ] as const).map(tab => {
            const Icon = tab.icon;
            const isActive = accountTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { setAccountTab(tab.id); setEditing(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider transition-all ${isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 md:p-6">
          {accountTab === 'profile' && <ProfileInfo currentUser={currentUser} />}
          {accountTab === 'password' && <ChangePasswordForm />}
          {accountTab === 'email' && <EmailVerificationForm currentUser={currentUser} onVerify={() => {
            const updated = { ...currentUser, is_email_verified: true };
            updateUserProfile(updated);
            onUserUpdate?.(updated);
          }} />}
          {accountTab === 'devices' && <TrustedDevicesPanel />}
          {accountTab === 'theme' && <ThemePreferencesPanel />}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Info (read-only summary) ─── */
function ProfileInfo({ currentUser }: { currentUser: UserProfile }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.email}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.phone_number || 'Not provided'}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.gender || 'Not selected'}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</p>
          <p className="text-sm font-semibold text-slate-900">
            {currentUser.date_of_birth ? new Date(currentUser.date_of_birth).toLocaleDateString() : 'Not available'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Status</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.status || 'Active'}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.role}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Verified</p>
          <p className="text-sm font-semibold text-slate-900">{currentUser.is_email_verified ? 'Yes' : 'No'}</p>
        </div>
      </div>
      {currentUser.assignments && currentUser.assignments.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assignments</p>
          <div className="space-y-1.5">
            {currentUser.assignments.map(a => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs font-semibold text-slate-700 capitalize">{a.role.replace('_', ' ')}</span>
                {a.branch_name && <span className="text-xs text-slate-500">at {a.branch_name}</span>}
                {a.is_primary && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Primary</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Change Password ─── */
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
    if (!form.current_password || !form.new_password || !form.confirm_password) { setError('All fields are required'); return; }
    if (form.new_password.length <= 6) { setError('Password must be greater than 6 characters'); return; }
    if (!/[A-Z]/.test(form.new_password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(form.new_password)) { setError('Password must contain at least one special character'); return; }
    if (form.new_password !== form.confirm_password) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      await securityApi.changePassword({ old_password: form.current_password, new_password: form.new_password });
      setSuccess(true);
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
          <Key className="w-4 h-4 text-blue-600" />
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Current Password</label>
          <input type="password" value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600/30 focus:bg-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">New Password</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-blue-600/30 focus:bg-white" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.new_password && (
            <div className="mt-2 space-y-1 pl-1">
              <p className={`text-[10px] font-medium flex items-center gap-1.5 transition-colors ${form.new_password.length > 6 ? 'text-emerald-600' : 'text-slate-500'}`}>
                {form.new_password.length > 6 ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />} Greater than 6 characters
              </p>
              <p className={`text-[10px] font-medium flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(form.new_password) ? 'text-emerald-600' : 'text-slate-500'}`}>
                {/[A-Z]/.test(form.new_password) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />} At least 1 uppercase letter
              </p>
              <p className={`text-[10px] font-medium flex items-center gap-1.5 transition-colors ${/[!@#$%^&*(),.?":{}|<>\-_]/.test(form.new_password) ? 'text-emerald-600' : 'text-slate-500'}`}>
                {/[!@#$%^&*(),.?":{}|<>\-_]/.test(form.new_password) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />} At least 1 special character
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Confirm New Password</label>
          <input type="password" value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600/30 focus:bg-white" />
        </div>
        <button type="submit" disabled={submitting}
          className="self-start px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

/* ─── Email Verification ─── */
function EmailVerificationForm({ currentUser, onVerify }: { currentUser: UserProfile; onVerify?: () => void }) {
  const [step, setStep] = useState<'idle' | 'sent' | 'verify'>('idle');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(currentUser.is_email_verified || false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Change email state
  const [emailForm, setEmailForm] = useState({ new_email: '', current_password: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleEmailChange = async () => {
    if (!emailForm.new_email.trim()) { setEmailError('Email is required'); return; }
    if (!emailForm.current_password) { setEmailError('Current password is required'); return; }
    if (emailForm.new_email === currentUser.email) { setEmailError('New email is the same as current'); return; }
    setEmailSaving(true);
    setEmailError('');
    setEmailSuccess(false);
    try {
      await updateUserApi(currentUser.id, { email: emailForm.new_email, current_password: emailForm.current_password } as any);
      setEmailSuccess(true);
      setEmailForm({ new_email: '', current_password: '' });
      const updated = { ...currentUser, email: emailForm.new_email };
      updateUserProfile(updated);
      onVerify?.();
    } catch (e: any) {
      setEmailError(formatApiError(e));
    } finally {
      setEmailSaving(false);
    }
  };

  React.useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => setResendCooldown(p => p - 1), 1000);
      return () => clearInterval(cooldownRef.current);
    }
  }, [resendCooldown > 0]);

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
      onVerify?.();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setSubmitting(true);
    setError('');
    try {
      await securityApi.requestEmailVerification();
      setResendCooldown(60);
      setStep('sent');
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to resend');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
          <Mail className="w-4 h-4 text-brand-blue" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900">Email Settings</h3>
          <p className="text-[11px] text-slate-500">Manage and verify your email</p>
        </div>
      </div>

      {/* Change Email Section */}
      <div className="mb-6 pb-6 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Change Email</h4>
        {emailSuccess && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Email changed successfully.
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">New Email Address</label>
            <input type="email" value={emailForm.new_email} onChange={e => setEmailForm(f => ({ ...f, new_email: e.target.value }))}
              placeholder="e.g. new_email@example.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Current Password</label>
            <div className="flex gap-2">
              <input type="password" value={emailForm.current_password} onChange={e => setEmailForm(f => ({ ...f, current_password: e.target.value }))}
                placeholder="Required to confirm"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
              <button onClick={handleEmailChange} disabled={emailSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                {emailSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
        </div>
      </div>

      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Verification Status</h4>
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
            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-brand-blue-dark disabled:opacity-50">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {submitting ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-slate-600 mb-3">Enter the 6-digit code sent to your email.</p>
          <div className="flex gap-2">
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000"
              maxLength={6}
              className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-brand-blue/40" />
            <button onClick={handleVerify} disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Verify
            </button>
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="mt-3 text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors disabled:text-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'group-hover:animate-spin'}`} />
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Trusted Devices ─── */
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

  React.useEffect(() => { load(); }, []);

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Trusted Devices</h3>
            <p className="text-[11px] text-slate-500">My trusted devices on this account</p>
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
        <div className="flex items-center justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
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

      <TrustThisDevice onTrusted={load} />

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Sessions</p>
        <button
          onClick={() => {
            if (window.confirm('Log out from all devices and sessions?')) {
              securityApi.logoutAllSessions().then(() => {
                window.location.href = '/login';
              }).catch(() => {
                window.location.href = '/login';
              });
            }
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout all sessions
        </button>
      </div>
    </div>
  );
}

function TrustThisDevice({ onTrusted }: { onTrusted: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'otp'>('idle');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const requestOtp = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await securityApi.requestDeviceVerification();
      setPhase('otp');
      setMsg('OTP sent. Enter the code to trust this browser.');
    } catch (e: unknown) {
      const { formatApiError } = await import('@/shared/utils/formatApiError');
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!otp.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await securityApi.verifyDevice(otp.trim());
      setPhase('idle');
      setOtp('');
      setMsg('This device is now trusted.');
      onTrusted();
    } catch (e: unknown) {
      const { formatApiError } = await import('@/shared/utils/formatApiError');
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Trust this browser</p>
      {msg && <p className="text-xs text-emerald-600 mb-2">{msg}</p>}
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      {phase === 'idle' ? (
        <button type="button" onClick={requestOtp} disabled={busy}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50">
          {busy ? 'Sending…' : 'Send verification OTP'}
        </button>
      ) : (
        <div className="flex gap-2">
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP code"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
          <button type="button" onClick={verify} disabled={busy || !otp.trim()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 text-white disabled:opacity-50">
            Verify
          </button>
        </div>
      )}
    </div>
  );
}

function ThemePreferencesPanel() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const raw = localStorage.getItem('admin.theme');
      if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
    } catch { /* ignore */ }
    return 'light';
  });

  useEffect(() => {
    const apply = () => {
      const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = theme === 'dark' || (theme === 'system' && preferDark);
      document.documentElement.classList.toggle('dark', dark);
      try { localStorage.setItem('admin.theme', theme); } catch { /* ignore */ }
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const options = [
    { id: 'light' as const, label: 'Light', icon: Zap },
    { id: 'dark' as const, label: 'Dark', icon: Shield },
    { id: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <h3 className="font-bold text-sm text-slate-900">Appearance</h3>
        <p className="text-xs text-slate-500 mt-1">Applies the dark class on this browser (same pattern as student settings).</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${
                active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-700">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
