import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Button } from "../ui";
import { cn } from "../ui/cn";
import { IntroCanvas, CANVAS_H, CANVAS_W, type CanvasState } from "./IntroCanvas";
import { INTRO_MS, SCRIPTS, type Caption, type CameraTarget } from "./timeline";
import type { Audience } from "../../types";

const INITIAL: CanvasState = {
  fileDropped: false, indexed: false, typed: "", sent: false, streamed: "", citationGlow: false, answerPicked: false, cursor: null,
};

/** Offset of a data-cam element relative to the canvas, measured at zoom 1. */
function camBox(canvas: HTMLElement, target: string) {
  const el = canvas.querySelector<HTMLElement>(`[data-cam="${target}"]`);
  if (!el) return null;
  let x = 0, y = 0, e: HTMLElement | null = el;
  while (e && e !== canvas) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent as HTMLElement | null; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function IntroStage({ onDone, embedded = false, audience = "student" }: { onDone: () => void; embedded?: boolean; audience?: Audience }) {
  const script = SCRIPTS[audience];
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const camera = useRef<{ target: CameraTarget; zoom: number }>({ target: "wide", zoom: 1 });
  const [state, setState] = useState<CanvasState>(INITIAL);
  const [caption, setCaption] = useState<Caption>(script.beats[0].caption as Caption);
  const [ended, setEnded] = useState(Boolean(reduce));
  const [moving, setMoving] = useState(false);
  const [progress, setProgress] = useState(false);

  const frame = useCallback(() => {
    const vp = viewport.current, cv = canvas.current, w = world.current;
    if (!vp || !cv || !w) return;
    const { target, zoom } = camera.current;
    const vw = vp.clientWidth, vh = vp.clientHeight;
    const fit = Math.min(vw / CANVAS_W, vh / CANVAS_H);
    let cx = CANVAS_W / 2, cy = CANVAS_H / 2, s = fit * 0.86;
    if (target !== "wide") {
      const b = camBox(cv, target);
      if (b) { cx = b.x + b.w / 2; cy = b.y + b.h / 2; s = fit * zoom; }
    }
    w.style.transform = `translate(${vw / 2 - cx * s}px, ${vh / 2 - cy * s}px) scale(${s})`;
  }, []);

  // Run the timeline once.
  useEffect(() => {
    if (reduce) return;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const patch = (p: Partial<CanvasState>) => setState((s) => ({ ...s, ...p }));
    requestAnimationFrame(() => setProgress(true));

    const { beats, question, answer } = script;
    for (const beat of beats) {
      later(beat.at, () => {
        if (beat.caption) setCaption(beat.caption);
        if (beat.camera) {
          camera.current = beat.camera;
          setMoving(true);
          frame();
          later(1300, () => setMoving(false)); // let the browser re-rasterise at the final scale
        }
        switch (beat.action) {
          case "dropFile": patch({ fileDropped: true }); break;
          case "indexed": patch({ indexed: true }); break;
          case "typeQuestion":
            for (let i = 1; i <= question.length; i++) later(i * 32, () => patch({ typed: question.slice(0, i) }));
            break;
          case "clickSend":
            patch({ cursor: { target: "send", click: Date.now() } });
            later(800, () => patch({ typed: "", sent: true, cursor: null }));
            break;
          case "streamAnswer": {
            const words = answer.split(" ");
            words.forEach((_, i) => later(i * 70, () => patch({ streamed: words.slice(0, i + 1).join(" ") })));
            break;
          }
          case "glowCitation": patch({ citationGlow: true }); break;
          case "pickAnswer":
            patch({ citationGlow: false, cursor: { target: "answer", click: Date.now() } });
            later(800, () => patch({ answerPicked: true }));
            later(2600, () => patch({ cursor: null }));
            break;
          case "end": setEnded(true); break;
        }
      });
    }
    return () => timers.forEach(clearTimeout);
  }, [reduce, frame, script]);

  // Re-frame on resize; Esc skips.
  useEffect(() => {
    frame();
    const onResize = () => frame();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("keydown", onKey); };
  }, [frame, onDone]);

  // Auto-continue a few seconds after the title card appears.
  useEffect(() => {
    if (!ended || embedded || reduce) return;
    const t = window.setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [ended, embedded, reduce, onDone]);

  const cursorBox = state.cursor && canvas.current ? camBox(canvas.current, state.cursor.target) : null;

  return (
    <div
      role="dialog"
      aria-label="How StudyFlow works"
      className={cn(
        "flex flex-col overflow-clip bg-background",
        embedded ? "absolute inset-0" : "fixed inset-0 z-[60] min-[900px]:grid min-[900px]:grid-cols-[36%_1fr]",
      )}
    >
      {!reduce && (
        <div className="absolute left-0 top-0 z-20 h-[3px] bg-primary" style={{ width: progress ? "100%" : "0%", transition: `width ${INTRO_MS}ms linear` }} />
      )}
      <Button size="sm" variant="secondary" onClick={onDone} className="absolute right-4 top-4 z-30">Skip intro →</Button>

      {/* Split-stage caption */}
      <div className={cn("relative z-10 flex shrink-0 flex-col justify-center", embedded ? "gap-1 px-5 pb-2 pt-3 pr-36" : "gap-3 px-8 pb-4 pt-14 min-[900px]:border-r min-[900px]:border-border min-[900px]:bg-sidebar/60 min-[900px]:px-12 min-[900px]:py-0")}>
        <div key={caption.title} className="animate-[sfFade_0.4s_ease]">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-primary-text">{caption.step}</div>
          <div className="mt-2 font-serif text-foreground" style={{ fontSize: embedded ? "clamp(18px, 2vw, 24px)" : "clamp(28px, 3.4vw, 44px)", lineHeight: 1.05 }}>{caption.title}</div>
          {caption.body && !embedded && <p className="mt-3 max-w-md text-md text-muted-foreground">{caption.body}</p>}
        </div>
        <div className={cn("flex gap-1.5", embedded ? "mt-1" : "mt-2")} aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn("h-[3px] w-7 rounded-full transition-colors duration-300", caption.index >= i || (caption.index === 0 && ended) ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>

      {/* Camera viewport */}
      <div ref={viewport} className="relative min-h-0 flex-1 overflow-clip bg-[radial-gradient(120%_100%_at_70%_0%,hsl(var(--primary-soft))_0%,hsl(var(--background))_60%)]">
        <div
          ref={world}
          className="absolute left-0 top-0"
          style={{
            transformOrigin: "0 0",
            transition: reduce ? "none" : "transform 1.25s cubic-bezier(.65,0,.25,1)",
            willChange: moving ? "transform" : "auto",
          }}
        >
          <IntroCanvas ref={canvas} state={state} content={script.canvas} />
          {cursorBox && (
            <svg
              key={state.cursor?.click}
              viewBox="0 0 24 24"
              width="26"
              height="26"
              className="absolute z-10 animate-[sfFade_0.2s_ease] drop-shadow"
              style={{ left: cursorBox.x + cursorBox.w * 0.55, top: cursorBox.y + cursorBox.h * 0.55 }}
              aria-hidden
            >
              <path d="M4 2l16 9-7 2-3 7z" fill="hsl(var(--foreground))" stroke="hsl(var(--background))" strokeWidth="1.5" />
            </svg>
          )}
        </div>

        {/* Closing title card */}
        <div className={cn("absolute inset-0 z-20 grid place-items-center bg-background/95 px-6 text-center transition-opacity duration-700", ended ? "opacity-100" : "pointer-events-none opacity-0")}>
          <div>
            <div className="font-serif text-xl text-primary-text">StudyFlow</div>
            <div className="mt-3 font-serif text-foreground" style={{ fontSize: "clamp(30px, 4.4vw, 56px)", lineHeight: 1.02 }}>
              {script.closing[0]}<em className="text-primary-text">{script.closing[1]}</em>{script.closing[2]}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={onDone}>{embedded ? "Close" : "Explore StudyFlow"}</Button>
              {!embedded && <Button variant="secondary" onClick={() => { onDone(); navigate("/login"); }}>Sign in</Button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
