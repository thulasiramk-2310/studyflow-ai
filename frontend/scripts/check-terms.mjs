// Fails when app screens hard-code audience-specific nouns instead of reading them from useTerms().
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SCAN = ["components/layout", "components/groups", "components/sessions", "components/study", "components/ai", "components/shared", "pages/app"];
// Visible JSX text or string literals that a professional must never see.
const BANNED = /(>|["'`])[^<>"'`{}]*\b(study groups?|Study [Gg]roups?|Learning [Pp]ath|Organizer|Flashcards|Quizzes)\b[^<>"'`{}]*(<|["'`])/;
// <option> labels name the styles themselves ("Study group style" / "Team style").
const ALLOW = [/import /, /className=/, /services\//, /\/api\//, /<option /];

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") && files.push(p); });
SCAN.forEach((d) => walk(join(ROOT, d)));

const hits = [];
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (BANNED.test(line) && !ALLOW.some((a) => a.test(line))) hits.push(`${relative(ROOT, f)}:${i + 1}: ${line.trim().slice(0, 100)}`);
  });
}
if (hits.length) {
  console.error(`terms guard: ${hits.length} hard-coded audience noun(s); use useTerms():\n` + hits.join("\n"));
  process.exit(1);
}
console.log("terms guard ok");
