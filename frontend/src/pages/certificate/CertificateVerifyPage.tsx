import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Shield, XCircle, Award, Share2, Printer, Clock, BadgeCheck, Hash, GraduationCap } from 'lucide-react';
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
          @page { margin: 0; size: A4 portrait; }
          html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; page-break-inside: avoid; }
          .no-print { display: none !important; }
          .print-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
                  {/* Decorative border frame */}
                  <div className="absolute inset-[18px] border-[1px] border-white/10 rounded-xl pointer-events-none print:inset-[24px]" />

                  <div className="relative h-full flex flex-col px-12 py-10 sm:px-14 print:px-16 print:py-12">

                    {/* ── CORNER ORNAMENTS ── */}
                    <div className="absolute top-5 left-5 w-14 h-14 border-l-[1.5px] border-t-[1.5px] border-white/15 rounded-tl-2xl print:top-7 print:left-7" />
                    <div className="absolute top-5 right-5 w-14 h-14 border-r-[1.5px] border-t-[1.5px] border-white/15 rounded-tr-2xl print:top-7 print:right-7" />
                    <div className="absolute bottom-5 left-5 w-14 h-14 border-l-[1.5px] border-b-[1.5px] border-white/15 rounded-bl-2xl print:bottom-7 print:left-7" />
                    <div className="absolute bottom-5 right-5 w-14 h-14 border-r-[1.5px] border-b-[1.5px] border-white/15 rounded-br-2xl print:bottom-7 print:right-7" />

                    {/* ════════════════════════════════════════ */}
                    {/* HEADER SECTION */}
                    {/* ════════════════════════════════════════ */}
                    <div className="shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="w-28 h-auto">
                          <BrandLogo className="w-full h-auto" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block h-px w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          <div className="flex items-center gap-2">
                            <Award className="w-3 h-3 text-amber-400/70" />
                            <span className="text-[7px] text-white/60 uppercase tracking-[0.35em] font-bold">Certificate of Completion</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    </div>

                    {/* ════════════════════════════════════════ */}
                    {/* BODY SECTION — flex-1 pushes footer down */}
                    {/* ════════════════════════════════════════ */}
                    <div className="flex-1 flex flex-col justify-center pt-6 pb-6">
                      <div className="flex flex-col items-center">
                        {/* Gold seal accent */}
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/20 ring-[1.5px] ring-white/15 mb-4">
                          <Award className="w-5 h-5 text-white" />
                        </div>

                        <p className="text-white/50 text-[10px] tracking-widest uppercase mb-3">This certifies that</p>

                        {/* Recipient name — focal point */}
                        <p className="font-black text-2xl text-white tracking-tight font-serif text-center leading-tight px-4">
                          {result.student_name}
                        </p>

                        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mt-4 mb-3" />

                        <p className="text-white/50 text-[10px] tracking-widest uppercase mb-4">has successfully completed</p>

                        {/* Program badge */}
                        <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold px-5 py-1.5 rounded-full border border-white/15 mb-2">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {result.sub_program_name}
                        </div>

                        <p className="text-amber-300/80 text-[10px] font-bold uppercase tracking-[0.25em]">{result.certificate_title}</p>
                      </div>
                    </div>

                    {/* ════════════════════════════════════════ */}
                    {/* DETAILS GRID */}
                    {/* ════════════════════════════════════════ */}
                    <div className="shrink-0">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mb-5" />

                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <div>
                          <p className="text-[7px] text-white/35 uppercase tracking-[0.2em] font-bold">Certificate ID</p>
                          <p className="font-mono text-[9px] text-white/70 mt-0.5 tracking-wider flex items-center gap-1">
                            <Hash className="w-2.5 h-2.5 text-white/30 shrink-0" />
                            {result.certificate_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] text-white/35 uppercase tracking-[0.2em] font-bold">Completion Date</p>
                          <p className="font-mono text-[9px] text-white/70 mt-0.5 tracking-wider">
                            {new Date(result.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] text-white/35 uppercase tracking-[0.2em] font-bold">Course</p>
                          <p className="text-[9px] text-white/70 mt-0.5 tracking-wide">{result.sub_program_name}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-white/35 uppercase tracking-[0.2em] font-bold">Level</p>
                          <p className="text-[9px] text-white/70 mt-0.5 tracking-wide">{result.certificate_title}</p>
                        </div>
                      </div>
                    </div>

                    {/* ════════════════════════════════════════ */}
                    {/* FOOTER */}
                    {/* ════════════════════════════════════════ */}
                    <div className="shrink-0 mt-6">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-white/30" />
                          <span className="text-[8px] text-white/45 tracking-wide">Issued by <span className="text-white/70 font-semibold">{result.issued_by_name}</span></span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7px] text-white/30 uppercase tracking-[0.15em] font-bold">Verify at</span>
                          <p className="text-[8px] text-white/45 font-mono mt-0.5 tracking-wider">{window.location.origin}/verify</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Bottom accent glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

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
