import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Shield, XCircle, Award, Share2, Printer, Clock, BadgeCheck, Hash, GraduationCap, ScrollText } from 'lucide-react';
import { http } from '@/shared/api/http';
import BrandLogo from '@/shared/ui/BrandLogo';

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
    <>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; width: 100%; height: 100vh; }
          body * { visibility: hidden; height: 0; overflow: hidden; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
          .print-only, .print-only * { visibility: visible; height: auto; overflow: visible; padding: revert !important; margin: revert !important; min-height: revert !important; }
          .print-only {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
          }
          .no-print { display: none !important; }
          .print-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0; }
        }
      `}</style>
      <div className="bg-gradient-to-b from-white via-brand-paper to-white relative overflow-x-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.15] no-print"
          style={{
            backgroundImage: `
              linear-gradient(rgba(37, 51, 141, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(37, 51, 141, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Header */}
            <div className="text-center no-print">
              <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-brand-red" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Certificate Verification</h1>
              <p className="mt-1 text-sm text-slate-500">Enter a certificate number to verify its authenticity</p>
            </div>

            {/* Search */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm no-print">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Certificate Number</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
                    placeholder="e.g. CERT-2025-0001"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all"
                  />
                </div>
                <button
                  onClick={handleVerify}
                  disabled={loading || !number.trim()}
                  className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-red/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center no-print"
              >
                <XCircle className="w-10 h-10 text-red-300 mx-auto mb-2" />
                <p className="text-base font-bold text-red-700">Verification Failed</p>
                <p className="text-sm text-red-600/80 mt-1">{error}</p>
                <button onClick={() => { setResult(null); setError(null); }}
                  className="mt-3 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700"
                >Try another number</button>
              </motion.div>
            )}

            {/* Success */}
            {result && result.valid && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Verification seal banner — screen only */}
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}
                  className="no-print bg-emerald-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 mb-4 shadow-lg shadow-emerald-600/20">
                  <BadgeCheck className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-wide">Verified Authentic Certificate</span>
                </motion.div>

                {/* Certificate document — this is the only print-visible element */}
                <div className="print-only print-bg relative bg-gradient-to-b from-brand-blue-dark via-brand-blue to-brand-blue-dark rounded-2xl overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] print:rounded-none print:shadow-none">
                  <div className="relative px-6 sm:px-8 pb-6 pt-5 flex flex-col items-center gap-2.5 print:px-4 print:pb-4 print:pt-3 print:gap-2">
                    {/* Corner ornaments */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-l-[1.5px] border-t-[1.5px] border-white/25 rounded-tl-lg" />
                    <div className="absolute top-3 right-3 w-8 h-8 border-r-[1.5px] border-t-[1.5px] border-white/25 rounded-tr-lg" />
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-l-[1.5px] border-b-[1.5px] border-white/25 rounded-bl-lg" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-r-[1.5px] border-b-[1.5px] border-white/25 rounded-br-lg" />

                    {/* Gold seal */}
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/30 ring-2 ring-white/20">
                      <Award className="w-6 h-6 text-white" />
                    </div>

                    {/* Brand logo */}
                    <div className="w-24 h-auto">
                      <BrandLogo className="w-full h-auto" />
                    </div>

                    {/* Certificate label */}
                    <div className="flex items-center gap-2">
                      <div className="h-px w-6 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                      <span className="text-[7px] text-white/80 uppercase tracking-[0.35em] font-bold">Certificate of Completion</span>
                      <div className="h-px w-6 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    </div>

                    {/* Decorative divider */}
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                      <ScrollText className="w-3 h-3 text-amber-400" />
                      <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                    </div>

                    <p className="text-white/70 text-[10px] tracking-wide">This certifies that</p>
                    <p className="font-black text-2xl text-white tracking-tight font-serif">{result.student_name}</p>
                    <p className="text-white/70 text-[10px] tracking-wide">has successfully completed</p>

                    {/* Program badge */}
                    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/20">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {result.sub_program_name}
                    </div>

                    {/* Certificate title */}
                    <p className="text-amber-300 text-[10px] font-bold uppercase tracking-widest">{result.certificate_title}</p>

                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-white/50">
                      <div className="flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" />
                        <span className="font-mono text-[8px]">{result.certificate_number}</span>
                      </div>
                      <span className="text-white/30 text-[8px]">|</span>
                      <span className="font-mono text-[8px]">{new Date(result.issued_at).toLocaleDateString()}</span>
                    </div>

                    {/* Issued by */}
                    <div className="flex items-center gap-1.5 text-white/50 text-[9px]">
                      <Shield className="w-3 h-3" />
                      <span>Issued by {result.issued_by_name}</span>
                    </div>
                  </div>

                  {/* Bottom accent bar */}
                  <div className="h-1 bg-gradient-to-r from-amber-400/60 via-amber-300 to-amber-400/60" />

                  {/* Footer bar — screen only */}
                  <div className="no-print bg-slate-900/80 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                      <Clock className="w-3 h-3" />
                      <span>Verified {verifiedAt ? new Date(verifiedAt).toLocaleString() : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/cert-verify?number=' + result.certificate_number); }}
                        className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      ><Share2 className="w-3 h-3" /> Share</button>
                      <button onClick={() => window.print()}
                        className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      ><Printer className="w-3 h-3" /> Print</button>
                      <button onClick={() => { setResult(null); setError(null); setNumber(''); setVerifiedAt(null); }}
                        className="text-[10px] font-black uppercase tracking-wider text-amber-300 hover:text-amber-200"
                      >Verify another</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
