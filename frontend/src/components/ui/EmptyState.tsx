import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary-text"><Icon className="h-5 w-5" /></div>
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-base text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
