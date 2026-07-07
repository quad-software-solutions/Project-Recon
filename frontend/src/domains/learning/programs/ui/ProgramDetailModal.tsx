import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Award, Users, BookOpen } from 'lucide-react';
import { ProgramDisplay } from '@/src/shared/types';

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-premium-xl">
            <div className="relative h-48 overflow-hidden rounded-t-3xl">
              <img src={program.image} alt={program.title} className="w-full h-full object-cover" />
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-700 hover:bg-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-lg">{program.category}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-lg">{program.level}</span>
              </div>
              <h2 className="font-black text-2xl text-slate-900 mb-2">{program.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-red" />{program.duration}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-blue" />Ages {program.ageGroup}</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" />{program.skillsGained?.length || 0} Skills</span>
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
              <button onClick={() => { onEnroll(program.id); onClose(); }} className="mt-6 w-full bg-gradient-to-r from-brand-red to-brand-red-dark text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-brand-red/25 transition-all">
                Enroll Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
