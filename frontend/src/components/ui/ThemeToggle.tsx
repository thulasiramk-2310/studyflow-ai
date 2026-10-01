import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../../context/ThemeContext";

const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const ICON = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICON[theme];
  return (
    <button
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Theme: ${theme}`}
      title={`Theme: ${theme}`}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
