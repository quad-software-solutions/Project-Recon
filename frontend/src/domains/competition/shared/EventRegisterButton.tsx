import { CheckCircle2, Lock, Shield, User } from 'lucide-react';
import type { Tournament, Workshop, UserProfile } from '@/shared/types';
import { getRegistrationEligibility } from './eventRegistrationUtils';

interface EventRegisterButtonProps {
  event: Tournament | Workshop;
  currentUser?: UserProfile | null;
  isRegistered: boolean;
  onRegister: () => void;
  onNavigateLogin?: () => void;
  className?: string;
  compact?: boolean;
}

export default function EventRegisterButton({
  event,
  currentUser,
  isRegistered,
  onRegister,
  onNavigateLogin,
  className = '',
  compact = false,
}: EventRegisterButtonProps) {
  const eligibility = getRegistrationEligibility(event, currentUser, isRegistered);

  if (isRegistered) {
    return (
      <div className={`flex-1 bg-emerald-50 text-emerald-600 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" /> Registered
      </div>
    );
  }

  if (!eligibility.canRegister) {
    if (eligibility.action === 'login') {
      return (
        <button
          onClick={onNavigateLogin}
          className={`flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-brand-red/20 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 ${className}`}
        >
          <User className="w-3.5 h-3.5" /> Sign In
        </button>
      );
    }

    return (
      <div className={`flex-1 bg-slate-100 text-slate-400 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 ${className}`}>
        <Lock className="w-3.5 h-3.5" />
        {compact ? eligibility.reason : eligibility.reason}
      </div>
    );
  }

  return (
    <button
      onClick={onRegister}
      className={`flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-brand-red/20 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 ${className}`}
    >
      <Shield className="w-3.5 h-3.5" />
      Register
      {event.paymentRequired && event.registrationFee && !compact && ` · ${event.registrationFee} Birr`}
    </button>
  );
}
