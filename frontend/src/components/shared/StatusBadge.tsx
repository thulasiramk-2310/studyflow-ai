type Status = "live" | "upcoming" | "completed" | "organizer" | "member" | "active" | "inactive" | string;

const CONFIG: Record<string, { bg: string; text: string; dot?: string }> = {
  live:      { bg: "bg-red-100",      text: "text-red-600",      dot: "bg-red-500" },
  upcoming:  { bg: "bg-primary-soft", text: "text-primary",      dot: "bg-primary" },
  completed: { bg: "bg-border-soft",  text: "text-muted-foreground" },
  organizer: { bg: "bg-secondary-soft", text: "text-secondary" },
  member:    { bg: "bg-border-soft",  text: "text-muted-foreground" },
  active:    { bg: "bg-emerald-50",   text: "text-emerald-600",  dot: "bg-emerald-500" },
  inactive:  { bg: "bg-border-soft",  text: "text-muted-foreground" },
  tomorrow:  { bg: "bg-amber-100",    text: "text-amber-700" },
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, label, showDot = false }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const cfg = CONFIG[key] ?? { bg: "bg-border-soft", text: "text-muted-foreground" };
  const display = label ?? status;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {showDot && cfg.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      )}
      {display}
    </span>
  );
}
