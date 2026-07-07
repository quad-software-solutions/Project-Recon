import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, ChevronDown, CheckCircle2, Clock, AlertTriangle, ThumbsUp, Shield } from 'lucide-react';

type TicketCategory = 'academic' | 'safety' | 'facility' | 'general' | 'appreciation';
type TicketStatus = 'open' | 'in-review' | 'resolved';

interface Ticket {
  id: number;
  parentName: string;
  category: TicketCategory;
  subject: string;
  message: string;
  date: string;
  status: TicketStatus;
  response?: string;
}

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  academic:     { label: 'Academic Progress',  icon: MessageCircle,  color: 'text-[#2563EB]',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  safety:       { label: 'Safety Concern',     icon: Shield,         color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200' },
  facility:     { label: 'Facility / Equipment', icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  general:      { label: 'General Feedback',   icon: MessageCircle,  color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  appreciation: { label: 'Appreciation',       icon: ThumbsUp,       color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  open:       { label: 'Open',      icon: Clock,          color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'in-review': { label: 'In Review', icon: Clock,          color: 'text-[#2563EB]',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  resolved:   { label: 'Resolved',  icon: CheckCircle2,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 1, parentName: 'Mrs. Tigist A.', category: 'academic',
    subject: 'Request for extra tutoring sessions',
    message: 'My son Abebe has been struggling with the PID control module. Could you arrange additional one-on-one sessions with the instructor? He is very motivated but needs more hands-on practice time.',
    date: 'Jun 14, 2026', status: 'in-review',
    response: 'Thank you for reaching out. We have scheduled two extra lab hours on Tuesdays and Thursdays for Abebe. The instructor will focus on practical PID exercises.',
  },
  {
    id: 2, parentName: 'Mr. Dawit K.', category: 'appreciation',
    subject: 'Excellent competition preparation',
    message: 'I wanted to thank the entire coaching staff for the outstanding preparation for the VEX Regionals. My daughter came home every day excited about what she learned. The mentorship she received was truly exceptional.',
    date: 'Jun 10, 2026', status: 'resolved',
  },
  {
    id: 3, parentName: 'Mrs. Hana M.', category: 'safety',
    subject: 'Protective equipment during soldering sessions',
    message: 'I noticed that some students were not wearing safety goggles during the last soldering workshop. Please ensure all protective equipment is mandatory and enforced at all times.',
    date: 'Jun 8, 2026', status: 'open',
  },
];

export default function ParentFeedback() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('general');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const submitTicket = () => {
    if (!formName.trim() || !formSubject.trim() || !formMessage.trim()) return;
    const newTicket: Ticket = {
      id: Date.now(),
      parentName: formName.trim(),
      category: formCategory,
      subject: formSubject.trim(),
      message: formMessage.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'open',
    };
    setTickets(prev => [newTicket, ...prev]);
    setFormName(''); setFormCategory('general'); setFormSubject(''); setFormMessage('');
    setShowForm(false);
  };

  const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);

  // Summary counts
  const openCount = tickets.filter(t => t.status === 'open').length;
  const reviewCount = tickets.filter(t => t.status === 'in-review').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-xl text-slate-900">Parent / Guardian Feedback</h3>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Submit complaints, comments, or appreciation regarding your child's experience
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Send className="w-4 h-4" /> Submit Feedback
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: openCount, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
          { label: 'In Review', value: reviewCount, color: 'text-[#2563EB]', bg: 'bg-blue-50', border: 'border-blue-200', icon: MessageCircle },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${s.border} flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="font-display font-extrabold text-xl text-slate-900">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Submit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm p-6">
              <h4 className="font-display font-bold text-sm text-slate-900 mb-5 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#2563EB]" /> New Feedback Submission
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Parent / Guardian Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Mrs. Tigist A."
                    className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
                </div>
                <div>
                  <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] transition-all">
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Subject</label>
                <input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Brief summary of your feedback..."
                  className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
              </div>

              <div className="mb-5">
                <label className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Message</label>
                <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4}
                  placeholder="Describe your concern, suggestion, or comment in detail..."
                  className="w-full bg-slate-50 border border-brand-border-light rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-5 py-2.5 rounded-lg transition-colors">Cancel</button>
                <button onClick={submitTicket}
                  className="bg-[#2563EB] text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
                  <Send className="w-3.5 h-3.5" /> Submit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'open', 'in-review', 'resolved'] as const).map(tab => (
          <button key={tab} onClick={() => setFilterStatus(tab)}
            className={`text-[11px] font-bold px-4 py-2 rounded-lg transition-colors capitalize ${
              filterStatus === tab ? 'bg-[#2563EB] text-slate-900' : 'bg-white text-slate-600 border border-brand-border-light hover:bg-slate-50'
            }`}>
            {tab === 'in-review' ? 'In Review' : tab}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-brand-border-light/60 shadow-sm">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="font-sans text-sm text-slate-400">No feedback tickets match this filter.</p>
          </div>
        )}
        {filtered.map((ticket, i) => {
          const cat = CATEGORY_CONFIG[ticket.category];
          const stat = STATUS_CONFIG[ticket.status];
          const isExpanded = expandedId === ticket.id;

          return (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-brand-border-light/60 shadow-sm overflow-hidden hover:shadow-md transition-all">

              {/* Ticket Header */}
              <div
                className="px-6 py-5 cursor-pointer flex items-start gap-4"
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
              >
                <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-900">{ticket.subject}</h4>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="font-sans text-xs text-slate-500">{ticket.parentName}</span>
                        <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}>
                          {cat.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{ticket.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border ${stat.bg} ${stat.color} ${stat.border}`}>
                        <stat.icon className="w-3 h-3" /> {stat.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="px-6 pb-5 pt-0 ml-14">
                      <div className="bg-slate-50 rounded-xl p-4 border border-brand-border-light/40 mb-3">
                        <p className="font-sans text-sm text-slate-700 leading-relaxed">{ticket.message}</p>
                      </div>

                      {ticket.response && (
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                          <p className="font-mono text-[9px] font-bold text-[#2563EB] uppercase tracking-wider mb-2">Institute Response</p>
                          <p className="font-sans text-sm text-slate-700 leading-relaxed">{ticket.response}</p>
                        </div>
                      )}

                      {!ticket.response && ticket.status === 'open' && (
                        <p className="font-sans text-xs text-slate-400 italic mt-2">
                          Your feedback has been received and will be reviewed by the administration shortly.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
