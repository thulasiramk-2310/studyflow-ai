import { Skeleton } from "../ui";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-2 h-9 w-72" />
      <Skeleton className="mb-8 h-4 w-48" />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="mt-5 h-56" />
    </div>
  );
}
