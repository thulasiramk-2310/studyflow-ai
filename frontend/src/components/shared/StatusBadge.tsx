type Status = "live" | "upcoming" | "completed" | "organizer" | "member" | "active" | "inactive" | string;

const CONFIG: Record<string, { bg: string; text: string; dot?: string }> = {
  live:      { bg: "bg-danger-soft",      text: "text-danger",      dot: "bg-danger" },
  upcoming:  { bg: "bg-primary-soft", text: "text-primary",      dot: "bg-primary" },
  completed: { bg: "bg-border-soft",  text: "text-muted-foreground" },
  organizer: { bg: "bg-secondary-soft", text: "text-secondary" },
  member:    { bg: "bg-border-soft",  text: "text-muted-foreground" },
  active:    { bg: "bg-success-soft",   text: "text-success",  dot: "bg-success" },
  inactive:  { bg: "bg-border-soft",  text: "text-muted-foreground" },
  tomorrow:  { bg: "bg-warning-soft",    text: "text-warning" },
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
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {showDot && cfg.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      )}
      {display}
    </span>
  );
}
