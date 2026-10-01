// Mechanical first pass for one or more files: maps hardcoded Tailwind colours and
// arbitrary font sizes to design tokens. Review every diff; layout-specific
// colours (e.g. file-type badges) may need a hand-picked token instead.
import { readFileSync, writeFileSync } from "node:fs";

const COLOR_RULES = [
  // dark: variants become redundant once tokens switch by theme
  [/\s*dark:(?:bg|text|border|hover:bg|hover:text|placeholder)-(?:slate|gray|zinc|neutral|stone|white|black|blue|indigo)(?:-\d{2,3})?(?:\/\d+)?/g, ""],
  [/\btext-(?:gray|slate|zinc|neutral)-(?:900|800|700)\b|\btext-black\b/g, "text-foreground"],
  [/\btext-(?:gray|slate|zinc|neutral)-(?:600|500|400|300)\b/g, "text-muted-foreground"],
  [/\bplaceholder-(?:gray|slate)-\d{3}\b/g, "placeholder-muted-foreground"],
  [/\bbg-white(?:\/\d+)?\b/g, "bg-surface"],
  [/\bbg-(?:gray|slate|zinc|neutral)-(?:50|100|200)\b/g, "bg-muted"],
  [/\bhover:bg-(?:gray|slate|zinc|neutral)-(?:50|100|200)\b/g, "hover:bg-muted"],
  [/\bbg-(?:gray|slate|zinc)-(?:800|900|950)\b/g, "bg-foreground"],
  [/\bborder-(?:gray|slate|zinc|neutral)-\d{2,3}\b/g, "border-border"],
  [/\bdivide-(?:gray|slate|zinc)-\d{2,3}\b/g, "divide-border"],
  [/\bbg-(?:blue|indigo|violet|purple)-(?:500|600|700)\b/g, "bg-primary"],
  [/\bhover:bg-(?:blue|indigo|violet|purple)-(?:600|700|800)\b/g, "hover:bg-primary-hover"],
  [/\bbg-(?:blue|indigo|violet|purple)-(?:50|100|200)\b/g, "bg-primary-soft"],
  [/\btext-(?:blue|indigo|violet|purple)-\d{3}\b/g, "text-primary-text"],
  [/\bborder-(?:blue|indigo|violet|purple)-\d{2,3}\b/g, "border-primary"],
  [/\bring-(?:blue|indigo|violet|purple)-\d{3}\b/g, "ring-primary"],
  [/\bbg-(?:red|rose)-(?:50|100)\b/g, "bg-danger-soft"],
  [/\b(text|bg|border)-(?:red|rose)-\d{3}\b/g, "$1-danger"],
  [/\bhover:bg-(?:red|rose)-\d{2,3}\b/g, "hover:bg-danger-soft"],
  [/\bbg-(?:green|emerald|teal)-(?:50|100)\b/g, "bg-success-soft"],
  [/\b(text|bg|border)-(?:green|emerald|teal)-\d{3}\b/g, "$1-success"],
  [/\bbg-(?:amber|yellow|orange)-(?:50|100)\b/g, "bg-warning-soft"],
  [/\b(text|bg|border)-(?:amber|yellow|orange)-\d{3}\b/g, "$1-warning"],
  [/\bbg-(?:sky|cyan)-(?:50|100)\b/g, "bg-info-soft"],
  [/\b(text|bg|border)-(?:sky|cyan)-\d{3}\b/g, "$1-info"],
  [/\btext-white\b/g, "text-primary-foreground"],
  [/\bborder-white\b/g, "border-surface"],
];

function sizeToken(px) {
  if (px <= 12.5) return "text-xs";
  if (px < 14) return "text-sm";
  if (px < 16) return "text-base";
  if (px < 19) return "text-md";
  if (px < 25) return "text-lg";
  if (px < 34) return "text-xl";
  return "text-2xl";
}

for (const file of process.argv.slice(2)) {
  let s = readFileSync(file, "utf8");
  const before = s;
  for (const [re, to] of COLOR_RULES) s = s.replace(re, to);
  s = s.replace(/\btext-\[(\d+(?:\.\d+)?)px\]/g, (_, px) => sizeToken(Number(px)));
  if (s !== before) writeFileSync(file, s);
  console.log(`${s === before ? "unchanged" : "updated  "} ${file}`);
}
