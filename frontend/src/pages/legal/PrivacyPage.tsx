import { Shield, ArrowLeft } from 'lucide-react';
import type { ActiveTab } from '@/shared/types';

interface Props { onNavigate: (tab: ActiveTab) => void }

export default function PrivacyPage({ onNavigate }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center"><Shield className="w-5 h-5 text-brand-blue" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1><p className="text-sm text-slate-500">Last updated: July 2026</p></div>
      </div>
      <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h2>
        <p>We collect personal information you provide directly, such as your name, email address, phone number, and payment information when you register for programs, make purchases, or contact us. We also automatically collect certain technical information, including IP address, browser type, and usage data when you interact with our platform.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">2. How We Use Your Information</h2>
        <p>We use the information we collect to process your registrations and payments, communicate with you about programs and events, improve our educational services, send updates and marketing communications (with your consent), and comply with legal obligations.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">3. Information Sharing</h2>
        <p>We do not sell your personal information. We may share your data with trusted service providers who assist in operating our platform (payment processors, hosting services), when required by law, or to protect our rights and safety.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">4. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">5. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. You may also object to or restrict certain processing activities. To exercise these rights, please contact us at info@ethiorobotics.com.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">6. Cookies</h2>
        <p>We use essential cookies to ensure the proper functioning of our platform. Analytics and preference cookies may be used to improve your experience. You can manage cookie preferences through your browser settings.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">7. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at info@ethiorobotics.com or call 0911675401.</p></section>
      </div>
    </div>
  );
}
