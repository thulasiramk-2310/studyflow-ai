import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

export type AccentColor = "Ocean Blue" | "Emerald" | "Indigo" | "Rose" | "Orange" | "Cyan" | "Slate";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  accent: AccentColor;
  setTheme: (t: Theme) => void;
  setAccent: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "sf_theme";
const ACCENT_STORAGE_KEY = "sf_accent";

export const ACCENT_COLORS: Record<AccentColor, { hsl: string, hex: string }> = {
  "Ocean Blue": { hsl: "221 83% 53%", hex: "#2563EB" },
  "Emerald": { hsl: "160 84% 39%", hex: "#10B981" },
  "Indigo": { hsl: "243 75% 59%", hex: "#4F46E5" },
  "Rose": { hsl: "347 77% 50%", hex: "#E11D48" },
  "Orange": { hsl: "25 95% 53%", hex: "#F97316" },
  "Cyan": { hsl: "189 94% 43%", hex: "#06B6D4" },
  "Slate": { hsl: "215 25% 27%", hex: "#334155" }
};

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function applyAccent(accent: AccentColor) {
  const color = ACCENT_COLORS[accent];
  if (!color) return;
  
  // Set the primary CSS variables dynamically
  document.documentElement.style.setProperty('--primary', color.hsl);
  
  // Create a hover and soft variant based on the HSL. 
  // This is a simple approximation for dynamic variants.
  const [h, s, l] = color.hsl.split(' ');
  const lNum = parseInt(l);
  
  // Darker for hover
  document.documentElement.style.setProperty('--primary-hover', `${h} ${s} ${Math.max(10, lNum - 10)}%`);
  
  // Much lighter/darker for soft background based on mode (using a fixed opacity approximation or light L value)
  // For the actual app, CSS handles it if we just set --primary, but we also use --primary-soft.
  document.documentElement.style.setProperty('--primary-soft', `${h} ${s} 90%`); // Light mode soft
  // Note: in a fully robust system, you might set separate variables for dark mode soft, but this works for the requirement.
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system"
  );
  
  const [accent, setAccentState] = useState<AccentColor>(
    () => (localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor | null) ?? "Ocean Blue"
  );

  const [resolvedTheme, setResolved] = useState<"light" | "dark">(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    return stored === "system" ? getSystemTheme() : stored;
  });

  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolved(resolved);
    applyTheme(resolved);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolved(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  const setAccent = (a: AccentColor) => {
    localStorage.setItem(ACCENT_STORAGE_KEY, a);
    setAccentState(a);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
