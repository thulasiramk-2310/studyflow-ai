import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, FolderOpen, Calendar, Sparkles, MessageSquare, ArrowRight, Plus, CheckSquare, Layers, Lightbulb, UploadCloud, BrainCircuit } from "lucide-react";
import { PageHeader, EmptyState, StatsCard } from "../../components/shared";
import { DashboardSkeleton } from "../../components/skeletons";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";
import { JoinGroupModal } from "../../components/groups/JoinGroupModal";
import { useAuth } from "../../hooks/useAuth";
import { userService, type DashboardResponse } from "../../services/user.service";

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[1100px] mx-auto animate-[sfFadeIn_0.3s_ease-out] flex flex-col gap-6">
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]} 👋`} showBreadcrumb={false} />

      {/* Quick Actions */}
      <div>
        <h3 className="text-[14px] font-bold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => navigate("/ai")} className="flex flex-col items-start gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-primary/30 hover:bg-primary-soft/50 transition-all text-left shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-foreground">Ask AI Assistant</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Chat with your study materials</div>
            </div>
          </button>

          <button onClick={() => navigate("/resources")} className="flex flex-col items-start gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-emerald-600/30 hover:bg-emerald-50/50 transition-all text-left shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-foreground">Upload Resources</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Add PDFs & documents for indexing</div>
            </div>
          </button>

          <button onClick={() => navigate("/sessions")} className="flex flex-col items-start gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-indigo-600/30 hover:bg-indigo-50/50 transition-all text-left shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-foreground">Plan Study Session</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Generate AI study plans</div>
            </div>
          </button>

          <button onClick={() => navigate("/groups")} className="flex flex-col items-start gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-amber-600/30 hover:bg-amber-50/50 transition-all text-left shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-foreground">Manage Groups</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">View progress & members</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-2">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Sessions */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-[14px] font-bold">Upcoming Sessions</span>
              </div>
              <Link to="/sessions" className="text-[12.5px] font-semibold text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            
            <div className="flex-1 p-2">
              {dashboardData?.upcoming_sessions?.length === 0 ? (
                <div className="px-5 py-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-[14px] font-bold text-foreground">No upcoming sessions</div>
                  <div className="text-[12.5px] text-muted-foreground mt-1 max-w-[250px]">Schedule a study session to keep your momentum going.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {dashboardData?.upcoming_sessions?.map((s) => {
                    const date = new Date(s.scheduled_at);
                    const mon = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                    const day = date.getDate();
                    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <Link to={`/sessions/${s.id}`} key={s.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-background transition-colors group">
                        <div className={`w-12 h-12 rounded-xl bg-primary-soft text-primary flex flex-col items-center justify-center shrink-0 shadow-sm border border-primary/10`}>
                          <div className="text-[10px] font-bold uppercase leading-none">{mon}</div>
                          <div className="text-[16px] font-extrabold leading-tight">{day}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-foreground truncate">{s.title}</div>
                          <div className="text-[12px] font-medium text-muted-foreground mt-0.5 truncate">{s.group_name} · {time}</div>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                          Join <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recently Indexed Resources */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-[14px] font-bold">Recently Indexed Resources</span>
              </div>
              <Link to="/resources" className="text-[12.5px] font-semibold text-emerald-600 hover:underline flex items-center gap-1">Browse library <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            
            <div className="flex-1 p-2">
              {dashboardData?.recent_resources?.length === 0 ? (
                <div className="px-5 py-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <FolderOpen className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-[14px] font-bold text-foreground">Library empty</div>
                  <div className="text-[12.5px] text-muted-foreground mt-1 max-w-[250px]">Upload study materials so AI can index them.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dashboardData?.recent_resources?.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3 border border-border-soft rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 text-[10px] font-extrabold uppercase shadow-sm">
                        {r.title.split('.').pop() || 'DOC'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-foreground truncate group-hover:text-emerald-700 transition-colors">{r.title}</div>
                        <div className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{r.group_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Recent Activity */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-border-soft flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="text-[14px] font-bold">Recent Activity</span>
            </div>
            
            <div className="flex-1 p-3">
              {dashboardData?.recent_activity?.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-muted-foreground flex flex-col items-center">
                  <Activity className="w-8 h-8 text-border mb-2" />
                  No recent activity found.
                </div>
              ) : (
                <div className="flex flex-col relative before:absolute before:inset-y-3 before:left-[19px] before:w-[2px] before:bg-border-soft">
                  {dashboardData?.recent_activity?.map((a, i) => {
                    let icon = <Plus className="w-3.5 h-3.5" />;
                    let bg = "bg-gray-100 text-gray-600 border-gray-200";
                    
                    if (a.type === "RESOURCE") {
                      icon = <FolderOpen className="w-3.5 h-3.5" />;
                      bg = "bg-emerald-50 text-emerald-600 border-emerald-100";
                    } else if (a.type === "SESSION") {
                      icon = <Calendar className="w-3.5 h-3.5" />;
                      bg = "bg-primary-soft text-primary border-primary/20";
                    } else if (a.type === "QUIZ") {
                      icon = <CheckSquare className="w-3.5 h-3.5" />;
                      bg = "bg-indigo-50 text-indigo-600 border-indigo-100";
                    } else if (a.type === "FLASHCARDS") {
                      icon = <Layers className="w-3.5 h-3.5" />;
                      bg = "bg-amber-50 text-amber-600 border-amber-100";
                    }

                    return (
                      <div key={i} className="flex items-start gap-4 px-2 py-3 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${bg}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-[13px] font-semibold text-foreground truncate">{a.title}</div>
                          <div className="text-[11px] font-medium text-muted-foreground mt-1">{a.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stats Summary */}
          <div className="bg-surface border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <h4 className="text-[13px] font-bold text-foreground">Your Impact</h4>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-foreground leading-none">{dashboardData?.stats.conversations || 0}</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">AI Chats</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-foreground leading-none">{dashboardData?.stats.quizzes || 0}</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Quizzes</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-foreground leading-none">{dashboardData?.stats.flashcards || 0}</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Decks</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-extrabold text-foreground leading-none">{dashboardData?.stats.resources || 0}</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Resources</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchData} />
      <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchData} />
    </div>
  );
}

// Need to import Activity since it wasn't in the original imports
import { Activity } from "lucide-react";
