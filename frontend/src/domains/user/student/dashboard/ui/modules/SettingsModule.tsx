import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Bell, Globe, Eye, Monitor, Check } from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { updateUserApi } from '@/domains/user/shared/api/adminApi';
import PageHeader from '../../../shared/ui/PageHeader';
import TabBar from '../../../shared/ui/TabBar';

interface Props {
  currentUser: UserProfile;
  onUserUpdate?: (user: UserProfile) => void;
}

const STORAGE_KEY = 'student_settings';

interface StudentSettings {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  academicAlerts: boolean;
  eventAlerts: boolean;
  language: 'en' | 'am';
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large';
}

const DEFAULT_SETTINGS: StudentSettings = {
  theme: 'light',
  emailNotifications: true,
  pushNotifications: true,
  academicAlerts: true,
  eventAlerts: true,
  language: 'en',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
};

function loadSettings(): StudentSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* noop */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: StudentSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* noop */ }
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export default function SettingsModule({ currentUser, onUserUpdate }: Props) {
  const [tab, setTab] = useState('appearance');
  const [settings, setSettings] = useState<StudentSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [savingLang, setSavingLang] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.style.fontSize = settings.fontSize === 'large' ? '18px' : '';
  }, [settings]);

  const update = (patch: Partial<StudentSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLanguageChange = async (lang: 'en' | 'am') => {
    update({ language: lang });
    if (!currentUser.id) return;
    setSavingLang(true);
    try {
      await updateUserApi(currentUser.id, { language: lang } as Partial<UserProfile>);
      const updated = { ...currentUser, language: lang };
      const existing = localStorage.getItem('ethio_robotics_user');
      if (existing) localStorage.setItem('ethio_robotics_user', JSON.stringify(updated));
      onUserUpdate?.(updated);
    } catch { /* local pref still saved */ }
    finally { setSavingLang(false); }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'accessibility', label: 'Accessibility' },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Customize your dashboard experience"
        icon={Settings}
        actions={saved ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        ) : undefined}
      />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
        {tab === 'appearance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 mb-2">Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'light' as const, label: 'Light', icon: Sun },
                { id: 'dark' as const, label: 'Dark', icon: Moon },
                { id: 'system' as const, label: 'System', icon: Monitor },
              ]).map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => update({ theme: opt.id })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      settings.theme === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${settings.theme === opt.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Language
              </h3>
              <div className="flex gap-2">
                {([{ id: 'en' as const, label: 'English' }, { id: 'am' as const, label: 'አማርኛ' }]).map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    disabled={savingLang}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      settings.language === lang.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="divide-y divide-slate-100">
            <p className="text-xs text-slate-500 pb-3">
              These preferences are stored on this device only. There is no server-side notification inbox yet.
            </p>
            <Toggle checked={settings.emailNotifications} onChange={v => update({ emailNotifications: v })}
              label="Email updates" description="Prefer email reminders when the platform sends them" />
            <Toggle checked={settings.academicAlerts} onChange={v => update({ academicAlerts: v })}
              label="Academic alerts" description="Prefer alerts about grades and course updates" />
            <Toggle checked={settings.eventAlerts} onChange={v => update({ eventAlerts: v })}
              label="Event alerts" description="Prefer reminders about tournaments and events" />
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Your profile information is managed in <strong>My Account</strong>. Contact support if you need to update or delete your data.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-700">Account email</p>
              <p className="text-sm text-slate-900 mt-1">{currentUser.email}</p>
            </div>
          </div>
        )}

        {tab === 'accessibility' && (
          <div className="divide-y divide-slate-100">
            <Toggle checked={settings.reducedMotion} onChange={v => update({ reducedMotion: v })}
              label="Reduce motion" description="Minimize animations throughout the dashboard" />
            <Toggle checked={settings.highContrast} onChange={v => update({ highContrast: v })}
              label="High contrast" description="Increase contrast for better readability" />
            <div className="py-3">
              <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Text size
              </p>
              <div className="flex gap-2">
                {([{ id: 'normal' as const, label: 'Normal' }, { id: 'large' as const, label: 'Large' }]).map(size => (
                  <button
                    key={size.id}
                    onClick={() => update({ fontSize: size.id })}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      settings.fontSize === size.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
