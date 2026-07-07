import React from 'react';
import { UserProfile } from '@/src/shared/types';
import { Mail, Phone, MapPin, School, Calendar, GraduationCap, CheckCircle2, Award, BookOpen } from 'lucide-react';
import profileImg from '@/assets/photo_2026-06-15_14-39-27.jpg';

interface Props {
  currentUser: UserProfile;
}

export default function ProfileOverview({ currentUser }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-50 shadow-md shrink-0">
          <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex flex-col flex-1 text-center md:text-left w-full">
          <h3 className="font-display font-bold text-slate-900 text-3xl md:text-4xl uppercase tracking-tight">{currentUser.name}</h3>
          <p className="font-sans text-brand-muted text-sm mt-1">Student ID: #ST-2023-8942</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg"><School className="w-3.5 h-3.5 text-slate-400" /> Addis Ababa Science Academy</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg"><GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Grade 10</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg">Age: 16</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Student</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-6 pt-6 border-t border-slate-100 w-full max-w-xl mx-auto md:mx-0">
             <div className="flex items-center gap-2.5 text-sm text-slate-600">
               <Mail className="w-4 h-4 text-slate-400" /> student@ethiorobotics.edu
             </div>
             <div className="flex items-center gap-2.5 text-sm text-slate-600">
               <Phone className="w-4 h-4 text-slate-400" /> +251 911 234 567
             </div>
             <div className="flex items-center gap-2.5 text-sm text-slate-600">
               <MapPin className="w-4 h-4 text-slate-400" /> Bole, Addis Ababa, Ethiopia
             </div>
             <div className="flex items-center gap-2.5 text-sm text-slate-600">
               <Calendar className="w-4 h-4 text-slate-400" /> Enrolled: September 2022
             </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-brand-muted uppercase">Active Tracks</p>
            <p className="font-sans font-bold text-slate-900 text-lg leading-tight mt-0.5">{currentUser.enrolledPrograms.join(', ') || 'VEX Robotics'}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-end mb-1">
              <p className="text-xs font-mono font-bold text-brand-muted uppercase">Overall Progress</p>
              <span className="text-sm font-bold text-emerald-600">65%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-brand-muted uppercase">Completed Projects</p>
            <p className="font-sans font-bold text-slate-900 text-lg leading-tight mt-0.5">14 <span className="text-sm font-normal text-slate-500">submissions</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
