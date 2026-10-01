import { cn } from "./cn";

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return (
    <div role="tablist" className="flex gap-5 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={tab === active}
          onClick={() => onChange(tab)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 py-2.5 text-base transition-colors",
            tab === active ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
