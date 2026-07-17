import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Briefcase, GraduationCap, Send, Loader2, Award, BookOpen, MessageSquare,
} from 'lucide-react';
import { getWorkshops } from '@/domains/competition/api/competitionApi';
import { cmsPublicApi } from '@/domains/cms/public/api/cmsPublicApi';
import PageHeader from '../../../shared/ui/PageHeader';
import TabBar from '../../../shared/ui/TabBar';
import EmptyState from '../../../shared/ui/EmptyState';
import { GridSkeleton } from '../../../shared/ui/LoadingSkeleton';
import CertificateGenerator from '../CertificateGenerator';
import type { UserProfile, Workshop } from '@/shared/types';

interface Props {
  studentId: string;
  currentUser: UserProfile;
}

export default function CareerCenterModule({ studentId, currentUser }: Props) {
  const [tab, setTab] = useState('workshops');
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone_number || '',
    organization: '',
    topic: '',
    message: '',
  });

  useEffect(() => {
    setLoading(true);
    getWorkshops()
      .then(setWorkshops)
      .catch(() => setWorkshops([]))
      .finally(() => setLoading(false));
  }, []);

  const handleConsultancySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.topic.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await cmsPublicApi.submitContactRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: `[Career] ${form.topic.trim()}`,
        description: [form.message.trim(), form.phone && `Phone: ${form.phone}`, form.organization && `Organization: ${form.organization}`].filter(Boolean).join('\n\n'),
      });
      setSubmitSuccess(true);
      setForm(f => ({ ...f, topic: '', message: '' }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'workshops', label: 'Workshops' },
    { id: 'consultancy', label: 'Career Guidance' },
    { id: 'certificates', label: 'Certificates' },
  ];

  const LEVEL_COLORS: Record<string, string> = {
    BEGINNER: 'bg-emerald-100 text-emerald-700',
    INTERMEDIATE: 'bg-blue-100 text-blue-700',
    ADVANCED: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <PageHeader
        title="Career Management Center"
        subtitle="Workshops, career guidance, and professional certificates"
        icon={Briefcase}
      />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'workshops' && (
        loading ? <GridSkeleton count={3} /> : workshops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workshops.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-brand-border rounded-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900">{w.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Instructor: {w.instructor || 'TBA'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[w.level] || 'bg-slate-100 text-slate-600'}`}>
                        {w.level}
                      </span>
                      <span className="text-[10px] text-slate-500">{w.duration} min</span>
                      {w.price > 0 && <span className="text-[10px] font-medium text-emerald-600">{w.price} ETB</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-2xl">
            <EmptyState icon={BookOpen} title="No workshops available" description="Career workshops will appear here when scheduled." />
          </div>
        )
      )}

      {tab === 'consultancy' && (
        <div className="max-w-xl">
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Request Career Guidance</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">Submit a career guidance request for career advice, mentorship, or professional development support.</p>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0" /> Request submitted successfully. Our team will contact you soon.
              </div>
            )}

            <form onSubmit={handleConsultancySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name" required
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  type="email" placeholder="Email" required
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="Topic (e.g. Resume review, Career path)" required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe what you'd like help with..." rows={4}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none" />
              {submitError && <p className="text-xs text-red-600">{submitError}</p>}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'certificates' && <CertificateGenerator studentId={studentId} />}
    </div>
  );
}
