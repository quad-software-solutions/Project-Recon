import { Award, CheckCircle2, GraduationCap, Hash, ScrollText } from 'lucide-react';
import type { Certificate, StudentCertificate } from '@/shared/types';
import { decodeBodyWithSignatory } from '@/domains/learning/academics/api/academicApi';
import BrandLogo from '@/shared/ui/BrandLogo';
import { resolveMediaUrl } from '@/shared/utils/media';

export type CertificateCanvasData = {
  title: string;
  body_text?: string | null;
  background_url?: string | null;
  institute_logo_url?: string | null;
  signature_url?: string | null;
  student_name?: string;
  certificate_number?: string;
  issued_at?: string;
};

/** Match an issued certificate to its template using backend-supported fields only. */
export function resolveCertificateTemplate(
  issued: Partial<StudentCertificate>,
  templates: Certificate[],
): Certificate | null {
  if (!templates.length) return null;
  if (issued.certificate) {
    const byId = templates.find(t => t.id === issued.certificate);
    if (byId) return byId;
  }
  if (issued.certificate_title && issued.sub_program_name) {
    const byBoth = templates.find(
      t => t.title === issued.certificate_title && t.sub_program_name === issued.sub_program_name,
    );
    if (byBoth) return byBoth;
  }
  if (issued.certificate_title) {
    const byTitle = templates.find(t => t.title === issued.certificate_title);
    if (byTitle) return byTitle;
  }
  if (issued.sub_program) {
    const bySp = templates.find(t => t.sub_program === issued.sub_program);
    if (bySp) return bySp;
  }
  if (issued.sub_program_name) {
    const bySpName = templates.find(t => t.sub_program_name === issued.sub_program_name);
    if (bySpName) return bySpName;
  }
  return null;
}

export function issuedToCanvasData(
  issued: StudentCertificate,
  template?: Certificate | null,
): CertificateCanvasData {
  return {
    title: template?.title || issued.certificate_title || issued.sub_program_name || 'Certificate',
    body_text: template?.body_text || '',
    background_url: template?.background_url,
    institute_logo_url: template?.institute_logo_url,
    signature_url: template?.signature_url,
    student_name: issued.student_name || 'Student',
    certificate_number: issued.certificate_number,
    issued_at: issued.issued_at,
  };
}

interface Props {
  data: CertificateCanvasData;
  /** Placeholder shown in template preview when no student is set. */
  placeholderName?: string;
  footer?: React.ReactNode;
  className?: string;
}

/** Renders a certificate using the same layout for template preview and issued view. */
export default function CertificateCanvas({
  data,
  placeholderName = '[Student Name]',
  footer,
  className = '',
}: Props) {
  const decoded = decodeBodyWithSignatory(data.body_text || '');
  const bgUrl = resolveMediaUrl(data.background_url);
  const logoUrl = resolveMediaUrl(data.institute_logo_url);
  const sigUrl = resolveMediaUrl(data.signature_url);
  const hasBg = Boolean(bgUrl);
  const studentName = data.student_name || placeholderName;
  const certNumber = data.certificate_number || 'Not available';
  const issuedDate = data.issued_at?.slice(0, 10) || 'Not available';

  return (
    <div className={`bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden ${className}`}>
      <div
        className={`relative text-center ${hasBg ? '' : 'bg-gradient-to-b from-brand-blue-dark via-brand-blue to-brand-blue-dark'}`}
        style={hasBg ? {
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {hasBg && <div className="absolute inset-0 bg-black/30" />}
        <div className="relative px-8 pb-8 pt-6 flex flex-col items-center gap-3">
          <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-white/30 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-white/30 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-white/30 rounded-br-xl" />

          <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/30 ring-2 ring-white/20">
            <Award className="w-7 h-7 text-white" />
          </div>

          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-10 object-contain" />
          ) : (
            <div className="w-28 h-auto"><BrandLogo className="w-full h-auto" /></div>
          )}

          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <span className="text-[7px] text-white/80 uppercase tracking-[0.35em] font-bold">Certificate of Completion</span>
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <ScrollText className="w-3.5 h-3.5 text-amber-400" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          </div>

          <p className="text-white/70 text-[11px] tracking-wide">This certifies that</p>
          <p className="font-black text-2xl text-white tracking-tight font-serif">{studentName}</p>
          <p className="text-white/70 text-[11px] tracking-wide">has successfully completed</p>

          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/20">
            <GraduationCap className="w-4 h-4" />
            {data.title}
          </div>

          {decoded.body && (
            <p className="text-white/60 text-[10px] max-w-xs leading-relaxed whitespace-pre-wrap">{decoded.body}</p>
          )}

          <div className="w-40 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/50">
              <Hash className="w-2.5 h-2.5" />
              <span className="font-mono text-[8px]">{certNumber}</span>
            </div>
            <span className="text-white/30 text-[8px]">|</span>
            <span className="font-mono text-[8px] text-white/50">{issuedDate}</span>
          </div>

          {(sigUrl || decoded.signatory_name) && (
            <div className="flex items-end justify-center gap-8 mt-1 pt-3 border-t border-white/15 w-full max-w-xs">
              <div className="text-center">
                {sigUrl && (
                  <img src={sigUrl} alt="Signature" className="h-9 mx-auto mb-1 object-contain" />
                )}
                <div className="w-24 h-px bg-white/30 mx-auto mb-1" />
                {decoded.signatory_name && (
                  <>
                    <p className="text-white text-[10px] font-bold leading-tight">{decoded.signatory_name}</p>
                    <p className="text-amber-300 text-[7px] uppercase tracking-widest font-bold">
                      {decoded.signatory_title || 'Principal'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative h-1 bg-gradient-to-r from-amber-400/60 via-amber-300 to-amber-400/60" />
      </div>

      {footer !== undefined ? footer : (
        <div className="p-3 flex items-center justify-between bg-slate-50 border-t border-brand-border">
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Issued certificate
          </span>
        </div>
      )}
    </div>
  );
}
