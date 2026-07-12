interface ProgressCardProps {
  label: string;
  value: number; // 0–100
  color?: string;
  sublabel?: string;
}

export function ProgressCard({ label, value, color = "bg-primary", sublabel }: ProgressCardProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] font-semibold">{label}</span>
        <span className="text-[12.5px] font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 bg-border-soft rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      {sublabel && <div className="text-[11px] text-muted-foreground mt-1">{sublabel}</div>}
    </div>
  );
}
