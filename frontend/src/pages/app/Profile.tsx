import { useState, useEffect } from "react";
import { useTerms } from "../../hooks/useTerms";
import { userService } from "../../services/user.service";
import type { UserProfileStats } from "../../services/user.service";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { ProfileSkeleton } from "../../components/skeletons";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Profile() {
  const { user } = useAuth();
  const terms = useTerms();
  
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<UserProfileStats | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [groupsData, statsData] = await Promise.all([
          groupService.getGroups().catch(() => []),
          userService.getProfileStats().catch(() => null),
        ]);
        
        setGroups(groupsData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  if (loading || !user || !stats) {
    return <ProfileSkeleton />;
  }

  const statCards = [
    { label: `${terms.groups} joined`, value: stats.groupsJoined.toString() },
    { label: "Resources shared", value: stats.resourcesShared.toString() },
    { label: `${terms.sessions} hosted`, value: stats.sessionsHosted.toString() },
    { label: "AI chats", value: stats.aiConversations.toString() },
    { label: "Questions asked", value: stats.aiQuestionsAsked.toString() },
  ];

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8 md:px-8">
      {/* Header card */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-primary-soft text-primary-text flex items-center justify-center font-serif text-2xl">
            {user.initials || getInitials(user.name)}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-xl text-foreground">{user.name}</h1>
            <div className="text-sm text-muted-foreground mt-0.5">{user.email}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                Member since {stats.joinedAt}
              </span>
            </div>
          </div>
          <Link to="/settings" className="bg-surface border border-border rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors">
            Edit profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-5">
        {statCards.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl px-5 py-4">
            <div className="text-xs font-semibold text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-serif text-xl text-primary-text">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Groups + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 mt-5 items-start">
        {/* Groups */}
        <div className="bg-surface border border-border rounded-xl">
          <div className="px-5 py-4 border-b border-border-soft text-base font-bold">{terms.groups} joined</div>
          
          {groups.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              You haven't joined any {terms.groupsLower} yet.
            </div>
          ) : (
            groups.map((g) => {
              const isOrg = g.members?.some(m => m.user_id === Number(user.id) && m.role === "ORGANIZER");
              const init = getInitials(g.name);
              
              return (
                <Link to={`/groups/${g.id}`} key={g.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft hover:bg-muted transition-colors cursor-pointer last:border-0">
                  <div className={`w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-sm font-bold shrink-0`}>
                    {init}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{g.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {g.members?.length || 1} members
                    </div>
                  </div>
                  {isOrg && <span className="text-xs font-bold text-primary-text bg-primary-soft px-2 py-0.5 rounded-full">{terms.organizer}</span>}
                  <ChevronRight className="w-4 h-4 text-border shrink-0" />
                </Link>
              );
            })
          )}
        </div>

        {/* Activity */}
        <div className="bg-surface border border-border rounded-xl">
          <div className="px-5 py-4 border-b border-border-soft text-base font-bold">Activity</div>
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No recent activity found.
          </div>
        </div>
      </div>
    </div>
  );
}
