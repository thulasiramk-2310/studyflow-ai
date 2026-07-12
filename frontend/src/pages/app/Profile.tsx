import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const STATS = [
  { label: "Groups joined", value: "6" },
  { label: "Resources shared", value: "41" },
  { label: "Sessions hosted", value: "12" },
  { label: "Questions asked", value: "248" },
];

const GROUPS = [
  { init: "B3", name: "Biology 301", members: 24, progress: 72, isOrg: true, tileBg: "bg-primary-soft", tileColor: "text-primary" },
  { init: "LA", name: "Linear Algebra", members: 16, progress: 54, isOrg: false, tileBg: "bg-secondary-soft", tileColor: "text-secondary" },
  { init: "OC", name: "Organic Chem", members: 31, progress: 38, isOrg: true, tileBg: "bg-emerald-50", tileColor: "text-emerald-600" },
  { init: "CS", name: "CS 210", members: 48, progress: 81, isOrg: false, tileBg: "bg-amber-50", tileColor: "text-amber-600" },
];

const ACTIVITY = [
  { what: "Uploaded", target: "Problem Set 5.pdf", when: "12 min ago" },
  { what: "Joined quiz in", target: "Biology 301", when: "3 hours ago" },
  { what: "Scheduled", target: "Gene Regulation Review", when: "1 hour ago" },
  { what: "Shared", target: "Lecture 9 — Gene Expression.pptx", when: "2 days ago" },
];

export function Profile() {
  return (
    <div className="max-w-[860px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      {/* Header card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-2xl font-extrabold shadow-md">AO</div>
          <div className="flex-1">
            <div className="text-[20px] font-extrabold tracking-tight">Ada Okafor</div>
            <div className="text-[13.5px] text-muted-foreground mt-0.5">ada.okafor@university.edu</div>
            <div className="flex gap-2 mt-2">
              <span className="text-[11px] font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full">Organizer</span>
              <span className="text-[11px] font-bold text-muted-foreground bg-border-soft px-2.5 py-0.5 rounded-full">Member since 2024</span>
            </div>
          </div>
          <Link to="/settings" className="bg-surface border border-border rounded-lg px-3.5 py-2 text-[12.5px] font-semibold hover:bg-background transition-colors">
            Edit profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-5">
        {STATS.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="text-[12.5px] font-semibold text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-[24px] font-extrabold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Groups + Activity */}
      <div className="grid grid-cols-[1fr_300px] gap-5 mt-5 items-start">
        <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Groups joined</div>
          {GROUPS.map((g, i) => (
            <Link to="/groups/biology-301" key={i} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft hover:bg-background transition-colors cursor-pointer">
              <div className={`w-9 h-9 rounded-xl ${g.tileBg} ${g.tileColor} flex items-center justify-center text-[13px] font-extrabold shrink-0`}>{g.init}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold">{g.name}</div>
                <div className="text-[12px] text-text-muted mt-0.5">{g.members} members · {g.progress}% progress</div>
              </div>
              {g.isOrg && <span className="text-[10.5px] font-bold text-secondary bg-secondary-soft px-2 py-0.5 rounded-full">Organizer</span>}
              <ChevronRight className="w-4 h-4 text-border shrink-0" />
            </Link>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Activity</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex gap-3 px-5 py-3.5 border-b border-border-soft last:border-0 items-start">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <div className="text-[12.5px] leading-relaxed">{a.what} <span className="font-semibold">{a.target}</span></div>
                <div className="text-[11px] text-text-muted mt-0.5">{a.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
