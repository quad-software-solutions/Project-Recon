export default function HubSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-200 mb-3" />
            <div className="h-6 w-16 bg-slate-200 rounded mb-1.5" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="h-10 bg-slate-100" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
              <div className="flex gap-2">
                <div className="h-8 flex-1 bg-slate-100 rounded-xl" />
                <div className="h-8 flex-1 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
