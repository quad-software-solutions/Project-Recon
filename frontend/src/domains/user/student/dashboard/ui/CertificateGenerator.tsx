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
              <div className="relative bg-gradient-to-b from-brand-blue-dark via-brand-blue to-brand-blue-dark">
                {/* Decorative border frame */}
                <div className="absolute inset-[14px] border-[1px] border-white/10 rounded-xl pointer-events-none" />

                {/* Corner ornaments */}
                <div className="absolute top-4 left-4 w-10 h-10 border-l-[1.5px] border-t-[1.5px] border-white/15 rounded-tl-xl" />
                <div className="absolute top-4 right-4 w-10 h-10 border-r-[1.5px] border-t-[1.5px] border-white/15 rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-l-[1.5px] border-b-[1.5px] border-white/15 rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-r-[1.5px] border-b-[1.5px] border-white/15 rounded-br-xl" />

                <div className="px-10 py-8 flex flex-col items-center">
                  {/* Brand logo */}
                  <div className="w-28 h-auto mb-4">
                    <BrandLogo className="w-full h-auto" />
                  </div>

                  {/* Decorative header divider */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mb-5" />

                  {/* Gold seal */}
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/20 ring-[1.5px] ring-white/15 mb-3">
                    <Award className="w-[18px] h-[18px] text-white" />
                  </div>

                  <p className="text-white/50 text-[10px] tracking-widest uppercase mb-2">This certifies that</p>

                  {/* Recipient name — focal point */}
                  <p className="font-black text-2xl text-white tracking-tight text-center leading-tight px-4">
                    {selected.student_name}
                  </p>

                  <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mt-3 mb-3" />

                  <p className="text-white/50 text-[10px] tracking-widest uppercase mb-4">has successfully completed</p>

                  {/* Program badge */}
                  <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 px-4 py-1 mb-1">
                    <span className="text-sm font-bold text-white">{selected.certificate_title || selected.sub_program_name}</span>
                  </div>

                  {/* Details */}
                  <div className="w-full mt-5 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div className="text-left">
                        <p className="text-[7px] text-white/35 uppercase tracking-[0.2em] font-bold">Certificate ID</p>
                        <p className="font-mono text-[9px] text-white/70 mt-0.5 tracking-wider">{selected.certificate_number}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[7px] text-white/35 uppercase tracking-[0.2em] font-bold">Completion Date</p>
                        <p className="font-mono text-[9px] text-white/70 mt-0.5">{selected.issued_at?.slice(0, 10) || ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent glow */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
              </div>

              <div className="p-4 flex items-center justify-between bg-slate-50 border-t border-brand-border-light">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified & Authentic
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => downloadCertificateReportPdf(studentId || '').catch(() => {})}
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