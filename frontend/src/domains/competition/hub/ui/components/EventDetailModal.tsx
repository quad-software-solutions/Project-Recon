import { Trophy, GraduationCap, X, Calendar, MapPin, Users, Shield, Lock, DollarSign, Swords } from 'lucide-react';
import { UserProfile, type Tournament, type Workshop } from '@/shared/types';
import EventRegisterButton from '../../../shared/EventRegisterButton';
import { REGISTRATION_MODE_LABELS } from '../../../shared/eventRegistrationUtils';
import { statusBadge } from '@/shared/utils/status';

export default function EventDetailModal({ event, onClose, currentUser, isRegistered, onRegister, onViewFull, onNavigateLogin }: {
  event: Tournament | Workshop;
  onClose: () => void;
  currentUser?: UserProfile | null;
  isRegistered: boolean;
  onRegister: () => void;
  onViewFull?: (() => void) | undefined;
  onNavigateLogin?: () => void;
}) {
  const isTournament = event.eventType === 'TOURNAMENT';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className={`p-6 ${isTournament
          ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5'
          : 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'
        } border-b border-slate-200`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isTournament ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                {isTournament
                  ? <Trophy className="w-6 h-6 text-amber-600" />
                  : <GraduationCap className="w-6 h-6 text-emerald-600" />
                }
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{event.title}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(event.storedStatus)}`}>
                  {event.storedStatus}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h4 className="font-bold text-xs text-slate-700 mb-1.5">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{event.description || 'No description provided.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-slate-400 mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-500">Date</p>
              <p className="text-xs font-bold text-slate-800">{new Date(event.startDateTime).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <MapPin className="w-4 h-4 text-slate-400 mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-500">Location</p>
              <p className="text-xs font-bold text-slate-800 truncate">{event.location}</p>
            </div>
            {isTournament && (
              <div className="bg-slate-50 rounded-xl p-3">
                <Users className="w-4 h-4 text-slate-400 mb-1" />
                <p className="text-[9px] font-black uppercase text-slate-500">Teams</p>
                <p className="text-xs font-bold text-slate-800">{(event as Tournament).enrolledCount} / {(event as Tournament).maxTeams || '∞'}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3">
              <Shield className="w-4 h-4 text-slate-400 mb-1" />
              <p className="text-[9px] font-black uppercase text-slate-500">Registration</p>
              <p className="text-xs font-bold text-slate-800">{REGISTRATION_MODE_LABELS[event.registrationMode]}</p>
            </div>
            {isTournament && (event as Tournament).isClosed && (
              <div className="bg-slate-100 rounded-xl p-3 col-span-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-600 uppercase">This tournament is closed</span>
              </div>
            )}
            {event.computedState === 'LIVE' && !(isTournament && (event as Tournament).isClosed) && (
              <div className="bg-red-50 rounded-xl p-3 col-span-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-red-700 uppercase">This event is currently live</span>
              </div>
            )}
            {event.paymentRequired && event.registrationFee && (
              <div className="bg-amber-50 rounded-xl p-3 col-span-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-700">Registration Fee: {event.registrationFee} Birr</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-2">
          {onViewFull && (
            <button onClick={onViewFull}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-brand-blue/10 hover:text-brand-blue transition-all">
              <Swords className="w-4 h-4 inline-block mr-1.5" />Full Details
            </button>
          )}
          <EventRegisterButton
            event={event}
            currentUser={currentUser}
            isRegistered={isRegistered}
            onRegister={onRegister}
            onNavigateLogin={onNavigateLogin}
            className="!py-3 !text-xs"
          />
        </div>
      </div>
    </div>
  );
}
