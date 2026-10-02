import { useState, useEffect, useRef } from "react";
import { Search, Plus, Bell, Menu, Users, KeyRound, CalendarPlus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileMenu } from "./ProfileMenu";
import { SearchModal } from "../shared/SearchModal";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../hooks/useAuth";
import { Breadcrumb } from "../shared/Breadcrumb";
import { notificationService } from "../../services/notification.service";
import { groupService, type Group } from "../../services/group.service";
import { CreateGroupModal } from "../groups/CreateGroupModal";
import { JoinGroupModal } from "../groups/JoinGroupModal";
import { CreateSessionModal } from "../sessions/CreateSessionModal";
import { DragDropUploader } from "../resources/DragDropUploader";
import { Avatar, Button, ThemeToggle } from "../ui";

type NewAction = "group" | "join" | "session" | "upload" | null;

const NEW_ITEMS = [
  { key: "group" as const, label: "New group", icon: Users },
  { key: "join" as const, label: "Join group", icon: KeyRound },
  { key: "session" as const, label: "New session", icon: CalendarPlus },
  { key: "upload" as const, label: "Upload notes", icon: Upload },
];

export function Topbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [action, setAction] = useState<NewAction>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const newRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const data = await notificationService.getUnreadCount();
        setUnreadCount(data.unread_count);
      } catch (err) {
        console.error("Failed to fetch unread notifications count", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Global Ctrl/Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close the "New" menu on outside click or Escape
  useEffect(() => {
    if (!isNewOpen) return;
    const onDown = (e: MouseEvent) => { if (!newRef.current?.contains(e.target as Node)) setIsNewOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsNewOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [isNewOpen]);

  const startAction = (a: NewAction) => {
    setIsNewOpen(false);
    if (a !== "upload") return setAction(a);
    // The uploader picks its default group on mount, so open it once groups are loaded.
    groupService.getGroups().then((gs) => { setGroups(gs); setAction("upload"); }).catch(() => navigate("/resources"));
  };
  const done = () => { setAction(null); navigate(0); };

  return (
    <>
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
        <button onClick={toggleSidebar} aria-label="Open navigation" className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <Breadcrumb />
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden w-full max-w-[320px] items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-left text-muted-foreground transition-colors hover:border-primary/40 sm:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm">Search or jump to…</span>
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 font-sans text-xs text-muted-foreground lg:inline-block">Ctrl K</kbd>
        </button>

        <div className="flex-1 lg:hidden" />

        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsSearchOpen(true)} aria-label="Open search" className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted sm:hidden">
            <Search className="h-4 w-4" />
          </button>

          <div className="relative" ref={newRef}>
            <Button size="sm" icon={Plus} onClick={() => setIsNewOpen((v) => !v)} aria-haspopup="menu" aria-expanded={isNewOpen} className="hidden sm:inline-flex">
              New
            </Button>
            {isNewOpen && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-float">
                {NEW_ITEMS.map(({ key, label, icon: Icon }) => (
                  <button key={key} role="menuitem" onClick={() => startAction(key)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          <button onClick={() => navigate("/notifications")} title="Notifications" aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-xs font-bold leading-none text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button onClick={() => setIsMenuOpen((v) => !v)} aria-label="Open profile menu" aria-haspopup="true" aria-expanded={isMenuOpen} className="ml-1 rounded-full">
            <Avatar name={user?.name ?? "?"} />
          </button>
        </div>

        {isMenuOpen && <ProfileMenu onClose={() => setIsMenuOpen(false)} />}
      </header>

      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
      <CreateGroupModal isOpen={action === "group"} onClose={() => setAction(null)} onSuccess={done} />
      <JoinGroupModal isOpen={action === "join"} onClose={() => setAction(null)} onSuccess={done} />
      <CreateSessionModal isOpen={action === "session"} onClose={() => setAction(null)} onSuccess={done} />
      {action === "upload" && <DragDropUploader groups={groups} onUploadSuccess={done} onClose={() => setAction(null)} />}
    </>
  );
}
