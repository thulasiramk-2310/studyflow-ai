import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, Upload, Calendar, Sparkles, Trash2, Download, Users, CheckCircle, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { resourceService } from "../../services/resource.service";
import type { Resource } from "../../services/resource.service";
import { sessionService } from "../../services/session.service";
import type { Session } from "../../services/session.service";
import { useAuth } from "../../hooks/useAuth";
import { StudyPlanModal } from "../../components/study/StudyPlanModal";
import { StudyRoadmap } from "../../components/groups/StudyRoadmap";

const TABS = ["Overview", "Resources", "Sessions", "Members", "AI Assistant"];

export function GroupWorkspace() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  // AI Study Planner State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [targetDuration, setTargetDuration] = useState(60);

  const loadData = async () => {
    if (!groupId) return;
    try {
      if (!group) setLoading(true);
      const [g, r, s, up] = await Promise.all([
        groupService.getGroup(Number(groupId)),
        resourceService.getResources(Number(groupId)),
        sessionService.getGroupSessions(Number(groupId)),
        groupService.getUpcomingSessions(Number(groupId))
      ]);
      // Sort resources by date
      r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setGroup(g);
      setResources(r);
      setSessions(s);
      setUpcomingSessions(up);
    } catch (err) {
      console.error("Failed to load group data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId]);

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await resourceService.deleteResource(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast.success("Resource deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete resource");
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12 animate-pulse">
        <div className="h-4 bg-border-soft w-48 rounded mb-6"></div>
        <div className="h-16 bg-border-soft rounded-2xl mb-8"></div>
        <div className="h-96 bg-border-soft rounded-2xl"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-[1180px] mx-auto px-8 py-7 text-center text-muted-foreground">
        Failed to load group.
      </div>
    );
  }

  const userRole = group.members?.find((m) => m.user_id === Number(user?.id))?.role || "MEMBER";
  const canManageGroup = userRole === "ORGANIZER";
  const recentResources = resources.slice(0, 3);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  
  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      await groupService.leaveGroup(group.id);
      toast.success("Left group successfully");
      window.location.href = "/groups";
    } catch (err: any) {
      toast.error(err.message || "Failed to leave group");
    }
  };

  const handleRegenerateInvite = async () => {
    try {
      const newCode = await groupService.regenerateInviteCode(group.id);
      setGroup({ ...group, invite_code: newCode });
      toast.success("Invite code regenerated");
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate invite code");
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      if (group.invite_code) {
        await navigator.clipboard.writeText(group.invite_code);
        toast.success("Invite code copied to clipboard!");
      }
    } catch (err: any) {
      toast.error("Failed to copy invite code");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await groupService.removeMember(group.id, userId);
      setGroup({ ...group, members: group.members?.filter(m => m.user_id !== userId) });
      toast.success("Member removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  const handleGeneratePlan = async () => {
    if (!groupId) return;
    try {
      setIsGeneratingPlan(true);
      toast.loading("AI is analyzing group progress...", { id: "generate-plan" });
      const proposal = await groupService.generateStudyPlan(Number(groupId), targetDuration);
      setAiProposal(proposal);
      setIsPlanModalOpen(true);
      toast.success("Study plan generated!", { id: "generate-plan" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate study plan", { id: "generate-plan" });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleCreateSession = async (editedProposal?: any, scheduledAt?: string) => {
    const finalProposal = editedProposal || aiProposal;
    if (!groupId || !finalProposal) return;
    try {
      setIsCreatingSession(true);
      toast.loading("Creating session...", { id: "create-session" });
      
      const newSession = await sessionService.createSession({
        group_id: Number(groupId),
        title: finalProposal.title,
        description: finalProposal.description,
        agenda: finalProposal.agenda,
        objectives: finalProposal.objectives,
        expected_outcome: finalProposal.expected_outcome,
        session_type: finalProposal.session_type,
        learning_path_item_id: finalProposal.learning_path_item_id,
        duration_minutes: finalProposal.duration_minutes,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        resource_ids: resources.map(r => r.id), // Attach all group resources so AI can generate content
        generated_by: "AI"
      });
      
      toast.success("Session created successfully!", { id: "create-session" });
      setIsPlanModalOpen(false);
      navigate(`/sessions/${newSession.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create session", { id: "create-session" });
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      {/* Breadcrumb */}
      <div className="text-[12.5px] text-muted-foreground flex items-center gap-1.5">
        <Link to="/groups" className="text-primary hover:underline">My Groups</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-semibold">{group.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mt-3.5">
        <div className="w-[52px] h-[52px] rounded-2xl bg-primary-soft text-primary flex items-center justify-center text-[19px] font-extrabold shrink-0">
          {getInitials(group.name)}
        </div>
        <div className="flex-1">
          <div className="text-[21px] font-extrabold tracking-tight flex items-center gap-2.5">
            {group.name}
            <span className="text-[10.5px] font-bold text-secondary bg-secondary-soft border border-purple-100 px-2 py-0.5 rounded-full capitalize">
              {userRole.toLowerCase()}
            </span>
          </div>
          <div className="text-[13px] text-muted-foreground mt-0.5">
            {group.members?.length || 1} members · {resources.length} resources
          </div>
        </div>
        <div className="flex">
          {(group.members || []).slice(0, 4).map((m, i) => {
            const isMe = m.user_id === Number(user?.id);
            const memberInitials = m.name ? m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : `U${m.user_id}`;
            const initials = isMe ? user?.initials : memberInitials;
            return (
              <div key={i} className="w-[30px] h-[30px] rounded-full bg-primary text-white flex items-center justify-center text-[10.5px] font-bold border-2 border-background -ml-2 first:ml-0">
                {initials}
              </div>
            );
          })}
          {(group.members?.length || 0) > 4 && (
            <div className="w-[30px] h-[30px] rounded-full bg-border-soft text-muted-foreground flex items-center justify-center text-[10px] font-bold border-2 border-background -ml-2">
              +{(group.members?.length || 0) - 4}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {canManageGroup && (
            <div className="relative group/invite">
              <button className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors">
                Invite members
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg opacity-0 invisible group-hover/invite:opacity-100 group-hover/invite:visible transition-all z-10 p-2">
                <div className="px-3 py-2 text-[12px] text-muted-foreground border-b border-border-soft mb-1">
                  Code: <span className="font-mono text-foreground font-semibold select-all bg-background px-1.5 py-0.5 rounded">{group.invite_code}</span>
                </div>
                <button onClick={handleCopyInviteCode} className="w-full text-left px-3 py-2 text-[13px] hover:bg-background rounded-lg transition-colors">
                  Copy to Clipboard
                </button>
                <button onClick={handleRegenerateInvite} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors mt-1">
                  Regenerate Code
                </button>
              </div>
            </div>
          )}
          <button onClick={handleLeaveGroup} className="bg-surface border border-border text-red-600 rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-red-50 hover:border-red-100 transition-colors">
            Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mt-5 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <div 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors -mb-px whitespace-nowrap ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"}`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-[1fr_320px] gap-5 mt-5 items-start">
        <div className="flex flex-col gap-5">
          
          {activeTab === "Resources" && (
            <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="px-5 py-4 border-b border-border-soft flex justify-between items-center">
                <span className="text-[14px] font-bold">All Resources ({resources.length})</span>
              </div>
              {resources.length === 0 ? (
                <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                  No resources uploaded yet.
                </div>
              ) : (
                resources.map((r) => {
                  const isPdf = r.original_filename.toLowerCase().endsWith(".pdf");
                  const typeName = isPdf ? "PDF" : "DOC";
                  const typeBg = isPdf ? "bg-red-100" : "bg-blue-100";
                  const typeColor = isPdf ? "text-red-600" : "text-blue-600";
                  
                  return (
                    <div key={r.id} className="flex items-center gap-3.5 px-5 py-3 border-b border-border-soft hover:bg-background transition-colors last:border-0 group">
                      <div className={`w-9 h-9 rounded-xl ${typeBg} ${typeColor} flex items-center justify-center text-[10px] font-extrabold shrink-0`}>
                        {typeName}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{r.original_filename}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">
                          {new Date(r.created_at).toLocaleDateString()} · {resourceService.formatFileSize(r.size)}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => resourceService.downloadResource(r.id, r.original_filename)} className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-primary hover:bg-primary-soft transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {(canManageGroup || r.uploaded_by === Number(user?.id)) && (
                          <button onClick={() => handleDeleteResource(r.id)} className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "Sessions" && (
            <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="px-5 py-4 border-b border-border-soft flex justify-between items-center">
                <span className="text-[14px] font-bold">All Sessions ({sessions.length})</span>
                {canManageGroup && (
                  <div className="flex items-center gap-3">
                    <select 
                      value={targetDuration}
                      onChange={e => setTargetDuration(Number(e.target.value))}
                      className="text-[12.5px] border border-border-soft rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary bg-surface text-foreground"
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                    <button 
                      onClick={handleGeneratePlan}
                      disabled={isGeneratingPlan}
                      className="text-[12.5px] font-bold text-primary bg-primary-soft/50 hover:bg-primary-soft px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isGeneratingPlan ? "Analyzing..." : "AI Study Planner"}
                    </button>
                    <Link to="/sessions" className="text-[12.5px] font-semibold text-muted-foreground hover:text-foreground">
                      Schedule Manual
                    </Link>
                  </div>
                )}
              </div>
              {sessions.length === 0 ? (
                <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                  No sessions scheduled yet.
                </div>
              ) : (
                sessions.map((s) => {
                  const date = new Date(s.scheduled_at);
                  const mon = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                  const day = date.getDate();
                  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <Link to={`/sessions/${s.id}`} key={s.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft hover:bg-background transition-colors cursor-pointer last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold uppercase">{mon}</span>
                        <span className="text-[15px] font-extrabold leading-none">{day}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold">{s.title}</div>
                        <div className="text-[11.5px] text-muted-foreground mt-0.5">
                          {time} · {s.duration_minutes} mins
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : s.status === 'LIVE' ? 'bg-red-100 text-red-700' : 'bg-primary-soft text-primary'}`}>
                        {s.status}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "Members" && (
            <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="px-5 py-4 border-b border-border-soft flex justify-between items-center">
                <span className="text-[14px] font-bold">Group Members ({group.members?.length || 1})</span>
                {canManageGroup && (
                  <button className="text-[12.5px] font-semibold text-primary hover:underline">
                    Invite Member
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {(group.members || []).map((m) => {
                  const isMe = m.user_id === Number(user?.id);
                  const memberInitials = m.name ? m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : `U${m.user_id}`;
                  const initials = isMe ? user?.initials : memberInitials;
                  const name = isMe ? (user?.name + " (You)") : (m.name || `User ${m.user_id}`);
                  
                  return (
                    <div key={m.user_id} className="flex items-center gap-3 p-3 border border-border-soft rounded-xl bg-background group">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold truncate">{name}</div>
                        <div className="text-[12px] text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" /> {m.role.toLowerCase()}
                        </div>
                      </div>
                      {canManageGroup && m.role !== "ORGANIZER" && !isMe && (
                        <button 
                          onClick={() => handleRemoveMember(m.user_id)} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Assistant Tab */}
          {activeTab === "AI Assistant" && (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-[18px] font-extrabold tracking-tight mb-2">Your AI Study Buddy for {group.name}</h3>
              <p className="text-[13.5px] text-muted-foreground max-w-lg mb-6">
                Chat with our AI Assistant to ask questions about any of the {resources.length} resources uploaded to this group. It can explain concepts, summarize documents, and help you prepare for exams.
              </p>
              <Link to="/ai" className="bg-primary text-white rounded-lg px-6 py-2.5 text-[14px] font-bold hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Start AI Chat
              </Link>
            </div>
          )}

          {activeTab === "Overview" && (
            <>
              {/* Group Overview */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <h3 className="text-[15px] font-bold mb-2 text-foreground">Group Overview</h3>
                {group.description && (
                  <div className="mb-4">
                    <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-[13.5px] text-foreground leading-relaxed">{group.description}</p>
                  </div>
                )}
                {group.goal && (
                  <div>
                    <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Goal</h4>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 inline-block">
                      <p className="text-[13px] font-semibold text-primary-hover flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {group.goal}
                      </p>
                    </div>
                  </div>
                )}
                {!group.description && !group.goal && (
                  <p className="text-[13.5px] text-muted-foreground">This group doesn't have a description or goal set.</p>
                )}
              </div>

              {/* Study Roadmap */}
              <StudyRoadmap 
                groupId={group.id} 
                items={group.learning_plan || []} 
                canManage={true} 
                onUpdate={loadData} 
                progressPercent={(group as any).progress_percent || 0}
                completedCount={(group as any).completed_items_count || 0}
              />


          {/* Resources */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Recent resources</span>
              <Link to="/resources" className="text-[12.5px] font-semibold text-primary">View all</Link>
            </div>
            {recentResources.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                No resources uploaded yet.
              </div>
            ) : (
              recentResources.map((r) => {
                const isPdf = r.original_filename.toLowerCase().endsWith(".pdf");
                const typeName = isPdf ? "PDF" : "DOC";
                const typeBg = isPdf ? "bg-red-100" : "bg-blue-100";
                const typeColor = isPdf ? "text-red-600" : "text-blue-600";
                
                return (
                  <div key={r.id} className="flex items-center gap-3.5 px-5 py-3 border-b border-border-soft hover:bg-background transition-colors cursor-pointer last:border-0">
                    <div className={`w-9 h-9 rounded-xl ${typeBg} ${typeColor} flex items-center justify-center text-[10px] font-extrabold shrink-0`}>
                      {typeName}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{r.original_filename}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {new Date(r.created_at).toLocaleDateString()} · {resourceService.formatFileSize(r.size)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-border shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Sessions */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Upcoming sessions</span>
              <Link to="/sessions" className="text-[12.5px] font-semibold text-primary">View all</Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-muted-foreground">
                No upcoming sessions.
              </div>
            ) : (
              upcomingSessions.map((s) => {
                const date = new Date(s.scheduled_at);
                const mon = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = date.getDate();
                const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <Link to={`/sessions/${s.id}`} key={s.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft hover:bg-background transition-colors cursor-pointer last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold uppercase">{mon}</span>
                      <span className="text-[15px] font-extrabold leading-none">{day}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{s.title}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5">
                        {time} · {s.duration_minutes} mins
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-soft text-primary">
                      {s.status}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
          </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-3.5">
          <div className="bg-surface border border-border rounded-2xl p-4.5">
            <div className="text-[13.5px] font-bold mb-3">Quick actions</div>
            <div className="flex flex-col gap-2">
              <Link to="/resources" className="flex items-center gap-2.5 bg-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] font-semibold hover:bg-border-soft transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" /> Upload resource
              </Link>
              <Link to="/sessions" className="flex items-center gap-2.5 bg-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] font-semibold hover:bg-border-soft transition-colors">
                <Calendar className="w-4 h-4 text-muted-foreground" /> Schedule session
              </Link>
              <Link to="/ai" className="flex items-center gap-2.5 bg-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] font-semibold hover:bg-border-soft transition-colors">
                <Sparkles className="w-4 h-4 text-muted-foreground" /> Ask AI about this group
              </Link>
            </div>
          </div>

          {/* Members preview */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="px-4 py-3.5 border-b border-border-soft text-[13.5px] font-bold">
              Members ({group.members?.length || 1})
            </div>
            {(group.members || []).map((m) => {
              const isMe = m.user_id === Number(user?.id);
              const memberInitials = m.name ? m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : `U${m.user_id}`;
              const initials = isMe ? user?.initials : memberInitials;
              const name = isMe ? (user?.name + " (You)") : (m.name || `User ${m.user_id}`);

              return (
                <div key={m.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-border-soft last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{name}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">{m.role.toLowerCase()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {aiProposal && (
        <StudyPlanModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          proposal={aiProposal}
          onRegenerate={handleGeneratePlan}
          onCreateSession={handleCreateSession}
          isRegenerating={isGeneratingPlan}
          isCreating={isCreatingSession}
        />
      )}
    </div>
  );
}
