export function ResourcesSkeleton() {
  return (
    <div className="px-8 py-7 pb-12 max-w-[1100px] mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="w-48 h-8 bg-surface border border-border rounded-lg mb-2"></div>
          <div className="w-64 h-4 bg-surface border border-border rounded-lg"></div>
        </div>
        <div className="w-32 h-10 bg-surface border border-border rounded-xl"></div>
      </div>
      <div className="mb-6 flex gap-3">
        <div className="w-full h-10 bg-surface border border-border rounded-xl flex-1"></div>
        <div className="w-32 h-10 bg-surface border border-border rounded-xl"></div>
      </div>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border-soft last:border-0">
            <div className="w-10 h-10 rounded-lg bg-border-soft shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-4 bg-border-soft rounded"></div>
              <div className="w-1/4 h-3 bg-border-soft rounded"></div>
            </div>
            <div className="w-24 h-6 bg-border-soft rounded-full"></div>
            <div className="w-8 h-8 rounded-lg bg-border-soft shrink-0"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
