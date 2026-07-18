import { FileText, ArrowLeft } from 'lucide-react';
import type { ActiveTab } from '@/shared/types';

interface Props { onNavigate: (tab: ActiveTab) => void }

export default function TermsPage({ onNavigate }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center"><FileText className="w-5 h-5 text-brand-blue" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1><p className="text-sm text-slate-500">Last updated: July 2026</p></div>
      </div>
      <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
        <p>By accessing or using the Ethio Robotics platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. These terms apply to all visitors, users, and others who access our platform.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">2. Description of Services</h2>
        <p>Ethio Robotics provides an educational platform offering robotics programs, courses, competitions, and related services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current, and complete information during registration.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">4. Payments and Refunds</h2>
        <p>Program fees are due at the time of registration. Refund policies vary by program and are communicated at the time of purchase. Late payments may result in suspension of services.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">5. User Conduct</h2>
        <p>You agree not to misuse our platform, including attempting unauthorized access, interfering with services, or engaging in any activity that violates applicable laws or regulations.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">6. Intellectual Property</h2>
        <p>All content, materials, and trademarks on this platform are the property of Ethio Robotics or its licensors. You may not reproduce, distribute, or create derivative works without explicit permission.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">7. Limitation of Liability</h2>
        <p>Ethio Robotics shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services, to the maximum extent permitted by law.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-2">8. Contact</h2>
        <p>For questions about these terms, please contact us at info@ethiorobotics.com or call 0911675401.</p></section>
      </div>
    </div>
  );
}
