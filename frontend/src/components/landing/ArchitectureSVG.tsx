import type { ReactNode } from "react";

/** System architecture, drawn with tokens so it follows light and dark mode. */

function Node({ title, detail, tone = "default" }: { title: string; detail: string; tone?: "default" | "brand" }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${tone === "brand" ? "border-primary/30 bg-primary-soft" : "border-border bg-surface"}`}>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function Down({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-1 text-xs text-muted-foreground" aria-hidden>
      <span className="h-4 w-px bg-border" />
      {children}
      <span className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-border" />
    </div>
  );
}

export function ArchitectureSVG() {
  return (
    <div className="mx-auto w-full max-w-3xl" role="img" aria-label="StudyFlow architecture: browser to HTTPS proxy to nginx gateway to auth, study and AI services, backed by PostgreSQL, FAISS and Groq.">
      <div className="mx-auto max-w-xs"><Node title="React app" detail="Vite · TypeScript · Tailwind" /></div>
      <Down>HTTPS</Down>
      <div className="mx-auto max-w-sm"><Node title="Caddy / CloudFront" detail="TLS, static frontend, single origin" /></div>
      <Down />
      <div className="mx-auto max-w-sm"><Node title="nginx API gateway" detail="Routing · rate limits · real client IP" tone="brand" /></div>
      <Down />
      <div className="grid gap-3 sm:grid-cols-3">
        <Node title="Auth service" detail="Spring Boot · JWT · Flyway" />
        <Node title="Study service" detail="FastAPI · groups, sessions, quizzes" />
        <Node title="AI service" detail="FastAPI · LangGraph agents · guardrails" tone="brand" />
      </div>
      <Down />
      <div className="grid gap-3 sm:grid-cols-3">
        <Node title="PostgreSQL" detail="Users, groups, sessions, chats" />
        <Node title="FAISS" detail="Per-group vector index · MiniLM" />
        <Node title="Groq" detail="LLM inference (gpt-oss-20b)" />
      </div>
    </div>
  );
}
