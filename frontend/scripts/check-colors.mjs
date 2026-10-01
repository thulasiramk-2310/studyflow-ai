// Fails when src/ uses hardcoded Tailwind palette colours or arbitrary font
// sizes, except in files still listed in color-allowlist.json (migration in progress).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const ALLOW_FILE = join(ROOT, "scripts", "color-allowlist.json");
const allow = new Set(existsSync(ALLOW_FILE) ? JSON.parse(readFileSync(ALLOW_FILE, "utf8")) : []);

const PALETTE = /\b(?:bg|text|border|from|to|via|ring|divide|outline|fill|stroke|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b|\b(?:bg|text|border)-(?:white|black)\b/g;
const ARBITRARY_SIZE = /\btext-\[\d+(?:\.\d+)?px\]/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts)$/.test(name) ? [p] : [];
  });
}

let failures = 0;
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (allow.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const hits = [...(line.match(PALETTE) || []), ...(line.match(ARBITRARY_SIZE) || [])];
    for (const hit of hits) {
      console.log(`${rel}:${i + 1}: ${hit}`);
      failures += 1;
    }
  });
}
for (const rel of allow) {
  if (!existsSync(join(ROOT, rel))) console.log(`allowlist entry no longer exists: ${rel}`);
}
console.log(failures ? `\n${failures} hardcoded style(s) found` : `colour guard ok (${allow.size} file(s) still allowlisted)`);
process.exit(failures ? 1 : 0);
