import React from 'react';
import { Book, Video, FileText, Code, Download, ExternalLink } from 'lucide-react';

export default function LearningResources() {
  const resources = [
    { type: 'book', title: 'VEX IQ Architecture', category: 'Manuals', format: 'PDF', icon: Book, color: 'text-blue-600', bg: 'bg-blue-50' },
    { type: 'video', title: 'C++ Basics for Arduino', category: 'Tutorials', format: 'MP4', icon: Video, color: 'text-red-500', bg: 'bg-red-50' },
    { type: 'code', title: 'Line Follower Algorithm', category: 'Algorithms', format: 'CPP', icon: Code, color: 'text-purple-600', bg: 'bg-purple-50' },
    { type: 'doc', title: 'Safety Guidelines 2024', category: 'Administration', format: 'PDF', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { type: 'book', title: 'Introduction to AI', category: 'Manuals', format: 'EPUB', icon: Book, color: 'text-blue-600', bg: 'bg-blue-50' },
    { type: 'video', title: 'Advanced Motor Controls', category: 'Tutorials', format: 'MP4', icon: Video, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-xl mb-6">Learning Resources</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((res, i) => (
          <div key={i} className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:border-[#2563EB]/30 hover:shadow-md transition-all cursor-pointer flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl ${res.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <res.icon className={`w-5 h-5 ${res.color}`} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md">
                {res.format}
              </span>
            </div>
            
            <h4 className="font-sans font-bold text-slate-900 text-sm leading-snug mb-1 group-hover:text-[#2563EB] transition-colors">{res.title}</h4>
            <p className="text-xs text-slate-500 font-medium mb-4">{res.category}</p>
            
            <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold">Access Resource</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
