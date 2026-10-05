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
const OUT = resolve(process.env.WALKTHROUGH_OUTPUT_DIR || join(HERE, "../walkthrough-output/modes"));
const NOTES = resolve(HERE, "../../ai-service/evals/data/os_notes.pdf");
const DOCX = resolve(HERE, "fixtures/sample-notes.docx");
const VTT = resolve(HERE, "fixtures/sample-meeting.vtt");
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

async function newUser(browser, { teams, prefix }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("sf_intro_seen", "1"); } catch { /* ignore */ } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(30_000);
  const pw = `Mode-${Math.random().toString(36).slice(2, 10)}`;
  await p.goto(`${BASE}/register${teams ? "?for=teams" : ""}`);
  const pro = await p.getByRole("radio", { name: /professional/i }).getAttribute("aria-checked");
  if ((pro === "true") !== teams) throw new Error(`sign-up preselection wrong (teams=${teams}, professional checked=${pro})`);
  await p.getByLabel("Full name").fill(teams ? "Priya Owner" : "Arjun Student");
  const email = `${prefix ?? (teams ? "pro" : "stu")}${stamp}@example.com`;
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Password", { exact: true }).fill(pw);
  await p.getByLabel("Confirm password").fill(pw);
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL(/dashboard/);
  await p.getByRole("link", { name: "Today", exact: true }).first().waitFor(); // app shell rendered
  await p.waitForTimeout(500);
  return { ctx, p, email, password: pw };
}

async function createGroup(p, name) {
  await p.getByRole("button", { name: "New", exact: true }).click();
  await p.getByRole("menuitem", { name: /New (group|team)/ }).click();
  await p.getByRole("dialog").getByRole("textbox").first().fill(name);
  await p.getByRole("dialog").getByRole("button", { name: /Create (group|team)/ }).click();
  await p.waitForTimeout(1500);
  await p.goto(`${BASE}/groups`);
  await p.getByText(name).first().click();
  await p.waitForURL(/groups\/\d+/);
  await p.locator("h1").first().waitFor();
}

async function scheduleIn(p, groupName, title) {
  await p.getByRole("button", { name: "New", exact: true }).click();
  await p.getByRole("menuitem", { name: /New (session|meeting)/ }).click();
  const dlg = p.getByRole("dialog", { name: /Schedule a (session|meeting)/ });
  const sel = dlg.locator("select").first();
  const option = sel.locator("option", { hasText: groupName }).first();
  await option.waitFor({ state: "attached" });
  await sel.selectOption({ label: (await option.textContent()).trim() });
  await dlg.locator('input[placeholder="e.g. Operating Systems Revision"]').fill(title);
  await dlg.locator('input[type="date"]').fill(new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10));
  await dlg.locator('input[type="time"]').fill("18:00");
  await dlg.getByRole("button", { name: "Schedule", exact: true }).click();
  await p.waitForTimeout(1500);
  await p.goto(`${BASE}/sessions`);
  await p.getByText(title).first().click();
  await p.waitForURL(/sessions\/\d+$/);
  await p.waitForLoadState("networkidle");
  await p.locator("main h1").first().waitFor();
  await p.waitForTimeout(800); // let the previous page finish its exit animation
  return new URL(p.url()).pathname;
}

const STUDENT_WORDS = /\b(quiz(zes)?|flashcards?|study groups?|sessions?|learning path|organizer)\b/i;
const TEAM_WORDS = /\b(meetings?|knowledge checks?|key-point cards?|roadmap|teams?)\b/i;

const browser = await chromium.launch();
let inviteCode = "";
try {
  // ── Landing: the students/teams toggle swaps the copy and the sign-up link ──
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.addInitScript(() => { try { localStorage.setItem("sf_intro_seen", "1"); } catch { /* ignore */ } });
    const p = await ctx.newPage();
    p.setDefaultTimeout(30_000);
    await step(p, `landing teams toggle at ${width}px`, async () => {
      await p.goto(`${BASE}/`);
      await p.getByRole("tab", { name: "For teams" }).click();
      const h1 = await p.locator("h1").first().innerText();
      if (!/ready/.test(h1) || !/on day one/.test(h1)) throw new Error(`teams headline not shown: "${h1}"`);
      const extra = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (extra > 1) throw new Error(`landing scrolls sideways by ${extra}px`);
      await p.getByRole("button", { name: /Get started free/ }).first().click();
      await p.waitForURL(/\/register\?for=teams/);
      if ((await p.getByRole("radio", { name: /professional/i }).getAttribute("aria-checked")) !== "true") throw new Error("professional not preselected");
    });
    if (width === 1440) {
      await step(p, "teams tour shows the team script", async () => {
        await p.goto(`${BASE}/?for=teams`);
        await p.getByRole("button", { name: /Watch the 25-second tour/ }).click();
        await p.getByText("Everything your team knows, in one place.").waitFor();
        await p.getByText("Platform Team", { exact: true }).first().waitFor({ state: "attached" });
        await p.keyboard.press("Escape");
        await p.getByRole("dialog", { name: "How StudyFlow works" }).waitFor({ state: "detached" });
      });
    }
    await ctx.close();
  }

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
  let studentSession = "";
  await step(student.p, "student owner schedules a session", async () => {
    studentSession = await scheduleIn(student.p, `OS Study Group ${stamp}`, `Deadlocks revision ${stamp}`);
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
    await pro.p.getByRole("button", { name: /Upload (notes|documents)/ }).click();
    const dlg = pro.p.getByRole("dialog", { name: /Upload (notes|documents)/ });
    await dlg.locator('input[type="file"]').setInputFiles(NOTES);
    await dlg.getByRole("button", { name: "Upload", exact: true }).click();
    await pro.p.getByText("File uploaded successfully").waitFor();
    await collect();
  });
  let proMeeting = "";
  await step(pro.p, "professional meeting page has no student words", async () => {
    proMeeting = await scheduleIn(pro.p, `Platform Team ${stamp}`, `Q3 planning sync ${stamp}`);
    const text = (await visibleText(pro.p)).replace(`Q3 planning sync ${stamp}`, "");
    const hit = text.match(STUDENT_WORDS);
    if (hit) throw new Error(`student word "${hit[0]}" on a professional meeting page`);
    seen.push(text);
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

  await step(pro.p, "professional adds a transcript and approves the minutes", async () => {
    await pro.p.goto(BASE + proMeeting);
    await pro.p.getByRole("button", { name: "Mark completed" }).click();
    await pro.p.getByRole("button", { name: "Upload transcript" }).waitFor();
    await pro.p.getByLabel("Transcript file").setInputFiles(VTT);
    await pro.p.getByText("Draft — awaiting review").waitFor({ timeout: 180_000 });
    for (const want of ["Minutes of meeting", "From transcript (speakers named)", "Decisions", "Action items"]) {
      if (!(await pro.p.getByText(want, { exact: true }).count())) throw new Error(`minutes missing "${want}"`);
    }
    const item = await pro.p.locator("li", { hasText: /migration plan/i }).first().innerText();
    if (!/Priya/.test(item)) throw new Error(`action item owner not taken from the speaker name: "${item}"`);
    await pro.p.getByRole("button", { name: "Approve", exact: true }).click();
    await pro.p.getByText("Approved", { exact: true }).waitFor();
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
  await step(pro.p, "student group's session and quiz pages keep student wording", async () => {
    for (const path of [studentSession, `${studentSession}/quiz`]) {
      await pro.p.goto(BASE + path);
      await pro.p.waitForLoadState("networkidle");
      await pro.p.waitForTimeout(1200);
      const main = await pro.p.locator("main").innerText();
      const hit = main.match(TEAM_WORDS);
      if (hit) throw new Error(`team word "${hit[0]}" on ${path} of a student group`);
    }
  });


  // ── Account features: everything in Settings must really change something ──
  const acct = await newUser(browser, { teams: false, prefix: "acct" });
  const me = () => acct.p.evaluate(() => fetch("/auth/me", { credentials: "include" }).then((r) => r.json()).then((j) => j.data));
  const openSettingsTab = async (name) => {
    await acct.p.goto(`${BASE}/settings`);
    await acct.p.locator("h1").first().waitFor();
    await acct.p.locator("main").getByRole("button", { name, exact: true }).first().click(); // not the top bar bell
  };
  await step(acct.p, "rename survives a reload", async () => {
    await openSettingsTab("Account");
    await acct.p.getByLabel("Full name").fill("Sam Renamed");
    await acct.p.getByRole("button", { name: "Save changes" }).click();
    await acct.p.getByText("Name updated").waitFor();
    await acct.p.reload();
    await acct.p.getByText("Sam Renamed").first().waitFor();
    if ((await me()).name !== "Sam Renamed") throw new Error("name not saved on the server");
  });
  await step(acct.p, "account type switch survives a reload", async () => {
    await openSettingsTab("Account");
    await acct.p.getByRole("button", { name: "Professional", exact: true }).click();
    await acct.p.getByRole("link", { name: "Teams", exact: true }).first().waitFor();
    await acct.p.reload();
    await acct.p.getByRole("link", { name: "Teams", exact: true }).first().waitFor();
    await openSettingsTab("Account");
    await acct.p.getByRole("button", { name: "Student", exact: true }).click();
    await acct.p.getByRole("link", { name: "Groups", exact: true }).first().waitFor();
  });
  await step(acct.p, "notification setting persists", async () => {
    await openSettingsTab("Notifications");
    const toggle = acct.p.getByRole("switch", { name: "Notes and documents" });
    await toggle.waitFor();
    if ((await toggle.getAttribute("aria-checked")) !== "true") throw new Error("defaults should be on");
    await toggle.click();
    await acct.p.waitForTimeout(800);
    await openSettingsTab("Notifications");
    const after = await acct.p.getByRole("switch", { name: "Notes and documents" }).getAttribute("aria-checked");
    if (after !== "false") throw new Error("notification setting did not persist");
  });
  const newPassword = `Changed-${Math.random().toString(36).slice(2, 10)}`;
  await step(acct.p, "password change rejects a wrong current password, then works", async () => {
    await openSettingsTab("Security");
    await acct.p.getByLabel("Current password").fill("definitely-wrong");
    await acct.p.getByLabel("New password").fill(newPassword);
    await acct.p.getByRole("button", { name: "Update password" }).click();
    await acct.p.getByText("Current password is incorrect").waitFor();
    await acct.p.getByLabel("Current password").fill(acct.password);
    await acct.p.getByRole("button", { name: "Update password" }).click();
    await acct.p.getByText("Password updated").waitFor();
  });
  await step(acct.p, "sign in with the new password", async () => {
    await acct.p.getByRole("button", { name: "Log out" }).click();
    await acct.p.waitForURL((u) => !u.pathname.startsWith("/dashboard"));
    await acct.p.goto(`${BASE}/login`);
    await acct.p.getByLabel("Email").fill(acct.email);
    await acct.p.getByLabel("Password").fill(newPassword);
    await acct.p.locator('button[type="submit"]').click();
    await acct.p.waitForURL(/dashboard/);
  });
  await step(acct.p, "Word upload is indexed", async () => {
    await createGroup(acct.p, `Docx Group ${stamp}`);
    const groupId = new URL(acct.p.url()).pathname.split("/").pop();
    acct.groupId = groupId;
    await acct.p.goto(`${BASE}/resources`);
    await acct.p.locator("h1").first().waitFor();
    await acct.p.getByRole("button", { name: /Upload (notes|documents)/ }).click();
    const dlg = acct.p.getByRole("dialog", { name: /Upload (notes|documents)/ });
    await dlg.locator('input[type="file"]').setInputFiles(DOCX);
    const sel = dlg.locator("select");
    if (await sel.count()) {
      const option = sel.locator("option", { hasText: `Docx Group ${stamp}` }).first();
      await option.waitFor({ state: "attached" });
      await sel.selectOption({ label: (await option.textContent()).trim() });
    }
    await dlg.getByRole("button", { name: "Upload", exact: true }).click();
    await acct.p.getByText("File uploaded successfully").waitFor();
    let status = "";
    for (let i = 0; i < 40 && status !== "INDEXED" && status !== "FAILED"; i++) {
      await acct.p.waitForTimeout(1500);
      status = await acct.p.evaluate((gid) => fetch(`/api/v1/resources/?group_id=${gid}`, { credentials: "include" })
        .then((r) => r.json()).then((j) => (j.data || [])[0]?.status || ""), groupId);
    }
    if (status !== "INDEXED") throw new Error(`docx ended as "${status}"`);
  });
  await step(acct.p, "Ask AI answers from indexed notes with a citation", async () => {
    await acct.p.goto(`${BASE}/ai`);
    const groupSelect = acct.p.locator('select[aria-label="Study group"]');
    await groupSelect.waitFor();
    const option = groupSelect.locator("option", { hasText: `Docx Group ${stamp}` }).first();
    await option.waitFor({ state: "attached" });
    await groupSelect.selectOption({ label: (await option.textContent()).trim() });
    const box = acct.p.locator('textarea[placeholder="Ask about your study materials…"]');
    await box.fill("What four conditions must hold for a deadlock?");
    await acct.p.getByRole("button", { name: "Send message" }).click();
    await acct.p.getByText("Searching your notes and writing an answer…").waitFor({ state: "detached", timeout: 180_000 });
    await acct.p.getByText("Sources", { exact: true }).waitFor({ timeout: 10_000 });
    const text = await acct.p.locator("main").innerText();
    if (!/mutual exclusion/i.test(text) || !/circular wait/i.test(text)) throw new Error("answer did not cover the indexed deadlock notes");
  });
  let generatedSessionPath = "";
  await step(acct.p, "AI planner creates a session from group notes", async () => {
    await acct.p.goto(`${BASE}/groups/${acct.groupId}`);
    await acct.p.getByRole("button", { name: "Plan next session" }).click();
    await acct.p.getByRole("dialog", { name: "Proposed session" }).waitFor({ timeout: 180_000 });
    await acct.p.getByRole("button", { name: "Create session" }).click();
    await acct.p.waitForURL(/\/sessions\/\d+$/ , { timeout: 60_000 });
    generatedSessionPath = new URL(acct.p.url()).pathname;
    await acct.p.locator("main h1").first().waitFor();
  });
  await step(acct.p, "session summary generates from attached notes", async () => {
    await acct.p.getByRole("button", { name: "Mark completed" }).click();
    await acct.p.getByText("Session marked as completed!").waitFor();
    await acct.p.getByText("Key concepts", { exact: true }).waitFor({ timeout: 180_000 });
  });
  await step(acct.p, "flashcards generate and flip", async () => {
    await acct.p.getByRole("button", { name: "Generate flashcards" }).click();
    const card = acct.p.getByText("Click to flip", { exact: true });
    await card.waitFor({ timeout: 180_000 });
    await card.click();
    await acct.p.getByText("Answer", { exact: true }).waitFor();
  });
  await step(acct.p, "quiz generates, submits, and returns a grade", async () => {
    await acct.p.getByRole("button", { name: "Generate quiz" }).click();
    await acct.p.getByRole("button", { name: "Take quiz" }).waitFor({ timeout: 180_000 });
    await acct.p.getByRole("button", { name: "Take quiz" }).click();
    await acct.p.waitForURL(/\/sessions\/\d+\/quiz$/);
    await acct.p.getByText("Question 1", { exact: true }).waitFor();
    const cards = acct.p.locator("main div.p-5").filter({ has: acct.p.getByText(/^Question \d+$/) });
    const count = await cards.count();
    if (!count) throw new Error("quiz has no questions");
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const answer = card.locator("textarea");
      if (await answer.count()) await answer.fill("Mutual exclusion, hold and wait, no preemption and circular wait.");
      else await card.locator("button").first().click();
    }
    await acct.p.getByRole("button", { name: /Submit/ }).click();
    await acct.p.getByRole("link", { name: /Return to/ }).waitFor({ timeout: 120_000 });
  });
  await step(acct.p, "dark theme applies and can be restored", async () => {
    await acct.p.setViewportSize({ width: 1440, height: 900 });
    await acct.p.goto(`${BASE}/settings`);
    await acct.p.getByRole("button", { name: "Dark", exact: true }).click();
    await acct.p.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await acct.p.getByRole("button", { name: "Light", exact: true }).click();
    await acct.p.waitForFunction(() => !document.documentElement.classList.contains("dark"));
  });
  await step(acct.p, "authenticated pages fit phone and tablet widths", async () => {
    const paths = [
      "/dashboard", "/groups", `/groups/${acct.groupId}`, "/resources", "/sessions",
      generatedSessionPath, `${generatedSessionPath}/quiz`, "/ai", "/notifications", "/settings",
    ];
    for (const width of [390, 768]) {
      await acct.p.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await acct.p.goto(BASE + path);
        await acct.p.locator("h1").first().waitFor();
        await acct.p.waitForTimeout(150);
        const overflow = await acct.p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) throw new Error(`${path} overflows horizontally at ${width}px by ${overflow}px`);
      }
    }
    await acct.p.setViewportSize({ width: 1440, height: 900 });
  });
  await step(acct.p, "forgot password confirms without revealing accounts", async () => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(`${BASE}/login`);
    await p.getByRole("link", { name: "Forgot password?" }).click();
    await p.waitForURL(/forgot-password/);
    await p.getByRole("heading", { name: "Reset your password" }).waitFor();
    await p.getByLabel("Email").fill(`nobody-${stamp}@example.com`);
    await p.getByRole("button", { name: "Send reset link" }).click();
    try {
      await p.getByRole("status").filter({ hasText: "reset link is on its way" }).waitFor({ timeout: 10_000 });
    } catch (e) {
      await p.screenshot({ path: join(OUT, "FAIL-forgot-password-page.png") });
      throw e;
    } finally {
      await ctx.close();
    }
  });
  await step(student.p, "deleting an account that owns a shared group is blocked", async () => {
    await student.p.goto(`${BASE}/settings`);
    await student.p.locator("main").getByRole("button", { name: "Account", exact: true }).first().click();
    await student.p.getByRole("button", { name: "Delete account" }).click();
    await student.p.getByLabel("Your password").fill(student.password);
    await student.p.getByRole("button", { name: "Delete permanently" }).click();
    await student.p.getByRole("alert").filter({ hasText: `OS Study Group ${stamp}` }).waitFor();
    await student.p.getByRole("button", { name: "Cancel" }).click();
  });
  await step(acct.p, "deleting an account removes it", async () => {
    await openSettingsTab("Account");
    await acct.p.getByRole("button", { name: "Delete account" }).click();
    await acct.p.getByLabel("Your password").fill(newPassword);
    await acct.p.getByRole("button", { name: "Delete permanently" }).click();
    await acct.p.waitForURL((u) => u.pathname === "/");
    const status = await acct.p.evaluate(({ email, password }) => fetch("/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
    }).then((r) => r.status), { email: acct.email, password: newPassword });
    if (status !== 401) throw new Error(`deleted account can still sign in (HTTP ${status})`);
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
