export function AIAssistantSkeleton() {
  return (
    <div className="h-full flex overflow-hidden animate-pulse">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-surface flex-col hidden lg:flex">
        <div className="px-4 py-3.5 border-b border-border-soft">
          <div className="w-full h-9 bg-border-soft rounded-lg"></div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-full h-4 bg-border-soft rounded"></div>
          ))}
        </div>
      </aside>
      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-border-soft"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 bg-border-soft rounded"></div>
            <div className="w-48 h-3 bg-border-soft rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-5 space-y-6">
          <div className="flex gap-3 justify-end">
            <div className="w-64 h-12 bg-border-soft rounded-2xl rounded-tr-md"></div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-border-soft shrink-0"></div>
            <div className="w-80 h-24 bg-border-soft rounded-2xl rounded-tl-md"></div>
          </div>
          <div className="flex gap-3 justify-end">
            <div className="w-48 h-12 bg-border-soft rounded-2xl rounded-tr-md"></div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-border-soft shrink-0"></div>
            <div className="w-96 h-32 bg-border-soft rounded-2xl rounded-tl-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
