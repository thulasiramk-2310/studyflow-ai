import { Link } from "react-router-dom";
import { ChevronRight, Upload, Calendar, Sparkles } from "lucide-react";
import { Sparkle } from "../../components/Icons";

const TABS = ["Overview", "Resources", "Sessions", "Members", "Progress", "AI Assistant"];

const RESOURCES = [
  { type: "PDF", name: "Molecular Biology Ch. 4.pdf", by: "Ada Okafor", date: "Jul 8", size: "4.2 MB", typeBg: "bg-red-100", typeColor: "text-red-600" },
  { type: "PPT", name: "Lecture 9 — Gene Expression.pptx", by: "Ada Okafor", date: "Jul 7", size: "8.1 MB", typeBg: "bg-orange-100", typeColor: "text-orange-600" },
  { type: "MD", name: "Study Notes — Operons.md", by: "Sofia Lopez", date: "Jul 6", size: "48 KB", typeBg: "bg-indigo-100", typeColor: "text-indigo-600" },
];

const MEMBERS = [
  { init: "AO", name: "Ada Okafor", email: "ada.okafor@uni.edu", role: "Organizer", prog: 100, bg: "bg-primary" },
  { init: "MC", name: "Marcus Chen", email: "m.chen@uni.edu", role: "Member", prog: 84, bg: "bg-sky-400" },
  { init: "SL", name: "Sofia Lopez", email: "s.lopez@uni.edu", role: "Member", prog: 67, bg: "bg-pink-400" },
  { init: "JP", name: "Jordan Park", email: "j.park@uni.edu", role: "Member", prog: 91, bg: "bg-amber-400" },
  { init: "PN", name: "Priya Nair", email: "p.nair@uni.edu", role: "Member", prog: 45, bg: "bg-purple-400" },
];

const UPCOMING = [
  { mon: "JUL", day: "11", topic: "Gene Regulation Review", time: "2:00 PM", organizer: "Ada Okafor", status: "Tomorrow", stBg: "bg-amber-100", stColor: "text-amber-700" },
  { mon: "JUL", day: "17", topic: "Midterm Prep Marathon", time: "1:00 PM", organizer: "Ada Okafor", status: "Thu", stBg: "bg-primary-soft", stColor: "text-primary" },
];

export function GroupWorkspace() {
  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      {/* Breadcrumb */}
      <div className="text-[12.5px] text-muted-foreground flex items-center gap-1.5">
        <Link to="/groups" className="text-primary hover:underline">My Groups</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-semibold">Biology 301</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mt-3.5">
        <div className="w-[52px] h-[52px] rounded-2xl bg-primary-soft text-primary flex items-center justify-center text-[19px] font-extrabold shrink-0">B3</div>
        <div className="flex-1">
          <div className="text-[21px] font-extrabold tracking-tight flex items-center gap-2.5">
            Biology 301 — Molecular Genetics
            <span className="text-[10.5px] font-bold text-secondary bg-secondary-soft border border-purple-100 px-2 py-0.5 rounded-full">Organizer</span>
          </div>
          <div className="text-[13px] text-muted-foreground mt-0.5">24 members · 18 resources · Next session Fri, 2:00 PM</div>
        </div>
        <div className="flex">
          {["AO","MC","SL","JP"].map((init, i) => (
            <div key={i} className="w-[30px] h-[30px] rounded-full bg-primary text-white flex items-center justify-center text-[10.5px] font-bold border-2 border-background -ml-2 first:ml-0">
              {init}
            </div>
          ))}
          <div className="w-[30px] h-[30px] rounded-full bg-border-soft text-muted-foreground flex items-center justify-center text-[10px] font-bold border-2 border-background -ml-2">+19</div>
        </div>
        <button className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors">Invite members</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mt-5 border-b border-border">
        {TABS.map((tab, i) => (
          <div key={i} className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors -mb-px ${i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"}`}>{tab}</div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-[1fr_320px] gap-5 mt-5 items-start">
        <div className="flex flex-col gap-5">
          {/* Progress */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex justify-between items-baseline">
              <span className="text-[14px] font-bold">Course progress</span>
              <span className="text-[13px] font-bold text-primary">72% complete</span>
            </div>
            <div className="mt-3 h-2 bg-border-soft rounded-full overflow-hidden">
              <div className="h-full w-[72%] bg-gradient-to-r from-primary to-secondary rounded-full" />
            </div>
            <div className="flex justify-between mt-2.5 text-[12px] text-muted-foreground">
              <span>13 of 18 modules covered</span>
              <span>Est. completion: Aug 2</span>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Recent resources</span>
              <Link to="/resources" className="text-[12.5px] font-semibold text-primary">View all</Link>
            </div>
            {RESOURCES.map((r, i) => (
              <div key={i} className="flex items-center gap-3.5 px-5 py-3 border-b border-border-soft hover:bg-background transition-colors cursor-pointer">
                <div className={`w-9 h-9 rounded-xl ${r.typeBg} ${r.typeColor} flex items-center justify-center text-[10px] font-extrabold shrink-0`}>{r.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{r.name}</div>
                  <div className="text-[11.5px] text-text-muted mt-0.5">{r.by} · {r.date} · {r.size}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-border shrink-0" />
              </div>
            ))}
          </div>

          {/* Sessions */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border-soft">
              <span className="text-[14px] font-bold">Upcoming sessions</span>
              <Link to="/sessions" className="text-[12.5px] font-semibold text-primary">View all</Link>
            </div>
            {UPCOMING.map((u, i) => (
              <Link to="/sessions/1" key={i} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft hover:bg-background transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold uppercase">{u.mon}</span>
                  <span className="text-[15px] font-extrabold leading-none">{u.day}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{u.topic}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">{u.time} · {u.organizer}</div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${u.stBg} ${u.stColor}`}>{u.status}</span>
              </Link>
            ))}
          </div>
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

          {/* AI Recommendation */}
          <div className="bg-secondary-soft border border-purple-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-secondary">
              <Sparkle className="w-4 h-4" /> AI recommendation
            </div>
            <div className="mt-2 text-[12.5px] leading-relaxed text-purple-900">
              Members struggled with "gene regulation" in last week's quiz. Consider a review session before Friday.
            </div>
            <div className="flex gap-2 mt-3">
              <button className="bg-secondary text-white border-none rounded-lg px-3 py-1.5 text-[12px] font-bold hover:opacity-90 transition-opacity">Approve</button>
              <button className="bg-surface text-secondary border border-purple-100 rounded-lg px-3 py-1.5 text-[12px] font-bold hover:bg-white transition-colors">Dismiss</button>
            </div>
          </div>

          {/* Members preview */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="px-4 py-3.5 border-b border-border-soft text-[13.5px] font-bold">Members ({MEMBERS.length})</div>
            {MEMBERS.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border-soft last:border-0">
                <div className={`w-8 h-8 rounded-full ${m.bg} text-white flex items-center justify-center text-[11px] font-bold shrink-0`}>{m.init}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">{m.role}</div>
                </div>
                <div className="text-[11.5px] font-bold text-muted-foreground">{m.prog}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
