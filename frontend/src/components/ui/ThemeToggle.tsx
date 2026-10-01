import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/** Flips between light and dark based on what is on screen. "System" lives in Settings. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = resolvedTheme === "dark" ? Moon : Sun;
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${resolvedTheme}. Switch to ${next}`}
      title={`Switch to ${next} mode`}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
