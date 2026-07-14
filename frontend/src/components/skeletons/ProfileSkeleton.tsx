export function ProfileSkeleton() {
  return (
    <div className="max-w-[860px] mx-auto px-8 py-7 pb-12 animate-pulse">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-border-soft"></div>
          <div className="flex-1 space-y-2">
            <div className="w-48 h-6 bg-border-soft rounded"></div>
            <div className="w-32 h-4 bg-border-soft rounded"></div>
            <div className="w-24 h-4 bg-border-soft rounded mt-2"></div>
          </div>
          <div className="w-24 h-9 bg-border-soft rounded-lg"></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl px-5 py-4 h-24">
            <div className="w-24 h-3 bg-border-soft rounded mb-3"></div>
            <div className="w-10 h-7 bg-border-soft rounded"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8 space-y-4">
        <div className="w-32 h-5 bg-border-soft rounded mb-4"></div>
        {[1, 2].map(i => (
          <div key={i} className="w-full h-32 bg-surface border border-border rounded-2xl"></div>
        ))}
      </div>
    </div>
  );
}
