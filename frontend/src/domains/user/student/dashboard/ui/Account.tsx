import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, Calendar, BookOpen, CheckCircle2,
  Edit3, Save, X, Loader2, Shield, Star, Target, Lock,
} from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { updateUserApi } from '@/domains/user/shared/api/adminApi';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';

interface Props {
  currentUser: UserProfile;
  studentId: string;
  onUserUpdate?: (user: UserProfile) => void;
}

export default function Account({ currentUser, onUserUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSaving(false);
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
      const { http } = await import('@/shared/api/http');
      await http.patch('/accounts/password/change/', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess(true);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e: any) {
      setPwError(e.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
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

        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-50 shadow-md shrink-0">
          <img src={currentUser.profile_picture || profileImg} alt="" className="w-full h-full object-cover" />
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
    </div>
  );
}
