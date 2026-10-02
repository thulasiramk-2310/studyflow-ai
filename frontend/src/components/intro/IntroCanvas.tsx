import { forwardRef } from "react";
import { Calendar, Check, FileText, FolderOpen, Home, Send, Sparkles, Users } from "lucide-react";
import { RichText } from "../ui";

export const CANVAS_W = 1280;
export const CANVAS_H = 780;

export interface CanvasState {
  fileDropped: boolean;
  indexed: boolean;
  typed: string;
  sent: boolean;
  streamed: string;
  citationGlow: boolean;
  answerPicked: boolean;
  cursor: { target: string; click: number } | null;
}

/**
 * A fixed-size, presentational copy of StudyFlow used by the intro's camera.
 * Elements the camera can frame carry data-cam attributes.
 */
export const IntroCanvas = forwardRef<HTMLDivElement, { state: CanvasState }>(function IntroCanvas({ state }, ref) {
  const nav = [
    { icon: Home, label: "Today" },
    { icon: Users, label: "Groups", on: true },
    { icon: Calendar, label: "Sessions" },
    { icon: Sparkles, label: "Ask AI" },
    { icon: FolderOpen, label: "Library" },
  ];
  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute left-0 top-0 flex overflow-hidden rounded-xl border border-border bg-background shadow-float"
      style={{ width: CANVAS_W, height: CANVAS_H, transformOrigin: "0 0" }}
    >
      <aside className="flex w-[210px] shrink-0 flex-col gap-1 border-r border-border bg-sidebar px-3 py-5">
        <div className="mb-4 px-2 font-serif text-xl text-primary-text">StudyFlow</div>
        {nav.map(({ icon: Icon, label, on }) => (
          <div key={label} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-base ${on ? "bg-surface font-semibold text-foreground shadow-[0_0_0_1px_hsl(var(--border))]" : "text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />{label}
          </div>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-border px-6 text-sm text-muted-foreground">
          <div className="w-72 rounded-lg border border-border bg-surface px-3 py-1.5">Search or jump to…</div>
          <span className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">DS</span>
        </div>

        <div className="grid flex-1 grid-cols-[1fr_1.15fr] gap-5 p-6">
          <div className="flex flex-col gap-5">
            <div>
              <div className="font-serif text-2xl text-foreground">Operating Systems</div>
              <div className="text-sm text-muted-foreground">Study group · 2 members</div>
            </div>

            <div data-cam="upload" className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex justify-between text-base font-semibold text-foreground">Library <span className="text-sm font-normal text-muted-foreground">Upload notes</span></div>
              <div className="relative grid h-24 place-items-center rounded-lg border-[1.5px] border-dashed border-border text-sm text-muted-foreground">
                <span className={`transition-opacity duration-300 ${state.fileDropped ? "opacity-0" : "opacity-100"}`}>Drop PDFs, slides or notes here</span>
                <div
                  className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-base font-semibold text-foreground shadow-float transition-all duration-700"
                  style={{ top: state.fileDropped ? 22 : -120, opacity: state.fileDropped ? 1 : 0, transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-danger-soft text-xs font-bold text-danger">PDF</span>
                  os_notes.pdf <span className="font-normal text-muted-foreground">16 KB</span>
                </div>
              </div>
              <div className={`mt-3 flex items-center gap-2 text-sm text-foreground transition-opacity duration-300 ${state.fileDropped ? "opacity-100" : "opacity-0"}`}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-primary-text"><Check className="h-3 w-3" /></span>Chunked and embedded
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-[width] duration-[1400ms] ease-out" style={{ width: state.fileDropped ? "100%" : "0%" }} />
              </div>
              <div className={`mt-3 flex items-center gap-2 text-sm text-foreground transition-opacity duration-300 ${state.indexed ? "opacity-100" : "opacity-0"}`}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-primary-text"><Check className="h-3 w-3" /></span><b>Indexed</b> — ready for questions
              </div>
            </div>

            <div data-cam="quiz" className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex justify-between text-base font-semibold text-foreground">Session quiz <span className="text-sm font-normal text-muted-foreground">3 of 8</span></div>
              <div className="mb-2 font-serif text-lg leading-snug text-foreground">Which state does the Banker's algorithm keep the system in?</div>
              {["Deadlocked", "A safe state", "Preempted"].map((o) => {
                const correct = o === "A safe state";
                const picked = correct && state.answerPicked;
                return (
                  <div
                    key={o}
                    data-cam={correct ? "answer" : undefined}
                    className={`mt-2 flex items-center justify-between rounded-lg border px-3 py-2 text-base transition-colors duration-300 ${picked ? "border-primary/50 bg-primary-soft text-foreground" : "border-border text-foreground"}`}
                  >
                    {o}
                    {picked && <span className="flex items-center gap-1 text-sm font-semibold text-primary-text"><Check className="h-3.5 w-3.5" />Correct</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div data-cam="chat" className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex justify-between text-base font-semibold text-foreground">Ask AI <span className="text-sm font-normal text-muted-foreground">answers only from this group's notes</span></div>
            <div className={`max-w-[85%] self-end rounded-xl bg-primary px-4 py-2.5 text-base text-primary-foreground transition-opacity duration-300 ${state.sent ? "opacity-100" : "opacity-0"}`}>
              What are the four conditions for deadlock?
            </div>
            <div className={`max-w-[88%] rounded-xl border border-border bg-background px-4 py-3 transition-opacity duration-300 ${state.streamed ? "opacity-100" : "opacity-0"}`}>
              <RichText text={state.streamed || " "} className="text-base leading-relaxed text-foreground" />
              <div className={`mt-3 flex gap-2 transition-opacity duration-300 ${state.streamed.length > 60 ? "opacity-100" : "opacity-0"}`}>
                <span
                  data-cam="citation"
                  className={`inline-flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1 text-sm text-foreground transition-shadow duration-300 ${state.citationGlow ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.25)]" : "border-border"}`}
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />os_notes.pdf · page 4 · <b className="text-primary-text">72%</b>
                </span>
                <span className="inline-flex items-center rounded-lg border border-border bg-surface px-2.5 py-1 text-sm text-foreground">page 2 · <b className="ml-1 text-primary-text">34%</b></span>
              </div>
            </div>
            <div data-cam="input" className="mt-auto flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground">
              <span>{state.typed}<span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-primary" /></span>
              <span data-cam="send" className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Send className="h-3.5 w-3.5" /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
