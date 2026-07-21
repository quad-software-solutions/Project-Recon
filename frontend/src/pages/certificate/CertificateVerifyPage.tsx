import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Shield, XCircle, Award, Share2, Printer, Clock, BadgeCheck } from 'lucide-react';
import { http, isApiError } from '@/shared/api/http';
import { fetchCertificateTemplatesApi } from '@/domains/learning/academics/api/academicApi';
import CertificateCanvas from '@/domains/user/shared/ui/components/CertificateCanvas';
import type { CertificateCanvasData } from '@/domains/user/shared/ui/components/CertificateCanvas';
import type { Certificate, StudentCertificate } from '@/domains/learning/model/types';

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
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<Certificate[]>([]);

  useEffect(() => {
    fetchCertificateTemplatesApi().then(setTemplates).catch(() => {});
  }, []);

  const handleVerify = async (value = number) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setVerifiedAt(null);
    try {
      const data = await http.get<VerifyResult>(`/academic/certificates/verify/${encodeURIComponent(trimmed)}/`);
      if (!data.valid) {
        setError('This certificate could not be verified. Please check the number and try again.');
      } else {
        setResult(data);
        setVerifiedAt(new Date().toISOString());
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 404) {
          setError('Certificate not found. Please check the number and try again.');
        } else {
          setError(err.message || 'Verification failed. Please try again.');
        }
      } else if (err instanceof TypeError || (err instanceof Error && /network|fetch|failed to fetch/i.test(err.message))) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const sharedNumber = new URLSearchParams(window.location.search).get('number');
    if (sharedNumber?.trim()) {
      setNumber(sharedNumber);
      void handleVerify(sharedNumber);
    }
  }, []);

  const verificationUrl = `${window.location.origin}/cert-verify?number=${encodeURIComponent(result?.certificate_number || number.trim())}`;
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Unable to copy the verification link. Please copy the URL from your browser.');
    }
  };

  /** Resolve the best-matching template for a verify result using the same logic as IssuedTab. */
  function resolveTemplate(v: VerifyResult): Certificate | null {
    if (!templates.length) return null;
    const byBoth = templates.find(t => t.title === v.certificate_title && t.sub_program_name === v.sub_program_name);
    if (byBoth) return byBoth;
    const byTitle = templates.find(t => t.title === v.certificate_title);
    if (byTitle) return byTitle;
    const bySp = templates.find(t => t.sub_program_name === v.sub_program_name);
    if (bySp) return bySp;
    return null;
  }

  const canvasData: CertificateCanvasData | null = result?.valid ? (() => {
    const tmpl = resolveTemplate(result);
    return {
      title: result.certificate_title || result.sub_program_name || 'Certificate',
      body_text: tmpl?.body_text || '',
      background_url: tmpl?.background_url || null,
      institute_logo_url: tmpl?.institute_logo_url || null,
      signature_url: tmpl?.signature_url || null,
      student_name: result.student_name,
      certificate_number: result.certificate_number,
      issued_at: result.issued_at,
    };
  })() : null;

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
                    className="w-full pl-11 pr-4 min-h-[48px] sm:min-h-[44px] bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all"
                  />
                </div>
                <button
                  onClick={() => handleVerify()}
                  disabled={loading || !number.trim()}
                  className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 min-h-[48px] sm:min-h-[44px] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-red/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
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
            {result && result.valid && canvasData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Verification seal banner — screen only */}
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}
                  className="no-print bg-emerald-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 mb-4 shadow-lg shadow-emerald-600/20">
                  <BadgeCheck className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-wide">Verified Authentic Certificate</span>
                </motion.div>

                {/* Certificate document */}
                <div className="print-only">
                  <CertificateCanvas
                    data={canvasData}
                    footer={
                      <div className="p-3 flex items-center justify-between bg-slate-50 border-t border-brand-border flex-wrap gap-2 print:bg-white">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500 tracking-wide">
                            Issued by <span className="font-semibold text-slate-700">{result.issued_by_name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Verified {verifiedAt ? new Date(verifiedAt).toLocaleString() : ''}
                          </span>
                          <span className="text-slate-300 text-[10px]">|</span>
                          <button onClick={handleShare}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          ><Share2 className="w-3 h-3" /> {copied ? 'Copied' : 'Share'}</button>
                          <button onClick={() => window.print()}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          ><Printer className="w-3 h-3" /> Print</button>
                          <button onClick={() => { setResult(null); setError(null); setNumber(''); setVerifiedAt(null); }}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700"
                          >Verify another</button>
                        </div>
                      </div>
                    }
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
