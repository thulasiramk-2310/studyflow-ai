import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div>
        <div className="text-[14px] font-bold">{title}</div>
        {subtitle && <div className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
