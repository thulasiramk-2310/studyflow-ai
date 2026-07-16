import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SkeletonList, EmptyState } from "../../components/shared";
import { Upload, Calendar, Sparkles, UserPlus } from "lucide-react";
import { notificationService } from "../../services/notification.service";
import type { Notification } from "../../services/notification.service";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICON: Record<string, React.ElementType> = {
  upload: Upload, session: Calendar, ai: Sparkles, member: UserPlus,
};
const TYPE_STYLE: Record<string, [string, string]> = {
  upload:  ["bg-primary-soft",   "text-primary"],
  session: ["bg-emerald-50",     "text-emerald-600"],
  ai:      ["bg-secondary-soft", "text-secondary"],
  member:  ["bg-amber-50",       "text-amber-600"],
};

const mapNotificationType = (apiType: string) => {
  if (apiType.includes("RESOURCE")) return "upload";
  if (apiType.includes("MEMBER")) return "member";
  if (apiType.includes("READY")) return "ai";
  return "session"; // default for SESSION_CREATED etc
};

export function Notifications() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  
  const fetchNotifications = async () => {
    try {
      const [data, unread] = await Promise.all([
        notificationService.getNotifications(0, 50),
        notificationService.getUnreadCount()
      ]);
      setNotifs(data.data || []);
      setUnreadCount(unread.unread_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifs(n => n.map(x => ({ ...x, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const markRead = async (id: number, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifs(n => n.filter(x => x.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const shown = filter === "unread" ? notifs.filter(n => !n.is_read) : notifs;
  
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const today = shown.filter(n => isToday(n.created_at));
  const earlier = shown.filter(n => !isToday(n.created_at));

  if (loading) return (
    <div className="max-w-[760px] mx-auto px-6 md:px-8 py-7 pb-12">
      <div className="h-8 w-48 bg-border-soft rounded-lg animate-pulse mb-6" />
      <SkeletonList rows={6} cols={2} />
    </div>
  );

  if (notifs.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-10 animate-[sfFade_0.3s_ease]">
        <PageHeader title="Notifications" />
        <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] px-5 py-12 mt-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-primary opacity-80" />
          </div>
          <h3 className="text-base font-bold text-foreground">No notifications yet</h3>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-[280px]">
            We'll notify you when AI summaries finish, someone joins your group, or sessions are scheduled.
          </p>
        </div>
      </div>
    );
  }

  const handleNotificationClick = (n: Notification) => {
    markRead(n.id, n.is_read);
    if (n.entity_type === 'SESSION' && n.entity_id) {
      navigate(`/sessions/${n.entity_id}`);
    } else if (n.group_id) {
      navigate(`/groups/${n.group_id}`);
    }
  };

  const Section = ({ label, items }: { label: string; items: Notification[] }) =>
    items.length === 0 ? null : (
      <div className="mb-6">
        <div className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{label}</div>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {items.map((n) => {
            const mappedType = mapNotificationType(n.type);
            const Icon = TYPE_ICON[mappedType] ?? Bell;
            const [bg, color] = TYPE_STYLE[mappedType] ?? ["bg-border-soft", "text-muted-foreground"];
            return (
              <div key={n.id}
                className={`flex items-start gap-3.5 px-5 py-4 border-b border-border-soft last:border-0 transition-colors cursor-pointer ${!n.is_read ? "bg-primary-soft/20 hover:bg-primary-soft/30" : "hover:bg-background"}`}
                onClick={() => handleNotificationClick(n)}>
                <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-foreground">{n.title}</div>
                  <div className="text-[13px] leading-relaxed text-muted-foreground">{n.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.created_at), {addSuffix: true})}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
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
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <Section label="Today" items={today} />
        <Section label="Earlier" items={earlier} />
      </div>

      {shown.length === 0 && (
        <div className="mt-8">
          <EmptyState icon={Bell} title="You're all caught up!" description="No new notifications match this filter." />
        </div>
      )}
    </div>
  );
}
