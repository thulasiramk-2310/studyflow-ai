import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard:     "Dashboard",
  groups:        "My Groups",
  resources:     "Resources",
  sessions:      "Sessions",
  ai:            "AI Assistant",
  notifications: "Notifications",
  profile:       "Profile",
  settings:      "Settings",
  quiz:          "Quiz",
  // dynamic segments get title-cased below
};

function label(segment: string): string {
  return ROUTE_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean); // e.g. ["groups", "bio301"]

  if (segments.length === 0) return null;

  // Build cumulative hrefs
  const crumbs = segments.map((seg, i) => ({
    label: label(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12.5px] font-medium">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-border" />}
          {crumb.isLast ? (
            <span className="text-foreground font-semibold">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
