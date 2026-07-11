import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, BookOpen, ShieldCheck, Check, CreditCard, Lock, MapPin, CheckCircle2, ChevronRight, ChevronLeft, Laptop, Cpu, Globe, Info, ArrowRight, Clock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerApi } from '../api/registerApi';
import { fetchProgramsApi, fetchSubProgramsApi } from '../../../learning/academics/api/academicApi';
import type { Program, SubProgram } from '@/src/shared/types';

interface SavedEnrollment {
  ref: string;
  name: string;
  studentEmail: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  courses: string;
  total: number;
  paymentMethod: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  submittedAt: string;
}

const STORAGE_KEY = 'enrollments';

function loadEnrollments(): SavedEnrollment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveEnrollment(e: SavedEnrollment) {
  const list = loadEnrollments();
  list.unshift(e);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function genRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ERR-${code}`;
}

import slide1 from '@/assets/slider/faj.jpg';
import slide2 from '@/assets/slider/photo_2026-06-15_14-40-10.jpg';
import slide3 from '@/assets/slider/photo_2026-06-15_18-51-59.jpg';
import slide4 from '@/assets/slider/photo_2026-06-15_18-52-03.jpg';
import slide5 from '@/assets/slider/photo_2026-06-15_18-52-07.jpg';
import slide6 from '@/assets/slider/photo_2026-06-15_18-52-11.jpg';
import slide7 from '@/assets/slider/photo_2026-06-15_18-52-21.jpg';
import slide8 from '@/assets/slider/photo_2026-06-15_18-52-25.jpg';

const SLIDER_IMAGES = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8];

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};



export default function StudentRegistration() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '', studentEmail: '', age: '', grade: '', school: '', parentName: '', parentPhone: '', parentEmail: ''
  });
  const [selectedCourses, setSelectedCourses] = useState<Record<string, 'class' | 'private' | null>>({});
  const [paymentMethod, setPaymentMethod] = useState<'chapa' | 'stripe'>('chapa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lastRef, setLastRef] = useState('');
  const [savedEnrollments] = useState<SavedEnrollment[]>(loadEnrollments);
  const [showHistory, setShowHistory] = useState(false);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
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
      icon: p.name.toLowerCase().includes('robot') || p.name.toLowerCase().includes('vex') ? Cpu : Laptop,
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

  const registrationFee = 500;
  const grandTotal = subtotal > 0 ? subtotal + registrationFee : 0;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (subtotal === 0) {
      setSubmitError('Please select at least one course.');
      return;
    }
    setIsSubmitting(true);
    const ref = genRef();
    try {
      await registerApi({
        ...formData,
        selectedCourses: Object.keys(selectedCourses).map(id => {
          const course = allCourses.find(c => c.id === id)!;
          const format = selectedCourses[id]!;
          return {
            name: course.name,
            format,
            price: format === 'private' ? course.pricePrivate : course.priceClass,
          };
        }),
        paymentMethod,
        total: grandTotal,
      });

      saveEnrollment({
        ref,
        name: formData.name,
        studentEmail: formData.studentEmail,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        courses: Object.keys(selectedCourses).map(id => allCourses.find(c => c.id === id)!.name).join(', '),
        total: grandTotal,
        paymentMethod,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });
      setLastRef(ref);
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration request failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-brand-paper flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={slide1} alt="" className="w-full h-full object-cover blur-[4px] scale-110" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/50 via-brand-paper/85 to-brand-red/35" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] bg-brand-blue/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-red/15 rounded-full blur-[110px] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white/95 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-[0_30px_80px_-12px_rgba(0,0,0,0.1)] text-center max-w-md border border-slate-200 relative"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue rounded-t-3xl" />
          <div className="w-16 h-16 bg-gradient-to-br from-brand-red/20 to-brand-red/5 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-brand-red/20">
            <CheckCircle2 className="w-8 h-8 text-brand-red" />
          </div>
          <h2 className="font-black text-2xl text-slate-900 uppercase tracking-tight mb-2">Registration Complete!</h2>
          <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4 inline-block mx-auto">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Reference</span>
            <span className="font-black text-lg text-brand-red tracking-widest">{lastRef}</span>
          </div>
          <p className="text-slate-600 font-medium mb-8 text-sm leading-relaxed">
            Thank you for registering <strong className="text-slate-900">{formData.name}</strong>. Your request was sent to the admissions team. They will review it and create your account — you'll receive login credentials at <strong className="text-brand-red">{formData.parentEmail}</strong> once processed.
            Your enrollment has been saved locally — you can view it in <strong>My Enrollments</strong> below.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setIsSuccess(false); setStep(1); setFormData({ name: '', studentEmail: '', age: '', grade: '', school: '', parentName: '', parentPhone: '', parentEmail: '' }); setSelectedCourses({}); }}
              className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/45 transition-all active:scale-[0.97]">
              New Registration
            </button>
            <button onClick={() => window.location.reload()}
              className="flex-1 bg-slate-100 text-slate-700 px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-slate-200 transition-all">
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-brand-paper py-12 px-6 relative overflow-hidden">

      {/* Background slider */}
      <div className="absolute inset-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentSlide}
            src={SLIDER_IMAGES[currentSlide]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-[4px] scale-110"
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </AnimatePresence>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/50 via-brand-paper/85 to-brand-red/35" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glows */}
      <div className="absolute top-[-15%] left-[-8%] w-[550px] h-[550px] bg-brand-blue/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[500px] h-[500px] bg-brand-red/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Slide dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDER_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`rounded-full transition-all duration-500 ${
              idx === currentSlide
                ? 'w-8 h-2 bg-brand-red shadow-[0_0_12px_rgba(237,28,36,0.5)]'
                : 'w-2 h-2 bg-slate-50/25 hover:bg-slate-50/50'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* My Enrollments */}
        {savedEnrollments.length > 0 && (
          <div className="mb-8">
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200 hover:border-brand-red/30 hover:text-brand-red transition-all shadow-sm">
              {showHistory ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              My Enrollments ({savedEnrollments.length})
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mt-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {savedEnrollments.map((enr, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-brand-red">{enr.ref}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${enr.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : enr.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {enr.status}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 truncate mt-1">{enr.name}</p>
                          <p className="text-xs text-slate-500 truncate">{enr.courses} &middot; {enr.total.toLocaleString()} ETB</p>
                        </div>
                        <div className="text-[10px] text-slate-400 shrink-0 ml-2 text-right">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(enr.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center gap-2">
              <div className={`flex items-center justify-center w-11 h-11 rounded-2xl font-black text-sm transition-all duration-300 ${
                step >= 1
                  ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/30 scale-110'
                  : 'bg-white text-slate-500 border-2 border-slate-200'
              }`}>1</div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Profile</span>
            </div>
            <div className={`w-20 h-0.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-brand-red' : 'bg-slate-200'}`} />
            <div className="flex flex-col items-center gap-2">
              <div className={`flex items-center justify-center w-11 h-11 rounded-2xl font-black text-sm transition-all duration-300 ${
                step >= 2
                  ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/30 scale-110'
                  : 'bg-white text-slate-500 border-2 border-slate-200'
              }`}>2</div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Courses & Payment</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 30, y: 10 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_30px_80px_-12px_rgba(0,0,0,0.1)] border border-slate-200 p-8 md:p-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />

              <div className="text-center mb-10">
                <h2 className="font-black text-3xl text-slate-900 uppercase tracking-tight">Student Profile</h2>
                <p className="text-slate-600 mt-2 font-medium">Let's start with the basic information.</p>
              </div>

              <form onSubmit={handleNextStep} className="flex flex-col gap-6 max-w-2xl mx-auto">
                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="text" placeholder="Abebe Kebede" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Student Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="email" placeholder="student@email.com" value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Age</label>
                    <input type="text" placeholder="e.g. 15" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Grade</label>
                    <input type="text" placeholder="e.g. 10th Grade" required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Current School</label>
                    <div className="relative group">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="text" placeholder="School Name" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="col-span-1 md:col-span-2 my-1 border-t border-slate-100" />

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Parent / Guardian Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="text" placeholder="Guardian Name" required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="tel" placeholder="+251 911 00 00 00" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="email" placeholder="parent@email.com" required value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 flex justify-end"
                >
                  <button type="submit" className="bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm flex items-center gap-2 shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/45 transition-all active:scale-[0.97] group">
                    Next: Select Courses <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -30, y: 10 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left: Categories */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-600 hover:text-brand-red flex items-center gap-1 mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to Profile
                  </button>
                  <h2 className="font-black text-3xl text-slate-900 uppercase tracking-tight">Select Programs</h2>
                  <p className="text-slate-600 mt-2 font-medium">Choose between group classes or private 1-on-1 tutoring.</p>
                </motion.div>

                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-6"
                >
                  {programsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
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
                    <motion.div
                      key={category.id}
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ scale: 1.003 }}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-slate-300/30 border border-slate-200 overflow-hidden transition-all hover:border-slate-300"
                    >
                      <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <category.icon className="w-5 h-5 text-brand-red" />
                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">{category.title}</h3>
                      </div>
                      <div className="p-6 flex flex-col gap-4">
                        {category.courses.map((course, ci) => {
                          const isSelectedClass = selectedCourses[course.id] === 'class';
                          const isSelectedPrivate = selectedCourses[course.id] === 'private';
                          const isSelected = isSelectedClass || isSelectedPrivate;

                          return (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ci * 0.07 }}
                              whileHover={{ scale: 1.008 }}
                              className={`rounded-xl p-5 border transition-all ${
                                isSelected
                                  ? 'border-brand-red bg-brand-red/5 shadow-lg shadow-brand-red/5'
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-1000'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 text-base">{course.name}</h4>
                                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{course.desc}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => toggleCourse(course.id, 'class')}
                                    className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border-2 transition-all ${
                                      isSelectedClass
                                        ? 'border-brand-red bg-brand-red/10 shadow-sm shadow-brand-red/20'
                                        : 'border-slate-200 hover:border-brand-red/40 bg-white'
                                    }`}
                                  >
                                    <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isSelectedClass ? 'text-brand-red' : 'text-slate-500'}`}>Group</span>
                                    <span className={`font-black text-sm ${isSelectedClass ? 'text-brand-red' : 'text-slate-700'}`}>{course.priceClass.toLocaleString()} ETB</span>
                                  </button>
                                  {(programs.length === 0 || (programs.find(p => p.slug === category.id || p.id === category.id)?.supports_individual ?? true)) && (
                                    <button
                                      onClick={() => toggleCourse(course.id, 'private')}
                                      className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border-2 transition-all ${
                                        isSelectedPrivate
                                          ? 'border-brand-red bg-brand-red/10 shadow-sm shadow-brand-red/20'
                                          : 'border-slate-200 hover:border-brand-red/40 bg-white'
                                      }`}
                                    >
                                      <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isSelectedPrivate ? 'text-brand-red' : 'text-slate-500'}`}>Private</span>
                                      <span className={`font-black text-sm ${isSelectedPrivate ? 'text-brand-red' : 'text-slate-700'}`}>{course.pricePrivate.toLocaleString()} ETB</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Right: Summary */}
              <div className="lg:col-span-5 xl:col-span-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200 sticky top-24 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-brand-red to-brand-red-dark px-6 py-5">
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Registration Summary</h3>
                    <p className="text-red-200 text-sm mt-1 font-medium">{formData.name || 'Student'}</p>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-3 min-h-[120px] max-h-[300px] overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                      {Object.keys(selectedCourses).length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 py-8">
                          <BookOpen className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm font-medium">Select courses from the left to build your schedule.</p>
                        </div>
                      ) : (
                        Object.keys(selectedCourses).map(id => {
                          const course = allCourses.find(c => c.id === id)!;
                          const format = selectedCourses[id]!;
                          const price = format === 'private' ? course.pricePrivate : course.priceClass;
                          return (
                            <div key={id} className="flex justify-between items-start text-sm bg-white p-3.5 rounded-xl border border-slate-100">
                              <div className="flex flex-col pr-4">
                                <span className="font-bold text-slate-900 leading-tight mb-1">{course.name}</span>
                                <span className="text-[10px] font-black tracking-wider text-brand-red uppercase bg-brand-red/10 w-fit px-1.5 py-0.5 rounded">{format}</span>
                              </div>
                              <span className="font-black text-slate-900 whitespace-nowrap">{price.toLocaleString()} ETB</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm pt-5 border-t border-slate-100">
                      <div className="flex justify-between text-slate-600"><span className="font-medium">Subtotal</span><span className="font-black">{subtotal.toLocaleString()} ETB</span></div>
                      <div className="flex justify-between text-slate-600"><span className="font-medium">Registration Fee</span><span className="font-black">{registrationFee.toLocaleString()} ETB</span></div>
                      <div className="flex justify-between text-slate-900 mt-3 pt-4 border-t border-slate-100">
                        <span className="font-black text-base">Total Due</span>
                        <span className="font-black text-2xl text-brand-red">{grandTotal.toLocaleString()} ETB</span>
                      </div>
                    </div>

                    <div className="mt-6 bg-gradient-to-br from-brand-red/10 to-brand-red/5 border border-brand-red/20 rounded-xl p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                      <p className="text-xs text-brand-red/80 leading-relaxed font-medium">
                        Your registration includes instant access to the <strong className="font-bold text-brand-red">Student Dashboard</strong> and <strong className="font-bold text-brand-red">Parent Portal</strong> for progress tracking.
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-3">Payment Method</label>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('chapa')}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition-all ${
                            paymentMethod === 'chapa' ? 'border-brand-red bg-brand-red/10 text-brand-red shadow-sm shadow-brand-red/20' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          Chapa
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('stripe')}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition-all ${
                            paymentMethod === 'stripe' ? 'border-brand-red bg-brand-red/10 text-brand-red shadow-sm shadow-brand-red/20' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          Stripe
                        </button>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={subtotal === 0 || isSubmitting}
                        className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-4 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-brand-red/45 transition-all active:scale-[0.97]"
                      >
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full" />
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            PAY {grandTotal.toLocaleString()} ETB
                          </>
                        )}
                      </button>
                      {submitError && (
                        <div className="mt-3 rounded-xl border border-brand-red/20 bg-brand-red/10 p-3 text-xs font-bold text-brand-red">
                          {submitError}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
