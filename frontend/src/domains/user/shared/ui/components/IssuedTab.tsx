import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Award, Eye, Download, Loader2, CheckCircle2, Users, Calendar, Shield, ExternalLink } from 'lucide-react';
import type { StudentCertificate } from '@/shared/types';
import BrandLogo from '@/shared/ui/BrandLogo';

export default function IssuedTab({ issuedCerts, loading, onRefresh }: {
  issuedCerts: StudentCertificate[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState<StudentCertificate | null>(null);

  const filtered = issuedCerts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.student_name || '').toLowerCase().includes(q)
      || (c.certificate_title || '').toLowerCase().includes(q)
      || c.certificate_number.toLowerCase().includes(q);
  });

  const uniqueStudents = new Set(issuedCerts.map(c => c.student));
  const recentCount = issuedCerts.filter(c => {
    const d = new Date(c.issued_at);
    return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Issued', value: issuedCerts.length, icon: Award, color: 'text-blue-600', bg: 'bg-blue-600/5' },
          { label: 'Students', value: uniqueStudents.size, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Last 30 Days', value: recentCount, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-1`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <p className="font-bold text-xl text-slate-900">{s.value}</p>
            <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input type="text" placeholder="Search by student, certificate, or number..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certificate</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Sub-Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Issued</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Number</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
                      <div className="w-7 h-7 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                        <div className="h-2.5 w-20 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'No certificates match your search' : 'No certificates issued yet'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setShowDetail(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/5 flex items-center justify-center">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900">{c.student_name || c.student?.slice(0, 8) || 'Student'}</span>
                        {c.issued_by_name && (
                          <p className="text-[9px] text-slate-400 leading-tight">by {c.issued_by_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-700">{c.certificate_title || 'Certificate'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{c.sub_program_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">{c.issued_at?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{c.certificate_number}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={e => { e.stopPropagation(); setShowDetail(c); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {c.pdf && (
                        <a href={c.pdf} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10" title="Download PDF">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetail(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg overflow-hidden">
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
                    <p className="font-black text-2xl text-white tracking-tight">{showDetail.student_name || 'Student'}</p>
                    <p className="text-slate-300 text-[11px] tracking-wider">has successfully completed</p>
                    <p className="font-bold text-base text-blue-600">{showDetail.certificate_title || showDetail.sub_program_name || 'Program'}</p>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent mt-1" />
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Shield className="w-2.5 h-2.5 text-brand-cyan" />
                        <p className="font-mono text-[9px]">{showDetail.certificate_number}</p>
                      </div>
                      <span className="text-slate-600 text-[9px]">|</span>
                      <p className="font-mono text-[9px] text-slate-400">{showDetail.issued_at?.slice(0, 10) || ''}</p>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-600 via-brand-cyan to-blue-600 opacity-60" />
                </div>
                {/* Info Section */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Student</span>
                      <p className="text-sm font-semibold text-slate-900 truncate">{showDetail.student_name || '—'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Sub-Program</span>
                      <p className="text-sm font-semibold text-slate-900 truncate">{showDetail.sub_program_name || '—'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Certificate Details</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Number</span>
                      <span className="text-xs font-mono font-bold text-brand-blue">{showDetail.certificate_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Title</span>
                      <span className="text-xs font-semibold text-slate-900">{showDetail.certificate_title || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Issued At</span>
                      <span className="text-xs font-semibold text-slate-900">{showDetail.issued_at?.slice(0, 10) || '—'}</span>
                    </div>
                    {showDetail.issued_by_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Issued By</span>
                        <span className="text-xs font-semibold text-slate-900">{showDetail.issued_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-slate-50 border-t border-brand-border-light">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Verified & Authentic
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowDetail(null)} className="px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg">Close</button>
                    <a href={`/cert-verify?number=${encodeURIComponent(showDetail.certificate_number)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-brand-blue border border-brand-blue/20 px-3 py-1 rounded-lg hover:bg-brand-blue/5 transition-colors">
                      <ExternalLink className="w-2.5 h-2.5" /> Verify Online
                    </a>
                    {showDetail.pdf && (
                      <a href={showDetail.pdf} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="w-2.5 h-2.5" /> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
