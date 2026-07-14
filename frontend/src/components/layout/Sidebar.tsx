import { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FolderOpen, Calendar, Sparkles,
  Bell, User, Settings, LogOut, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { Logo } from "../Icons";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../context/SidebarContext";


const NAV_ITEMS = [
  { label: "Dashboard",     to: "/dashboard",      icon: LayoutDashboard },
  { label: "My Groups",     to: "/groups",          icon: Users },
  { label: "Resources",     to: "/resources",       icon: FolderOpen },
  { label: "Sessions",      to: "/sessions",        icon: Calendar },
  { label: "AI Assistant",  to: "/ai",              icon: Sparkles },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Profile",       to: "/profile",       icon: User },
  { label: "Settings",      to: "/settings",      icon: Settings },
];

const unreadCount = 0;

function NavItem({ to, icon: Icon, label, collapsed, badge }: { to: string; icon: React.ElementType; label: string; collapsed: boolean; badge?: number }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-[13.5px] transition-colors group relative ${
          isActive
            ? "bg-primary-soft text-primary font-bold"
            : "text-muted-foreground font-semibold hover:bg-border-soft hover:text-foreground"
        } ${collapsed ? "justify-center px-2" : ""}`
      }
    >
      {() => (
        <>
          <Icon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="flex-1">{label}</span>}
          {badge !== undefined && badge > 0 && (
            <span className={`bg-primary text-white text-[10.5px] font-bold rounded-full px-1.5 py-0.5 leading-none ${collapsed ? "absolute -top-0.5 -right-0.5 px-1" : ""}`}>
              {badge}
            </span>
          )}
          {/* Tooltip on collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-foreground text-background text-[12px] font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

/** The inner sidebar content, shared between desktop+tablet and mobile drawer */
function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleCollapse } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={`flex flex-col h-full ${collapsed ? "w-[60px]" : "w-[244px]"} transition-all duration-200`}>
      {/* Brand */}
      <div className={`flex items-center gap-2.5 px-4 pt-4 pb-3 font-extrabold text-[15px] tracking-tight ${collapsed ? "justify-center px-2" : ""}`}>
        <Logo className="w-5 h-5 text-primary shrink-0" />
        {!collapsed && <span>StudyFlow AI</span>}
        {/* Mobile close */}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-1 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div className="my-1.5 border-t border-border-soft" />

        {BOTTOM_ITEMS.map(item => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            badge={item.to === "/notifications" ? unreadCount : undefined}
          />
        ))}
      </nav>

      {/* Collapse toggle (desktop/tablet only) */}
      {!onClose && (
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mx-2 mb-2 flex items-center justify-center h-8 rounded-lg text-muted-foreground hover:bg-border-soft hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* User footer */}
      <div className="border-t border-border p-2">
        <div className={`flex items-center gap-2.5 cursor-pointer hover:bg-background transition-colors rounded-lg p-2 group ${collapsed ? "justify-center" : ""}`}>
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-[13px] font-bold shrink-0 shadow-sm">
            {user?.initials ?? "AO"}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{user?.name}</div>
                <div className="text-[11.5px] text-muted-foreground truncate">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
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
      {/* ── Desktop / Tablet: permanent sidebar ── */}
      <aside
        className={`hidden md:flex shrink-0 bg-surface border-r border-border flex-col z-10 shadow-[1px_0_2px_rgba(0,0,0,0.02)] transition-all duration-200 ${isCollapsed ? "w-[60px]" : "w-[244px]"}`}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* ── Mobile: drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 md:hidden"
              onClick={close}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed inset-y-0 left-0 bg-surface border-r border-border z-50 md:hidden shadow-xl flex flex-col"
            >
              <SidebarContent collapsed={false} onClose={close} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
