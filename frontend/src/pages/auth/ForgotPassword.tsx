import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { authService } from "../../services/auth.service";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the reset email. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Reset your password</h1>
      {sent ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          If <b>{email.trim()}</b> has a StudyFlow account, a reset link is on its way. It works once and expires in 30 minutes.
          Check your spam folder if it doesn't arrive.
        </div>
      ) : (
        <>
          <p className="mt-1 text-base text-muted-foreground">Enter your account email and we'll send you a reset link.</p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" />
            {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">Send reset link</Button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/login" className="font-semibold text-primary-text hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
