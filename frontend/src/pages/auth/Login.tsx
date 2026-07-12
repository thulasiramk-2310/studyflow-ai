import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sparkle, Logo } from "../../components/Icons";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Navigate to the page the user was trying to reach, or dashboard
  const from =
    (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      toast.success("Welcome back!", { description: "You've been signed in successfully." });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div className="flex-1 flex bg-background">
      {/* Left panel — gradient */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${120 + i * 80}px`,
                height: `${120 + i * 80}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Sparkle className="w-7 h-7" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            Study together.
          </div>
          <div className="text-2xl font-extrabold tracking-tight opacity-75">
            Learn faster.
          </div>
          <div className="mt-4 text-[13.5px] text-white/70 leading-relaxed max-w-[280px]">
            AI-powered study groups with smart resources, sessions, and quizzes
            — all in one place.
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="flex items-center gap-2.5 font-bold text-[15px] text-primary mb-6">
            <Logo className="w-5 h-5" /> StudyFlow AI
          </div>

          <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-muted-foreground text-[13.5px] font-medium">
            Sign in to continue to your study groups.
          </p>

          {/* Info hint */}
          <div className="mt-4 bg-primary-soft border border-primary/20 rounded-xl p-3 flex gap-2.5 items-start">
            <Sparkle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[12px] leading-relaxed text-muted-foreground font-medium">
              Sign in with your registered <b className="text-foreground">StudyFlow AI</b> account.
            </p>
          </div>

          <form className="mt-5 flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-[12.5px] font-semibold px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12.5px] font-semibold mb-1.5 text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@studyflow.ai"
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold mb-1.5 text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20 mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-[13px] text-muted-foreground font-medium">
            No account?{" "}
            <Link
              to="/register"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
