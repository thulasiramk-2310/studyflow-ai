import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../components/ui/cn";
import type { AccountType } from "../../types";

const ACCOUNT_CHOICES = [
  ["STUDENT", "I'm a student", "Study groups, sessions and quizzes"],
  ["PROFESSIONAL", "I'm a professional", "Teams, meetings and knowledge checks"],
] as const;

export function SignUp() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>(params.get("for") === "teams" ? "PROFESSIONAL" : "STUDENT");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await register(name, email, password, accountType);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account. Try again.");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Create your account</h1>
      <p className="mt-1 text-base text-muted-foreground">{accountType === "PROFESSIONAL" ? "Start a team and bring your documents." : "Start a study group and bring your notes."}</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div role="radiogroup" aria-label="I'm signing up as" className="grid grid-cols-2 gap-3">
          {ACCOUNT_CHOICES.map(([value, title, sub]) => (
            <button key={value} type="button" role="radio" aria-checked={accountType === value} onClick={() => setAccountType(value)}
              className={cn("rounded-xl border p-3 text-left transition-colors", accountType === value ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/40")}>
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
            </button>
          ))}
        </div>
        <Input label="Full name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" />
          <Input label="Confirm password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" loading={isLoading} className="w-full">{isLoading ? "Creating account…" : "Create account"}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary-text hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
