import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, CheckCircle2, Clock, AlertTriangle, ThumbsUp, Shield, Loader2 } from 'lucide-react';
import { cmsPublicApi } from '@/src/domains/cms/public/api/cmsPublicApi';

type TicketCategory = 'academic' | 'safety' | 'facility' | 'general' | 'appreciation';

interface Ticket {
  id: number;
  parentName: string;
  category: TicketCategory;
  subject: string;
  message: string;
  date: string;
}

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  academic:     { label: 'Academic Progress',  icon: MessageCircle,  color: 'text-brand-blue',   bg: 'bg-brand-blue/10',    border: 'border-brand-blue-bright/20' },
  safety:       { label: 'Safety Concern',     icon: Shield,         color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200' },
  facility:     { label: 'Facility / Equipment', icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  general:      { label: 'General Feedback',   icon: MessageCircle,  color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  appreciation: { label: 'Appreciation',       icon: ThumbsUp,       color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export default function ParentFeedback() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('general');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const submitTicket = async () => {
    if (!formName.trim() || !formSubject.trim() || !formMessage.trim()) return;
    setSubmitting(true);
    try {
      await cmsPublicApi.submitContactRequest({
        name: formName.trim(),
        email: '',
        subject: `[${formCategory}] ${formSubject.trim()}`,
        description: formMessage.trim(),
      });
      const newTicket: Ticket = {
        id: Date.now(),
        parentName: formName.trim(),
        category: formCategory,
        subject: formSubject.trim(),
        message: formMessage.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setTickets(prev => [newTicket, ...prev]);
      setFormName(''); setFormCategory('general'); setFormSubject(''); setFormMessage('');
      setShowForm(false);
    } catch {
      // silently fail - feedback is best-effort
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-xl text-slate-900">Parent / Guardian Feedback</h3>
          <p className="text-xs text-slate-500 mt-1">
            Submit complaints, comments, or appreciation regarding your child's experience
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-brand-red text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-1.5 self-start sm:self-auto">
          <Send className="w-4 h-4" /> Submit Feedback
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Submitted', value: tickets.length, color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue-bright/20', icon: MessageCircle },
          { label: 'Awaiting Review', value: tickets.filter(t => t.category !== 'appreciation').length, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
          { label: 'Appreciation', value: tickets.filter(t => t.category === 'appreciation').length, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: ThumbsUp },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${s.border} flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="font-extrabold text-xl text-slate-900">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
              <h4 className="font-bold text-sm text-slate-900 mb-5 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-blue" /> New Feedback Submission
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Parent / Guardian Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Mrs. Tigist A."
                    className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10">
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Subject</label>
                <input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Brief summary of your feedback..."
                  className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10" />
              </div>
              <div className="mb-5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Message</label>
                <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4}
                  placeholder="Describe your concern, suggestion, or comment in detail..."
                  className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors">Cancel</button>
                <button onClick={submitTicket} disabled={submitting || !formName.trim() || !formSubject.trim() || !formMessage.trim()}
                  className="bg-brand-red text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {tickets.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-brand-border-light/60 shadow-sm">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-sm text-slate-400">No feedback submitted yet.</p>
            <p className="text-xs text-slate-400 mt-1">Use the form above to submit your first feedback.</p>
          </div>
        )}
        {tickets.map((ticket, i) => {
          const cat = CATEGORY_CONFIG[ticket.category];
          return (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900">{ticket.subject}</h4>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500">{ticket.parentName}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cat.color} ${cat.bg} ${cat.border}`}>{cat.label}</span>
                    <span className="text-[10px] text-slate-400">{ticket.date}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
