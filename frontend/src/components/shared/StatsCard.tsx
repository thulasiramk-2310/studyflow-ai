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
    <div className="bg-surface border border-border rounded-xl p-5 hover: shadow-float transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2.5 text-xl font-semibold">{value}</div>
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-xs text-success font-semibold">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
