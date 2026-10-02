import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Laptop, Save, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../../components/shared";

const SET_TABS = ["Appearance", "Notifications", "Security", "Account"] as const;
type Tab = (typeof SET_TABS)[number];



const NOTIF_SETTINGS = [
  { title: "Session reminders", desc: "Email me before a session starts" },
  { title: "New resources", desc: "Notify when someone uploads to my groups" },
  { title: "AI recommendations", desc: "Weekly digest of AI study suggestions" },
  { title: "Member activity", desc: "When members join or complete quizzes" },
];

const DISPLAY_THEMES = [
  { key: "light",  label: "Light",  icon: Sun },
  { key: "dark",   label: "Dark",   icon: Moon },
  { key: "system", label: "System", icon: Laptop },
] as const;

export function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Appearance");
  const { theme, setTheme } = useTheme();
  const [notifOn, setNotifOn] = useState([true, true, false, true]);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");

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
            {NOTIF_SETTINGS.map((n, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border-soft last:border-0">
                <div>
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                </div>
                <button onClick={() => {
                  const arr = [...notifOn]; arr[i] = !arr[i]; setNotifOn(arr);
                  toast.success(arr[i] ? `${n.title} enabled` : `${n.title} disabled`);
                }} className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${notifOn[i] ? "bg-primary" : "bg-border"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-all ${notifOn[i] ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Security */}
        {tab === "Security" && (
          <>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="text-base font-bold mb-4">Change password</div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Current password</label>
                  <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">New password</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="8+ characters"
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
              <button onClick={() => { if (!currentPwd || !newPwd) { toast.error("Please fill in both fields"); return; } toast.success("Password updated successfully"); setCurrentPwd(""); setNewPwd(""); }}
                className="mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> Update password
              </button>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-base font-bold">Two-factor authentication</div>
                <div className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account.</div>
              </div>
              <span className="bg-success-soft text-success border border-success rounded-lg px-3 py-1.5 text-xs font-bold">Enabled</span>
            </div>
          </>
        )}

        {/* Account */}
        {tab === "Account" && (
          <>
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="text-base font-bold mb-4">Account details</div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Full name</label>
                  <input defaultValue={user?.name || ""} className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Email</label>
                  <input defaultValue={user?.email || ""} className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
              <button onClick={() => toast.success("Profile updated!", { description: "Your account details have been saved." })}
                className="mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> Save changes
              </button>
            </div>
            <div className="bg-surface border border-danger rounded-xl p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-base font-bold text-danger">Danger zone</div>
                <div className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data.</div>
              </div>
              <button onClick={() => toast.error("Are you sure? This cannot be undone.", { action: { label: "Delete", onClick: () => toast.error("Account deleted") } })}
                className="bg-surface text-destructive border border-danger rounded-lg px-4 py-2 text-xs font-bold hover:bg-danger-soft transition-colors">
                Delete account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
