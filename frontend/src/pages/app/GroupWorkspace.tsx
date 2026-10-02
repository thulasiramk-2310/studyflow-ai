import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Copy, Download, FileText, LogOut, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { resourceService } from "../../services/resource.service";
import type { Resource } from "../../services/resource.service";
import { sessionService } from "../../services/session.service";
import type { Session } from "../../services/session.service";
import { useAuth } from "../../hooks/useAuth";
import { useGroupTerms } from "../../hooks/useTerms";
import type { Audience } from "../../types";
import { StudyPlanModal } from "../../components/study/StudyPlanModal";
import { StudyRoadmap } from "../../components/groups/StudyRoadmap";
import { DragDropUploader } from "../../components/resources/DragDropUploader";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, Select, Skeleton, Tabs } from "../../components/ui";

const TABS = ["Overview", "Sessions", "Library", "Members", "Ask AI"];

function fileTag(name: string) {
  return (name.split(".").pop() ?? "file").slice(0, 4).toUpperCase();
}

function ResourceRow({ resource, onDelete }: { resource: Resource; onDelete?: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground group-hover:bg-surface">{fileTag(resource.original_filename)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base text-foreground">{resource.original_filename}</div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(resource.created_at), "d MMM yyyy")} · {resourceService.formatFileSize(resource.size)}
          {resource.uploader_name ? ` · ${resource.uploader_name}` : ""}
        </div>
      </div>
      <button onClick={() => resourceService.downloadResource(resource.id, resource.original_filename)} aria-label="Download" className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground">
        <Download className="h-4 w-4" />
      </button>
      {onDelete && (
        <button onClick={onDelete} aria-label="Delete" className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  const d = new Date(session.scheduled_at);
  const tone = session.status === "COMPLETED" ? "success" : session.status === "LIVE" ? "danger" : "neutral";
  return (
    <Link to={`/sessions/${session.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text">
        <span className="text-center leading-none">
          <span className="block text-xs font-semibold uppercase">{format(d, "MMM")}</span>
          <span className="block font-serif text-lg">{format(d, "d")}</span>
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold text-foreground">{session.title}</div>
        <div className="text-sm text-muted-foreground">
          {format(d, "EEE HH:mm")} · {session.duration_minutes} min{session.generated_by_ai ? " · AI-planned" : ""}
        </div>
      </div>
      <Badge tone={tone}>{session.status}</Badge>
    </Link>
  );
}


export function GroupWorkspace() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const terms = useGroupTerms(group);
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="mb-8 h-10 w-80" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
        <Card><EmptyState icon={FileText} title="Couldn't load this group" description="It may have been deleted, or you're no longer a member." action={<Button variant="secondary" onClick={() => navigate("/groups")}>Back to groups</Button>} /></Card>
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

  const canDelete = (r: Resource) => canManageGroup || r.uploaded_by === Number(user?.id);
  const memberName = (m: { user_id: number; name?: string }) =>
    m.user_id === Number(user?.id) ? `${user?.name} (You)` : m.name || `User ${m.user_id}`;
  const memberCount = group.members?.length ?? 1;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/groups" className="hover:text-foreground">Groups</Link>
            <span>/</span>
            <span className="truncate text-foreground">{group.name}</span>
          </div>
        }
        title={group.name}
        subtitle={
          <span>
            {group.goal || group.description || "Study group"} · {memberCount} member{memberCount === 1 ? "" : "s"} · {resources.length} note{resources.length === 1 ? "" : "s"}
          </span>
        }
        actions={
          <>
            <div className="mr-1 flex -space-x-2">
              {(group.members || []).slice(0, 4).map((m) => (
                <Avatar key={m.user_id} name={m.name || `User ${m.user_id}`} size="sm" />
              ))}
            </div>
            {canManageGroup && (
              <Select aria-label="Group style" value={group.audience ?? "student"} onChange={async (e) => {
                const audience = e.target.value as Audience;
                try { const updated = await groupService.updateGroup(group.id, { name: group.name, audience }); setGroup({ ...group, audience: updated.audience }); toast.success("Group style updated"); }
                catch { toast.error("Couldn't update the group style"); }
              }}>
                <option value="student">Study group style</option>
                <option value="professional">Team style</option>
              </Select>
            )}
            {canManageGroup && (
              <Button size="sm" variant="secondary" icon={Copy} onClick={handleCopyInviteCode}>
                Invite · {group.invite_code}
              </Button>
            )}
            {canManageGroup && (
              <Button size="sm" icon={Sparkles} loading={isGeneratingPlan} onClick={handleGeneratePlan}>
                {terms.planNext}
              </Button>
            )}
          </>
        }
      />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "Overview" && (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
          <StudyRoadmap
            groupId={group.id}
            items={group.learning_plan || []}
            canManage={true}
            onUpdate={loadData}
            progressPercent={group.progress_percent || 0}
            completedCount={group.completed_items_count || 0}
          />
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader title="Upcoming" action={<button onClick={() => setActiveTab("Sessions")} className="hover:text-foreground">All sessions</button>} />
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming sessions. Use “Plan next session” to let the AI propose one.</p>
              ) : (
                upcomingSessions.slice(0, 3).map((s) => <SessionRow key={s.id} session={s} />)
              )}
            </Card>
            <Card>
              <CardHeader title={`Library · ${resources.length}`} action={<button onClick={() => setActiveTab("Library")} className="hover:text-foreground">View all</button>} />
              {recentResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet. Upload PDFs, slides or Markdown.</p>
              ) : (
                recentResources.map((r) => <ResourceRow key={r.id} resource={r} />)
              )}
            </Card>
            {group.description && group.goal && (
              <Card>
                <CardHeader title="About" />
                <p className="text-base text-muted-foreground">{group.description}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "Sessions" && (
        <Card className="mt-6">
          <CardHeader
            title={`Sessions · ${sessions.length}`}
            action={
              canManageGroup && (
                <div className="flex items-center gap-2">
                  <Select aria-label="Session length" value={targetDuration} onChange={(e) => setTargetDuration(Number(e.target.value))} className="h-8 w-28 text-sm">
                    {[30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>{m} min</option>
                    ))}
                  </Select>
                  <Button size="sm" icon={Sparkles} loading={isGeneratingPlan} onClick={handleGeneratePlan}>AI planner</Button>
                  <Button size="sm" variant="secondary" icon={Calendar} onClick={() => navigate("/sessions")}>Schedule</Button>
                </div>
              )
            }
          />
          {sessions.length === 0 ? (
            <EmptyState icon={Calendar} title="No sessions yet" description="Plan one with the AI planner or schedule it yourself." />
          ) : (
            sessions.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </Card>
      )}

      {activeTab === "Library" && (
        <Card className="mt-6">
          <CardHeader title={`Library · ${resources.length}`} action={<Button size="sm" icon={Upload} onClick={() => setIsUploadOpen(true)}>Upload notes</Button>} />
          {resources.length === 0 ? (
            <EmptyState icon={FileText} title="No notes yet" description="Upload PDFs, DOCX, PPTX or Markdown. They're indexed so Ask AI can cite them." />
          ) : (
            resources.map((r) => (
              <ResourceRow key={r.id} resource={r} onDelete={canDelete(r) ? () => handleDeleteResource(r.id) : undefined} />
            ))
          )}
        </Card>
      )}

      {activeTab === "Members" && (
        <Card className="mt-6">
          <CardHeader title={`Members · ${memberCount}`} />
          <div className="grid gap-3 md:grid-cols-2">
            {(group.members || []).map((m) => {
              const isMe = m.user_id === Number(user?.id);
              return (
                <div key={m.user_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Avatar name={m.name || `User ${m.user_id}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-foreground">{memberName(m)}</div>
                    <div className="text-sm capitalize text-muted-foreground">{m.role.toLowerCase()}</div>
                  </div>
                  {m.role === "ORGANIZER" && <Badge tone="brand">Organizer</Badge>}
                  {canManageGroup && m.role !== "ORGANIZER" && !isMe && (
                    <button onClick={() => handleRemoveMember(m.user_id)} title="Remove member" aria-label="Remove member" className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            {canManageGroup && <Button size="sm" variant="ghost" icon={RefreshCw} onClick={handleRegenerateInvite}>Regenerate invite code</Button>}
            <Button size="sm" variant="danger" icon={LogOut} onClick={handleLeaveGroup}>Leave group</Button>
          </div>
        </Card>
      )}

      {activeTab === "Ask AI" && (
        <Card className="mt-6">
          <EmptyState
            icon={Sparkles}
            title={`Ask about ${group.name}`}
            description={`Answers come only from this group's ${resources.length} note${resources.length === 1 ? "" : "s"}, with the page they came from.`}
            action={<Button icon={Sparkles} onClick={() => navigate("/ai")}>Open Ask AI</Button>}
          />
        </Card>
      )}

      {isUploadOpen && (
        <DragDropUploader
          groupId={group.id}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => { setIsUploadOpen(false); loadData(); }}
        />
      )}

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
