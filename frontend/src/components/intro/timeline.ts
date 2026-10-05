import type { Audience } from "../../types";

export type CameraTarget = "wide" | "upload" | "input" | "chat" | "citation" | "quiz" | "answer";

export type BeatAction =
  | "dropFile" | "indexed" | "typeQuestion" | "clickSend" | "streamAnswer" | "glowCitation" | "pickAnswer" | "end";

export interface Caption {
  step: string;
  title: string;
  body: string;
  /** 0 for the opening/closing shots, 1–4 for the numbered steps. */
  index: number;
}

export interface Beat {
  at: number;
  camera?: { target: CameraTarget; zoom: number };
  caption?: Caption;
  action?: BeatAction;
}

/** What the presentational canvas shows. The last card is a quiz for students and draft minutes for teams. */
export interface CanvasContent {
  question: string;
  nav: [string, string, string, string, string];
  initials: string;
  group: string;
  groupMeta: string;
  library: string;
  libraryAction: string;
  dropHint: string;
  file: string;
  fileSize: string;
  chatHint: string;
  citation: string;
  citationScore: string;
  secondCitation: string;
  secondScore: string;
  card:
    | { kind: "quiz"; title: string; count: string; question: string; options: string[]; correct: string }
    | { kind: "minutes"; title: string; decision: string; action: string; owner: string; due: string };
}

export interface IntroScript {
  question: string;
  answer: string;
  beats: Beat[];
  canvas: CanvasContent;
  closing: [string, string, string];
}

export const INTRO_MS = 25600;

/** Camera moves and actions shared by both scripts; only the captions differ. */
function beats(c: { open: Caption; upload: Caption; ask: Caption; cite: Caption; last: Caption; close: Caption }): Beat[] {
  return [
    { at: 0, camera: { target: "wide", zoom: 1 }, caption: c.open },
    { at: 2600, camera: { target: "upload", zoom: 2 }, caption: c.upload },
    { at: 3800, action: "dropFile" },
    { at: 6300, action: "indexed" },
    { at: 7600, camera: { target: "input", zoom: 2.2 }, caption: c.ask },
    { at: 8700, action: "typeQuestion" },
    { at: 10300, action: "clickSend" },
    { at: 11200, camera: { target: "chat", zoom: 1.25 }, action: "streamAnswer" },
    { at: 14600, camera: { target: "citation", zoom: 2.4 }, action: "glowCitation", caption: c.cite },
    { at: 17600, camera: { target: "quiz", zoom: 1.9 }, caption: c.last },
    { at: 18900, action: "pickAnswer" },
    { at: 19800, camera: { target: "answer", zoom: 2.4 } },
    { at: 22200, camera: { target: "wide", zoom: 1 }, caption: c.close },
    { at: 25200, action: "end" },
  ];
}

const CITE: Caption = { index: 3, step: "Step 3 of 4", title: "Every answer shows its source.", body: "Each answer links the file and page it came from, with a match score." };

export const SCRIPTS: Record<Audience, IntroScript> = {
  student: {
    question: "What are the four conditions for deadlock?",
    answer: "**All four must hold at once:** mutual exclusion, hold and wait, no preemption and circular wait.",
    beats: beats({
      open: { index: 0, step: "StudyFlow", title: "A study group with an AI that read your notes.", body: "Here's how it works, in about 25 seconds." },
      upload: { index: 1, step: "Step 1 of 4", title: "Drop in your notes.", body: "Your PDFs are chunked, embedded and indexed for your group." },
      ask: { index: 2, step: "Step 2 of 4", title: "Ask anything.", body: "Questions are answered only from your group's own material." },
      cite: CITE,
      last: { index: 4, step: "Step 4 of 4", title: "Then it quizzes you on it.", body: "Quizzes and flashcards are generated for every session." },
      close: { index: 0, step: "StudyFlow", title: "Notes in. Understanding out.", body: "Your notes, an AI that cites them, and a plan for the next session." },
    }),
    canvas: {
      question: "What are the four conditions for deadlock?",
      nav: ["Today", "Groups", "Sessions", "Ask AI", "Library"],
      initials: "DS",
      group: "Operating Systems",
      groupMeta: "Study group · 2 members",
      library: "Library",
      libraryAction: "Upload notes",
      dropHint: "Drop PDFs, slides or notes here",
      file: "os_notes.pdf",
      fileSize: "16 KB",
      chatHint: "answers only from this group's notes",
      citation: "os_notes.pdf · page 4",
      citationScore: "72%",
      secondCitation: "page 2",
      secondScore: "34%",
      card: {
        kind: "quiz", title: "Session quiz", count: "3 of 8",
        question: "Which state does the Banker's algorithm keep the system in?",
        options: ["Deadlocked", "A safe state", "Preempted"], correct: "A safe state",
      },
    },
    closing: ["Study groups that ", "actually", " study."],
  },
  professional: {
    question: "How do I get access to production?",
    answer: "**Raise an access request in the IT portal.** Your manager approves it, and production access lasts 30 days before it needs renewing.",
    beats: beats({
      open: { index: 0, step: "StudyFlow for teams", title: "Everything your team knows, in one place.", body: "New members join with a code and get every document on day one." },
      upload: { index: 1, step: "Step 1 of 4", title: "Add the team's documents once.", body: "Runbooks, specs and policies are indexed for the whole team, including whoever joins next." },
      ask: { index: 2, step: "Step 2 of 4", title: "New teammate? Just ask.", body: "Answers come only from your team's own documents, so nobody has to interrupt a colleague." },
      cite: CITE,
      last: { index: 4, step: "Step 4 of 4", title: "Then it writes the minutes.", body: "Decisions and action items from the meeting transcript, for the owner to approve." },
      close: { index: 0, step: "StudyFlow for teams", title: "Your team's knowledge, ready for every new member.", body: "Your documents, an AI that cites them, and minutes for every meeting." },
    }),
    canvas: {
      question: "How do I get access to production?",
      nav: ["Today", "Teams", "Meetings", "Ask AI", "Documents"],
      initials: "KI",
      group: "Platform Team",
      groupMeta: "Team · 12 members · Kavya joined today",
      library: "Documents",
      libraryAction: "Upload files",
      dropHint: "Drop runbooks, specs or policies here",
      file: "onboarding_runbook.pdf",
      fileSize: "64 KB",
      chatHint: "answers only from this team's documents",
      citation: "onboarding_runbook.pdf · page 3",
      citationScore: "84%",
      secondCitation: "security_policy.pdf · page 1",
      secondScore: "41%",
      card: {
        kind: "minutes", title: "Minutes of meeting",
        decision: "Move the reporting database to Postgres 16",
        action: "Send the migration plan", owner: "Harish", due: "Fri",
      },
    },
    closing: ["Your team's knowledge, ", "ready", " on day one."],
  },
};
