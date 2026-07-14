export function DashboardSkeleton() {
  return (
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[1100px] mx-auto animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="w-48 h-8 bg-surface border border-border rounded-lg mb-2"></div>
          <div className="w-32 h-4 bg-surface border border-border rounded-lg"></div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-28">
            <div className="w-8 h-8 rounded-full bg-border-soft mb-3"></div>
            <div className="w-24 h-4 bg-border-soft rounded mb-2"></div>
            <div className="w-12 h-6 bg-border-soft rounded"></div>
          </div>
        ))}
      </div>
      
      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 h-64">
          <div className="w-32 h-5 bg-border-soft rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-border-soft"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-1/3 h-4 bg-border-soft rounded"></div>
                  <div className="w-1/4 h-3 bg-border-soft rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 h-64">
          <div className="w-32 h-5 bg-border-soft rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-10 bg-border-soft rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
