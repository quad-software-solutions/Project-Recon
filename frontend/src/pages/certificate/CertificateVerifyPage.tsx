import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Shield, CheckCircle2, XCircle, ExternalLink, Award, User, BookOpen, Calendar, Share2, Printer, Clock, BadgeCheck, Hash, GraduationCap, ScrollText } from 'lucide-react';
import { http } from '@/shared/api/http';

interface VerifyResult {
  valid: boolean;
  certificate_number: string;
  student_name: string;
  sub_program_name: string;
  certificate_title: string;
  issued_at: string;
  issued_by_name: string;
}

interface CertificateVerifyPageProps {
  onNavigateHome?: () => void;
}

export default function CertificateVerifyPage({ onNavigateHome }: CertificateVerifyPageProps) {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  const handleVerify = async () => {
    const trimmed = number.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setVerifiedAt(null);
    try {
      const data = await http.get<VerifyResult>(`/academic/certificates/verify/${encodeURIComponent(trimmed)}/`);
      setResult(data);
      setVerifiedAt(new Date().toISOString());
    } catch (err: any) {
      const status = err?.response?.status || err?.status;
      const body = err?.response?.data || err?.data;
      const detail = body?.detail || body?.message || '';
      if (status === 404 || detail.toLowerCase().includes('not found')) {
        setError('Certificate not found. Please check the number and try again.');
      } else if (status === 0 || err.message === 'Network Error') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(detail || 'Verification failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-white via-brand-paper to-white relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37, 51, 141, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 51, 141, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
              <Award className="w-7 h-7 text-brand-red" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Certificate Verification</h1>
            <p className="mt-2 text-sm text-slate-500">Enter a certificate number to verify its authenticity</p>
          </div>

          {/* Search */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Certificate Number</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
                  placeholder="e.g. CERT-2025-0001"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all"
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || !number.trim()}
                className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-red/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center"
            >
              <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
              <p className="text-base font-bold text-red-700">Verification Failed</p>
              <p className="text-sm text-red-600/80 mt-1">{error}</p>
              <button onClick={() => { setResult(null); setError(null); }}
                className="mt-4 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700"
              >Try another number</button>
            </motion.div>
          )}

          {/* Success — professional certificate card */}
          {result && result.valid && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Verification seal banner */}
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}
                className="bg-emerald-600 text-white rounded-2xl px-5 py-3 flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20">
                <BadgeCheck className="w-6 h-6" />
                <span className="font-bold text-sm tracking-wide">Verified Authentic Certificate</span>
              </motion.div>

              {/* Certificate document */}
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] border border-slate-200">
                {/* Decorative top border */}
                <div className="h-2 bg-gradient-to-r from-brand-red via-amber-400 to-brand-red" />

                <div className="p-8 md:p-10">
                  {/* Corner ornaments */}
                  <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-slate-200 rounded-tl-xl" />
                  <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-slate-200 rounded-tr-xl" />
                  <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-slate-200 rounded-bl-xl" />
                  <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-slate-200 rounded-br-xl" />

                  {/* Main content */}
                  <div className="relative text-center space-y-6">
                    {/* Seal icon */}
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-inner">
                      <Award className="w-8 h-8 text-amber-600" />
                    </div>

                    {/* Certificate title */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Certificate of Completion</p>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight font-serif">
                        {result.certificate_title}
                      </h2>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 justify-center">
                      <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                      <ScrollText className="w-4 h-4 text-slate-300" />
                      <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    </div>

                    {/* Awarded text */}
                    <p className="text-sm text-slate-500 font-medium">This is to certify that</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 font-serif tracking-wide">
                      {result.student_name}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      has successfully completed the program
                    </p>
                    <div className="inline-flex items-center gap-2 bg-brand-red/5 text-brand-red font-bold text-base md:text-lg px-5 py-2 rounded-xl border border-brand-red/10">
                      <GraduationCap className="w-5 h-5" />
                      {result.sub_program_name}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Issued</p>
                        <p className="text-xs font-bold text-slate-800">
                          {new Date(result.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Authority</p>
                        <p className="text-xs font-bold text-slate-800">{result.issued_by_name}</p>
                      </div>
                    </div>

                    {/* Certificate number */}
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-mono font-bold px-3 py-1.5 rounded-full">
                      <Hash className="w-3 h-3" />
                      {result.certificate_number}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Verified {verifiedAt ? new Date(verifiedAt).toLocaleString() : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/cert-verify?number=' + result.certificate_number); }}
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-brand-red flex items-center gap-1 transition-colors"
                    ><Share2 className="w-3 h-3" /> Share</button>
                    <button onClick={() => window.print()}
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-brand-red flex items-center gap-1 transition-colors"
                    ><Printer className="w-3 h-3" /> Print</button>
                    <button onClick={() => { setResult(null); setError(null); setNumber(''); setVerifiedAt(null); }}
                      className="text-[10px] font-black uppercase tracking-wider text-brand-red hover:text-brand-red-dark"
                    >Verify another</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
