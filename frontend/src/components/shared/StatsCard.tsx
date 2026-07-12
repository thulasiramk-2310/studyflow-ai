import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

export function StatsCard({ label, value, trend, icon: Icon, iconBg = "bg-primary-soft", iconColor = "text-primary" }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2.5 text-[26px] font-extrabold tracking-tight">{value}</div>
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600 font-semibold">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
