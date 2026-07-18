import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import type { ActiveTab } from '@/shared/types';

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

interface Props { onNavigate: (tab: ActiveTab) => void }

export default function CookieConsent({ onNavigate }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-0.5">We use cookies</p>
            <p>This site uses essential cookies to function properly. By continuing, you accept our <button onClick={() => { setVisible(false); onNavigate('privacy'); }} className="text-brand-blue underline hover:no-underline">Privacy Policy</button> and <button onClick={() => { setVisible(false); onNavigate('terms'); }} className="text-brand-blue underline hover:no-underline">Terms of Service</button>.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={accept} className="bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors">Accept</button>
          <button onClick={accept} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
