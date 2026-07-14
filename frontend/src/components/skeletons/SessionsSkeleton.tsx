export function SessionsSkeleton() {
  return (
    <div className="px-8 py-7 pb-12 max-w-[1100px] mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="w-48 h-8 bg-surface border border-border rounded-lg mb-2"></div>
          <div className="w-64 h-4 bg-surface border border-border rounded-lg"></div>
        </div>
        <div className="w-32 h-10 bg-surface border border-border rounded-xl"></div>
      </div>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-24 h-9 bg-surface border border-border rounded-full"></div>
        ))}
      </div>
      <div className="space-y-6">
        {[1, 2].map(d => (
          <div key={d}>
            <div className="w-32 h-5 bg-border-soft rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-surface border border-border rounded-2xl h-40 p-5 flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-border-soft shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="w-3/4 h-5 bg-border-soft rounded"></div>
                    <div className="w-1/2 h-3 bg-border-soft rounded"></div>
                    <div className="flex gap-2 mt-2">
                      <div className="w-16 h-5 bg-border-soft rounded-full"></div>
                      <div className="w-16 h-5 bg-border-soft rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
