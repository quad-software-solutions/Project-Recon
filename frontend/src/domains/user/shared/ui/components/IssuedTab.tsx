import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Award, Eye, Download, CheckCircle2, Users, Calendar, ExternalLink,
  FileSpreadsheet, ArrowUpDown,
} from 'lucide-react';
import type { Certificate, StudentCertificate } from '@/shared/types';
import CertificateCanvas, {
  issuedToCanvasData,
  resolveCertificateTemplate,
} from './CertificateCanvas';
import { downloadCsv } from '@/shared/utils/export';
import EmptyState from '@/shared/ui/EmptyState';

type SortKey = 'issued_at' | 'student_name' | 'certificate_title';

export default function IssuedTab({ issuedCerts, templates = [], loading, onRefresh }: {
  issuedCerts: StudentCertificate[];
  templates?: Certificate[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('issued_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showDetail, setShowDetail] = useState<StudentCertificate | null>(null);
  const detailTemplate = showDetail
    ? resolveCertificateTemplate(showDetail, templates)
    : null;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = issuedCerts.filter((c) => {
      if (!q) return true;
      return (c.student_name || '').toLowerCase().includes(q)
        || (c.certificate_title || '').toLowerCase().includes(q)
        || c.certificate_number.toLowerCase().includes(q)
        || (c.sub_program_name || '').toLowerCase().includes(q);
    });
    rows = [...rows].sort((a, b) => {
      const av = String(a[sortKey] || '');
      const bv = String(b[sortKey] || '');
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [issuedCerts, searchQuery, sortKey, sortDir]);

  const uniqueStudents = new Set(issuedCerts.map(c => c.student));
  const recentCount = issuedCerts.filter(c => {
    const d = new Date(c.issued_at);
    return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }).length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'issued_at' ? 'desc' : 'asc');
    }
  };

  const handleExport = () => {
    downloadCsv(
      filtered.map((c) => ({
        Student: c.student_name || '',
        Certificate: c.certificate_title || '',
        Sub_Program: c.sub_program_name || '',
        Number: c.certificate_number,
        Issued: c.issued_at?.slice(0, 10) || '',
        Issued_By: c.issued_by_name || '',
      })),
      'issued-certificates',
    );
  };

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

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="search"
            placeholder="Search by student, certificate, or number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('student_name')} className="inline-flex items-center gap-1 hover:text-slate-800">
                    Student <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <button type="button" onClick={() => toggleSort('certificate_title')} className="inline-flex items-center gap-1 hover:text-slate-800">
                    Certificate <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Sub-Program</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  <button type="button" onClick={() => toggleSort('issued_at')} className="inline-flex items-center gap-1 hover:text-slate-800">
                    Issued <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Number</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-3">
                  {[1, 2, 3].map(i => (
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
                <tr>
                  <td colSpan={6} className="px-4 py-4">
                    <EmptyState
                      icon={Award}
                      title={searchQuery ? 'No certificates match your search' : 'No certificates issued yet'}
                      description={searchQuery ? 'Try another name, title, or certificate number.' : 'Issue a certificate from the Issue tab to see it here.'}
                      compact
                    />
                  </td>
                </tr>
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
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-right">
            Showing {filtered.length} of {issuedCerts.length}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetail(null)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <CertificateCanvas
                  data={issuedToCanvasData(showDetail, detailTemplate)}
                  footer={(
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
                  )}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
