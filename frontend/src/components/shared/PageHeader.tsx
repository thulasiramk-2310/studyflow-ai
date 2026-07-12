import type { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBreadcrumb?: boolean;
}

export function PageHeader({ title, subtitle, actions, showBreadcrumb = true }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {showBreadcrumb && <div className="mb-1"><Breadcrumb /></div>}
        <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted-foreground font-medium">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
