import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { authService } from "../../services/auth.service";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This reset link is invalid or has expired.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div>
        <h1 className="font-serif text-2xl text-foreground">Link incomplete</h1>
        <p className="mt-2 text-base text-muted-foreground">Open the link from your email again, or ask for a new one.</p>
        <Link to="/forgot-password" className="mt-6 inline-block font-semibold text-primary-text hover:underline">Send a new reset link</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Choose a new password</h1>
      {done ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          Your password was reset. <Link to="/login" className="font-semibold text-primary-text hover:underline">Sign in</Link> with the new one.
        </div>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="New password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" />
          <Input label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error} <Link to="/forgot-password" className="font-semibold underline">Get a new link</Link>
            </p>
          )}
          <Button type="submit" loading={busy} className="w-full">Reset password</Button>
        </form>
      )}
    </div>
  );
}
