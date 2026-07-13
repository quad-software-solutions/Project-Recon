import React, { useState, useEffect } from 'react';
import { Book, Video, FileText, Code, Download, ExternalLink, Loader2, ShieldOff } from 'lucide-react';
import { fetchEnrollmentsApi, fetchLearningMaterialsApi } from '@/src/domains/learning/academics/api/academicApi';
import type { LearningMaterial } from '@/src/shared/types';

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  PDF: { icon: Book, color: 'text-blue-600', bg: 'bg-blue-50' },
  PPT: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  PPTX: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  DOC: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  DOCX: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  IMAGE: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
  ZIP: { icon: Code, color: 'text-amber-600', bg: 'bg-amber-50' },
  OTHER: { icon: Book, color: 'text-slate-600', bg: 'bg-slate-50' },
};

const DEFAULT_CFG = { icon: Book, color: 'text-slate-600', bg: 'bg-slate-50' };

interface Props { studentId: string }

export default function LearningResources({ studentId }: Props) {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const enr = await fetchEnrollmentsApi(studentId);
        const all: LearningMaterial[] = [];
        for (const e of enr) {
          try {
            const m = await fetchLearningMaterialsApi(e.enrolled_class);
            all.push(...m);
          } catch {}
        }
        if (!cancelled) setMaterials(all);
      } catch {
        // Permission denied — try direct materials fetch (student-scoped)
        try {
          const mats = await fetchLearningMaterialsApi();
          if (!cancelled) setMaterials(mats);
        } catch {}
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-xl mb-6">Learning Resources</h3>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Book className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No learning materials available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((res) => {
            const cfg = TYPE_ICONS[res.material_type] || DEFAULT_CFG;
            const Icon = cfg.icon;
            return (
              <div key={res.id} className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:border-blue-600/30 hover:shadow-md transition-all cursor-pointer flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md">
                    {res.material_type}
                  </span>
                </div>
                <h4 className="font-sans font-bold text-slate-900 text-sm leading-snug mb-1 group-hover:text-blue-600 transition-colors">{res.title}</h4>
                {res.description && <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">{res.description}</p>}
                <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={res.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}