import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, FolderOpen, Calendar, MessageSquare, ChevronRight, ArrowRight, Plus } from "lucide-react";
import { StatsCard, LoadingSkeleton, PageHeader, EmptyState } from "../../components/shared";
import { MOCK_DASHBOARD_STATS, MOCK_SESSIONS, MOCK_ACTIVITY, MOCK_NOTIFICATIONS } from "../../lib/mock-data";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";
import { JoinGroupModal } from "../../components/groups/JoinGroupModal";
import { useAuth } from "../../hooks/useAuth";

const STAT_ICONS = [Users, FolderOpen, Calendar, MessageSquare];
const STAT_COLORS = [
  { iconBg: "bg-primary-soft",    iconColor: "text-primary" },
  { iconBg: "bg-emerald-50",      iconColor: "text-emerald-600" },
  { iconBg: "bg-secondary-soft",  iconColor: "text-secondary" },
  { iconBg: "bg-amber-50",        iconColor: "text-amber-600" },
];

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) return <LoadingSkeleton cards={4} rows={4} />;

  const recentGroups = groups.slice(0, 3);
  const upcomingSessions = MOCK_SESSIONS.filter(s => s.status !== "Completed").slice(0, 3);
  const unread = MOCK_NOTIFICATIONS.filter(n => n.unread).slice(0, 3);

  if (groups.length === 0) {
    return (
      <div className="px-6 md:px-8 py-7 pb-12 max-w-[1100px] mx-auto min-h-[calc(100vh-64px)] flex flex-col">
        <PageHeader title="Welcome to StudyFlow AI" subtitle={`Hello, ${user?.name?.split(' ')[0]} 👋`} showBreadcrumb={false} />
        
        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
          <EmptyState 
            icon={Users} 
            title="You haven't joined any study groups" 
            description="Create your first study group or join an existing one to get started." 
            action={
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Study Group
                </button>
                <button 
                  onClick={() => setIsJoinOpen(true)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  Join Existing Group
                </button>
              </div>
            }
          />
        </div>

        <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchGroups} />
        <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchGroups} />
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[1100px] mx-auto animate-[sfFadeIn_0.3s_ease-out]">
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]} 👋`} showBreadcrumb={false} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_DASHBOARD_STATS.map((s, i) => (
          <StatsCard key={i} label={s.label} value={s.value} trend={s.trend} icon={STAT_ICONS[i]} {...STAT_COLORS[i]} />
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mt-5">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Groups */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Active Groups</span>
              <Link to="/groups" className="text-[12.5px] font-semibold text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {recentGroups.map((g) => {
              const isOrg = g.members?.some(m => m.user_id === Number(user?.id) && m.role === "ORGANIZER");
              const init = g.name.substring(0, 2).toUpperCase();
              return (
                <Link to={`/groups/${g.id}`} key={g.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft last:border-0 hover:bg-background transition-colors">
                  <div className={`w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-[13px] font-extrabold shrink-0`}>{init}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{g.name}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5 truncate">{g.description || "No description"}</div>
                  </div>
                  {isOrg && <span className="text-[10.5px] font-bold text-secondary bg-secondary-soft px-2 py-0.5 rounded-full">Org</span>}
                  <ChevronRight className="w-4 h-4 text-border shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Upcoming sessions */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Upcoming Sessions</span>
              <Link to="/sessions" className="text-[12.5px] font-semibold text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {upcomingSessions.map((s) => (
              <Link to={`/sessions/${s.id}`} key={s.id}
                className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft last:border-0 hover:bg-background transition-colors">
                <div className={`w-10 h-10 rounded-xl ${s.dateBg} ${s.dateColor} flex flex-col items-center justify-center shrink-0`}>
                  <div className="text-[9px] font-bold uppercase leading-none">{s.mon}</div>
                  <div className="text-[15px] font-extrabold leading-tight">{s.day}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold">{s.topic}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{s.group} · {s.time}</div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.stBg} ${s.stColor}`}>{s.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Activity */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Recent Activity</div>
            {MOCK_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 border-b border-border-soft last:border-0">
                <div className={`w-7 h-7 rounded-full ${a.avBg} text-white flex items-center justify-center text-[11px] font-bold shrink-0`}>{a.av}</div>
                <div>
                  <div className="text-[12.5px] leading-relaxed"><b className="font-semibold">{a.who}</b> {a.what} <span className="text-primary font-medium">{a.target}</span></div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{a.when}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Notifications */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Notifications</span>
              <Link to="/notifications" className="text-[12.5px] font-semibold text-primary hover:underline">See all</Link>
            </div>
            {unread.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-border-soft last:border-0 bg-primary-soft/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <div className="text-[12.5px] leading-relaxed">{n.text}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchGroups} />
      <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchGroups} />
    </div>
  );
}
