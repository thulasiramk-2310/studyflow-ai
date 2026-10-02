// Walks through StudyFlow as a student and as a professional, using fresh accounts.
// Usage: BASE_URL=http://localhost node scripts/walkthrough-modes.mjs
// Checks: professional wording everywhere, a student group keeps its wording for a
// professional member, and the owner shares an invite code that a second user joins with.
import { chromium } from "playwright";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.BASE_URL || "http://localhost").replace(/\/$/, "");
const OUT = resolve(HERE, "../walkthrough-output/modes");
const NOTES = resolve(HERE, "../../ai-service/evals/data/os_notes.pdf");
const stamp = Date.now().toString().slice(-6);
const report = [];
let shot = 0;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const step = async (p, name, fn) => {
  try {
    await fn();
    shot += 1;
    await p.screenshot({ path: join(OUT, `${String(shot).padStart(2, "0")}-${name.replace(/\W+/g, "-").toLowerCase()}.png`) });
    report.push(`ok    ${name}`);
    console.log(`ok    ${name}`);
  } catch (e) {
    await p.screenshot({ path: join(OUT, `FAIL-${name.replace(/\W+/g, "-").toLowerCase()}.png`) }).catch(() => {});
    throw new Error(`${name}: ${String(e.message).split("\n")[0]}`);
  }
};

/** Visible text, ignoring <option> labels (the group-style picker names both styles). */
const visibleText = (p) => p.evaluate(() => {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("option, script, style").forEach((n) => n.remove());
  return clone.innerText;
});

async function newUser(browser, { teams }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("sf_intro_seen", "1"); } catch { /* ignore */ } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(30_000);
  const pw = `Mode-${Math.random().toString(36).slice(2, 10)}`;
  await p.goto(`${BASE}/register${teams ? "?for=teams" : ""}`);
  const pro = await p.getByRole("radio", { name: /professional/i }).getAttribute("aria-checked");
  if ((pro === "true") !== teams) throw new Error(`sign-up preselection wrong (teams=${teams}, professional checked=${pro})`);
  await p.getByLabel("Full name").fill(teams ? "Priya Owner" : "Arjun Student");
  await p.getByLabel("Email").fill(`${teams ? "pro" : "stu"}${stamp}@example.com`);
  await p.getByLabel("Password", { exact: true }).fill(pw);
  await p.getByLabel("Confirm password").fill(pw);
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL(/dashboard/);
  await p.getByRole("link", { name: "Today", exact: true }).first().waitFor(); // app shell rendered
  await p.waitForTimeout(500);
  return { ctx, p };
}

async function createGroup(p, name) {
  await p.getByRole("button", { name: "New", exact: true }).click();
  await p.getByRole("menuitem", { name: /New (group|team)/ }).click();
  await p.getByRole("dialog").getByRole("textbox").first().fill(name);
  await p.getByRole("dialog").getByRole("button", { name: /Create group/ }).click();
  await p.waitForTimeout(1500);
  await p.goto(`${BASE}/groups`);
  await p.getByText(name).first().click();
  await p.waitForURL(/groups\/\d+/);
  await p.locator("h1").first().waitFor();
}

const browser = await chromium.launch();
let inviteCode = "";
try {
  // ── Student owner creates a study group and shares its code ─────────────
  const student = await newUser(browser, { teams: false });
  await step(student.p, "student sees student wording", async () => {
    const text = await visibleText(student.p);
    if (!/Groups/.test(text) || !/Sessions/.test(text)) throw new Error("student sidebar should say Groups/Sessions");
    if (/\bTeams\b/.test(text)) throw new Error("student sees 'Teams'");
  });
  await step(student.p, "student owner sees the invite code", async () => {
    await createGroup(student.p, `OS Study Group ${stamp}`);
    const label = await student.p.getByRole("button", { name: /^Invite · / }).innerText();
    inviteCode = label.split("·")[1].trim();
    if (!/^[A-Z0-9]{6}$/.test(inviteCode)) throw new Error(`unexpected invite code "${inviteCode}"`);
  });

  // ── Professional owner: workplace wording everywhere ────────────────────
  const pro = await newUser(browser, { teams: true });
  const seen = [];
  const collect = async () => seen.push(await visibleText(pro.p));
  await step(pro.p, "professional dashboard", async () => {
    await pro.p.locator("h1").first().waitFor();
    await collect();
  });
  await step(pro.p, "professional team page", async () => {
    await createGroup(pro.p, `Platform Team ${stamp}`);
    await collect();
    await pro.p.getByRole("tab", { name: "Members" }).click();
    await pro.p.waitForTimeout(400);
    await collect();
  });
  await step(pro.p, "professional documents upload", async () => {
    await pro.p.goto(`${BASE}/resources`);
    await pro.p.locator("h1").first().waitFor();
    await pro.p.getByRole("button", { name: "Upload notes" }).click();
    const dlg = pro.p.getByRole("dialog", { name: "Upload notes" });
    await dlg.locator('input[type="file"]').setInputFiles(NOTES);
    await dlg.getByRole("button", { name: "Upload", exact: true }).click();
    await pro.p.getByText("File uploaded successfully").waitFor();
    await collect();
  });
  for (const path of ["/sessions", "/guide", "/ai"]) {
    await step(pro.p, `professional ${path}`, async () => {
      await pro.p.goto(BASE + path);
      await pro.p.locator("h1").first().waitFor();
      await pro.p.waitForTimeout(400);
      await collect();
    });
  }
  await step(pro.p, "professional wording check", async () => {
    const all = seen.join("\n");
    const missing = ["Team", "Meeting", "Roadmap", "Knowledge check", "Documents", "Key-point cards", "Owner"]
      .filter((w) => !all.toLowerCase().includes(w.toLowerCase()));
    if (missing.length) throw new Error(`professional pages never showed: ${missing.join(", ")}`);
    const leaking = seen.findIndex((t) => /study group/i.test(t));
    if (leaking !== -1) throw new Error(`"Study group" appears on professional page #${leaking + 1}`);
  });

  // ── The professional joins the student's group with its code ────────────
  await step(pro.p, "professional joins a student group with the code", async () => {
    await pro.p.goto(`${BASE}/groups`);
    await pro.p.getByRole("button", { name: /Join (group|team)/ }).first().click();
    await pro.p.getByLabel("Invite code").fill(inviteCode);
    await pro.p.getByRole("dialog").getByRole("button", { name: /Join (group|team)/ }).click();
    await pro.p.getByText(`OS Study Group ${stamp}`).first().waitFor();
  });
  await step(pro.p, "student group keeps its wording for a professional", async () => {
    await pro.p.getByText(`OS Study Group ${stamp}`).first().click();
    await pro.p.waitForURL(/groups\/\d+/);
    await pro.p.locator("h1").first().waitFor();
    await pro.p.getByRole("tab", { name: "Sessions" }).waitFor();   // group wording: student
    await pro.p.getByRole("link", { name: "Teams", exact: true }).first().waitFor(); // sidebar: the user's
    if (await pro.p.getByRole("button", { name: /^Invite · / }).count()) throw new Error("a member can see the invite code");
  });

  report.push("walkthrough-modes passed");
  console.log("walkthrough-modes passed");
} catch (e) {
  report.push(`FAIL  ${e.message}`);
  console.error(`FAIL  ${e.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  writeFileSync(join(OUT, "report.txt"), report.join("\n") + "\n");
}
