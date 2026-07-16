import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Award, Users, BookOpen } from 'lucide-react';
import { ProgramDisplay } from '@/shared/types';

interface ProgramDetailModalProps {
  program: ProgramDisplay | null;
  onClose: () => void;
  onEnroll: (programId: string) => void;
}

export default function ProgramDetailModal({ program, onClose, onEnroll }: ProgramDetailModalProps) {
  return (
    <AnimatePresence>
      {program && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="relative w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-modal bg-white shadow-premium-xl ring-1 ring-white/20">
            <div className="relative h-56 overflow-hidden">
              {program.image ? (
                <img src={program.image} alt={program.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-blue/30 via-brand-red/20 to-slate-100 flex items-center justify-center">
                  <BookOpen className="w-14 h-14 text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-700 hover:bg-white transition-colors" aria-label="Close program details"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-lg">{program.category}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-lg">{program.level}</span>
              </div>
              <h2 className="font-black text-2xl md:text-3xl text-slate-950 mb-2 tracking-tight">{program.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>
              <div className="grid grid-cols-1 gap-2 mt-5 text-sm text-slate-600 sm:grid-cols-3">
                <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><Clock className="w-4 h-4 text-brand-red" />{program.duration}</span>
                <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><Users className="w-4 h-4 text-brand-blue" />Ages {program.ageGroup}</span>
                <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><Award className="w-4 h-4 text-amber-500" />{program.skillsGained?.length || 0} Skills</span>
              </div>
              {program.syllabus && program.syllabus.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-brand-red" />Syllabus</h4>
                  <ul className="space-y-1.5">
                    {program.syllabus.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={() => { onEnroll(program.id); onClose(); }} className="mt-6 w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-brand-red/25 transition-all">
                Enroll Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
