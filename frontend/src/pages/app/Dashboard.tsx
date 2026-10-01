import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, Calendar, Plus, Users } from "lucide-react";
import { DashboardSkeleton } from "../../components/skeletons";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";
import { JoinGroupModal } from "../../components/groups/JoinGroupModal";
import { Button, Card, CardHeader, EmptyState, PageHeader, StatTile } from "../../components/ui";
import { groupDotColor } from "../../components/layout/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import { userService, type DashboardResponse } from "../../services/user.service";
import { groupService, type Group } from "../../services/group.service";

function timeAgo(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : formatDistanceToNow(d, { addSuffix: true });
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, gs] = await Promise.all([userService.getDashboardStats(), groupService.getGroups()]);
      setDashboardData(data);
      setGroups(gs);
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

  const firstName = user.name?.split(" ")[0] ?? "there";
  const modals = (
    <>
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchData} />
      <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchData} />
    </>
  );

  if (dashboardData?.stats.groups === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
        <PageHeader title={`Welcome, ${firstName}`} subtitle="Start by creating a study group or joining one with an invite code." />
        <Card>
          <EmptyState
            icon={Users}
            title="You're not in a study group yet"
            description="Groups hold your notes, sessions and AI chats. Invite classmates with a code."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button icon={Plus} onClick={() => setIsCreateOpen(true)}>Create a group</Button>
                <Button variant="secondary" onClick={() => setIsJoinOpen(true)}>Join with a code</Button>
              </div>
            }
          />
        </Card>
        {modals}
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const upcoming = dashboardData?.upcoming_sessions ?? [];
  const next = upcoming[0];
  const activity = dashboardData?.recent_activity ?? [];
  const pathGroups = groups.filter((g) => (g.total_items_count ?? 0) > 0).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={`${format(new Date(), "EEEE, d MMMM")} · ${upcoming.length} upcoming session${upcoming.length === 1 ? "" : "s"}`}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Up next" action={next ? timeAgo(next.scheduled_at) : undefined} />
          {next ? (
            <>
              <div className="truncate text-md font-semibold text-foreground">{next.title}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {next.group_name} · {format(new Date(next.scheduled_at), "EEE d MMM, HH:mm")}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate(`/sessions/${next.id}`)}>Open session</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/sessions/${next.id}/quiz`)}>Take quiz</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/sessions/${next.id}`)}>Flashcards</Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Nothing scheduled"
              description="Plan a session from a group, or let the AI planner suggest one."
              action={<Button size="sm" onClick={() => navigate("/groups")}>Go to groups</Button>}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Learning paths" />
          {pathGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add topics to a group's learning path to track progress here.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {pathGroups.map((g) => (
                <Link key={g.id} to={`/groups/${g.id}`} className="group block">
                  <div className="mb-1.5 flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: groupDotColor(g.id) }} />
                    <span className="truncate font-medium text-foreground group-hover:underline">{g.name}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground">{g.completed_items_count} of {g.total_items_count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${g.progress_percent ?? 0}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="AI chats" value={dashboardData?.stats.conversations ?? 0} />
        <StatTile label="Quizzes" value={dashboardData?.stats.quizzes ?? 0} />
        <StatTile label="Flashcard decks" value={dashboardData?.stats.flashcards ?? 0} />
        <StatTile label="Notes indexed" value={dashboardData?.stats.resources ?? 0} />
      </div>

      <Card className="mt-5">
        <CardHeader title="Recent activity" />
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Activity from your groups shows up here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.slice(0, 6).map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Activity className="h-3.5 w-3.5" /></span>
                <span className="min-w-0 flex-1 truncate text-foreground">{a.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modals}
    </div>
  );
}
