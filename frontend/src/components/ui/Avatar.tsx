import { cn } from "./cn";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  return (
    <span
      title={name}
      className={cn(
        "inline-grid place-items-center rounded-full bg-primary-soft font-bold text-primary-text ring-2 ring-surface",
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
      )}
    >
      {initials}
    </span>
  );
}
