import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Shield, CheckCircle2, XCircle, ExternalLink, Award, User, BookOpen, Calendar, Share2, Printer, Clock } from 'lucide-react';
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

          {/* Success */}
          {result && result.valid && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-emerald-200 rounded-3xl shadow-lg overflow-hidden"
            >
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-black text-emerald-800 text-sm uppercase tracking-wider">Valid Certificate</p>
                  <p className="text-xs text-emerald-600">This certificate has been verified as authentic</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <User className="w-3.5 h-3.5" />
                      Student
                    </div>
                    <p className="font-bold text-slate-900">{result.student_name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      Program
                    </div>
                    <p className="font-bold text-slate-900">{result.sub_program_name}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    <Award className="w-3.5 h-3.5" />
                    Certificate
                  </div>
                  <p className="font-bold text-slate-900">{result.certificate_title}</p>
                  <p className="text-xs text-slate-500 mt-1">#{result.certificate_number}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Issued At
                    </div>
                    <p className="font-bold text-slate-900">{new Date(result.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <User className="w-3.5 h-3.5" />
                      Issued By
                    </div>
                    <p className="font-bold text-slate-900">{result.issued_by_name}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Verified {verifiedAt ? new Date(verifiedAt).toLocaleString() : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/cert-verify?number=' + result.certificate_number); }}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-red flex items-center gap-1"
                  ><Share2 className="w-3 h-3" /> Share</button>
                  <button onClick={() => window.print()}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-red flex items-center gap-1"
                  ><Printer className="w-3 h-3" /> Print</button>
                  <button onClick={() => { setResult(null); setError(null); setNumber(''); setVerifiedAt(null); }}
                    className="text-xs font-black uppercase tracking-wider text-brand-red hover:text-brand-red-dark"
                  >Verify another</button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
