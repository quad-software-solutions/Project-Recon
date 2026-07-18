import { HelpCircle, ArrowLeft, Mail, Phone, MessageCircle, Youtube, Instagram } from 'lucide-react';
import type { ActiveTab } from '@/shared/types';

interface Props { onNavigate: (tab: ActiveTab) => void }

export default function HelpPage({ onNavigate }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-brand-blue" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">Help Center</h1><p className="text-sm text-slate-500">How can we help you?</p></div>
      </div>
      <div className="space-y-8 text-sm leading-relaxed text-slate-700">
        <section><h2 className="text-lg font-bold text-slate-900 mb-3">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-slate-900 mb-1">How do I enroll in a program?</h3><p className="text-slate-600">Browse our Programs section, select your desired course, and follow the registration process. You'll need to create an account if you don't already have one.</p></div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-slate-900 mb-1">What payment methods do you accept?</h3><p className="text-slate-600">We accept bank transfers, mobile money, and cash payments at our Bole office in Addis Ababa.</p></div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-slate-900 mb-1">Can I get a refund?</h3><p className="text-slate-600">Refund policies vary by program. Please contact us for specific refund information related to your enrollment.</p></div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-slate-900 mb-1">How do I reset my password?</h3><p className="text-slate-600">Use the "Forgot Password" link on the login page. A reset link will be sent to your registered email address.</p></div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-slate-900 mb-1">How can I track my order from the store?</h3><p className="text-slate-600">Log in to your account and visit the Orders section to view your order history and status updates.</p></div>
        </div></section>
        <section><h2 className="text-lg font-bold text-slate-900 mb-3">Contact Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="tel:+251911675401" className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-blue/30 hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><Phone className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="font-semibold text-slate-900 text-sm">Phone</p><p className="text-xs text-slate-500">0911 675 401</p></div>
          </a>
          <a href="mailto:info@ethiorobotics.com" className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-blue/30 hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-600" /></div>
            <div><p className="font-semibold text-slate-900 text-sm">Email</p><p className="text-xs text-slate-500">info@ethiorobotics.com</p></div>
          </a>
          <a href="https://www.instagram.com/ethiorobotics" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-blue/30 hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center"><Instagram className="w-4 h-4 text-pink-600" /></div>
            <div><p className="font-semibold text-slate-900 text-sm">Instagram</p><p className="text-xs text-slate-500">@ethiorobotics</p></div>
          </a>
          <a href="https://youtube.com/@ethio-roborobotics2722" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-blue/30 hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><Youtube className="w-4 h-4 text-red-600" /></div>
            <div><p className="font-semibold text-slate-900 text-sm">YouTube</p><p className="text-xs text-slate-500">Ethio Robotics</p></div>
          </a>
        </div></section>
        <section className="bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-6 text-center">
          <MessageCircle className="w-8 h-8 text-brand-blue mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Still need help?</h2>
          <p className="text-sm text-slate-600 mb-3">Reach out to us on social media — we typically respond within a few hours.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="https://www.instagram.com/ethiorobotics" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-blue hover:underline">Instagram</a>
            <span className="text-slate-300">·</span>
            <a href="https://www.tiktok.com/@ethiorobotics" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-blue hover:underline">TikTok</a>
          </div>
        </section>
      </div>
    </div>
  );
}
