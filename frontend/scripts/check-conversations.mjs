// Deterministic UI regression checks. Run against a local Vite server.
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const output = resolve(process.env.WALKTHROUGH_OUTPUT_DIR || `walkthrough-output/conversations-${Date.now()}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const groups = [1, 2].map(id => ({ id, name: `Workspace ${id}`, created_by: 7, audience: "student", members: [{ user_id: 7, name: "Test Member", role: "ORGANIZER" }], learning_plan: [] }));
const sessions = [{ id: 11, group_id: 1, title: "First conversation" }, { id: 12, group_id: 1, title: "Second conversation" }];
let failHistory = false;
let failSend = false;
let pendingReply;
let releaseReply;
let pendingHistory;
let releaseHistory;
let planRequests = 0;
let createdSessions = 0;
const message = (id, content) => ({ id, session_id: id, role: "ai", content });

await page.route("**/*", async route => {
  const url = new URL(route.request().url());
  const path = url.pathname;
  const ok = data => route.fulfill({ json: { success: true, data } });
  if (path === "/auth/me") return ok({ id: "7", name: "Test Member", email: "test@example.com", accountType: "STUDENT" });
  if (path === "/api/v1/groups/") return ok(groups);
  if (path === "/api/v1/resources/") return ok([{ id: 1, filename: "notes.txt", original_filename: "notes.txt", created_at: "2026-10-01T00:00:00Z", size: 128, uploaded_by: 7 }]);
  if (path === "/api/v1/groups/1") return ok(groups[0]);
  if (path === "/api/v1/groups/1/sessions") return ok([]);
  if (path === "/api/v1/groups/1/schedule-agent") {
    planRequests += 1;
    return ok({ title: "Review approved follow-ups", description: "Review progress from the last meeting", duration_minutes: 60, session_type: "DISCUSSION", agenda: [{ title: "Review action progress", duration_minutes: 60, activity_type: "discussion" }] });
  }
  if (path === "/api/v1/sessions/" && route.request().method() === "POST") { createdSessions += 1; return ok({ id: 1 }); }
  if (path === "/api/v1/ai/chat/sessions") {
    if (failHistory) return route.fulfill({ status: 503, json: { success: false } });
    return ok(url.searchParams.get("group_id") === "1" ? sessions : []);
  }
  if (path === "/api/v1/ai/chat/sessions/11") {
    if (pendingHistory) { pendingHistory(); await new Promise(resolve => { releaseHistory = resolve; }); }
    return ok([message(11, "First saved answer")]);
  }
  if (path === "/api/v1/ai/chat/sessions/12") {
    expect(url.searchParams.get("latest")).toBe("true");
    if (url.searchParams.has("before_id")) return ok([message(50, "Archived earlier answer")]);
    return ok([...Array.from({ length: 29 }, (_, i) => message(100 + i, `History line ${i}`)), message(129, "Second saved answer")]);
  }
  if (path === "/api/v1/ai/chat") {
    if (failSend) return route.fulfill({ status: 503, json: { success: false, error: { message: "Please try again shortly" } } });
    pendingReply();
    await new Promise(resolve => { releaseReply = resolve; });
    return ok({ answer: "Delayed answer from old conversation", citations: [], sessionId: 11 });
  }
  if (path.startsWith("/api/v1/notifications")) return ok({ data: [], total: 0, unread_count: 0 });
  return route.continue();
});

try {
  await page.goto(`${base}/ai`);
  await expect(page.getByText("First saved answer", { exact: true })).toBeVisible();
  const replyStarted = new Promise(resolve => { pendingReply = resolve; });
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Question in the first conversation");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await replyStarted;
  await page.getByRole("button", { name: "Second conversation", exact: true }).click();
  await expect(page.getByText("Second saved answer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Load older messages", exact: true }).click();
  await expect(page.getByText("Archived earlier answer", { exact: true })).toBeAttached();
  await expect(page.getByRole("button", { name: "Load older messages", exact: true })).toHaveCount(0);
  console.log("PASS: older messages remain accessible through cursor pagination");
  const replyFinished = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/ai/chat");
  releaseReply();
  await replyFinished;
  await expect(page.getByText("Delayed answer from old conversation", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("");
  await page.screenshot({ path: join(output, "conversation-desktop.png") });
  console.log("PASS: late chat replies cannot overwrite another conversation or its draft");

  const historyStarted = new Promise(resolve => { pendingHistory = resolve; });
  await page.getByRole("button", { name: "First conversation", exact: true }).click();
  await historyStarted;
  await page.getByRole("combobox", { name: "Study group", exact: true }).selectOption("2");
  await expect(page.getByRole("heading", { name: "What do you want to understand?" })).toBeVisible();
  const historyFinished = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/ai/chat/sessions/11");
  releaseHistory();
  await historyFinished;
  pendingHistory = undefined;
  await expect(page.getByText("First saved answer", { exact: true })).toHaveCount(0);
  console.log("PASS: late history responses cannot cross workspace boundaries");

  failSend = true;
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Keep this draft after failure");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please try again shortly" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("Keep this draft after failure");
  console.log("PASS: failed sends preserve the draft for retry");

  failHistory = true;
  await page.getByRole("combobox", { name: "Study group", exact: true }).selectOption("1");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  failHistory = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("First saved answer", { exact: true })).toBeVisible();
  console.log("PASS: history loading failures are recoverable");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("combobox", { name: "Recent chats", exact: true }).selectOption("12");
  await expect(page.getByText("Second saved answer", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  expect(errors).toEqual([]);
  await page.screenshot({ path: join(output, "conversation-mobile.png") });
  console.log("PASS: mobile conversation navigation fits without overflow or browser exceptions");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/groups/1`);
  await page.getByRole("button", { name: "Ask StudyFlow AI", exact: true }).click();
  await page.getByRole("button", { name: "Plan a session", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Proposed session", exact: true })).toBeVisible();
  expect(planRequests).toBe(1);
  expect(createdSessions).toBe(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Workspace 1", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Proposed session", exact: true })).toHaveCount(0);
  expect(planRequests).toBe(1);
  expect(errors).toEqual([]);
  console.log("PASS: assistant planner shortcut opens one reviewable proposal, without creating a session or replaying on reload");

  failSend = false;
  const floatingStarted = new Promise(resolve => { pendingReply = resolve; });
  await page.getByRole("button", { name: "Ask StudyFlow AI", exact: true }).click();
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Question in the floating assistant");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await floatingStarted;
  await page.getByRole("combobox", { name: "Study group", exact: true }).selectOption("2");
  const floatingFinished = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/ai/chat");
  releaseReply();
  await floatingFinished;
  await expect(page.getByText("Delayed answer from old conversation", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("");
  console.log("PASS: floating assistant also isolates late replies after switching workspaces");
  console.log(`Screenshots: ${output}`);
} finally {
  releaseReply?.();
  releaseHistory?.();
  await browser.close();
}
