export function GroupsSkeleton() {
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
        <div className="w-full h-10 bg-surface border border-border rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl h-48 p-5 flex flex-col justify-between">
            <div>
              <div className="w-3/4 h-6 bg-border-soft rounded mb-3"></div>
              <div className="w-full h-4 bg-border-soft rounded mb-1"></div>
              <div className="w-2/3 h-4 bg-border-soft rounded"></div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-soft">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(j => <div key={j} className="w-8 h-8 rounded-full bg-border-soft border-2 border-surface"></div>)}
              </div>
              <div className="w-20 h-4 bg-border-soft rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
