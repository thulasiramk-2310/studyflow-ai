import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

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
    <div>
      <h1 className="font-serif text-2xl text-foreground">Welcome back</h1>
      <p className="mt-1 text-base text-muted-foreground">Sign in to continue to your study groups.</p>

      {demoEmail && demoPassword && (
        <Card className="mt-6 bg-primary-soft">
          <div className="text-sm font-semibold text-foreground">Try the demo</div>
          <div className="mt-1 text-sm text-muted-foreground">{demoEmail} / {demoPassword}</div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => { setEmail(demoEmail); setPassword(demoPassword); }}
          >
            Fill in demo login
          </Button>
        </Card>
      )}

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
        <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" loading={isLoading} className="w-full">{isLoading ? "Signing in…" : "Sign in"}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/register" className="font-semibold text-primary-text hover:underline">Create one free</Link>
      </p>
    </div>
  );
}
