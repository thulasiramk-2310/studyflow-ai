import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, FolderOpen, Calendar, Sparkles,
  Bell, BookOpen, Settings, LogOut, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { Logo } from "../Icons";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../context/SidebarContext";
import { groupService, type Group } from "../../services/group.service";
import { Avatar } from "../ui";

const NAV_ITEMS = [
  { label: "Today",    to: "/dashboard", icon: Home },
  { label: "Groups",   to: "/groups",    icon: Users },
  { label: "Sessions", to: "/sessions",  icon: Calendar },
  { label: "Ask AI",   to: "/ai",        icon: Sparkles },
  { label: "Library",  to: "/resources", icon: FolderOpen },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Guide",         to: "/guide",         icon: BookOpen },
  { label: "Settings",      to: "/settings",      icon: Settings },
];

const DOT_COLORS = ["#2F7D55", "#B7791F", "#3B6EA8", "#A0455A", "#6B5BA8", "#2E7F86"];
// eslint-disable-next-line react-refresh/only-export-components
export const groupDotColor = (id: number) => DOT_COLORS[Math.abs(id) % DOT_COLORS.length];

function NavItem({ to, icon: Icon, label, collapsed }: { to: string; icon: React.ElementType; label: string; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors ${
          isActive
            ? "bg-surface font-semibold text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } ${collapsed ? "justify-center px-2" : ""}`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-2.5 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-semibold text-background opacity-0 shadow-float transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </NavLink>
  );
}

/** The inner sidebar content, shared between desktop+tablet and mobile drawer */
function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleCollapse } = useSidebar();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    groupService.getGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={`flex h-full flex-col transition-all duration-200 ${collapsed ? "w-[64px]" : "w-[248px]"}`}>
      <div className={`flex items-center gap-2 px-4 pb-4 pt-5 ${collapsed ? "justify-center px-2" : ""}`}>
        <Logo className="h-5 w-5 shrink-0 text-primary-text" />
        {!collapsed && <span className="font-serif text-lg leading-none text-primary-text">StudyFlow</span>}
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1">
        {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} collapsed={collapsed} />)}

        {!collapsed && groups.length > 0 && (
          <div className="mt-6">
            <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your groups</div>
            {groups.slice(0, 6).map((g) => (
              <NavLink
                key={g.id}
                to={`/groups/${g.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm ${isActive ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                }
              >
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: groupDotColor(g.id) }} />
                <span className="truncate">{g.name}</span>
              </NavLink>
            ))}
          </div>
        )}

        <div className="mt-auto" />
        <div className="my-2 border-t border-border" />
        {BOTTOM_ITEMS.map((item) => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {!onClose && (
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mx-2 mb-2 flex h-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}

      <div className="border-t border-border p-2">
        <div className={`flex items-center gap-2.5 rounded-lg p-2 ${collapsed ? "justify-center" : ""}`}>
          <Link to="/profile" title="Profile" className="shrink-0">
            <Avatar name={user?.name ?? "?"} />
          </Link>
          {!collapsed && (
            <>
              <Link to="/profile" className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{user?.name}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isOpen, isCollapsed, close } = useSidebar();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => { close(); }, [location.pathname]);

  return (
    <>
      <aside className={`z-10 hidden shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200 md:flex ${isCollapsed ? "w-[64px]" : "w-[248px]"}`}>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
              onClick={close}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar shadow-float md:hidden"
            >
              <SidebarContent collapsed={false} onClose={close} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
