import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-8 h-8 text-primary opacity-70" />
      </div>
      <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-[320px] leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
