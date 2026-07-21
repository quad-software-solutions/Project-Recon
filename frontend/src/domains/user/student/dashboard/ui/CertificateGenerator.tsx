import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Download, Loader2, ExternalLink } from 'lucide-react';
import { fetchStudentCertificatesApi, fetchCertificateTemplatesApi, downloadCertificateReportPdf } from '@/domains/learning/academics/api/academicApi';
import type { StudentCertificate, Certificate } from '@/domains/learning/model/types';
import CertificateCanvas, { issuedToCanvasData, resolveCertificateTemplate } from '@/domains/user/shared/ui/components/CertificateCanvas';

interface Props { studentId?: string | null }

export default function CertificateGenerator({ studentId }: Props) {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<string | null>(null);
  const selected = certificates.find(c => c.id === selectedCert);

  useEffect(() => {
    Promise.all([
      fetchStudentCertificatesApi(studentId ?? undefined).catch(() => [] as StudentCertificate[]),
      fetchCertificateTemplatesApi().catch(() => [] as Certificate[]),
    ]).then(([certs, tmpls]) => {
      setCertificates(certs);
      setTemplates(tmpls);
    }).finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-display font-bold text-xl text-slate-900">My Certificates</h3>
        <p className="text-xs text-slate-500 mt-1">View and download certificates issued to you</p>
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
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600 mb-1">Certificate</p>
                <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">{cert.certificate_title || cert.sub_program_name || 'Certificate'}</h4>
                <p className="text-[10px] text-slate-400 font-mono">{cert.issued_at?.slice(0, 10)}</p>
              </motion.div>
            ))}
          </div>

          {selected && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CertificateCanvas
                data={issuedToCanvasData(selected, resolveCertificateTemplate(selected, templates))}
                footer={
                  <div className="p-4 flex items-center justify-between bg-slate-50 border-t border-brand-border-light">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                      <Download className="w-3 h-3" /> Issued certificate
                    </div>
                    <div className="flex gap-1.5">
                      <a href={`/cert-verify?number=${encodeURIComponent(selected.certificate_number)}`}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <ExternalLink className="w-2.5 h-2.5" /> Verify Online
                      </a>
                      <button onClick={() => studentId && downloadCertificateReportPdf(studentId).catch(() => {})}
                        className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="w-2.5 h-2.5" /> Download Report
                      </button>
                    </div>
                  </div>
                }
              />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
