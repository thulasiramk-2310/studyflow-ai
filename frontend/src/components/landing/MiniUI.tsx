import type { ReactNode } from "react";
import { Check, FileText, Sparkles, Users } from "lucide-react";

/** Small coded illustrations of real StudyFlow screens for the landing page. `team` swaps in workplace content. */
type MiniProps = { team?: boolean };

function Frame({ children }: { children: ReactNode }) {
  return <div className="flex h-40 flex-col gap-2 overflow-hidden rounded-lg border border-border bg-background p-3 text-xs">{children}</div>;
}

function Source({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs text-foreground">
      <FileText className="h-3 w-3 text-muted-foreground" />{label}
    </span>
  );
}

export function MiniChat({ team }: MiniProps) {
  return (
    <Frame>
      <div className="self-end rounded-lg bg-primary px-2.5 py-1.5 text-primary-foreground">{team ? "How do I get production access?" : "Four conditions for deadlock?"}</div>
      <div className="max-w-[90%] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-foreground">
        {team ? <><b>Raise a request in the IT portal.</b> Your manager approves it; access lasts 30 days.</> : <><b>All four at once:</b> mutual exclusion, hold and wait, no preemption, circular wait.</>}
        <div className="mt-1.5 flex gap-1.5"><Source label={team ? "onboarding_runbook.pdf · p3" : "os_notes.pdf · p4"} /><span className="font-semibold text-primary-text">{team ? "84%" : "72%"}</span></div>
      </div>
    </Frame>
  );
}

export function MiniPlanner({ team }: MiniProps) {
  return (
    <Frame>
      <div className="flex items-center gap-1.5 text-primary-text"><Sparkles className="h-3.5 w-3.5" /> {team ? "Planning from your roadmap…" : "Planning from your learning path…"}</div>
      <div className="rounded-lg border border-border bg-surface p-2">
        <div className="text-muted-foreground">{team ? "Thu 11:00 · 45 min · AI-planned" : "Fri 18:00 · 60 min · AI-planned"}</div>
        <div className="font-serif text-md text-foreground">{team ? "Postgres 16 rollout" : "Deadlocks and prevention"}</div>
        <div className="mt-1 text-muted-foreground">{team ? "1. Review Harish's migration plan" : "1. The four conditions"}</div>
        <div className="text-muted-foreground">{team ? "2. Decide on read replicas" : "2. Banker's algorithm"}</div>
      </div>
    </Frame>
  );
}

export function MiniQuiz({ team }: MiniProps) {
  const [q, wrong1, right, wrong2] = team
    ? ["How long does production access last?", "7 days", "30 days", "Until you leave"]
    : ["Which state does the Banker's algorithm keep the system in?", "Deadlocked", "A safe state", "Preempted"];
  return (
    <Frame>
      <div className="font-serif text-md leading-snug text-foreground">{q}</div>
      <div className="rounded-md border border-border bg-surface px-2 py-1 text-muted-foreground">{wrong1}</div>
      <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary-soft px-2 py-1 text-foreground">{right} <span className="flex items-center gap-1 font-semibold text-primary-text"><Check className="h-3 w-3" />Correct</span></div>
      <div className="rounded-md border border-border bg-surface px-2 py-1 text-muted-foreground">{wrong2}</div>
    </Frame>
  );
}

export function MiniMinutes(_: MiniProps) {
  return (
    <Frame>
      <div className="flex items-center justify-between"><span className="font-semibold text-foreground">Minutes of meeting</span><span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Approved</span></div>
      <div className="text-muted-foreground">Decision: move the reporting database to Postgres 16.</div>
      <div className="flex items-center gap-1.5 text-foreground">Send the migration plan <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-xs font-semibold text-primary-text">Harish</span><span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Fri</span></div>
      <div className="text-muted-foreground">Open: do we need read replicas?</div>
    </Frame>
  );
}

export function MiniSummary(_: MiniProps) {
  return (
    <Frame>
      <div className="font-semibold text-foreground">Summary</div>
      <div className="text-muted-foreground">A deadlock needs four conditions at once. Prevention breaks one of them; avoidance keeps the system in a safe state…</div>
      <div className="flex flex-wrap gap-1">
        {["Circular wait", "Safe state", "Banker's algorithm"].map((k) => (
          <span key={k} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text">{k}</span>
        ))}
      </div>
    </Frame>
  );
}

export function MiniInvite({ team }: MiniProps) {
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <span className="font-serif text-md text-foreground">{team ? "Platform Team" : "Operating Systems"}</span>
        <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">{team ? "K4P2TM" : "A7K9QP"}</span>
      </div>
      <div className="flex -space-x-1.5">
        {(team ? ["HK", "KI", "RM"] : ["DS", "AK", "PV"]).map((i) => (
          <span key={i} className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-bold leading-none text-primary-text ring-2 ring-background">{i}</span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {team ? "Kavya joined today · 46 documents ready" : "3 members · 2 sessions this week"}</div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 rounded-full bg-primary" /></div>
    </Frame>
  );
}

export function MiniFlashcards({ team }: MiniProps) {
  return (
    <Frame>
      <div className="flex items-center justify-between text-muted-foreground"><span>{team ? "Key-point cards" : "Flashcards"}</span><span>4 of 12</span></div>
      <div className="grid flex-1 place-items-center rounded-lg border border-border bg-surface px-3 text-center font-serif text-md leading-snug text-foreground">
        {team ? "Who approves a production access request?" : 'What does "hold and wait" mean?'}
      </div>
      <div className="flex justify-between gap-2">
        <span className="flex-1 rounded-md border border-border bg-surface py-1 text-center text-muted-foreground">Still learning</span>
        <span className="flex-1 rounded-md border border-primary/40 bg-primary-soft py-1 text-center font-semibold text-primary-text">Got it</span>
      </div>
    </Frame>
  );
}
