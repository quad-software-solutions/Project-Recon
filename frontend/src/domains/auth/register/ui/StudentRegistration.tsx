import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, BookOpen, ShieldCheck, Lock, MapPin, CheckCircle2, ChevronRight, ChevronLeft, Laptop, Cpu, Clock, Eye, EyeOff, Loader2, Building2, Hash, FileUp, Users, RotateCcw, User as UserIcon, Smartphone, FileText, Wallet, GraduationCap, Check, Info, ArrowRight } from 'lucide-react';
import { registerApi } from '../api/registerApi';
import { fetchProgramsApi, fetchSubProgramsApi, fetchClassesApi, fetchBankAccountsApi } from '../../../learning/academics/api/academicApi';
import type { Program, SubProgram, AcademicClass } from '@/shared/types';

type PaymentMethodType = 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'CASH';

import slide1 from '@/assets/slider/faj.jpg';
import slide2 from '@/assets/slider/photo_2026-06-15_14-40-10.jpg';
import slide3 from '@/assets/slider/photo_2026-06-15_18-51-59.jpg';
import slide4 from '@/assets/slider/photo_2026-06-15_18-52-03.jpg';
import slide5 from '@/assets/slider/photo_2026-06-15_18-52-07.jpg';
import slide6 from '@/assets/slider/photo_2026-06-15_18-52-11.jpg';
import slide7 from '@/assets/slider/photo_2026-06-15_18-52-21.jpg';
import slide8 from '@/assets/slider/photo_2026-06-15_18-52-25.jpg';

const SLIDER_IMAGES = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8];

const PAYMENT_ICONS: Record<PaymentMethodType, React.ReactNode> = {
  BANK_TRANSFER: <Building2 className="w-5 h-5" />,
  MOBILE_MONEY: <Smartphone className="w-5 h-5" />,
  CHEQUE: <FileText className="w-5 h-5" />,
  CASH: <Wallet className="w-5 h-5" />,
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function StudentRegistration() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '', studentEmail: '', password: '', age: '', grade: '', school: '', parentName: '', parentPhone: '', parentEmail: ''
  });
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BANK_TRANSFER');
  const [paymentDetails, setPaymentDetails] = useState({ bank_name: '', transaction_reference: '', transfer_reference: '' });
  const [paymentAttachment, setPaymentAttachment] = useState<File | null>(null);
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; bank_name: string; account_holder: string; account_number: string; branch?: string; swift_code?: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState('');
  const [enrollmentType, setEnrollmentType] = useState<'GROUP' | 'INDIVIDUAL'>('GROUP');

  const loadPrograms = () => {
    setProgramsLoading(true);
    setProgramsError('');
    Promise.all([
      fetchProgramsApi().catch(() => [] as any[]),
      fetchSubProgramsApi().catch(() => [] as any[]),
      fetchClassesApi().catch(() => [] as any[]),
      fetchBankAccountsApi().catch(() => [] as any[]),
    ]).then(([progs, subs, cls, banks]) => {
      if (progs.length > 0) setPrograms(progs);
      if (subs.length > 0) setSubPrograms(subs);
      setClasses((cls || []).filter(c => c.is_active));
      if (Array.isArray(banks) && banks.length > 0) setBankAccounts(banks);
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      setProgramsError(msg.includes('Network Error') ? 'Unable to reach the server. Please check your connection.' : msg || 'Failed to load programs');
    }).finally(() => setProgramsLoading(false));
  };

  useEffect(() => { loadPrograms(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSub = selectedClass
    ? subPrograms.find(s => s.id === selectedClass.sub_program)
    : undefined;
  const classFee = selectedSub
    ? Number(enrollmentType === 'GROUP' ? selectedSub.group_fee : (selectedSub.individual_fee ?? 0))
    : 0;
  const filteredClasses = classes.filter(c => c.class_type === enrollmentType);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!selectedClassId) {
      setSubmitError('Please select a class to enroll in.');
      return;
    }
    if (!formData.studentEmail.trim() || !formData.password.trim()) {
      setSubmitError('Student email and password are required.');
      return;
    }
    if (paymentMethod !== 'CASH' && !paymentDetails.transaction_reference.trim() && !paymentAttachment) {
      setSubmitError('Transaction reference is required for non-cash payments.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await registerApi({
        name: formData.name,
        studentEmail: formData.studentEmail.trim(),
        password: formData.password,
        age: formData.age,
        grade: formData.grade,
        school: formData.school,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail,
        enrolledClassId: selectedClassId,
        paymentMethod,
        bank_name: paymentDetails.bank_name || undefined,
        transaction_reference: paymentDetails.transaction_reference || undefined,
        transfer_reference: paymentDetails.transfer_reference || undefined,
      });
      setEnrollmentNumber(
        (result.enrollment as { enrollment_number?: string; pending_code?: string })?.enrollment_number
        || (result.enrollment as { pending_code?: string })?.pending_code
        || result.enrollment?.id?.slice(0, 8)
        || ''
      );
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={slide1} alt="" className="w-full h-full object-cover blur-sm scale-105" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/60 via-brand-paper/85 to-brand-red/25" />
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] bg-brand-blue/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-red/15 rounded-full blur-[110px] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white/95 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-[0_30px_80px_-12px_rgba(0,0,0,0.15)] text-center max-w-md border border-white/20 relative"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue rounded-t-3xl" />
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="font-black text-2xl text-slate-900 tracking-tight mb-2">Registration Complete!</h2>
          <div className="bg-slate-100 rounded-xl px-5 py-3.5 mb-5 inline-block mx-auto">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Reference</span>
            <span className="font-black text-lg text-brand-red tracking-widest">{enrollmentNumber || "Submitted"}</span>
          </div>
          <p className="text-slate-600 font-medium mb-8 text-sm leading-relaxed">
            Thank you for registering <strong className="text-slate-900">{formData.name}</strong>. Your enrollment was submitted for payment verification. Sign in with <strong className="text-brand-red">{formData.studentEmail}</strong> after verifying your email to open the Student Dashboard.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setIsSuccess(false); setStep(1); setFormData({ name: '', studentEmail: '', password: '', age: '', grade: '', school: '', parentName: '', parentPhone: '', parentEmail: '' }); setSelectedClassId(''); }}
              className="flex-1 bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg shadow-brand-red/30 hover:shadow-xl hover:shadow-brand-red/45 transition-all active:scale-[0.97]">
              New Registration
            </button>
            <button onClick={() => window.location.reload()}
              className="flex-1 bg-slate-100 text-slate-700 px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-slate-200 transition-all active:scale-[0.97]">
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper relative overflow-hidden">

      {/* ── Background ── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentSlide}
            src={SLIDER_IMAGES[currentSlide]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </AnimatePresence>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/60 via-brand-paper/85 to-brand-red/20" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Ambient glows */}
      <div className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-brand-blue/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[450px] h-[450px] bg-brand-red/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Slide dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDER_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`rounded-full transition-all duration-500 ${
              idx === currentSlide
                ? 'w-8 h-2 bg-brand-red shadow-[0_0_12px_rgba(237,28,36,0.5)]'
                : 'w-2 h-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1400px] mx-auto relative z-10 px-6 py-8 lg:py-10">

        {/* ── Stepper ── */}
        <div className="mb-10 lg:mb-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-0">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{
                        scale: step >= s ? 1 : 0.85,
                      }}
                      className={`relative flex items-center justify-center w-11 h-11 rounded-xl font-black text-sm transition-colors duration-300 ${
                        step > s
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : step === s
                          ? 'bg-gradient-to-br from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/30'
                          : 'bg-white/80 text-slate-400 border-2 border-slate-200'
                      }`}
                    >
                      {step > s ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{s}</span>
                      )}
                      {step === s && (
                        <span className="absolute -inset-1.5 rounded-xl bg-brand-red/15 animate-pulse -z-10" />
                      )}
                    </motion.div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.18em] transition-colors duration-300 ${
                      step >= s ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {s === 1 ? 'Profile' : 'Courses & Payment'}
                    </span>
                  </div>
                  {s === 1 && (
                    <div className="relative mx-8 sm:mx-12 md:mx-16">
                      <motion.div
                        initial={false}
                        animate={{ backgroundColor: step >= 2 ? 'rgb(237,28,36)' : 'rgb(226,232,240)' }}
                        className="w-20 sm:w-28 md:w-36 h-0.5 rounded-full transition-all duration-500"
                      />
                      <motion.div
                        initial={false}
                        animate={{
                          borderColor: step >= 2 ? 'rgb(237,28,36)' : 'rgb(203,213,225)',
                          rotate: step >= 2 ? 0 : 45,
                        }}
                        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 transition-all duration-500 bg-white"
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">

          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div className="lg:col-span-7 xl:col-span-8">

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08)] border border-white/40 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue" />

                  <div className="px-8 pt-8 pb-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
                      <User className="w-6 h-6 text-brand-red" />
                    </div>
                    <h2 className="font-black text-2xl text-slate-900 tracking-tight">Student Profile</h2>
                    <p className="text-slate-500 mt-1.5 text-sm font-medium">Let's start with the basic information.</p>
                  </div>

                  <form onSubmit={handleNextStep} className="px-8 pb-8">
                    <motion.div
                      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    >
                      <motion.div variants={staggerItem} className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Full Name <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="text" placeholder="Abebe Kebede" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>

                      <motion.div variants={staggerItem} className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Student Email <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="email" placeholder="student@email.com" required value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>

                      <motion.div variants={staggerItem} className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Account Password <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="password" placeholder="Min. 8 characters" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Age <span className="text-brand-red">*</span></label>
                        <input type="text" placeholder="e.g. 15" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Grade <span className="text-brand-red">*</span></label>
                        <input type="text" placeholder="e.g. 10th Grade" required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                      </motion.div>

                      <motion.div variants={staggerItem} className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Current School <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="text" placeholder="School Name" required value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>

                      <div className="md:col-span-2 my-1 border-t border-slate-100" />

                      <motion.div variants={staggerItem} className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Parent / Guardian Name <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="text" placeholder="Guardian Name" required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Phone Number <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="tel" placeholder="+251 911 00 00 00" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Email Address <span className="text-brand-red">*</span></label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                          <input type="email" placeholder="parent@email.com" required value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                        </div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-6 flex justify-end"
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex flex-col gap-6"
                >
                  {/* Back button + Header */}
                  <div>
                    <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-brand-red mb-4 transition-colors group">
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Profile
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-brand-red" />
                      </div>
                      <div>
                        <h2 className="font-black text-2xl text-slate-900 tracking-tight">Select Programs</h2>
                        <p className="text-slate-500 text-sm mt-0.5">Choose between group classes or private 1-on-1 tutoring.</p>
                      </div>
                    </div>
                  </div>

                  {/* Segmented enrollment type toggle */}
                  <div className="flex bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
                    <button
                      type="button"
                      onClick={() => { setEnrollmentType('GROUP'); setSelectedClassId(''); }}
                      className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                        enrollmentType === 'GROUP'
                          ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4" /> Group
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEnrollmentType('INDIVIDUAL'); setSelectedClassId(''); }}
                      className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                        enrollmentType === 'INDIVIDUAL'
                          ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" /> 1-on-1
                    </button>
                  </div>

                  {/* Program cards */}
                  {programsLoading ? (
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 p-12">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative w-12 h-12 mb-4">
                          <Loader2 className="w-12 h-12 text-brand-red animate-spin" />
                        </div>
                        <p className="font-bold text-slate-600">Loading programs...</p>
                      </div>
                    </div>
                  ) : programsError ? (
                    <div className="bg-white/95 backdrop-blur-sm border border-red-200 rounded-2xl p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <Info className="w-7 h-7 text-red-400" />
                      </div>
                      <p className="text-sm font-black text-red-700 mb-1">Failed to load programs</p>
                      <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">{programsError}</p>
                      <button onClick={loadPrograms} className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-red to-brand-red-dark text-white px-6 py-3 rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-brand-red/20 hover:shadow-xl transition-all active:scale-[0.97]">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    </div>
                  ) : filteredClasses.length === 0 ? (
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-lg font-bold text-slate-600">No {enrollmentType === 'GROUP' ? 'group' : 'individual'} classes available</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Open classes will appear here once they are published. Check back later or contact the admin.</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/40 overflow-hidden shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)]"
                    >
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-brand-red" />
                        <h3 className="font-black text-base text-slate-900 tracking-tight">Available Classes</h3>
                        <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{filteredClasses.length} classes</span>
                      </div>
                      <div className="p-5 flex flex-col gap-3">
                        {filteredClasses.map((cls, ci) => {
                          const sub = subPrograms.find(s => s.id === cls.sub_program);
                          const fee = Number(enrollmentType === 'GROUP' ? sub?.group_fee : (sub?.individual_fee ?? 0));
                          const selected = selectedClassId === cls.id;
                          const programName = cls.sub_program_name || sub?.name || 'Program';
                          const initials = programName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                          const colors = ['from-brand-red to-brand-red-dark', 'from-brand-blue to-blue-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-orange-600', 'from-violet-500 to-violet-700', 'from-cyan-500 to-cyan-700'];
                          const colorIdx = [...(programName)].reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
                          return (
                            <motion.button
                              key={cls.id}
                              type="button"
                              onClick={() => setSelectedClassId(cls.id)}
                              whileHover={{ scale: 1.005 }}
                              whileTap={{ scale: 0.995 }}
                              className={`text-left rounded-xl p-4 border-2 transition-all ${
                                selected
                                  ? 'border-brand-red bg-brand-red/[0.04] shadow-lg shadow-brand-red/5'
                                  : 'border-slate-100 hover:border-slate-200 bg-white shadow-sm hover:shadow-md'
                              }`}
                            >
                              <div className="flex gap-4 items-center">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{cls.name}</h4>
                                  <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                                    <GraduationCap className="w-3 h-3 shrink-0" />
                                    <span>{programName}</span>
                                    {cls.branch_name && <><span className="text-slate-300">·</span><span>{cls.branch_name}</span></>}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <p className={`font-black text-sm ${selected ? 'text-brand-red' : 'text-slate-800'}`}>
                                    {fee > 0 ? `${fee.toLocaleString()} Birr` : 'Free'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{enrollmentType === 'GROUP' ? 'Group' : 'Individual'}</p>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════════ RIGHT COLUMN — Summary & Payment ═══════════════ */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-24 flex flex-col gap-6">

              {/* Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden"
              >
                {/* Summary Header */}
                <div className="bg-gradient-to-br from-brand-red to-brand-red-dark px-6 py-5">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-black text-white text-base tracking-tight">Enrollment Summary</h3>
                  </div>
                  <p className="text-red-200/70 text-sm font-medium truncate">{formData.name || 'Student'}</p>
                </div>

                {/* Summary Body */}
                <div className="p-6">
                  {!selectedClass ? (
                    <div className="flex flex-col items-center justify-center text-center text-slate-500 py-8">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                        <GraduationCap className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 mb-1">No class selected</p>
                      <p className="text-xs text-slate-400 max-w-[180px]">Choose a program from the left to see the summary.</p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Class */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-900 text-sm leading-tight block mb-1 truncate">{selectedClass.name}</span>
                            <span className="inline-flex text-[10px] font-black tracking-wider text-brand-red uppercase bg-brand-red/10 px-2 py-0.5 rounded-md">
                              {selectedClass.class_type === 'GROUP' ? 'Group Class' : '1-on-1 Tutoring'}
                            </span>
                            {selectedSub?.name && (
                              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 shrink-0" />
                                {selectedSub.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fee Breakdown */}
                      <div className="mt-5 space-y-2.5">
                        <div className="flex justify-between items-center text-sm py-2">
                          <span className="text-slate-600 font-medium">Class Fee</span>
                          <span className="font-bold text-slate-900">{classFee.toLocaleString()} Birr</span>
                        </div>
                        <div className="border-t border-slate-100" />
                        <div className="flex justify-between items-center py-2">
                          <span className="font-bold text-base text-slate-900">Total Due</span>
                          <span className="font-black text-xl text-brand-red">{classFee.toLocaleString()} Birr</span>
                        </div>
                      </div>

                      {/* Info Note */}
                      <div className="mt-5 bg-gradient-to-br from-brand-red/[0.06] to-brand-red/[0.03] border border-brand-red/15 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                        <p className="text-xs text-brand-red/80 leading-relaxed font-medium">
                          Your registration creates a student account. After email verification, sign in to the <strong className="font-bold text-brand-red">Student Dashboard</strong> to track enrollments and progress.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Payment Card */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden"
                >
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-brand-red" />
                      </div>
                      <h3 className="font-black text-base text-slate-900 tracking-tight">Payment Method</h3>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {(['BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'CASH'] as PaymentMethodType[]).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => { setPaymentMethod(method); setPaymentDetails({ bank_name: '', transaction_reference: '', transfer_reference: '' }); setPaymentAttachment(null); }}
                          className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                            paymentMethod === method
                              ? 'border-brand-red bg-brand-red/[0.04] text-brand-red shadow-sm shadow-brand-red/10'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            paymentMethod === method ? 'bg-brand-red/10 text-brand-red' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {PAYMENT_ICONS[method]}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-center leading-tight">
                            {method === 'BANK_TRANSFER' ? 'Bank' : method === 'MOBILE_MONEY' ? 'Mobile' : method === 'CHEQUE' ? 'Cheque' : 'Cash'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Payment Details Form */}
                    {paymentMethod !== 'CASH' && (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer Details' : paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money Details' : 'Cheque Details'}</p>

                        {paymentMethod === 'BANK_TRANSFER' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Bank Name</label>
                            <div className="relative">
                              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="text" placeholder="e.g. Dashen Bank" value={paymentDetails.bank_name} onChange={e => setPaymentDetails(p => ({ ...p, bank_name: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Transaction Reference</label>
                          <div className="relative">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Transaction ID or receipt number" value={paymentDetails.transaction_reference} onChange={e => setPaymentDetails(p => ({ ...p, transaction_reference: e.target.value }))}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Receipt / Screenshot</label>
                          <label className={`flex flex-col items-center justify-center gap-2 px-4 py-6 bg-white border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            paymentAttachment ? 'border-brand-red/40 bg-brand-red/[0.02]' : 'border-slate-200 hover:border-brand-red/40 hover:bg-slate-50'
                          }`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              paymentAttachment ? 'bg-brand-red/10 text-brand-red' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <FileUp className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-slate-700">{paymentAttachment ? paymentAttachment.name : 'Upload receipt'}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{paymentAttachment ? `${(paymentAttachment.size / 1024).toFixed(1)} KB` : 'PNG, JPG or PDF'}</p>
                            </div>
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setPaymentAttachment(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Bank Accounts */}
                    {paymentMethod === 'BANK_TRANSFER' && bankAccounts.length > 0 && (
                      <div className="bg-brand-blue/[0.04] border border-brand-blue/15 rounded-xl p-4 mb-5">
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> Our Bank Accounts
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                          {(() => {
                            const seen = new Set<string>();
                            const byBank: [string, typeof bankAccounts][] = [];
                            bankAccounts.filter(a => { const k = a.account_number; if (seen.has(k)) return false; seen.add(k); return true; }).forEach(a => {
                              let g = byBank.find(([b]) => b === a.bank_name);
                              if (!g) { g = [a.bank_name, []]; byBank.push(g); }
                              g[1].push(a);
                            });
                            return byBank.map(([bank, accs]) => (
                              <div key={bank}>
                                <p className="font-bold text-slate-700 text-xs mb-1.5">{bank}</p>
                                <div className="space-y-1.5">
                                  {accs.map(acc => (
                                    <div key={acc.account_number} className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-brand-blue/10 text-xs shadow-sm">
                                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                        <span className="font-mono font-bold text-slate-800">{acc.account_number}</span>
                                        <span className="text-slate-500 text-[10px] truncate">{acc.account_holder}{acc.branch ? ` · ${acc.branch}` : ''}</span>
                                      </div>
                                      <button type="button" onClick={() => navigator.clipboard.writeText(acc.account_number)}
                                        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Copy account number">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedClassId || isSubmitting}
                      className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-brand-red/45 transition-all active:scale-[0.97] disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Submit Enrollment
                        </>
                      )}
                    </button>

                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 flex items-start gap-2.5"
                      >
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
