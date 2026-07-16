import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, BookOpen, ShieldCheck, Lock, MapPin, CheckCircle2, ChevronRight, ChevronLeft, Laptop, Cpu, Clock, Eye, EyeOff, Loader2, Building2, Hash, FileUp, Users, User as UserIcon } from 'lucide-react';
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

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
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

  useEffect(() => {
    Promise.all([
      fetchProgramsApi(),
      fetchSubProgramsApi(),
      fetchClassesApi(),
      fetchBankAccountsApi().catch(() => [] as any[]),
    ]).then(([progs, subs, cls, banks]) => {
      if (progs.length > 0) setPrograms(progs);
      if (subs.length > 0) setSubPrograms(subs);
      setClasses((cls || []).filter(c => c.is_active));
      if (Array.isArray(banks) && banks.length > 0) setBankAccounts(banks);
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
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Full Name <span className="text-brand-red">*</span></label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="text" placeholder="Abebe Kebede" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Student Email <span className="text-brand-red">*</span></label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="email" placeholder="student@email.com" required value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Account Password <span className="text-brand-red">*</span></label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="password" placeholder="Min. 8 characters" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Age <span className="text-brand-red">*</span></label>
                    <input type="text" placeholder="e.g. 15" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Grade <span className="text-brand-red">*</span></label>
                    <input type="text" placeholder="e.g. 10th Grade" required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Current School <span className="text-brand-red">*</span></label>
                    <div className="relative group">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="text" placeholder="School Name" required value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="col-span-1 md:col-span-2 my-1 border-t border-slate-100" />

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Parent / Guardian Name <span className="text-brand-red">*</span></label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="text" placeholder="Guardian Name" required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Phone Number <span className="text-brand-red">*</span></label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-red transition-colors" />
                      <input type="tel" placeholder="+251 911 00 00 00" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all" />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Email Address <span className="text-brand-red">*</span></label>
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

                {/* Group / Individual toggle */}
                <div className="flex gap-2 bg-white/90 border border-slate-200 rounded-xl p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => { setEnrollmentType('GROUP'); setSelectedClassId(''); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
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
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
                      enrollmentType === 'INDIVIDUAL'
                        ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" /> 1-on-1
                  </button>
                </div>

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
                  ) : filteredClasses.length === 0 ? (
                    <div className="bg-white/80 rounded-2xl p-12 text-center">
                      <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-bold text-slate-600">No {enrollmentType === 'GROUP' ? 'group' : 'individual'} classes available</p>
                      <p className="text-sm text-slate-500 mt-1">Open classes will appear here once they are published.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-slate-300/30 border border-slate-200 overflow-hidden"
                    >
                      <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-brand-red" />
                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">Select a class</h3>
                      </div>
                      <div className="p-6 flex flex-col gap-3">
                        {filteredClasses.map((cls, ci) => {
                          const sub = subPrograms.find(s => s.id === cls.sub_program);
                          const fee = Number(enrollmentType === 'GROUP' ? sub?.group_fee : (sub?.individual_fee ?? 0));
                          const selected = selectedClassId === cls.id;
                          const programName = cls.sub_program_name || sub?.name || 'Program';
                          const initials = programName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                          const colors = ['from-brand-red to-brand-red-dark', 'from-brand-blue to-blue-700', 'from-emerald-500 to-emerald-700', 'from-amber-500 to-orange-600', 'from-violet-500 to-violet-700', 'from-cyan-500 to-cyan-700'];
                          const colorIdx = [...(programName)].reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => setSelectedClassId(cls.id)}
                              className={`text-left rounded-xl p-4 border transition-all ${
                                selected
                                  ? 'border-brand-red bg-brand-red/5 shadow-lg shadow-brand-red/5'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex gap-4 items-center">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{cls.name}</h4>
                                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    {programName}
                                    {cls.branch_name ? ` · ${cls.branch_name}` : ''}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <p className={`font-black text-xs ${selected ? 'text-brand-red' : 'text-slate-700'}`}>
                                    {fee > 0 ? `${fee.toLocaleString()} Birr` : 'Fee'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
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
                      {!selectedClass ? (
                        <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 py-8">
                          <BookOpen className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm font-medium">Select a class from the left to continue.</p>
                        </div>
                      ) : (
                        <div key={selectedClass.id} className="flex justify-between items-start text-sm bg-white p-3.5 rounded-xl border border-slate-100">
                          <div className="flex flex-col pr-4">
                            <span className="font-bold text-slate-900 leading-tight mb-1">{selectedClass.name}</span>
                            <span className="text-[10px] font-black tracking-wider text-brand-red uppercase bg-brand-red/10 w-fit px-1.5 py-0.5 rounded">
                              {selectedClass.class_type || 'Class'}
                            </span>
                          </div>
                          <span className="font-black text-slate-900 whitespace-nowrap">{classFee.toLocaleString()} Birr</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm pt-5 border-t border-slate-100">
                      <div className="flex justify-between text-slate-600"><span className="font-medium">Class fee</span><span className="font-black">{classFee.toLocaleString()} Birr</span></div>
                      <div className="flex justify-between text-slate-900 mt-3 pt-4 border-t border-slate-100">
                        <span className="font-black text-base">Total Due</span>
                        <span className="font-black text-2xl text-brand-red">{classFee.toLocaleString()} Birr</span>
                      </div>
                    </div>

                    <div className="mt-6 bg-gradient-to-br from-brand-red/10 to-brand-red/5 border border-brand-red/20 rounded-xl p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                      <p className="text-xs text-brand-red/80 leading-relaxed font-medium">
                        Your registration creates a student account. After email verification, you can sign in to the <strong className="font-bold text-brand-red">Student Dashboard</strong> to track enrollments and progress.
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-3">Payment Method</label>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {(['BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'CASH'] as PaymentMethodType[]).map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => { setPaymentMethod(method); setPaymentDetails({ bank_name: '', transaction_reference: '', transfer_reference: '' }); setPaymentAttachment(null); }}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition-all ${
                              paymentMethod === method ? 'border-brand-red bg-brand-red/10 text-brand-red shadow-sm shadow-brand-red/20' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {method === 'BANK_TRANSFER' ? 'Bank Transfer' : method === 'MOBILE_MONEY' ? 'Mobile Money' : method === 'CHEQUE' ? 'Cheque' : 'Cash'}
                          </button>
                        ))}
                      </div>

                      {paymentMethod !== 'CASH' && (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Payment Details</p>

                          {paymentMethod === 'BANK_TRANSFER' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Bank Name</label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input type="text" placeholder="e.g. Dashen Bank" value={paymentDetails.bank_name} onChange={e => setPaymentDetails(p => ({ ...p, bank_name: e.target.value }))}
                                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Transaction Reference</label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input type="text" placeholder="Transaction ID or receipt number" value={paymentDetails.transaction_reference} onChange={e => setPaymentDetails(p => ({ ...p, transaction_reference: e.target.value }))}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Attachment (receipt/screenshot)</label>
                            <label className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-brand-red/50 transition-colors">
                              <FileUp className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600 flex-1">{paymentAttachment ? paymentAttachment.name : 'Upload file...'}</span>
                              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setPaymentAttachment(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'BANK_TRANSFER' && bankAccounts.length > 0 && (
                        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4 mb-4">
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" /> Our Bank Accounts
                          </p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
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
                                  <p className="font-semibold text-slate-800 text-xs mb-1">{bank}</p>
                                  <div className="space-y-1">
                                    {accs.map(acc => (
                                      <div key={acc.account_number} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-brand-blue/10 text-xs">
                                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                          <span className="font-mono font-bold text-slate-800">{acc.account_number}</span>
                                          <span className="text-slate-500 text-[10px] truncate">{acc.account_holder}{acc.branch ? ` • ${acc.branch}` : ''}</span>
                                        </div>
                                        <button type="button" onClick={() => navigator.clipboard.writeText(acc.account_number)}
                                          className="shrink-0 p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Copy account number">
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

                      <button
                        onClick={handleSubmit}
                        disabled={!selectedClassId || isSubmitting}
                        className="w-full bg-gradient-to-r from-brand-red to-brand-red-dark disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-4 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-brand-red/45 transition-all active:scale-[0.97]"
                      >
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full" />
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Submit enrollment
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
