import React from 'react';

export default function UpcomingEvents() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-border-light/60">
      <h3 className="font-display font-bold text-slate-900 text-lg mb-6">Upcoming Events</h3>
      
      <div className="relative border-l-2 border-brand-border-light ml-3 pl-6 flex flex-col gap-6">
        <div className="relative">
          <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#2563EB] border-[3px] border-white shadow-sm" />
          <div className="bg-[#faf8ff] p-4 rounded-xl border border-brand-border-light/50 flex flex-col gap-1.5 hover:shadow-md transition-shadow">
            <h4 className="font-sans font-bold text-slate-900 text-sm">VEX Regional Finals Prep</h4>
            <p className="text-xs text-brand-muted font-medium">(Sat 15th)</p>
            <button className="self-start mt-2 text-xs font-semibold bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#004ac6] transition-colors shadow-sm">Join</button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-red-400 border-[3px] border-white shadow-sm" />
          <div className="bg-[#faf8ff] p-4 rounded-xl border border-brand-border-light/50 flex flex-col gap-1.5 hover:shadow-md transition-shadow">
            <h4 className="font-sans font-bold text-slate-900 text-sm">Enjoy AI Webinar</h4>
            <p className="text-xs text-brand-muted font-medium">(Wed 19th)</p>
            <button className="self-start mt-2 text-xs font-semibold bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#004ac6] transition-colors shadow-sm">Join</button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-[3px] border-white shadow-sm" />
          <div className="bg-[#faf8ff] p-4 rounded-xl border border-brand-border-light/50 flex flex-col gap-1.5 hover:shadow-md transition-shadow">
            <h4 className="font-sans font-bold text-slate-900 text-sm">Global STEM Tour Orientation</h4>
            <p className="text-xs text-brand-muted font-medium">(Fri 21st)</p>
            <button className="self-start mt-2 text-xs font-semibold bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#004ac6] transition-colors shadow-sm">Join</button>
          </div>
        </div>
      </div>
    </div>
  );
}
