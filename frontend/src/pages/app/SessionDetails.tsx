import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { Sparkle } from "../../components/Icons";
import { sessionService } from "../../services/session.service";
import type { Session } from "../../services/session.service";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/shared";
import { MOCK_MEMBERS } from "../../lib/mock-data";

const AGENDA = [
  { n: 1, title: "Recap: promoter & operon structure", detail: "Quick review of last session", dur: "10 min" },
  { n: 2, title: "The lac operon in depth", detail: "Inducible vs repressible systems", dur: "25 min" },
  { n: 3, title: "Eukaryotic enhancers & TFs", detail: "Walk through Ch. 4 pp. 88–92", dur: "30 min" },
  { n: 4, title: "Practice quiz + Q&A", detail: "AI-generated, 5 questions", dur: "25 min" },
];

export function SessionDetails() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const fetchSession = async () => {
    try {
      const data = await sessionService.getSession(Number(sessionId));
      setSession(data);
    } catch (error) {
      toast.error("Failed to fetch session details.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    sessionService.getSession(Number(sessionId))
      .then(data => {
        if (isMounted) setSession(data);
      })
      .catch(() => {
        if (isMounted) toast.error("Failed to fetch session details.");
      })
      .finally(() => {
        if (isMounted) {
          setTimeout(() => setLoading(false), 800);
        }
      });

    return () => { isMounted = false; };
  }, [sessionId]);

  const handleComplete = async () => {
    if (!sessionId) return;
    setCompleting(true);
    try {
      await sessionService.completeSession(Number(sessionId));
      toast.success("Session marked as completed!");
      await fetchSession(); // refresh
    } catch (error) {
      toast.error("Failed to complete session.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12">
        <PageHeader title="Loading Session..." />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12">
        <PageHeader title="Session Details" />
        <EmptyState icon={Clock} title="Session not found" description="The session you're looking for doesn't exist or has been removed." />
      </div>
    );
  }

  const sessionDate = new Date(session.scheduled_at);
  const month = sessionDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = sessionDate.getDate();
  const time = sessionDate.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' });
  const isCompleted = session.status === "COMPLETED";

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      <PageHeader
        title={session.title}
        subtitle={`${month} ${day} · ${time} · ${session.duration_minutes} min`}
        actions={
          <>
            <span className="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
              {session.status}
            </span>
            {!isCompleted && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {completing ? "Marking..." : "Mark Completed"}
              </button>
            )}
          </>
        }
      />

      {isCompleted && (
        <div className="mt-2 bg-primary-soft/50 border border-primary-soft rounded-2xl p-4 text-primary text-[13.5px] font-medium text-center">
          Generating Summary... Generating Quiz... <br/>
          <span className="text-primary/70 text-[12.5px]">(Coming Soon) AI Summary and Quiz will be available after AI integration.</span>
        </div>
      )}

      <div className="grid grid-cols-[1fr_300px] gap-5 mt-6 items-start">
        <div className="flex flex-col gap-5">
          {/* Agenda */}
          <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-4 border-b border-border-soft text-[14px] font-bold">Agenda</div>
            
            {session.agenda ? (
              <div className="px-5 py-4 text-[13.5px] whitespace-pre-wrap">{session.agenda}</div>
            ) : (
              AGENDA.map((a, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-border-soft last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-[12px] font-bold shrink-0">{a.n}</div>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold">{a.title}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{a.detail}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-muted-foreground shrink-0">
                    <Clock className="w-3.5 h-3.5" /> {a.dur}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white shadow-[0_8px_24px_rgba(91,75,255,0.2)]">
            <div className="flex items-center gap-2 font-bold text-[14px]">
              <Sparkle className="w-4 h-4" /> AI Session Insight
            </div>
            <div className="mt-2.5 text-[13px] leading-relaxed text-white/90">
              Based on recent quiz scores, members struggled most with <b>gene regulation</b> (avg 34%). Focus extra time on the lac operon and eukaryotic enhancers during this session.
            </div>
            <div className="flex gap-2 mt-3">
              <Link to="/quiz" className="bg-white/20 text-white border border-white/25 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold hover:bg-white/30 transition-colors">Generate quiz</Link>
              <Link to="/ai" className="bg-white/20 text-white border border-white/25 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold hover:bg-white/30 transition-colors">Ask AI</Link>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="text-[13.5px] font-bold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> Attending ({MOCK_MEMBERS.length} / 24)
            </div>
            <div className="flex flex-col gap-2">
              {MOCK_MEMBERS.map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${m.bg} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                    {m.init}
                  </div>
                  <span className="text-[13px] font-medium">{m.name}</span>
                </div>
              ))}
              <div className="text-[12px] text-muted-foreground mt-1">+13 more confirmed</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="text-[13.5px] font-bold mb-3">Resources for this session</div>
            {session.resources && session.resources.length > 0 ? (
              session.resources.map((r) => {
                const filename = r.original_filename || r.filename;
                const isPdf = filename.toLowerCase().endsWith('.pdf');
                const isPpt = filename.toLowerCase().endsWith('.ppt') || filename.toLowerCase().endsWith('.pptx');
                const type = isPdf ? "PDF" : isPpt ? "PPT" : filename.split('.').pop()?.toUpperCase() || "FILE";
                const typeBg = isPdf ? "bg-red-100" : isPpt ? "bg-orange-100" : "bg-blue-100";
                const typeColor = isPdf ? "text-red-600" : isPpt ? "text-orange-600" : "text-blue-600";
                
                return (
                  <div key={r.id} className="flex items-center gap-2.5 py-2.5 border-b border-border-soft last:border-0">
                    <div className={`w-7 h-7 rounded-lg ${typeBg} ${typeColor} flex items-center justify-center text-[9px] font-extrabold shrink-0`}>{type}</div>
                    <span className="text-[12.5px] font-medium flex-1 truncate">{filename}</span>
                    <Download className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
                  </div>
                );
              })
            ) : (
              <div className="text-[13px] text-muted-foreground py-2">No resources attached.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
