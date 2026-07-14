import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, MapPin, Users, Video, Download, Sparkle, ExternalLink, Settings } from "lucide-react";
import { sessionService, type Session, type SessionSummary, type FlashcardDeckResponse, type SessionAttendanceResponse, type MeetingType } from "../../services/session.service";
import { groupService, type Group } from "../../services/group.service";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { FlashcardViewer } from "../../components/study/FlashcardViewer";
import { PageHeader, LoadingSkeleton, EmptyState } from "../../components/shared";
import { EditSessionModal } from "../../components/sessions/EditSessionModal";

const AGENDA = [
  { n: 1, title: "Review previous topics", detail: "Go over chapter 4 notes", dur: "15m" },
  { n: 2, title: "Practice problems", detail: "Work on set #3", dur: "45m" },
  { n: 3, title: "Q&A Session", detail: "Discuss difficult concepts", dur: "30m" }
];

export function SessionDetails() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<FlashcardDeckResponse | null>(null);
  const [attendance, setAttendance] = useState<SessionAttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingQuiz, setRegeneratingQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [regeneratingFlashcards, setRegeneratingFlashcards] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchSession = async () => {
    try {
      const data = await sessionService.getSession(Number(sessionId));
      setSession(data);
      const att = await sessionService.getSessionAttendance(Number(sessionId));
      setAttendance(att);
    } catch (error) {
      toast.error("Failed to fetch session details.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    sessionService.getSession(Number(sessionId))
      .then(async data => {
        if (!isMounted) return;
        setSession(data);
        try {
          const g = await groupService.getGroup(data.group_id);
          if (isMounted) setGroup(g);
          const att = await sessionService.getSessionAttendance(Number(sessionId));
          if (isMounted) setAttendance(att);
        } catch (e) {
          console.error(e);
        }
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

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    const checkSummary = async () => {
      if (session?.status !== "COMPLETED") return;
      try {
        const res = await sessionService.getSessionSummary(session.id);
        setSummary(res);
        if (res.status === "PENDING" || res.status === "GENERATING") {
          t = setTimeout(checkSummary, 3000);
        }
      } catch (e) {
        // Not generated yet
      }
    };
    const checkQuiz = async () => {
      if (session?.status !== "COMPLETED") return;
      try {
        const res = await sessionService.getSessionQuiz(session.id);
        setQuiz(res);
        if (res.status === "PENDING" || res.status === "GENERATING") {
          t2 = setTimeout(checkQuiz, 3000);
        }
      } catch (e) {
        // Not generated yet
      }
    };
    const checkFlashcards = async () => {
      if (session?.status !== "COMPLETED") return;
      try {
        const res = await sessionService.getFlashcards(session.id);
        setFlashcards(res);
        if (res.status === "PENDING" || res.status === "GENERATING") {
          t3 = setTimeout(checkFlashcards, 3000);
        }
      } catch (e) {
        // Not generated yet
      }
    };
    
    if (session?.status === "COMPLETED" && (!summary || summary.status === "PENDING" || summary.status === "GENERATING")) checkSummary();
    if (session?.status === "COMPLETED" && (!quiz || quiz.status === "PENDING" || quiz.status === "GENERATING")) checkQuiz();
    if (session?.status === "COMPLETED" && (!flashcards || flashcards.status === "PENDING" || flashcards.status === "GENERATING")) checkFlashcards();
    
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); };
  }, [session?.status, session?.id, summary?.status, quiz?.status, flashcards?.status]);

  const handleComplete = async () => {
    if (!sessionId) return;
    setCompleting(true);
    try {
      await sessionService.completeSession(Number(sessionId));
      toast.success("Session marked as completed!");
      await fetchSession();
    } catch (error) {
      toast.error("Failed to complete session.");
    } finally {
      setCompleting(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!sessionId || !session) return;
    setJoining(true);
    try {
      const res = await sessionService.joinSession(session.id);
      if (res.meeting_url) {
        window.open(res.meeting_url, '_blank');
      } else {
        toast.success("Attendance marked!");
      }
      const att = await sessionService.getSessionAttendance(session.id);
      setAttendance(att);
    } catch (err) {
      toast.error("Failed to join meeting");
    } finally {
      setJoining(false);
    }
  };

  const handleRegenerate = async () => {
    if (!sessionId) return;
    setRegenerating(true);
    try {
      await sessionService.regenerateSessionSummary(Number(sessionId));
      toast.success("Summary regeneration started");
      setSummary(prev => prev ? { ...prev, status: "GENERATING" } : null);
    } catch (error) {
      toast.error("Failed to regenerate summary.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerateQuiz = async () => {
    if (!sessionId) return;
    setRegeneratingQuiz(true);
    try {
      await sessionService.regenerateSessionQuiz(Number(sessionId));
      toast.success("Quiz regeneration started");
      setQuiz((prev: any) => prev ? { ...prev, status: "GENERATING" } : null);
    } catch (error) {
      toast.error("Failed to regenerate quiz.");
    } finally {
      setRegeneratingQuiz(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!sessionId) return;
    setGeneratingQuiz(true);
    try {
      await sessionService.regenerateSessionQuiz(Number(sessionId));
      toast.success("Quiz generation started");
      setQuiz({ status: "GENERATING" });
    } catch (error) {
      toast.error("Failed to generate quiz.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleRegenerateFlashcards = async () => {
    if (!sessionId) return;
    setRegeneratingFlashcards(true);
    try {
      await sessionService.regenerateFlashcards(Number(sessionId));
      toast.success("Flashcard regeneration started");
      setFlashcards((prev: any) => prev ? { ...prev, status: "GENERATING" } : null);
    } catch (error) {
      toast.error("Failed to regenerate flashcards.");
    } finally {
      setRegeneratingFlashcards(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!sessionId) return;
    setGeneratingFlashcards(true);
    try {
      await sessionService.generateFlashcards(Number(sessionId));
      toast.success("Flashcard generation started");
      setFlashcards({ status: "GENERATING" } as any);
    } catch (error) {
      toast.error("Failed to generate flashcards.");
    } finally {
      setGeneratingFlashcards(false);
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
  const userRole = group?.members?.find((m) => m.user_id === Number(user?.id))?.role || "MEMBER";
  const canManageGroup = userRole === "ORGANIZER";
  const getMeetingIcon = (type: MeetingType) => {
    switch (type) {
      case "GOOGLE_MEET": return <Video className="w-5 h-5 text-emerald-600" />;
      case "ZOOM": return <Video className="w-5 h-5 text-blue-500" />;
      case "MICROSOFT_TEAMS": return <Video className="w-5 h-5 text-indigo-600" />;
      case "DISCORD": return <Video className="w-5 h-5 text-purple-500" />;
      default: return <MapPin className="w-5 h-5 text-muted-foreground" />;
    }
  };
  const getMeetingName = (type: MeetingType) => {
    switch (type) {
      case "GOOGLE_MEET": return "Google Meet";
      case "ZOOM": return "Zoom";
      case "MICROSOFT_TEAMS": return "Microsoft Teams";
      case "DISCORD": return "Discord";
      case "OTHER": return "Other Link";
      default: return "No meeting link added";
    }
  };

  return (
    <div className="max-w-[1180px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      {isEditModalOpen && (
        <EditSessionModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          session={session} 
          onSuccess={fetchSession} 
        />
      )}
      <PageHeader
        title={session.title}
        subtitle={`${group?.name || 'Group Session'}`}
        actions={
          <div className="flex items-center gap-2">
            {canManageGroup && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-surface text-foreground border border-border rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-surface-hover transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Edit
              </button>
            )}
            {canManageGroup && !isCompleted && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {completing ? "Marking..." : "Mark Completed"}
              </button>
            )}
          </div>
        }
      />

      {/* Hero Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center">
          <div className="text-[12px] font-medium text-muted-foreground mb-1">Status</div>
          <div className="text-[14px] font-bold">
            <span className={`px-2 py-0.5 rounded text-[11.5px] font-bold ${
              session.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
              session.status === 'LIVE' ? 'bg-rose-100 text-rose-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {session.status}
            </span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center">
          <div className="text-[12px] font-medium text-muted-foreground mb-1">Generated By</div>
          <div className="text-[14px] font-bold flex items-center gap-1.5">
            {(session as any).generated_by === 'AI' ? <Sparkle className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-muted-foreground" />}
            {(session as any).generated_by || "MANUAL"}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center">
          <div className="text-[12px] font-medium text-muted-foreground mb-1">Date</div>
          <div className="text-[14px] font-bold">{month} {day}</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center">
          <div className="text-[12px] font-medium text-muted-foreground mb-1">Time</div>
          <div className="text-[14px] font-bold">{time}</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center">
          <div className="text-[12px] font-medium text-muted-foreground mb-1">Duration</div>
          <div className="text-[14px] font-bold">{session.duration_minutes} Minutes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 mt-6 items-start">
        <div className="flex flex-col gap-6">
          {/* Meeting Block */}
          {!isCompleted && (
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-[0_8px_24px_rgba(99,102,241,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  {getMeetingIcon(session.meeting_type)}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-white">{getMeetingName(session.meeting_type)}</h3>
                  {session.meeting_url ? (
                    <p className="text-[13px] text-white/80 font-medium mt-0.5 truncate max-w-[200px] sm:max-w-xs">{session.meeting_url}</p>
                  ) : (
                    <p className="text-[13px] text-white/80 mt-0.5">Link not provided</p>
                  )}
                </div>
              </div>
              <button 
                onClick={handleJoinMeeting}
                disabled={joining || !session.meeting_url}
                className="w-full sm:w-auto bg-white text-indigo-600 rounded-xl px-5 py-2.5 text-[14px] font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joining ? "Joining..." : "Join Meeting"}
                {session.meeting_url && <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* After Completion AI Summaries */}
          {isCompleted && (
            <div className="flex flex-col gap-6 animate-[sfFade_0.4s_ease]">
              {/* Summary */}
              {summary?.status === "READY" ? (
                <div className="bg-white border border-border rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.03)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-border-soft flex items-center justify-between">
                    <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                      <Sparkle className="w-5 h-5 text-primary" /> Session Summary
                    </h2>
                    {canManageGroup && (
                      <button onClick={handleRegenerate} disabled={regenerating} className="text-[12.5px] text-muted-foreground hover:text-foreground font-medium disabled:opacity-50">
                        {regenerating ? "Regenerating..." : "Regenerate"}
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-[14px] font-bold text-foreground mb-2">Executive Summary</h3>
                    <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">{summary.summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-[14px] font-bold text-foreground mb-3">Key Concepts</h3>
                        <ul className="flex flex-col gap-2">
                          {summary.key_concepts?.map((kc, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-muted-foreground">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <span>{kc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-foreground mb-3">Important Points</h3>
                        <ul className="flex flex-col gap-2">
                          {summary.important_points?.map((ip, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-muted-foreground">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{ip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : summary?.status === "FAILED" ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-[13.5px] font-medium text-center">
                  AI Summary failed to generate. <button onClick={handleRegenerate} className="underline">Try again</button>
                </div>
              ) : (
                <div className="bg-primary-soft/50 border border-primary-soft rounded-2xl p-4 text-primary text-[13.5px] font-medium text-center">
                  AI Summary <br/> ⏳ Generating...
                </div>
              )}

              {/* Quiz */}
              {quiz?.status === "READY" ? (
                <div className="bg-white border border-border rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.03)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-border-soft flex items-center justify-between">
                    <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                      <Sparkle className="w-5 h-5 text-primary" /> Session Quiz
                    </h2>
                    <div className="flex items-center gap-3">
                      {canManageGroup && (
                        <button onClick={handleRegenerateQuiz} disabled={regeneratingQuiz} className="text-[12.5px] text-muted-foreground hover:text-foreground font-medium disabled:opacity-50">
                          {regeneratingQuiz ? "Regenerating..." : "Regenerate"}
                        </button>
                      )}
                      <Link to={`/sessions/${session.id}/quiz`} className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors">
                        Take Quiz
                      </Link>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-surface text-[13px] text-muted-foreground flex justify-between">
                    <span>{quiz.questions?.length || 0} questions generated from session materials</span>
                    {quiz.model && <span className="text-[11px]">Generated by {quiz.model}</span>}
                  </div>
                </div>
              ) : quiz?.status === "FAILED" ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-[13.5px] font-medium text-center">
                  AI Quiz failed to generate. <button onClick={handleRegenerateQuiz} className="underline">Try again</button>
                </div>
              ) : !quiz ? (
                <div className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground">AI Quiz</h3>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">Test your knowledge on this session's materials.</p>
                  </div>
                  {canManageGroup && (
                    <button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover">
                      Generate Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-primary-soft/50 border border-primary-soft rounded-2xl p-4 text-primary text-[13.5px] font-medium text-center">
                  AI Quiz <br/> ⏳ Generating...
                </div>
              )}

              {/* Flashcards */}
              {flashcards?.status === "READY" ? (
                <div className="bg-white border border-border rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.03)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-border-soft flex items-center justify-between">
                    <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                      <Sparkle className="w-5 h-5 text-primary" /> Flashcards
                    </h2>
                    {canManageGroup && (
                      <button onClick={handleRegenerateFlashcards} disabled={regeneratingFlashcards} className="text-[12.5px] text-muted-foreground hover:text-foreground font-medium disabled:opacity-50">
                        {regeneratingFlashcards ? "Regenerating..." : "Regenerate"}
                      </button>
                    )}
                  </div>
                  <div className="p-6 bg-surface">
                    <FlashcardViewer flashcards={flashcards.flashcards} />
                  </div>
                </div>
              ) : flashcards?.status === "FAILED" ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-[13.5px] font-medium text-center">
                  AI Flashcards failed to generate. <button onClick={handleRegenerateFlashcards} className="underline">Try again</button>
                </div>
              ) : !flashcards ? (
                <div className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground">AI Flashcards</h3>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">Memorize key concepts from this session.</p>
                  </div>
                  {canManageGroup && (
                    <button onClick={handleGenerateFlashcards} disabled={generatingFlashcards} className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover">
                      Generate Flashcards
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-primary-soft/50 border border-primary-soft rounded-2xl p-4 text-primary text-[13.5px] font-medium text-center">
                  AI Flashcards <br/> ⏳ Generating...
                </div>
              )}
            </div>
          )}

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
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-[13.5px] font-bold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Attendance ({attendance.length} / {group?.members?.length || 0})
            </div>
            {attendance.length > 0 ? (
              <div className="flex flex-col gap-3">
                {attendance.map((att) => {
                  return (
                    <div key={att.user_id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-[12px] font-bold">
                        {att.name ? att.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 text-[13px] font-medium text-foreground">
                        {att.user_id === Number(user?.id) ? `${att.name || `User ${att.user_id}`} (You)` : (att.name || `User ${att.user_id}`)}
                      </div>
                      <div className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        {att.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="text-[13px] font-bold text-muted-foreground">No attendees yet</div>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-[13.5px] font-bold mb-4">Resources</div>
            {session.resources && session.resources.length > 0 ? (
              <div className="flex flex-col gap-3">
                {session.resources.map((r) => {
                  const filename = r.original_filename || r.filename;
                  const type = filename.split('.').pop()?.toUpperCase() || "FILE";
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-extrabold shrink-0">{type}</div>
                      <span className="text-[12.5px] font-medium flex-1 truncate">{filename}</span>
                      <Download className="w-4 h-4 text-muted-foreground cursor-pointer shrink-0 hover:text-primary transition-colors" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[13px] text-muted-foreground">No resources attached.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
