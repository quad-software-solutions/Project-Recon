import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, Calendar, BookOpen, CheckCircle2, Camera,
  Edit3, Save, X, Loader2, Shield, Star, Target, Lock, Monitor, Smartphone, LogOut,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { updateUserApi, uploadProfilePictureApi } from '@/domains/user/shared/api/adminApi';
import { securityApi } from '@/domains/auth/login/api/securityApi';
import { formatApiError } from '@/shared/utils/formatApiError';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';

interface Props {
  currentUser: UserProfile;
  studentId: string;
  onUserUpdate?: (user: UserProfile) => void;
}

export default function Account({ currentUser, onUserUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: currentUser.first_name || currentUser.name.split(' ')[0] || '',
    last_name: currentUser.last_name || currentUser.name.split(' ').slice(1).join(' ') || '',
    phone_number: currentUser.phone_number || '',
    date_of_birth: currentUser.date_of_birth || '',
    gender: currentUser.gender || '',
  });

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSave = async () => {
    if (!currentUser.id) { setError('User ID not available.'); return; }
    setSaving(true);
    setError('');
    try {
      await updateUserApi(currentUser.id, form);
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
      const existing = localStorage.getItem('ethio_robotics_user');
      if (existing) localStorage.setItem('ethio_robotics_user', JSON.stringify(updatedUser));
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
      onUserUpdate?.({ ...currentUser, profile_picture: updated.profile_picture || currentUser.profile_picture });
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

  const handlePasswordChange = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    setPwError('');
    setPwSuccess(false);
    try {
      await securityApi.changePassword({
        old_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess(true);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      setPwError(formatApiError(e));
    } finally {
      setPwSaving(false);
    }
  };

  const [devices, setDevices] = useState<{ id: string; device_name?: string; device_type?: string; last_used?: string }[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutAllDone, setLogoutAllDone] = useState(false);

  useEffect(() => {
    setDevicesLoading(true);
    securityApi.listDevices()
      .then((d: any) => setDevices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setDevicesLoading(false));
  }, []);

  const revokeDevice = async (id: string) => {
    try {
      await securityApi.revokeDevice(id);
      setDevices(prev => prev.filter(d => d.id !== id));
    } catch {}
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      await securityApi.logoutAllSessions();
      setLogoutAllDone(true);
    } catch {}
    setLogoutAllLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
        {!editing && (
          <button onClick={() => setEditing(true)}
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
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-display font-bold text-slate-900 text-3xl md:text-4xl uppercase tracking-tight">{currentUser.name}</h3>
              <p className="font-sans text-brand-muted text-sm mt-1">Student</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {currentUser.email}
                </span>
                {currentUser.phone_number && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentUser.phone_number}
                  </span>
                )}
                {currentUser.date_of_birth && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(currentUser.date_of_birth).toLocaleDateString()}
                  </span>
                )}
                {currentUser.gender && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {currentUser.gender}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border-light/60">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-lg text-slate-900">Password</h3>
        </div>

        {pwSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Password changed successfully.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
            placeholder="Current password"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
          <input type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
            placeholder="New password"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
          <div className="flex gap-2">
            <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
              placeholder="Confirm new password"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue" />
            <button onClick={handlePasswordChange} disabled={pwSaving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {pwError && <p className="text-xs text-red-600 mt-2">{pwError}</p>}
      </div>

      {/* Devices & Sessions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border-light/60">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-lg text-slate-900">Security & Sessions</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">Logout all other sessions</span>
            </div>
            <button onClick={handleLogoutAll} disabled={logoutAllLoading || logoutAllDone}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
            >
              {logoutAllLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {logoutAllDone ? 'Done' : 'Logout All'}
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">Trusted Devices ({devices.length})</p>
            {devicesLoading ? (
              <div className="py-3 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" /></div>
            ) : devices.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No trusted devices</p>
            ) : (
              <div className="space-y-2">
                {devices.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{d.device_name || d.device_type || 'Unknown device'}</p>
                        {d.last_used && <p className="text-[10px] text-slate-400">Last used: {new Date(d.last_used).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <button onClick={() => revokeDevice(d.id)} className="text-[10px] font-semibold text-red-500 hover:text-red-700 shrink-0 px-2 py-1 rounded hover:bg-red-50">Revoke</button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <TrustCurrentDevice
                onTrusted={() => {
                  setDevicesLoading(true);
                  securityApi.listDevices()
                    .then((d: any) => setDevices(Array.isArray(d) ? d : []))
                    .catch(() => {})
                    .finally(() => setDevicesLoading(false));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustCurrentDevice({ onTrusted }: { onTrusted: () => void }) {
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
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Trust this browser</p>
      {msg && <p className="text-xs text-emerald-600 mb-2">{msg}</p>}
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      {phase === 'idle' ? (
        <button type="button" onClick={requestOtp} disabled={busy}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
          {busy ? 'Sending…' : 'Send verification OTP'}
        </button>
      ) : (
        <div className="flex gap-2">
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP code"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
          <button type="button" onClick={verify} disabled={busy || !otp.trim()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50">
            Verify
          </button>
        </div>
      )}
    </div>
  );
}
