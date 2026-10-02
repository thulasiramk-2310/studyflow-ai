// Fails when app screens hard-code audience-specific nouns instead of reading them from useTerms().
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SCAN = ["components/layout", "components/groups", "components/sessions", "components/study", "components/ai", "components/shared", "pages/app"];

// Nouns that differ between student and professional wording (any case).
const NOUN = /\b(study groups?|groups?|sessions?|learning paths?|quiz(?:zes)?|flashcards?|organizers?|library)\b/i;
// Visible text: JSX text between tags, or a quoted/template string literal.
const TEXT = /(?:>([^<>{}]+)<)|(?:"([^"]*)")|(?:'([^']*)')|(?:`([^`]*)`)/g;

// Strings that are code, not copy: paths, ids, enum values, imports, service calls.
const CODE_LIKE = [
  /^\//,                                   // "/groups", "/sessions/1"
  /^[a-z_]+$/,                             // "session", "quiz" (keys, enum-ish identifiers)
  /^[A-Z_]+$/,                             // "SESSION_CREATED"
  /^[\w.-]+-[\w.-]+$/,                     // "create-session", ids
  /\$\{[^}]*\}/,                           // template literals built from terms
  /^\.\.?\//,                              // relative import paths
];
const SKIP_LINE = [/terms-ok/, /^\s*import /, /^\s*\/\//, /^\s*\*/, /console\.(log|error|warn)/, /Service\./, /\/api\//, /<option /, /openTab|setActiveTab|activeTab ===|=== "Sessions"|=== "Library"/];

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") && files.push(p); });
SCAN.forEach((d) => walk(join(ROOT, d)));

const hits = [];
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((raw, i) => {
    if (SKIP_LINE.some((r) => r.test(raw))) return;
    const line = raw.replace(/className=("[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g, ""); // class names are not copy
    // JSX text with {expressions} inside: drop the expressions and scan the words around them.
    let jsxText = line;
    while (/\{[^{}]*\}/.test(jsxText)) jsxText = jsxText.replace(/\{[^{}]*\}/g, " "); // nested ${} inside {}
    for (const m of [...line.matchAll(TEXT), ...jsxText.matchAll(/>([^<>]+)</g)]) {
      const text = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? "").trim();
      if (!text || !NOUN.test(text) || CODE_LIKE.some((r) => r.test(text))) continue;
      hits.push(`${relative(ROOT, f)}:${i + 1}: ${text.slice(0, 90)}`);
    }
  });
}
if (hits.length) {
  console.error(`terms guard: ${hits.length} hard-coded audience noun(s); use useTerms():\n` + hits.join("\n"));
  process.exit(1);
}
console.log("terms guard ok");
