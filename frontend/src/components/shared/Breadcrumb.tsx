import { Link, useLocation } from "react-router-dom";
import { useTerms } from "../../hooks/useTerms";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard:     "Today",
  groups:        "Groups",
  resources:     "Library",
  sessions:      "Sessions",
  ai:            "Ask AI",
  guide:         "Guide",
  notifications: "Notifications",
  profile:       "Profile",
  settings:      "Settings",
  quiz:          "Quiz",
  // dynamic segments get title-cased below
};

function label(segment: string, t: ReturnType<typeof useTerms>): string {
  if (/^\d+$/.test(segment)) return "Details";
  const worded: Record<string, string> = { groups: t.groups, resources: t.library, sessions: t.sessions, quiz: t.quiz };
  return worded[segment] ?? ROUTE_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function Breadcrumb() {
  const terms = useTerms();
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean); // e.g. ["groups", "bio301"]

  if (segments.length === 0) return null;

  // Build cumulative hrefs
  const crumbs = segments.map((seg, i) => ({
    label: label(seg, terms),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium">
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
