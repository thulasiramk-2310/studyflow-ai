import { useState, useEffect } from "react";
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
    { label: "Groups joined", value: stats.groupsJoined.toString() },
    { label: "Resources shared", value: stats.resourcesShared.toString() },
    { label: "Sessions hosted", value: stats.sessionsHosted.toString() },
    { label: "Questions asked", value: "Coming Soon" },
  ];

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="max-w-[860px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      {/* Header card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-2xl font-extrabold shadow-md">
            {user.initials || getInitials(user.name)}
          </div>
          <div className="flex-1">
            <div className="text-[20px] font-extrabold tracking-tight">{user.name}</div>
            <div className="text-[13.5px] text-muted-foreground mt-0.5">{user.email}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-[11px] font-bold text-muted-foreground bg-border-soft px-2.5 py-0.5 rounded-full">
                Member since {stats.joinedAt}
              </span>
            </div>
          </div>
          <Link to="/settings" className="bg-surface border border-border rounded-lg px-3.5 py-2 text-[12.5px] font-semibold hover:bg-background transition-colors">
            Edit profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        {statCards.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="text-[12.5px] font-semibold text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-[24px] font-extrabold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Groups + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 mt-5 items-start">
        {/* Groups */}
        <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Groups joined</div>
          
          {groups.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              You haven't joined any groups yet.
            </div>
          ) : (
            groups.map((g) => {
              const isOrg = g.members?.some(m => m.user_id === Number(user.id) && m.role === "ORGANIZER");
              const init = getInitials(g.name);
              
              return (
                <Link to={`/groups/${g.id}`} key={g.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft hover:bg-background transition-colors cursor-pointer last:border-0">
                  <div className={`w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-[13px] font-extrabold shrink-0`}>
                    {init}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{g.name}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {g.members?.length || 1} members
                    </div>
                  </div>
                  {isOrg && <span className="text-[10.5px] font-bold text-secondary bg-secondary-soft px-2 py-0.5 rounded-full">Organizer</span>}
                  <ChevronRight className="w-4 h-4 text-border shrink-0" />
                </Link>
              );
            })
          )}
        </div>

        {/* Activity */}
        <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Activity</div>
          <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
            No recent activity found.
          </div>
        </div>
      </div>
    </div>
  );
}
