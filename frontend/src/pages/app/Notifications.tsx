import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SkeletonList, EmptyState } from "../../components/shared";
import { MOCK_NOTIFICATIONS } from "../../lib/mock-data";
import { Upload, Calendar, Sparkles, UserPlus } from "lucide-react";

const TYPE_ICON: Record<string, React.ElementType> = {
  upload: Upload, session: Calendar, ai: Sparkles, member: UserPlus,
};
const TYPE_STYLE: Record<string, [string, string]> = {
  upload:  ["bg-primary-soft",   "text-primary"],
  session: ["bg-emerald-50",     "text-emerald-600"],
  ai:      ["bg-secondary-soft", "text-secondary"],
  member:  ["bg-amber-50",       "text-amber-600"],
};

export function Notifications() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const markAllRead = () => {
    setNotifs(n => n.map(x => ({ ...x, unread: false })));
    toast.success("All notifications marked as read");
  };

  const shown = filter === "unread" ? notifs.filter(n => n.unread) : notifs;
  const today   = shown.filter(n => n.group === "today");
  const earlier = shown.filter(n => n.group === "earlier");
  const unreadCount = notifs.filter(n => n.unread).length;

  if (loading) return (
    <div className="max-w-[760px] mx-auto px-6 md:px-8 py-7 pb-12">
      <div className="h-8 w-48 bg-border-soft rounded-lg animate-pulse mb-6" />
      <SkeletonList rows={6} cols={2} />
    </div>
  );

  const Section = ({ label, items }: { label: string; items: typeof notifs }) =>
    items.length === 0 ? null : (
      <div>
        <div className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{label}</div>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const [bg, color] = TYPE_STYLE[n.type] ?? ["bg-border-soft", "text-muted-foreground"];
            return (
              <div key={n.id}
                className={`flex items-start gap-3.5 px-5 py-4 border-b border-border-soft last:border-0 transition-colors cursor-pointer ${n.unread ? "bg-primary-soft/20 hover:bg-primary-soft/30" : "hover:bg-background"}`}
                onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}>
                <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] leading-relaxed">{n.text}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.when}</div>
                </div>
                {n.unread && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      </div>
    );

  return (
    <div className="max-w-[760px] mx-auto px-6 md:px-8 py-7 pb-12">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <div className="flex bg-surface border border-border rounded-lg p-0.5">
              {(["all", "unread"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors capitalize ${filter === f ? "bg-primary text-white" : "text-muted-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        <Section label="Today" items={today} />
        <Section label="Earlier" items={earlier} />
        {shown.length === 0 && (
          <EmptyState icon={Bell} title="You're all caught up!" description="No new notifications right now. Check back later." />
        )}
      </div>
    </div>
  );
}
