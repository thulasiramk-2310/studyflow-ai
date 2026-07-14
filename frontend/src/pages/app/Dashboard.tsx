import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, FolderOpen, Calendar, MessageSquare, ArrowRight, Plus, CheckSquare, Layers } from "lucide-react";
import { StatsCard, PageHeader, EmptyState } from "../../components/shared";
import { DashboardSkeleton } from "../../components/skeletons";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";
import { JoinGroupModal } from "../../components/groups/JoinGroupModal";
import { useAuth } from "../../hooks/useAuth";
import { userService, type DashboardResponse } from "../../services/user.service";

const STAT_ICONS = [Users, FolderOpen, Calendar, MessageSquare, CheckSquare, Layers];
const STAT_COLORS = [
  { iconBg: "bg-primary-soft",    iconColor: "text-primary" },
  { iconBg: "bg-emerald-50",      iconColor: "text-emerald-600" },
  { iconBg: "bg-secondary-soft",  iconColor: "text-secondary" },
  { iconBg: "bg-amber-50",        iconColor: "text-amber-600" },
  { iconBg: "bg-indigo-50",       iconColor: "text-indigo-600" },
  { iconBg: "bg-rose-50",         iconColor: "text-rose-600" },
];

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await userService.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  const stats = [
    { label: "Groups", value: dashboardData?.stats.groups.toString() || "0", trend: "" },
    { label: "Resources", value: dashboardData?.stats.resources.toString() || "0", trend: "" },
    { label: "Upcoming", value: dashboardData?.stats.sessions.toString() || "0", trend: "" },
    { label: "AI Conversations", value: dashboardData?.stats.aiChats.toString() || "0", trend: "" },
    { label: "Quizzes", value: dashboardData?.stats.quizzes.toString() || "0", trend: "" },
    { label: "Flashcards", value: dashboardData?.stats.flashcards.toString() || "0", trend: "" },
  ];

  if (dashboardData?.stats.groups === 0) {
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

        <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchData} />
        <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchData} />
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[1100px] mx-auto animate-[sfFadeIn_0.3s_ease-out]">
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]} 👋`} showBreadcrumb={false} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatsCard key={i} label={s.label} value={s.value} trend={s.trend} icon={STAT_ICONS[i]} {...STAT_COLORS[i]} />
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mt-5">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Upcoming sessions */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Upcoming Sessions</span>
              <Link to="/sessions" className="text-[12.5px] font-semibold text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {dashboardData?.upcomingSessions.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                No upcoming sessions.
              </div>
            ) : (
              dashboardData?.upcomingSessions.map((s) => {
                const date = new Date(s.scheduled_at);
                const mon = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = date.getDate();
                const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <Link to={`/sessions/${s.id}`} key={s.id}
                    className="flex items-center gap-3.5 px-5 py-4 border-b border-border-soft last:border-0 hover:bg-background transition-colors group">
                    <div className={`w-12 h-12 rounded-xl bg-primary-soft text-primary flex flex-col items-center justify-center shrink-0`}>
                      <div className="text-[10px] font-bold uppercase leading-none">{mon}</div>
                      <div className="text-[16px] font-extrabold leading-tight">{day}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-foreground">{s.title}</div>
                      <div className="text-[12.5px] text-muted-foreground mt-0.5">{s.group_name} · {time}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Join <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Activity */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Recent Activity</div>
            {dashboardData?.recentActivity.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                No recent activity found.
              </div>
            ) : (
              <div className="flex flex-col">
                {dashboardData?.recentActivity.map((a, i) => {
                  let icon = <Plus className="w-4 h-4" />;
                  let bg = "bg-gray-100 text-gray-600";
                  
                  if (a.type === "RESOURCE") {
                    icon = <FolderOpen className="w-3.5 h-3.5" />;
                    bg = "bg-blue-50 text-blue-600";
                  } else if (a.type === "SESSION") {
                    icon = <Calendar className="w-3.5 h-3.5" />;
                    bg = "bg-primary-soft text-primary";
                  } else if (a.type === "QUIZ") {
                    icon = <CheckSquare className="w-3.5 h-3.5" />;
                    bg = "bg-emerald-50 text-emerald-600";
                  } else if (a.type === "FLASHCARDS") {
                    icon = <Layers className="w-3.5 h-3.5" />;
                    bg = "bg-amber-50 text-amber-600";
                  }

                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-border-soft last:border-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground truncate">{a.title}</div>
                        <div className="text-[11.5px] text-muted-foreground mt-0.5">{a.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Resources */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Recent Resources</div>
            {dashboardData?.recentResources.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                No resources uploaded.
              </div>
            ) : (
              <div className="flex flex-col">
                {dashboardData?.recentResources.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border-soft last:border-0 hover:bg-background transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded bg-red-50 text-red-600 flex items-center justify-center shrink-0 text-[9px] font-extrabold uppercase">
                      {r.title.split('.').pop()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground truncate">{r.title}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{r.group_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchData} />
      <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchData} />
    </div>
  );
}
