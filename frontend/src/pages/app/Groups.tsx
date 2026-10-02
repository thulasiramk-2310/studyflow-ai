import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Search, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState } from "../../components/shared";
import { GroupsSkeleton } from "../../components/skeletons";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { CreateGroupModal } from "../../components/groups/CreateGroupModal";
import { JoinGroupModal } from "../../components/groups/JoinGroupModal";
import { useAuth } from "../../hooks/useAuth";
import { groupDotColor } from "../../components/layout/Sidebar";

export function Groups() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [query, setQuery] = useState("");
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

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    (g.description || "").toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <GroupsSkeleton />;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
      <PageHeader
        title="Groups"
        subtitle={`${groups.length} groups joined`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex items-center gap-1.5 bg-surface border border-border text-foreground rounded-lg px-3.5 py-2 text-sm font-semibold hover:bg-muted transition-colors shadow-sm"
            >
              Join group
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3.5 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={3} /> Create group
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 mb-4 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search groups…"
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No groups found" description={query ? `No groups match "${query}". Try a different term.` : "Create your first study group to get started."} action={
          <div className="flex gap-2">
            <button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors">
              Create Group
            </button>
            {!query && (
              <button onClick={() => setIsJoinOpen(true)} className="bg-surface border border-border text-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors">
                Join group
              </button>
            )}
          </div>
        } />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {filtered.map((g, i) => {
            const isOrg = g.members?.some(m => m.user_id === Number(user?.id) && m.role === "ORGANIZER");
            const init = g.name.substring(0, 2).toUpperCase();
            const memberCount = g.members?.length || 1;
            
            return (
              <Link to={`/groups/${g.id}`} key={g.id}
                className={`flex items-center gap-4 px-5 py-4 border-b border-border-soft last:border-0 hover:bg-muted transition-colors ${i === 0 ? "" : ""}`}>
                <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-sm font-bold text-primary-text">{init}<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-sm ring-2 ring-surface" style={{ background: groupDotColor(g.id) }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-lg text-foreground">{g.name}</span>
                    {isOrg && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text">Organizer</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{g.goal || g.description || "No description"}</div>
                  {(g.total_items_count ?? 0) > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${g.progress_percent ?? 0}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{g.completed_items_count} of {g.total_items_count} topics</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-xs font-semibold">{memberCount} member{memberCount === 1 ? "" : "s"}</div>
                  {isOrg && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Invite: <span className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-foreground select-all">{g.invite_code}</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-border shrink-0 ml-2" />
              </Link>
            );
          })}
        </div>
      )}
      
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchGroups} />
      <JoinGroupModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSuccess={fetchGroups} />
    </div>
  );
}
