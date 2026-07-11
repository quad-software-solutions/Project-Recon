import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, BookOpen, ShieldCheck, Check, MapPin, CheckCircle2, ChevronRight, ChevronLeft, Laptop, Cpu, Globe, UserCheck, Loader2 } from 'lucide-react';
import { fetchProgramsApi, fetchSubProgramsApi } from '../../../../learning/academics/api/academicApi';
import type { Program, SubProgram } from '@/src/shared/types';



export default function WalkInRegistration() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '', studentEmail: '', age: '', grade: '', school: '', parentName: '', parentPhone: '', parentEmail: ''
  });

  const [selectedCourses, setSelectedCourses] = useState<Record<string, 'class' | 'private' | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchProgramsApi(),
      fetchSubProgramsApi()
    ]).then(([progs, subs]) => {
      if (progs.length > 0) setPrograms(progs);
      if (subs.length > 0) setSubPrograms(subs);
    }).catch(() => {
      setProgramsError('Failed to load programs');
    }).finally(() => setProgramsLoading(false));
  }, []);

  const toggleCourse = (id: string, format: 'class' | 'private') => {
    setSelectedCourses(prev => {
      if (prev[id] === format) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: format };
    });
  };

  const courseCategories = programs.map(p => {
    const subs = subPrograms.filter(s => s.program === p.id);
    return {
      id: p.slug || p.id,
      title: p.name,
      icon: p.name.toLowerCase().includes('robot') ? Cpu : p.name.toLowerCase().includes('program') || p.name.toLowerCase().includes('python') || p.name.toLowerCase().includes('cpp') || p.name.toLowerCase().includes('web') ? Laptop : Globe,
      courses: subs.length > 0
        ? subs.map(s => ({
            id: s.slug || s.id,
            name: s.name,
            priceClass: s.fee,
            pricePrivate: s.fee * 2,
            desc: s.description || p.description || '',
          }))
        : [{ id: p.slug || p.id, name: p.name, priceClass: 3500, pricePrivate: 7000, desc: p.description || '' }],
    };
  });

  const allCourses = courseCategories.flatMap(cat => cat.courses);

  const subtotal = Object.keys(selectedCourses).reduce((sum, id) => {
    const course = allCourses.find(c => c.id === id);
    const format = selectedCourses[id];
    if (course && format) {
      return sum + (format === 'private' ? course.pricePrivate : course.priceClass);
    }
    return sum;
  }, 0);

  const registrationFee = 500; // ETB
  const grandTotal = subtotal > 0 ? subtotal + registrationFee : 0;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = () => {
    if (subtotal === 0) {
      alert("Please select at least one course.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const resetForm = () => {
    setFormData({ name: '', studentEmail: '', age: '', grade: '', school: '', parentName: '', parentPhone: '', parentEmail: '' });
    setSelectedCourses({});
    setStep(1);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-brand-border-light">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 mb-2">Walk-In Registered!</h2>
          <p className="text-slate-600 font-sans mb-8">
            {formData.name} has been successfully registered. The total amount of <strong className="font-bold text-slate-900">{grandTotal.toLocaleString()} ETB</strong> should be collected at the desk.
          </p>
          <button onClick={resetForm} className="bg-[#2563EB] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#004ac6] transition-colors w-full flex items-center justify-center gap-2">
            <UserCheck className="w-4 h-4" /> Register Another Student
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-transparent py-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>1</div>
            <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-[#2563EB]' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${step >= 2 ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>2</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-sm border border-brand-border-light p-8 md:p-12"
            >
              <div className="text-center mb-10">
                <h2 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">Walk-In Entry</h2>
                <p className="text-slate-500 mt-2">Enter the in-person student and guardian details.</p>
              </div>

              <form onSubmit={handleNextStep} className="flex flex-col gap-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Abebe Kebede" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Student Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="student@email.com" value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Age</label>
                    <input type="text" placeholder="e.g. 15" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Grade</label>
                    <input type="text" placeholder="e.g. 10th Grade" required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Current School</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="School Name" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 my-2 border-t border-slate-100" />

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Parent / Guardian Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Guardian Name" required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" placeholder="+251 911 00 00 00" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="parent@email.com" required value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-brand-border-light rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="submit" className="bg-[#2563EB] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004ac6] transition-all active:scale-95 shadow-md shadow-[#2563EB]/20">
                    Next: Assign Courses <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Side: Categories */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
                <div>
                  <button onClick={() => setStep(1)} className="text-sm font-semibold text-slate-500 hover:text-[#2563EB] flex items-center gap-1 mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to Entry
                  </button>
                  <h2 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">Assign Programs</h2>
                  <p className="text-slate-500 mt-2">Select the curriculum for this walk-in student.</p>
                </div>

                <div className="flex flex-col gap-6">
                  {programsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
                      <span className="ml-3 font-bold text-slate-600">Loading programs...</span>
                    </div>
                  ) : programsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                      <p className="text-red-700 font-bold">{programsError}</p>
                    </div>
                  ) : courseCategories.length === 0 ? (
                    <div className="bg-white/80 rounded-2xl p-12 text-center">
                      <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-bold text-slate-600">No courses available</p>
                      <p className="text-sm text-slate-500 mt-1">Programs will appear here once they are added.</p>
                    </div>
                  ) : courseCategories.map((category) => (
                    <div key={category.id} className="bg-white rounded-3xl shadow-sm border border-brand-border-light overflow-hidden">
                      <div className="bg-slate-50 px-6 py-4 border-b border-brand-border-light flex items-center gap-3">
                        <category.icon className="w-5 h-5 text-[#2563EB]" />
                        <h3 className="font-display font-bold text-lg text-slate-900">{category.title}</h3>
                      </div>
                      <div className="p-6 flex flex-col gap-5">
                        {category.courses.map(course => {
                          const isSelectedClass = selectedCourses[course.id] === 'class';
                          const isSelectedPrivate = selectedCourses[course.id] === 'private';
                          const isSelected = isSelectedClass || isSelectedPrivate;

                          return (
                            <div key={course.id} className={`rounded-2xl p-5 border transition-all ${isSelected ? 'border-[#2563EB] bg-blue-50/30' : 'border-brand-border-light hover:border-slate-300'}`}>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 text-base">{course.name}</h4>
                                  <p className="text-sm text-slate-500 mt-1">{course.desc}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => toggleCourse(course.id, 'class')}
                                    className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border-2 transition-all ${isSelectedClass ? 'border-[#2563EB] bg-[#2563EB]/10' : 'border-slate-200 hover:border-[#2563EB]/40 bg-white'}`}
                                  >
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelectedClass ? 'text-[#2563EB]' : 'text-slate-500'}`}>Group</span>
                                    <span className={`font-display font-bold text-sm ${isSelectedClass ? 'text-[#2563EB]' : 'text-slate-900'}`}>{course.priceClass.toLocaleString()} ETB</span>
                                  </button>
                                  {(programs.length === 0 || (programs.find(p => p.slug === category.id || p.id === category.id)?.supports_individual ?? true)) && (
                                    <button
                                      onClick={() => toggleCourse(course.id, 'private')}
                                      className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border-2 transition-all ${isSelectedPrivate ? 'border-[#2563EB] bg-[#2563EB]/10' : 'border-slate-200 hover:border-[#2563EB]/40 bg-white'}`}
                                    >
                                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelectedPrivate ? 'text-[#2563EB]' : 'text-slate-500'}`}>Private</span>
                                      <span className={`font-display font-bold text-sm ${isSelectedPrivate ? 'text-[#2563EB]' : 'text-slate-900'}`}>{course.pricePrivate.toLocaleString()} ETB</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Summary & Payment */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-white rounded-3xl shadow-xl border border-brand-border-light sticky top-24 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-5">
                    <h3 className="font-display font-bold text-slate-900 text-lg">In-Person Verification</h3>
                    <p className="text-slate-400 text-sm mt-1">{formData.name || 'Student'}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex flex-col gap-3 min-h-[120px] max-h-[300px] overflow-y-auto pr-2 mb-6">
                      {Object.keys(selectedCourses).length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-full text-slate-400">
                          <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">Select courses from the left to compute the total.</p>
                        </div>
                      ) : (
                        Object.keys(selectedCourses).map(id => {
                          const course = allCourses.find(c => c.id === id)!;
                          const format = selectedCourses[id]!;
                          const price = format === 'private' ? course.pricePrivate : course.priceClass;
                          return (
                            <div key={id} className="flex justify-between items-start text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex flex-col pr-4">
                                <span className="font-bold text-slate-800 leading-tight mb-1">{course.name}</span>
                                <span className="text-[10px] font-bold tracking-wider text-[#2563EB] uppercase bg-blue-100/50 w-fit px-1.5 py-0.5 rounded">{format}</span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 whitespace-nowrap">{price.toLocaleString()} ETB</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 text-sm pt-5 border-t border-slate-200">
                      <div className="flex justify-between text-slate-500"><span className="font-medium">Subtotal</span><span className="font-mono font-bold">{subtotal.toLocaleString()} ETB</span></div>
                      <div className="flex justify-between text-slate-500"><span className="font-medium">Registration Fee</span><span className="font-mono font-bold">{registrationFee.toLocaleString()} ETB</span></div>
                      <div className="flex justify-between text-slate-900 mt-3 pt-4 border-t border-slate-200">
                        <span className="font-bold text-base">Total Due (Cash/POS)</span>
                        <span className="font-mono font-extrabold text-2xl text-[#2563EB]">{grandTotal.toLocaleString()} ETB</span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <button
                        onClick={handleSubmit}
                        disabled={subtotal === 0 || isSubmitting}
                        className="w-full bg-[#2563EB] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-4 rounded-xl font-bold text-sm shadow-md shadow-[#2563EB]/20 flex items-center justify-center gap-2 hover:bg-[#004ac6] transition-all active:scale-[0.98]"
                      >
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-slate-300 border-t-brand-red rounded-full" />
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" /> 
                            Verify & Register Walk-In
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
