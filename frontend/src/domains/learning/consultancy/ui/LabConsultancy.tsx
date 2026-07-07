import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Building2, Mail, Phone, User, Send, CheckCircle2, Cpu, Laptop, Zap, Layers, FileText, DollarSign, Users } from 'lucide-react';
import type { ConsultancyRequest } from '@/src/shared/types';
import { getConsultancyRequests, submitConsultancyRequest } from '../../consultancy/api/consultancyApi';

const LAB_TYPES = [
  { id: 'robotics', label: 'Robotics Lab', icon: Cpu, desc: 'VEX IQ/V5 with competition field', price: 'From 200K ETB' },
  { id: 'coding', label: 'Coding Lab', icon: Laptop, desc: 'Programming workstations & curriculum', price: 'From 150K ETB' },
  { id: 'electronics', label: 'Electronics Lab', icon: Zap, desc: 'Arduino, soldering, circuit design', price: 'From 100K ETB' },
  { id: 'full-stem', label: 'Full STEM Lab', icon: Layers, desc: 'Complete robotics + coding + 3D printing', price: 'From 500K ETB' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
  'in-review': { bg: 'bg-blue-50', text: 'text-blue-600' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  completed: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export default function LabConsultancy() {
  const [selectedLab, setSelectedLab] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<ConsultancyRequest[]>([]);
  const [form, setForm] = useState({ schoolName: '', contactName: '', email: '', phone: '', budget: '', capacity: '', notes: '' });

  useEffect(() => {
    getConsultancyRequests().then(setRequests).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!form.schoolName || !form.contactName || !selectedLab) return;
    await submitConsultancyRequest(form as any);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-[11px] text-[#25338d] uppercase tracking-widest font-bold mb-1">STEM LAB CONSULTANCY</p>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight">Build Your <span className="text-[#25338d]">Innovation Lab</span></h1>
          <p className="text-slate-500 mt-2">Professional lab design, equipment sourcing, and teacher training for schools across Ethiopia.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Lab Options + Form */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Lab Types */}
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 mb-4">Select Lab Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {LAB_TYPES.map((lab, i) => (
                  <motion.button key={lab.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedLab(lab.id)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${selectedLab === lab.id ? 'border-[#25338d] bg-blue-50/30 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <lab.icon className={`w-6 h-6 mb-2 ${selectedLab === lab.id ? 'text-[#25338d]' : 'text-slate-400'}`} />
                    <p className="font-bold text-sm text-slate-900">{lab.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{lab.desc}</p>
                    <p className="text-xs font-bold text-[#25338d] mt-2">{lab.price}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-display font-bold text-base text-slate-900 mb-5">Request Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ label: 'School / Institution', key: 'schoolName', icon: Building2, ph: 'e.g. Harmony Academy' },
                  { label: 'Contact Person', key: 'contactName', icon: User, ph: 'Full name' },
                  { label: 'Email', key: 'email', icon: Mail, ph: 'email@school.edu.et' },
                  { label: 'Phone', key: 'phone', icon: Phone, ph: '+251 911 000 000' }].map(f => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f.label}</label>
                    <div className="relative"><f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#25338d]" /></div>
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget Range</label>
                  <select value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#25338d]">
                    <option value="">Select...</option><option>Under 100,000 ETB</option><option>100,000 - 200,000 ETB</option><option>200,000 - 500,000 ETB</option><option>500,000+ ETB</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Capacity</label>
                  <select value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#25338d]">
                    <option value="">Select...</option><option>10-15 students</option><option>15-20 students</option><option>20-30 students</option><option>30-40 students</option><option>40+ students</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Additional Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Describe your requirements..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#25338d]" />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={!form.schoolName || !selectedLab}
                className="mt-5 w-full bg-[#25338d] disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1a2670] transition-all active:scale-[0.98] shadow-md shadow-blue-200">
                {submitted ? <><CheckCircle2 className="w-5 h-5" />Request Submitted!</> : <><Send className="w-5 h-5" />Submit Consultancy Request</>}
              </button>
            </div>
          </div>

          {/* Right: Existing Requests */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 sticky top-24 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-[#25338d]" />Recent Requests</h3>
              </div>
              {requests.map((req, i) => {
                const sc = STATUS_COLORS[req.status];
                return (
                  <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    className="px-5 py-4 border-b border-slate-50 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-sm text-slate-900">{req.schoolName}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{req.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{req.contactName} • {req.phone}</p>
                    <p className="text-xs text-slate-400">{req.notes}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{req.budget}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{req.studentCapacity}</span>
                    </div>
                  </motion.div>
                );
              })}
              <div className="p-4 bg-blue-50/50">
                <p className="text-xs text-center text-slate-500">Average response time: <strong className="text-slate-900">2-3 business days</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
