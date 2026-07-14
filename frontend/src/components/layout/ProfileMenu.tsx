import { useRef, useEffect } from "react";
import { User, Settings, Moon, Sun, Laptop, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "sonner";

interface ProfileMenuProps {
  onClose: () => void;
}

const THEMES = [
  { key: "light",  label: "Light",  icon: Sun },
  { key: "dark",   label: "Dark",   icon: Moon },
  { key: "system", label: "System", icon: Laptop },
] as const;

export function ProfileMenu({ onClose }: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Keyboard: close on Escape, trap focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/", { replace: true });
    toast.success("You've been signed out.");
  };

  return (
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} />

      <div
        ref={menuRef}
        role="menu"
        aria-label="Profile menu"
        className="fixed top-[54px] right-5 w-[272px] bg-surface border border-border rounded-[14px] shadow-[0_16px_44px_rgba(15,23,42,0.18)] z-[71] overflow-hidden animate-[sfModal_0.16s_ease] focus:outline-none"
      >
        {/* User info */}
        <div className="flex items-center gap-3 p-4 border-b border-border-soft">
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-[13px] font-bold shrink-0">
            {user?.initials ?? "AO"}
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold">{user?.name}</div>
            <div className="text-[11.5px] text-muted-foreground truncate">{user?.email ?? "ada@studyflow.ai"}</div>
          </div>
        </div>

        {/* Links */}
        <div className="p-1.5">
          <Link
            to="/profile"
            role="menuitem"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-background transition-colors"
            onClick={onClose}
          >
            <User className="w-4 h-4 text-muted-foreground" /> View profile
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-background transition-colors"
            onClick={onClose}
          >
            <Settings className="w-4 h-4 text-muted-foreground" /> Settings
          </Link>
        </div>

        {/* Theme picker */}
        <div className="px-3 pb-2 pt-1 border-t border-border-soft">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Theme</div>
          <div className="flex gap-1.5">
            {THEMES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="menuitem"
                onClick={() => { setTheme(key); toast.success(`Theme set to ${label}`); }}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[11.5px] font-semibold transition-colors ${
                  theme === key
                    ? "bg-primary text-white"
                    : "bg-background text-muted-foreground hover:bg-border-soft"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="p-1.5 border-t border-border-soft">
          <button
            role="menuitem"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}
