import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import type { UserProfile } from '@/shared/types';

interface Props {
  currentUser?: UserProfile;
}

export default function ParentFeedback({ currentUser }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formName, setFormName] = useState(currentUser?.name || '');
  const [formEmail, setFormEmail] = useState(currentUser?.email || '');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const submitTicket = async () => {
    if (!formName.trim() || !formEmail.trim() || !formSubject.trim() || !formMessage.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await cmsPublicApi.submitContactRequest({
        name: formName.trim(),
        email: formEmail.trim(),
        subject: formSubject.trim(),
        description: formMessage.trim(),
      });
      setFormSubject('');
      setFormMessage('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {submitSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Submitted successfully. Our team will review it shortly.
        </div>
      )}
      {submitError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Your name"
            className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600" />
          <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Your email"
            className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600" />
        </div>
        <div className="mb-4">
          <input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Subject"
            className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600" />
        </div>
        <div className="mb-4">
          <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4}
            placeholder="Your message..."
            className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-600" />
        </div>
        <div className="flex justify-end">
          <button onClick={submitTicket} disabled={submitting || !formName.trim() || !formEmail.trim() || !formSubject.trim() || !formMessage.trim()}
            className="bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
