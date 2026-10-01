import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BookOpenCheck, Quote, Sparkles } from "lucide-react";
import { Logo } from "../components/Icons";

const POINTS = [
  { icon: Quote, text: "Answers cite your own notes, down to the page." },
  { icon: BookOpenCheck, text: "Quizzes and flashcards for every session." },
  { icon: Sparkles, text: "An AI planner that schedules the next session." },
];

/** Wraps Login and Register. Already-authenticated users go straight to /dashboard. */
export function AuthLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-[minmax(360px,44%)_1fr]">
      <aside className="hidden flex-col justify-between border-r border-border bg-sidebar p-10 md:flex">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-5 w-5 text-primary-text" />
          <span className="font-serif text-lg text-primary-text">StudyFlow</span>
        </Link>
        <div>
          <p className="max-w-md font-serif text-2xl text-foreground">
            Study groups that <em className="text-primary-text">actually</em> study.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-base text-muted-foreground">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text"><Icon className="h-4 w-4" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">Open source · RAG · LangGraph agents</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 md:hidden">
            <Logo className="h-5 w-5 text-primary-text" />
            <span className="font-serif text-lg text-primary-text">StudyFlow</span>
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
