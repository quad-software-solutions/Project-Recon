import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Copy, CheckCircle2, Users, Share2, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile } from '@/shared/types';

interface Props { currentUser: UserProfile; }

export default function ReferralProgram({ currentUser }: Props) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const code = currentUser.referralCode || 'REFER-2026';

  const copyCode = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      setSent(true);
      setInviteEmail('');
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div><h3 className="font-bold text-xl text-slate-900">Referral Program</h3><p className="text-xs text-slate-500 mt-1">Invite friends and earn rewards for every enrollment</p></div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-blue to-brand-blue-bright rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-12 -mb-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4"><Gift className="w-8 h-8 text-amber-300" /><div><p className="font-bold text-lg">Invite & Earn</p><p className="text-blue-200 text-xs">500 XP + 10% discount for each successful referral</p></div></div>
          <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-4 flex items-center justify-between mt-4">
            <div><p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Your Referral Code</p><p className="font-mono font-extrabold text-2xl tracking-wider">{code}</p></div>
            <button onClick={copyCode} className="bg-white text-brand-blue px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-blue-50 transition-colors active:scale-95">
              {copied ? <><CheckCircle2 className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 relative">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="friend@email.com"
                className="w-full bg-white/15 backdrop-blur border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-blue-200 outline-none focus:border-white/40" />
            </div>
            <button onClick={sendInvite} disabled={sending || !inviteEmail.trim()}
              className="bg-amber-400 text-slate-900 px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {sending ? 'Sending...' : sent ? 'Sent!' : 'Send Invite'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Your Referrals', value: '0', icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
          { label: 'Enrolled', value: '0', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'XP Earned', value: '0', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p><p className="font-extrabold text-xl text-slate-900">{s.value}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h4 className="font-bold text-sm text-slate-900">Referral History</h4></div>
        <div className="text-center py-12 text-slate-400">
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No referrals yet</p>
          <p className="text-xs mt-1">Share your referral code to start earning rewards!</p>
        </div>
      </div>
    </div>
  );
}
