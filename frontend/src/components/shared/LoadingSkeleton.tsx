/** Shared skeleton/loading placeholder components */

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-border-soft animate-pulse ${className}`} />
  );
}

/** Full card skeleton matching the StatsCard shape */
export function LoadingCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Shimmer className="h-3.5 w-20" />
        <Shimmer className="h-8 w-8 rounded-lg" />
      </div>
      <Shimmer className="h-7 w-16 mb-1.5" />
      <Shimmer className="h-3 w-24" />
    </div>
  );
}

/** Single table row skeleton */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border-soft last:border-0">
      <Shimmer className="h-9 w-9 rounded-xl shrink-0" />
      <div className="flex-1 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className={`h-3.5 ${i === 0 ? "w-40" : i === cols - 1 ? "w-16" : "w-24"}`} />
        ))}
      </div>
    </div>
  );
}

/** List of skeleton rows */
export function SkeletonList({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

/** Generic full-page loading skeleton — assembles cards + list */
export function LoadingSkeleton({ cards = 4, rows = 5 }: { cards?: number; rows?: number }) {
  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 animate-pulse">
      {/* Stats row */}
      <div className={`grid grid-cols-${cards} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
      {/* List */}
      <SkeletonList rows={rows} />
    </div>
  );
}
