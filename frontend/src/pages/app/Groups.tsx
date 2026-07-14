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
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[900px] mx-auto">
      <PageHeader
        title="My Groups"
        subtitle={`${groups.length} groups joined`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
              Join Group
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={3} /> New Group
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
          className="flex-1 bg-transparent outline-none text-[13px] text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No groups found" description={query ? `No groups match "${query}". Try a different term.` : "Create your first study group to get started."} action={
          <div className="flex gap-2">
            <button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors">
              Create Group
            </button>
            {!query && (
              <button onClick={() => setIsJoinOpen(true)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-gray-50 transition-colors">
                Join Group
              </button>
            )}
          </div>
        } />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {filtered.map((g, i) => {
            const isOrg = g.members?.some(m => m.user_id === Number(user?.id) && m.role === "ORGANIZER");
            const init = g.name.substring(0, 2).toUpperCase();
            const memberCount = g.members?.length || 1;
            
            return (
              <Link to={`/groups/${g.id}`} key={g.id}
                className={`flex items-center gap-4 px-5 py-4 border-b border-border-soft last:border-0 hover:bg-background transition-colors ${i === 0 ? "" : ""}`}>
                <div className={`w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-[13px] font-extrabold shrink-0`}>{init}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold truncate">{g.name}</span>
                    {isOrg && <span className="text-[10.5px] font-bold text-secondary bg-secondary-soft px-2 py-0.5 rounded-full">Organizer</span>}
                  </div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5 truncate">{g.description || "No description"}</div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-[12.5px] font-semibold">{memberCount} members</div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">Invite: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700 select-all">{g.invite_code}</span></div>
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
