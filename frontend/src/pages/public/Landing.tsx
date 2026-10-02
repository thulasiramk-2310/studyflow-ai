import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, CalendarClock, Check, FileUp, GraduationCap, MessagesSquare, Play, Plus, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../../components/Icons";
import { Button } from "../../components/ui";
import { MiniChat, MiniFlashcards, MiniInvite, MiniPlanner, MiniQuiz, MiniSummary } from "../../components/landing/MiniUI";
import { IntroExperience } from "../../components/intro/IntroExperience";

const FORMATS = ["PDF", "Word", "PowerPoint", "Markdown", "Plain text"];

const PROBLEMS = [
  { before: "Notes scattered across chats and drives", after: "One shared library per group, searchable by question" },
  { before: "Study sessions that drift off topic", after: "Every session starts with a planned agenda" },
  { before: "Cramming the night before the exam", after: "Quizzes and flashcards after every session" },
];

const FEATURES = [
  { title: "Ask your notes", body: "Get answers from your group's own material, with the file and page each one came from.", Mini: MiniChat },
  { title: "Plan the next session", body: "StudyFlow reads your learning path and notes, then suggests what to cover next.", Mini: MiniPlanner },
  { title: "Quizzes that explain", body: "A quiz for every session, graded instantly, with the reason behind each answer.", Mini: MiniQuiz },
  { title: "Flashcards for revision", body: "Key terms from the session turned into cards you can flip through on any device.", Mini: MiniFlashcards },
  { title: "Session summaries", body: "The key ideas from each session, written up so nobody has to take minutes.", Mini: MiniSummary },
  { title: "Groups and invites", body: "Share a six-character code, and classmates join with everything already in place.", Mini: MiniInvite },
];

const STEPS = [
  { icon: UserPlus, title: "Start a group", body: "Name it after your course and invite classmates with a code." },
  { icon: FileUp, title: "Add your notes", body: "Drop in lecture slides, readings and handouts. They are ready in seconds." },
  { icon: MessagesSquare, title: "Study together", body: "Ask questions, run planned sessions, then quiz yourselves on what you covered." },
];

const USE_CASES = [
  { icon: GraduationCap, title: "Exam prep", body: "Turn a semester of slides into quizzes and flashcards in the weeks before finals." },
  { icon: Users, title: "Course study groups", body: "Keep the whole group on the same notes, schedule and agenda." },
  { icon: BookOpenCheck, title: "Self-study", body: "Create a group of one and use StudyFlow as a tutor for your own reading." },
];

const FAQ = [
  { q: "Is StudyFlow free?", a: "Yes. Create an account, start groups and invite classmates without paying anything." },
  { q: "Does the AI make things up?", a: "Answers are drawn only from the notes your group uploaded, and each one shows the source file and page. If the notes don't cover a question, StudyFlow says so instead of guessing." },
  { q: "Which files can I upload?", a: "PDF, Word (.docx), PowerPoint (.pptx), Markdown and plain text." },
  { q: "Who can see my group's notes?", a: "Only members of that group. Someone needs your invite code to join." },
  { q: "Does it work on my phone?", a: "Yes. StudyFlow runs in the browser on phones, tablets and laptops, with light and dark themes." },
];

export function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const playIntro = () => window.dispatchEvent(new Event("sf:play-intro"));
  const start = () => navigate(isAuthenticated ? "/dashboard" : "/register");
  const startLabel = isAuthenticated ? "Go to dashboard" : "Get started free";

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <IntroExperience />
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-[1120px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-primary-text" />
            <span className="font-serif text-lg text-primary-text">StudyFlow</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isLoading ? null : isAuthenticated ? (
              <Button size="sm" onClick={start}>Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Log in</Link>
                <Button size="sm" onClick={start}>Sign up</Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary-text">For students and study groups</span>
          <h1 className="mt-4 font-serif leading-[1.02] text-foreground" style={{ fontSize: "clamp(40px, 6.4vw, 66px)" }}>
            Study groups that <em className="text-primary-text">actually</em> study.
          </h1>
          <p className="mt-5 max-w-lg text-md text-muted-foreground">
            Upload your notes once. StudyFlow answers questions from them, plans your next session, and writes the quiz and flashcards for revision.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={start}>{startLabel} <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="secondary" icon={Play} onClick={playIntro}>Watch the 25-second tour</Button>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {["Free for students", "No credit card", "Works on any device"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary-text" />{t}</li>
            ))}
          </ul>
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

      {/* Formats strip */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Works with the notes you already have:</span>
          {FORMATS.map((f) => <span key={f} className="font-semibold text-foreground">{f}</span>)}
        </div>
      </section>

      {/* Problem → outcome */}
      <section className="border-t border-border bg-sidebar/40">
        <div className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl font-serif text-2xl text-foreground">Group study usually falls apart in the same three places</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PROBLEMS.map(({ before, after }) => (
              <div key={before} className="rounded-xl border border-border bg-surface p-5">
                <div className="text-sm text-muted-foreground line-through decoration-border">{before}</div>
                <div className="mt-3 flex gap-2 text-md font-semibold text-foreground">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary-text" />{after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-border">
        <div className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6">
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
      <section id="how" className="scroll-mt-16 border-t border-border bg-sidebar/40">
        <div className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Up and running in three steps</h2>
              <p className="mt-2 max-w-xl text-md text-muted-foreground">From an empty group to your first answer in minutes.</p>
            </div>
            <Button variant="ghost" icon={Play} onClick={playIntro}>Watch the tour</Button>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary-text"><Icon className="h-4 w-4" /></span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Step {i + 1}</span>
                </div>
                <div className="mt-4 text-md font-semibold text-foreground">{title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6">
          <h2 className="font-serif text-2xl text-foreground">Made for how students really study</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {USE_CASES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="h-5 w-5 text-primary-text" />
                <h3 className="mt-3 text-md font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-t border-border bg-sidebar/40">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="font-serif text-2xl text-foreground">Questions, answered</h2>
            <p className="mt-2 text-md text-muted-foreground">Anything else? Start a group and see for yourself. It's free.</p>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-md font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
          <CalendarClock className="h-6 w-6" />
          <h2 className="font-serif text-2xl">Your next study session, already planned</h2>
          <Button variant="secondary" onClick={start}>{startLabel}</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-12 text-sm sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
          <div>
            <span className="flex items-center gap-2"><Logo className="h-4 w-4 text-primary-text" /><span className="font-serif text-md text-primary-text">StudyFlow</span></span>
            <p className="mt-2 max-w-xs text-muted-foreground">The study space for groups that want to learn, not just meet.</p>
          </div>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">Product</span>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <button onClick={playIntro} className="text-left hover:text-foreground">Product tour</button>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">Account</span>
            <Link to="/register" className="hover:text-foreground">Sign up</Link>
            <Link to="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-[1120px] px-4 py-5 text-xs text-muted-foreground sm:px-6">© {new Date().getFullYear()} StudyFlow</div>
        </div>
      </footer>
    </div>
  );
}
