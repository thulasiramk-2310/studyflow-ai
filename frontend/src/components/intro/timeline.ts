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

export const INTRO_MS = 25600;

export const QUESTION = "What are the four conditions for deadlock?";
export const ANSWER =
  "**All four must hold at once:** mutual exclusion, hold and wait, no preemption and circular wait.";

export const BEATS: Beat[] = [
  { at: 0, camera: { target: "wide", zoom: 1 }, caption: { index: 0, step: "StudyFlow", title: "A study group with an AI that read your notes.", body: "Here's how it works, in about 25 seconds." } },
  { at: 2600, camera: { target: "upload", zoom: 2 }, caption: { index: 1, step: "Step 1 of 4", title: "Drop in your notes.", body: "Your PDFs are chunked, embedded and indexed for your group." } },
  { at: 3800, action: "dropFile" },
  { at: 6300, action: "indexed" },
  { at: 7600, camera: { target: "input", zoom: 2.2 }, caption: { index: 2, step: "Step 2 of 4", title: "Ask anything.", body: "Questions are answered only from your group's own material." } },
  { at: 8700, action: "typeQuestion" },
  { at: 10300, action: "clickSend" },
  { at: 11200, camera: { target: "chat", zoom: 1.25 }, action: "streamAnswer" },
  { at: 14600, camera: { target: "citation", zoom: 2.4 }, action: "glowCitation", caption: { index: 3, step: "Step 3 of 4", title: "Every answer shows its source.", body: "Each answer links the file and page it came from, with a match score." } },
  { at: 17600, camera: { target: "quiz", zoom: 1.9 }, caption: { index: 4, step: "Step 4 of 4", title: "Then it quizzes you on it.", body: "Quizzes and flashcards are generated for every session." } },
  { at: 18900, action: "pickAnswer" },
  { at: 19800, camera: { target: "answer", zoom: 2.4 } },
  { at: 22200, camera: { target: "wide", zoom: 1 }, caption: { index: 0, step: "StudyFlow", title: "Notes in. Understanding out.", body: "Your notes, an AI that cites them, and a plan for the next session." } },
  { at: 25200, action: "end" },
];
