import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({ className, padded = true, children, ...rest }: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface", padded && "p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {action && <div className="text-sm text-muted-foreground">{action}</div>}
    </div>
  );
}
