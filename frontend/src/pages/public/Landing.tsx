import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BrainCircuit, FileUp, Layers, Play, Quote, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../../components/Icons";
import { Badge, Button } from "../../components/ui";
import { ArchitectureSVG } from "../../components/landing/ArchitectureSVG";
import { MiniChat, MiniGuardrail, MiniInvite, MiniPlanner, MiniQuiz, MiniSummary } from "../../components/landing/MiniUI";

const GITHUB_URL = "https://github.com/thulasiramk-2310/studyflow-ai";

const FEATURES = [
  { title: "Ask AI with citations", body: "Answers come only from your group's notes, with the file and page they came from.", Mini: MiniChat },
  { title: "AI study planner", body: "Reads the learning path and notes, then proposes the next session with an agenda.", Mini: MiniPlanner },
  { title: "Quizzes and flashcards", body: "Generated for every session and graded with explanations.", Mini: MiniQuiz },
  { title: "Session summaries", body: "Key concepts and important points, written for revision.", Mini: MiniSummary },
  { title: "Groups and invites", body: "Invite classmates with a code and track the group's progress together.", Mini: MiniInvite },
  { title: "Guardrails built in", body: "Prompt-injection attempts are blocked and personal data is masked before the model sees it.", Mini: MiniGuardrail },
];

const STEPS = [
  { icon: FileUp, title: "Upload", body: "PDF, DOCX, PPTX, Markdown" },
  { icon: Layers, title: "Chunk + embed", body: "MiniLM sentence embeddings" },
  { icon: Search, title: "FAISS index", body: "One index per group" },
  { icon: BrainCircuit, title: "Agent router", body: "LangGraph + guardrails" },
  { icon: Quote, title: "Grounded answer", body: "With page citations" },
];

const STACK = ["React + TypeScript", "Spring Boot auth", "FastAPI services", "LangGraph", "FAISS", "PostgreSQL", "nginx", "Docker", "GitHub Actions", "Terraform (AWS)", "Caddy HTTPS"];

const PROOF = [
  { value: "93%", label: "answer recall on the eval set" },
  { value: "100%", label: "prompt-injection attacks blocked" },
  { value: "~10 ms", label: "p50 API latency" },
];

export function Landing() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

  const tryDemo = async () => {
    if (isAuthenticated) return navigate("/dashboard");
    if (!demoEmail || !demoPassword) return navigate("/login");
    setDemoLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate("/dashboard");
    } catch {
      toast.error("The demo account isn't available right now. Try signing in instead.");
      navigate("/login");
    } finally {
      setDemoLoading(false);
    }
  };
  const playIntro = () => window.dispatchEvent(new Event("sf:play-intro"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-[1120px] items-center gap-6 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-primary-text" />
            <span className="font-serif text-lg text-primary-text">StudyFlow</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#architecture" className="hover:text-foreground">Architecture</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isLoading ? null : isAuthenticated ? (
              <Button size="sm" onClick={() => navigate("/dashboard")}>Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Log in</Link>
                <Button size="sm" loading={demoLoading} onClick={tryDemo}>Try the live demo</Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Badge tone="brand">Open source · RAG · LangGraph agents</Badge>
          <h1 className="mt-5 font-serif leading-[1.02] text-foreground" style={{ fontSize: "clamp(40px, 6.4vw, 66px)" }}>
            Study groups that <em className="text-primary-text">actually</em> study.
          </h1>
          <p className="mt-5 max-w-lg text-md text-muted-foreground">
            Upload your notes. StudyFlow answers with citations from your own material, writes the quiz and flashcards, and plans your next session.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button loading={demoLoading} onClick={tryDemo}>Try the live demo — no sign-up</Button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"><Button variant="secondary">View on GitHub</Button></a>
            <Button variant="ghost" icon={Play} onClick={playIntro}>Watch how it works</Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {PROOF.map((p) => (
              <div key={p.label}>
                <dt className="sr-only">{p.label}</dt>
                <dd className="font-serif text-xl text-foreground">{p.value}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">{p.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[28px] bg-primary-soft/60 blur-2xl" aria-hidden />
          <div className="rounded-xl border border-border bg-surface p-4 shadow-float">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-sm bg-primary" /> Operating Systems · Ask AI
            </div>
            <MiniChat />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MiniQuiz />
              <MiniPlanner />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-sidebar/40">
        <div className="mx-auto max-w-[1120px] px-6 py-20">
          <h2 className="font-serif text-2xl text-foreground">Everything a study group needs, nothing it doesn't</h2>
          <p className="mt-2 max-w-xl text-md text-muted-foreground">Every feature works on your group's own notes.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, body, Mini }) => (
              <div key={title} className="rounded-xl border border-border bg-surface p-4">
                <Mini />
                <h3 className="mt-4 text-md font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-[1120px] px-6 py-20">
          <h2 className="font-serif text-2xl text-foreground">How an answer is made</h2>
          <p className="mt-2 max-w-xl text-md text-muted-foreground">Retrieval-augmented generation, with guardrails before and after the model.</p>
          <ol className="mt-10 grid gap-3 md:grid-cols-5">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative rounded-xl border border-border bg-surface p-4">
                <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
                <Icon className="mt-3 h-5 w-5 text-primary-text" />
                <div className="mt-2 text-base font-semibold text-foreground">{title}</div>
                <div className="text-sm text-muted-foreground">{body}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="border-t border-border bg-sidebar/40">
        <div className="mx-auto max-w-[1120px] px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Built like production software</h2>
              <p className="mt-3 text-md text-muted-foreground">
                Three services behind an nginx gateway, deployed with CI/CD, health checks, smoke tests and automatic rollback.
                Every AI answer passes guardrails, and offline evals track answer quality.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary-text" /> Prompt-injection and PII guardrails</div>
              <div className="mt-6 flex flex-wrap gap-2">
                {STACK.map((s) => <span key={s} className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground">{s}</span>)}
              </div>
            </div>
            <ArchitectureSVG />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-6 py-16 text-center">
          <h2 className="font-serif text-2xl">See it with real notes in under a minute</h2>
          <Button variant="secondary" loading={demoLoading} onClick={tryDemo}>Try the live demo</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-5 px-6 py-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Logo className="h-4 w-4 text-primary-text" /><span className="font-serif text-md text-primary-text">StudyFlow</span></span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
          <button onClick={playIntro} className="hover:text-foreground">How it works</button>
          <span className="ml-auto">Built by thulasiramk-2310</span>
        </div>
      </footer>
    </div>
  );
}
