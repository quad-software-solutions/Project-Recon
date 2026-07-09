import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, MapPin, Calendar, BookOpen, Award, CheckCircle2,
  Edit3, Save, X, Loader2, Shield, Star, TrendingUp, Zap, Medal,
  Target, Clock, GraduationCap, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import type { UserProfile, Enrollment } from '@/src/shared/types';
import { updateUserApi } from '@/src/domains/user/shared/api/adminApi';
import { fetchEnrollmentsApi } from '@/src/domains/learning/academics/api/academicApi';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';

interface Props {
  currentUser: UserProfile;
  studentId: string;
  onUserUpdate?: (user: UserProfile) => void;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

export default function Account({ currentUser, studentId, onUserUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: currentUser.first_name || currentUser.name.split(' ')[0] || '',
    last_name: currentUser.last_name || currentUser.name.split(' ').slice(1).join(' ') || '',
    phone_number: currentUser.phone_number || '',
    date_of_birth: currentUser.date_of_birth || '',
    gender: currentUser.gender || '',
  });

  useEffect(() => {
    fetchEnrollmentsApi(studentId).then(setEnrollments).catch(() => {}).finally(() => setEnrollLoading(false));
  }, [studentId]);

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

  const activeCount = enrollments.filter(e => e.status === 'ACTIVE').length;
  const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;
  const pendingCount = enrollments.filter(e => e.status === 'PENDING_PAYMENT').length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Profile Header ── */}
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
                  className="flex-1 px-3 py-2 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-brand-red-dark disabled:opacity-50 flex items-center justify-center gap-1.5">
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

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">XP Points</p>
            <p className="font-bold text-slate-900 text-xl leading-tight mt-0.5">{currentUser.xpPoints.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">Badges</p>
            <p className="font-bold text-slate-900 text-xl leading-tight mt-0.5">{currentUser.badges.length} <span className="text-sm font-normal text-slate-400">earned</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">Active</p>
            <p className="font-bold text-slate-900 text-xl leading-tight mt-0.5">{activeCount} <span className="text-sm font-normal text-slate-400">tracks</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Medal className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">Completed</p>
            <p className="font-bold text-slate-900 text-xl leading-tight mt-0.5">{completedCount} <span className="text-sm font-normal text-slate-400">courses</span></p>
          </div>
        </div>
      </div>

      {/* ── Portfolio: Enrollments & Achievements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Portfolio */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border-light/60">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-red" />
              <h3 className="font-black text-lg text-slate-900">Learning Portfolio</h3>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{enrollments.length} total</span>
          </div>

          {enrollLoading ? (
            <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
          ) : enrollments.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No enrollments yet. Start your learning journey!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {[...enrollments].reverse().map((enr, i) => (
                <motion.div
                  key={enr.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    enr.status === 'ACTIVE' ? 'bg-emerald-50/50 border-emerald-200' :
                    enr.status === 'COMPLETED' ? 'bg-blue-50/50 border-blue-200' :
                    enr.status === 'PENDING_PAYMENT' ? 'bg-amber-50/50 border-amber-200' :
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    enr.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' :
                    enr.status === 'COMPLETED' ? 'bg-blue-100 text-blue-600' :
                    enr.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {enr.status === 'ACTIVE' ? <TrendingUp className="w-5 h-5" /> :
                     enr.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> :
                     enr.status === 'PENDING_PAYMENT' ? <Clock className="w-5 h-5" /> :
                     <X className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">{enr.program_name || enr.sub_program_name || 'Program'}</h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_STYLES[enr.status] || 'bg-slate-100 text-slate-600'}`}>
                        {enr.status === 'PENDING_PAYMENT' ? 'Pending' : enr.status.charAt(0) + enr.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {enr.class_name && <span>{enr.class_name} · </span>}
                      {enr.branch_name && <span>{enr.branch_name} · </span>}
                      {enr.enrolled_at?.slice(0, 10)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements / Badges */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border-light/60">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-lg text-slate-900">Achievements</h3>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{currentUser.badges.length} badges</span>
          </div>

          {currentUser.badges.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Complete challenges to earn badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentUser.badges.map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:-translate-y-1 hover:border-amber-200 transition-all"
                >
                  <span className="text-2xl mb-2">
                    {['🏆', '🛡️', '⭐', '🎯', '💎', '🔥', '🌟', '📜', '🔬', '⚡', '🧠', '🎖️'][i % 12]}
                  </span>
                  <span className="font-bold text-xs text-slate-700 text-center leading-tight">{badge}</span>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Account Status</span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Shield className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
