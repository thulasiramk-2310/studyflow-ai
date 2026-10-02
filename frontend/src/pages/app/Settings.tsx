import { useEffect, useState } from "react";
import { useTerms } from "../../hooks/useTerms";
import { toast } from "sonner";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Laptop, Save, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../../components/shared";
import { Button, Input, Modal } from "../../components/ui";
import { notificationService, type NotificationPreferences } from "../../services/notification.service";

const SET_TABS = ["Appearance", "Notifications", "Security", "Account"] as const;
type Tab = (typeof SET_TABS)[number];



// In-app notifications only: StudyFlow does not send notification emails.
const notifSettings = (t: ReturnType<typeof useTerms>): { key: keyof NotificationPreferences; title: string; desc: string }[] => [
  { key: "sessions", title: t.sessions, desc: `When a ${t.sessionLower} is scheduled, changed or completed, or a call link is added` },
  { key: "resources", title: "Notes and documents", desc: `When someone uploads or removes a file in your ${t.groupsLower}` },
  { key: "ai_results", title: "AI results", desc: `When a summary, ${t.quiz.toLowerCase()}, ${t.flashcards.toLowerCase()} or plan is ready` },
  { key: "members", title: "Members", desc: `When people join or leave your ${t.groupsLower}` },
];

const DISPLAY_THEMES = [
  { key: "light",  label: "Light",  icon: Sun },
  { key: "dark",   label: "Dark",   icon: Moon },
  { key: "system", label: "System", icon: Laptop },
] as const;

export function Settings() {
  const { user, setAccountType, updateName, deleteAccount } = useAuth();
  const terms = useTerms();
  const NOTIF_SETTINGS = notifSettings(terms);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Appearance");
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setName(user?.name ?? ""); }, [user?.name]);

  useEffect(() => {
    if (tab !== "Notifications" || prefs) return;
    notificationService.getPreferences().then(setPrefs).catch(() => toast.error("Couldn't load notification settings"));
  }, [tab, prefs]);

  const togglePref = async (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try { await notificationService.updatePreferences(next); }
    catch { setPrefs(prefs); toast.error("Couldn't save that setting. Try again."); }
  };

  const changePassword = async () => {
    if (!currentPwd || !newPwd) { toast.error("Fill in both fields"); return; }
    if (newPwd.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setPwdBusy(true);
    try {
      await authService.changePassword(currentPwd, newPwd);
      toast.success("Password updated");
      setCurrentPwd(""); setNewPwd("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the password");
    } finally { setPwdBusy(false); }
  };

  const saveName = async () => {
    setNameBusy(true);
    try { await updateName(name.trim()); toast.success("Name updated"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't update your name"); }
    finally { setNameBusy(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true); setDeleteError(null);
    try { await deleteAccount(deletePwd); toast.success("Your account was deleted"); navigate("/", { replace: true }); }
    catch (e) { setDeleteError(e instanceof Error ? e.message : "Couldn't delete your account"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8 md:px-8">
      <PageHeader title="Settings" subtitle="Manage your workspace preferences and account." />

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border mb-5">
        {SET_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors -mb-px ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {/* Appearance */}
        {tab === "Appearance" && (
          <>
            <div className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text"><BookOpen className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold">Guide</div>
                <div className="text-sm text-muted-foreground">A 25-second tour of how StudyFlow works, plus where to find each feature.</div>
              </div>
              <Link to="/guide" className="shrink-0 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-muted">How StudyFlow works</Link>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="text-base font-bold mb-1">Display theme</div>
              <div className="text-xs text-muted-foreground mb-4">Choose between light, dark, or follow your system preference.</div>
              <div className="flex gap-3">
                {DISPLAY_THEMES.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => { setTheme(key); toast.success(`Theme set to ${label}`); }}
                    className={`flex-1 flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-all ${theme === key ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-border-soft"}`}>
                    <Icon className={`w-5 h-5 ${theme === key ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-semibold ${theme === key ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

          </>
        )}

        {/* Notifications */}
        {tab === "Notifications" && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 text-xs text-muted-foreground border-b border-border-soft">In-app notifications (the bell). StudyFlow doesn't send notification emails.</div>
            {!prefs ? (
              <div className="px-5 py-4 text-sm text-muted-foreground">Loading…</div>
            ) : NOTIF_SETTINGS.map((n) => (
              <div key={n.key} className="flex items-center justify-between px-5 py-4 border-b border-border-soft last:border-0">
                <div>
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                </div>
                <button role="switch" aria-checked={prefs[n.key]} aria-label={n.title} onClick={() => togglePref(n.key)}
                  className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${prefs[n.key] ? "bg-primary" : "bg-border"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-all ${prefs[n.key] ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Security */}
        {tab === "Security" && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="text-base font-bold mb-4">Change password</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Input label="Current password" type="password" autoComplete="current-password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              <Input label="New password" type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="8+ characters" />
            </div>
            <Button className="mt-4" icon={Save} loading={pwdBusy} onClick={changePassword}>Update password</Button>
          </div>
        )}

        {/* Account */}
        {tab === "Account" && (
          <>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="text-base font-bold mb-1">Account type</div>
              <div className="text-xs text-muted-foreground mb-4">Changes the wording you see across StudyFlow. Each team or study group keeps its own style. {/* terms-ok: names both styles */}</div>
              <div className="flex gap-3">
                {([["STUDENT", "Student"], ["PROFESSIONAL", "Professional"]] as const).map(([value, label]) => (
                  <button key={value} aria-pressed={user?.accountType === value} onClick={async () => {
                    try { await setAccountType(value); toast.success(value === "PROFESSIONAL" ? "Switched to professional wording" : "Switched to student wording"); }
                    catch { toast.error("Couldn't change account type. Try again."); }
                  }}
                    className={`flex-1 border-2 rounded-xl p-4 text-sm font-semibold transition-all ${user?.accountType === value ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted-foreground hover:border-border-soft"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="text-base font-bold mb-4">Account details</div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email" value={user?.email ?? ""} readOnly hint="Your sign-in email can't be changed yet." />
              </div>
              <Button className="mt-4" icon={Save} loading={nameBusy} disabled={name.trim().length < 2 || name.trim() === user?.name} onClick={saveName}>Save changes</Button>
            </div>
            <div className="bg-surface border border-danger rounded-xl p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-base font-bold text-danger">Delete account</div>
                <div className="text-xs text-muted-foreground mt-0.5">Removes your account, your memberships and any {terms.groupLower} you're the only member of.</div>
              </div>
              <Button variant="danger" size="sm" onClick={() => { setDeleteOpen(true); setDeletePwd(""); setDeleteError(null); }}>Delete account</Button>
            </div>
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account?"
              footer={<>
                <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" loading={deleting} disabled={!deletePwd} onClick={confirmDelete}>Delete permanently</Button>
              </>}>
              <p className="text-sm text-muted-foreground">This can't be undone. If you own a {terms.groupLower} that has other members, delete it or remove them first.</p>
              <div className="mt-4">
                <Input label="Your password" type="password" autoComplete="current-password" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
              </div>
              {deleteError && <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{deleteError}</p>}
            </Modal>
          </>
        )}
      </div>
    </div>
  );
}
