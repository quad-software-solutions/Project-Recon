import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Download, Shield, CheckCircle2, Trophy, Star, Loader2, ExternalLink } from 'lucide-react';
import { fetchStudentCertificatesApi, downloadCertificateReportPdf } from '@/domains/learning/academics/api/academicApi';
import type { StudentCertificate } from '@/shared/types';
import BrandLogo from '@/shared/ui/BrandLogo';

interface Props { studentId?: string | null }

export default function CertificateGenerator({ studentId }: Props) {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<string | null>(null);
  const selected = certificates.find(c => c.id === selectedCert);

  useEffect(() => {
    fetchStudentCertificatesApi(studentId ?? undefined).then(setCertificates).catch(() => setCertificates([])).finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display font-bold text-xl text-slate-900">My Certificates</h3>
        <p className="text-xs text-slate-500 mt-1">Download and share your verified achievements</p>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No certificates issued yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certificates.map((cert, i) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedCert(cert.id)}
                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${selectedCert === cert.id ? 'border-blue-600 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3`}>
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600 mb-1">Certificate</p>
                <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">{cert.certificate_title || cert.sub_program_name || 'Certificate'}</h4>
                <p className="text-[10px] text-slate-400 font-mono">{cert.issued_at?.slice(0, 10)}</p>
              </motion.div>
            ))}
          </div>

          {selected && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-brand-border shadow-lg overflow-hidden">
              <div className="relative bg-gradient-to-b from-brand-blue-dark via-brand-blue to-brand-blue-dark text-center">
                {/* Ornamental top border */}
                <div className="flex items-center justify-center gap-1 pt-6 px-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rotate-45 bg-blue-600" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-brand-cyan" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-blue-600" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
                </div>
                <div className="px-8 pb-6 pt-4 flex flex-col items-center gap-2.5">
                  <div className="w-28 h-auto">
                    <BrandLogo className="w-full h-auto" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-brand-cyan rounded-full" />
                    <p className="font-mono text-[8px] text-brand-cyan uppercase tracking-[0.3em] font-bold">CERTIFICATE OF COMPLETION</p>
                    <div className="w-1 h-1 bg-brand-cyan rounded-full" />
                  </div>
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
                  <p className="text-slate-300 text-[11px] tracking-wider">This certifies that</p>
                  <p className="font-black text-2xl text-white tracking-tight">{selected.student_name}</p>
                  <p className="text-slate-300 text-[11px] tracking-wider">has successfully completed</p>
                  <p className="font-bold text-base text-blue-600">{selected.certificate_title || selected.sub_program_name}</p>
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent mt-1" />
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Shield className="w-2.5 h-2.5 text-brand-cyan" />
                      <p className="font-mono text-[9px]">{selected.certificate_number}</p>
                    </div>
                    <span className="text-slate-600 text-[9px]">|</span>
                    <p className="font-mono text-[9px] text-slate-400">{selected.issued_at?.slice(0, 10) || ''}</p>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-600 via-brand-cyan to-blue-600 opacity-60" />
              </div>

              <div className="p-4 flex items-center justify-between bg-slate-50 border-t border-brand-border-light">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified & Authentic
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => downloadCertificateReportPdf(studentId || '')}
                    className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-2.5 h-2.5" /> Download Report
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}