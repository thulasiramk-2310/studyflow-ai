import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState, StatusBadge } from "../../components/shared";
import { SessionsSkeleton } from "../../components/skeletons";
import { sessionService } from "../../services/session.service";
import type { Session } from "../../services/session.service";
import { groupService } from "../../services/group.service";
import { CreateSessionModal } from "../../components/sessions/CreateSessionModal";

const FILTERS = ["Upcoming", "Today", "This Week", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

const PASTEL_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
];

const getColor = (id: number) => PASTEL_COLORS[id % PASTEL_COLORS.length];

export function Sessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groupNames, setGroupNames] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<Filter>("Upcoming");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [sessionsData, groupsData] = await Promise.all([
        sessionService.getSessions(),
        groupService.getGroups().catch(() => [])
      ]);
      setSessions(sessionsData);

      const groupMap: Record<number, string> = {};
      groupsData.forEach(g => {
        groupMap[g.id] = g.name;
      });
      setGroupNames(groupMap);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const filtered = sessions
    .filter(s => {
      const sDate = new Date(s.scheduled_at);
      if (filter === "Completed") return s.status === "COMPLETED";

      if (s.status === "COMPLETED" || s.status === "CANCELLED") return false;

      if (filter === "Today") return sDate >= today && sDate < tomorrow;
      if (filter === "This Week") return sDate >= today && sDate < nextWeek;
      if (filter === "Upcoming") return sDate >= today || s.status === "LIVE";

      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.scheduled_at).getTime();
      const bTime = new Date(b.scheduled_at).getTime();
      return filter === "Completed" ? bTime - aTime : aTime - bTime;
    });

  // Group by date string (e.g., "Oct 12, 2024")
  const grouped = filtered.reduce((acc, session) => {
    const d = new Date(session.scheduled_at);
    
    let key = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    
    // Nice friendly labels
    const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dStart.getTime() === today.getTime()) key = "Today, " + key;
    else if (dStart.getTime() === tomorrow.getTime()) key = "Tomorrow, " + key;

    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  if (loading) return <SessionsSkeleton />;

  return (
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[900px] mx-auto">
      <PageHeader
        title="Study Sessions"
        subtitle={`${sessions.filter(s => s.status !== "COMPLETED" && s.status !== "CANCELLED").length} upcoming sessions`}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={3} /> Schedule
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-0.5 border-b border-border mb-6">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors -mb-px ${filter === f ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={Calendar} 
          title="No sessions found" 
          description={`No ${filter.toLowerCase()} sessions. Schedule one to get started!`}
          action={
            <button 
              onClick={() => setIsCreateOpen(true)} 
              className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors"
            >
              Schedule Session
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([dateStr, sessionsForDate]) => (
            <div key={dateStr}>
              <h3 className="text-[13px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">{dateStr}</h3>
              <div className="flex flex-col gap-3">
                {sessionsForDate.map(s => {
                  const sDate = new Date(s.scheduled_at);
                  const mon = sDate.toLocaleString('default', { month: 'short' });
                  const day = sDate.getDate();
                  const time = sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isLive = s.status === "LIVE";
                  const colors = getColor(s.id);
                  const groupName = groupNames[s.group_id] || `Group #${s.group_id}`;
                  const agendaItems = s.agenda ? s.agenda.split(/[\n,]+/).map(a => a.trim()).filter(Boolean) : [];

                  return (
                    <Link to={`/sessions/${s.id}`} key={s.id}
                      className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-start gap-4 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all group">
                      
                      {/* Date block */}
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex flex-col items-center justify-center shrink-0 shadow-sm`}>
                        <div className="text-[9px] font-bold uppercase leading-none">{mon}</div>
                        <div className="text-[18px] font-extrabold leading-tight mt-0.5">{day}</div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-bold">{s.title}</span>
                          {isLive && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-0.5">{groupName} · {time}</div>
                        
                        {agendaItems.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {agendaItems.map((a, i) => (
                              <span key={i} className="text-[11px] bg-border-soft text-muted-foreground rounded-md px-2 py-0.5 font-medium">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Right */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <StatusBadge 
                          status={isLive ? "live" : s.status.toLowerCase() as any} 
                          label={s.status} 
                          showDot={isLive} 
                        />
                        <div className="text-[12px] text-muted-foreground whitespace-nowrap">
                          0 attending
                        </div>
                        <ChevronRight className="w-4 h-4 text-border opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSessionModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={fetchSessions} 
      />
    </div>
  );
}
