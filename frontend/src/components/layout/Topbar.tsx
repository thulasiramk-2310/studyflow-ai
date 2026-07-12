import { useState, useEffect } from "react";
import { Search, Plus, Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileMenu } from "./ProfileMenu";
import { SearchModal } from "../shared/SearchModal";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../hooks/useAuth";
import { Breadcrumb } from "../shared/Breadcrumb";
import { MOCK_NOTIFICATIONS } from "../../lib/mock-data";
import { toast } from "sonner";

const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;

export function Topbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCreate = () => {
    navigate("/groups");
    toast.success("Let's create a new group!", { description: "Fill in the group details below." });
  };

  return (
    <>
      <header className="h-[58px] shrink-0 bg-surface border-b border-border flex items-center gap-3 px-4 md:px-6 shadow-sm z-10 relative">
        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          aria-label="Open navigation"
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar — hidden on mobile, always open on sm+ */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex flex-1 max-w-[380px] items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:border-primary/40 transition-all text-left"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-[13px]">Search…</span>
          <kbd className="hidden lg:inline-block text-[11px] font-medium font-sans border border-border rounded px-1.5 bg-surface text-muted-foreground shrink-0">⌘K</kbd>
        </button>

        {/* Breadcrumb — only on desktop */}
        <div className="hidden lg:flex flex-1 items-center px-2">
          <Breadcrumb />
        </div>

        <div className="flex-1 sm:flex-none" />

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Mobile search icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search"
            className="sm:hidden w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Create button */}
          <button
            onClick={handleCreate}
            className="hidden sm:flex items-center gap-1.5 bg-primary text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" strokeWidth={3} /> Create
          </button>

          {/* Notifications */}
          <button
            className="relative w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-background transition-colors hover:text-foreground"
            onClick={() => navigate("/notifications")}
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-[6px] right-[7px] w-2 h-2 rounded-full bg-destructive border-[1.5px] border-surface" />
            )}
          </button>

          {/* Profile avatar */}
          <button
            onClick={() => setIsMenuOpen(v => !v)}
            className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-[12.5px] font-bold shrink-0 ring-2 ring-primary/20 shadow-sm hover:ring-primary/40 transition-all cursor-pointer"
            aria-label="Open profile menu"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            {user?.initials ?? "AO"}
          </button>
        </div>

        {isMenuOpen && <ProfileMenu onClose={() => setIsMenuOpen(false)} />}
      </header>

      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
