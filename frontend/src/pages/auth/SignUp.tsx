import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkle, Logo } from "../../components/Icons";
import { useAuth } from "../../hooks/useAuth";

export function SignUp() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await register(name, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account. Try again.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background min-h-screen p-6 animate-[sfFade_0.25s_ease]">
      <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-9">
        <div className="flex items-center gap-2.5 font-bold text-[15px] text-primary">
          <Logo className="w-5 h-5" /> StudyFlow AI
        </div>

        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1 text-muted-foreground text-[13.5px] font-medium">
          Start learning with your group in minutes.
        </p>

        {error && (
          <div className="mt-3 bg-destructive/10 border border-destructive/30 text-destructive text-[12.5px] font-semibold px-3.5 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <form
          className="mt-5 flex flex-col gap-3.5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-[12.5px] font-semibold mb-1.5 text-foreground">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Okafor"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold mb-1.5 text-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold mb-1.5 text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold mb-1.5 text-foreground">
                Confirm
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="mt-1">
            <div className="bg-primary-soft border border-primary-soft rounded-xl p-3 flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-surface text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Sparkle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[12px] leading-relaxed text-muted-foreground font-medium">
                No role to pick. Create a group and you organize it; join one
                and you're a member. You can be both.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20 mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-[13px] text-muted-foreground font-medium">
          Already have an account?{" "}
          <Link
            to="/"
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
