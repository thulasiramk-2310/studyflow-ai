import { useState, useEffect } from "react";
import { useGroupTerms } from "../../hooks/useTerms";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CheckCircle2, Clock, ExternalLink, ListChecks, MapPin, Pencil, Sparkles, Video } from "lucide-react";
import { sessionService, type Session, type SessionSummary, type FlashcardDeckResponse, type SessionAttendanceResponse, type MeetingType } from "../../services/session.service";
import { groupService, type Group } from "../../services/group.service";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { FlashcardViewer } from "../../components/study/FlashcardViewer";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, RichText, Skeleton } from "../../components/ui";
import { EditSessionModal } from "../../components/sessions/EditSessionModal";

export function SessionDetails() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const terms = useGroupTerms(group);
  const quizWord = terms.quiz.toLowerCase();
  const cardsWord = terms.flashcards.toLowerCase();
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
      toast.error(`Failed to fetch ${terms.sessionLower} details.`);
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
        if (isMounted) toast.error(`Failed to fetch ${terms.sessionLower} details.`);
      })
      .finally(() => {
        if (isMounted) {
          setTimeout(() => setLoading(false), 800);
        }
      });

    return () => { isMounted = false; };
  }, [sessionId]);

  useEffect(() => {
    if (session?.status !== "COMPLETED") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const inProgress = (x: any) => x?.status === "PENDING" || x?.status === "GENERATING";

    // Polls until the artifact is ready. A just-started job may not have created its row yet,
    // so a 404 keeps polling while we're waiting on it (capped at about two minutes).
    const poll = (fetch: () => Promise<any>, set: (v: any) => void, waiting: boolean, tries = 0) => {
      fetch()
        .then((res) => {
          set(res);
          if (inProgress(res)) timers.push(setTimeout(() => poll(fetch, set, waiting, tries + 1), 3000));
        })
        .catch(() => {
          if (!waiting) return; // not generated yet and nobody asked for it
          if (tries < 40) timers.push(setTimeout(() => poll(fetch, set, waiting, tries + 1), 3000));
          else set({ status: "FAILED" });
        });
    };

    if (!summary || inProgress(summary)) poll(() => sessionService.getSessionSummary(session.id), setSummary, inProgress(summary));
    if (!quiz || inProgress(quiz)) poll(() => sessionService.getSessionQuiz(session.id), setQuiz, inProgress(quiz));
    if (!flashcards || inProgress(flashcards)) poll(() => sessionService.getFlashcards(session.id), setFlashcards, inProgress(flashcards));

    return () => timers.forEach(clearTimeout);
  }, [session?.status, session?.id, summary?.status, quiz?.status, flashcards?.status]);

  const handleComplete = async () => {
    if (!sessionId) return;
    setCompleting(true);
    try {
      await sessionService.completeSession(Number(sessionId));
      toast.success(`${terms.session} marked as completed!`);
      await fetchSession();
    } catch (error) {
      toast.error(`Failed to complete ${terms.sessionLower}.`);
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
      toast.error("Failed to join the call");
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
      toast.success(`${terms.quiz} regeneration started`);
      setQuiz((prev: any) => prev ? { ...prev, status: "GENERATING" } : null);
    } catch (error) {
      toast.error(`Failed to regenerate ${quizWord}.`);
    } finally {
      setRegeneratingQuiz(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!sessionId) return;
    setGeneratingQuiz(true);
    try {
      await sessionService.regenerateSessionQuiz(Number(sessionId));
      toast.success(`${terms.quiz} generation started`);
      setQuiz({ status: "GENERATING" });
    } catch (error) {
      toast.error(`Failed to generate ${quizWord}.`);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleRegenerateFlashcards = async () => {
    if (!sessionId) return;
    setRegeneratingFlashcards(true);
    try {
      await sessionService.regenerateFlashcards(Number(sessionId));
      toast.success(`${terms.flashcards} regeneration started`);
      setFlashcards((prev: any) => prev ? { ...prev, status: "GENERATING" } : null);
    } catch (error) {
      toast.error(`Failed to regenerate ${cardsWord}.`);
    } finally {
      setRegeneratingFlashcards(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!sessionId) return;
    setGeneratingFlashcards(true);
    try {
      await sessionService.generateFlashcards(Number(sessionId));
      toast.success(`${terms.flashcards} generation started`);
      setFlashcards({ status: "GENERATING" } as any);
    } catch (error) {
      toast.error(`Failed to generate ${cardsWord}.`);
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8" aria-busy="true">
        <Skeleton className="mb-3 h-5 w-64" />
        <Skeleton className="mb-8 h-10 w-96" />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
        <Card><EmptyState icon={Clock} title={`${terms.session} not found`} description={`The ${terms.sessionLower} you're looking for doesn't exist or has been removed.`} /></Card>
      </div>
    );
  }

  const sessionDate = new Date(session.scheduled_at);
  const isCompleted = session.status === "COMPLETED";
  const userRole = group?.members?.find((m) => m.user_id === Number(user?.id))?.role || "MEMBER";
  const canManageGroup = userRole === "ORGANIZER";
  const getMeetingName = (type: MeetingType) => {
    switch (type) {
      case "GOOGLE_MEET": return "Google Meet";
      case "ZOOM": return "Zoom";
      case "MICROSOFT_TEAMS": return "Microsoft Teams";
      case "DISCORD": return "Discord";
      case "OTHER": return "Other Link";
      default: return "No call link added";
    }
  };

  const statusTone = session.status === "COMPLETED" ? "success" : session.status === "LIVE" ? "danger" : "neutral";
  const isAI = (session as { generated_by?: string }).generated_by === "AI" || session.generated_by_ai;
  const meName = (id: number, name?: string) => (id === Number(user?.id) ? `${name || `User ${id}`} (You)` : name || `User ${id}`);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-8">
      {isEditModalOpen && (
        <EditSessionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} session={session} onSuccess={fetchSession} audience={terms.audience} />
      )}

      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            {isAI && <Badge tone="brand"><Sparkles className="h-3 w-3" />AI-planned</Badge>}
            <Badge>{format(sessionDate, "EEE d MMM, HH:mm")} · {session.duration_minutes} min</Badge>
            <Badge tone={statusTone}>{session.status}</Badge>
          </div>
        }
        title={session.title}
        subtitle={group ? <Link to={`/groups/${group.id}`} className="hover:text-foreground">{group.name}</Link> : `${terms.group} ${terms.sessionLower}`}
        actions={
          <>
            {canManageGroup && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setIsEditModalOpen(true)}>Edit</Button>}
            {canManageGroup && !isCompleted && <Button size="sm" icon={CheckCircle2} loading={completing} onClick={handleComplete}>Mark completed</Button>}
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          {!isCompleted && (
            <>
              <Card>
                <CardHeader title="Video call" />
                <div className="flex flex-wrap items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text">
                    {session.meeting_url ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-foreground">{getMeetingName(session.meeting_type)}</div>
                    <div className="truncate text-sm text-muted-foreground">{session.meeting_url || "No link added yet"}</div>
                  </div>
                  <Button size="sm" icon={ExternalLink} loading={joining} disabled={!session.meeting_url} onClick={handleJoinMeeting}>Join call</Button>
                </div>
              </Card>
              <Card className="bg-primary-soft">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-text" />
                  <div>
                    <div className="text-base font-semibold text-foreground">Summary, {quizWord} and {cardsWord} come next</div>
                    <p className="mt-0.5 text-sm text-muted-foreground">When the {terms.sessionLower} is marked completed, StudyFlow writes a summary from the attached notes, and you can generate a {quizWord} and {cardsWord}.</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {isCompleted && (
            <>
              <Card>
                <CardHeader
                  title="Summary"
                  action={canManageGroup && summary?.status === "READY" && (
                    <button onClick={handleRegenerate} disabled={regenerating} className="hover:text-foreground disabled:opacity-50">{regenerating ? "Regenerating…" : "Regenerate"}</button>
                  )}
                />
                {summary?.status === "READY" ? (
                  <>
                    <RichText text={summary.summary ?? ""} className="text-base leading-relaxed text-foreground" />
                    {!!summary.key_concepts?.length && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key concepts</div>
                        {summary.key_concepts.every((k) => k.length <= 40) ? (
                          <div className="flex flex-wrap gap-2">{summary.key_concepts.map((k) => <Badge key={k} tone="brand">{k}</Badge>)}</div>
                        ) : (
                          <ul className="list-disc space-y-1 pl-5 text-base text-foreground marker:text-primary-text">{summary.key_concepts.map((k) => <li key={k}>{k}</li>)}</ul>
                        )}
                      </div>
                    )}
                    {!!summary.important_points?.length && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Important points</div>
                        <ul className="list-disc space-y-1 pl-5 text-base text-foreground">{summary.important_points.map((p) => <li key={p}>{p}</li>)}</ul>
                      </div>
                    )}
                  </>
                ) : summary?.status === "FAILED" ? (
                  <p className="text-sm text-danger">The summary failed to generate. <button onClick={handleRegenerate} className="underline">Try again</button></p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-3/4" />
                    <p className="text-xs text-muted-foreground">Writing the summary from the attached notes…</p>
                  </div>
                )}
              </Card>

              <div className="grid gap-5 md:grid-cols-2">
                <Card>
                  <CardHeader
                    title={terms.quiz}
                    action={canManageGroup && quiz?.status === "READY" && (
                      <button onClick={handleRegenerateQuiz} disabled={regeneratingQuiz} className="hover:text-foreground disabled:opacity-50">{regeneratingQuiz ? "Regenerating…" : "Regenerate"}</button>
                    )}
                  />
                  {quiz?.status === "READY" ? (
                    <>
                      <p className="mb-4 text-sm text-muted-foreground">{quiz.questions?.length || 0} questions from this {terms.sessionLower}'s notes.</p>
                      <Button icon={ListChecks} onClick={() => navigate(`/sessions/${session.id}/quiz`)}>Take {quizWord}</Button>
                    </>
                  ) : quiz?.status === "FAILED" ? (
                    <p className="text-sm text-danger">The {quizWord} failed to generate. <button onClick={handleRegenerateQuiz} className="underline">Try again</button></p>
                  ) : !quiz ? (
                    <>
                      <p className="mb-4 text-sm text-muted-foreground">Test yourself on this {terms.sessionLower}'s materials.</p>
                      {canManageGroup ? <Button variant="secondary" icon={Sparkles} loading={generatingQuiz} onClick={handleGenerateQuiz}>Generate {quizWord}</Button> : <p className="text-xs text-muted-foreground">The {terms.organizer.toLowerCase()} can generate a {quizWord}.</p>}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2"><Skeleton className="h-4 w-2/3" /><p className="text-xs text-muted-foreground">Writing questions…</p></div>
                  )}
                </Card>

                <Card>
                  <CardHeader
                    title={terms.flashcards}
                    action={canManageGroup && flashcards?.status === "READY" && (
                      <button onClick={handleRegenerateFlashcards} disabled={regeneratingFlashcards} className="hover:text-foreground disabled:opacity-50">{regeneratingFlashcards ? "Regenerating…" : "Regenerate"}</button>
                    )}
                  />
                  {flashcards?.status === "READY" ? (
                    <p className="text-sm text-muted-foreground">{flashcards.flashcards.length} cards. Flip through them below.</p>
                  ) : flashcards?.status === "FAILED" ? (
                    <p className="text-sm text-danger">{terms.flashcards} failed to generate. <button onClick={handleRegenerateFlashcards} className="underline">Try again</button></p>
                  ) : !flashcards ? (
                    <>
                      <p className="mb-4 text-sm text-muted-foreground">Memorise the key ideas from this {terms.sessionLower}.</p>
                      {canManageGroup ? <Button variant="secondary" icon={Sparkles} loading={generatingFlashcards} onClick={handleGenerateFlashcards}>Generate {cardsWord}</Button> : <p className="text-xs text-muted-foreground">The {terms.organizer.toLowerCase()} can generate {cardsWord}.</p>}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2"><Skeleton className="h-4 w-2/3" /><p className="text-xs text-muted-foreground">Writing {cardsWord}…</p></div>
                  )}
                </Card>
              </div>

              {flashcards?.status === "READY" && (
                <Card>
                  <FlashcardViewer flashcards={flashcards.flashcards} audience={terms.audience} />
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Agenda" action={session.agenda && Array.isArray(session.agenda) ? `${session.agenda.length} items` : undefined} />
            {session.agenda && Array.isArray(session.agenda) && session.agenda.length > 0 ? (
              <ol className="flex flex-col gap-3">
                {session.agenda.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-xs font-bold text-primary-text">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-medium text-foreground">{a.title}</div>
                      {a.description && <div className="text-sm text-muted-foreground">{a.description}</div>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{a.duration_minutes} min</span>
                  </li>
                ))}
              </ol>
            ) : typeof session.agenda === "string" && session.agenda ? (
              <p className="whitespace-pre-wrap text-base text-foreground">{session.agenda}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No agenda yet.</p>
            )}
          </Card>

          {!!session.objectives?.length && (
            <Card>
              <CardHeader title="Objectives" />
              <ul className="list-disc space-y-1 pl-5 text-base text-foreground">{session.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Attending" action={`${attendance.length} / ${group?.members?.length || 0}`} />
            {attendance.length > 0 ? (
              <div className="flex flex-col gap-3">
                {attendance.map((att) => (
                  <div key={att.user_id} className="flex items-center gap-3">
                    <Avatar name={att.name || `User ${att.user_id}`} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-base text-foreground">{meName(att.user_id, att.name)}</span>
                    <Badge tone="success">{att.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No one has joined yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Notes attached" />
            {session.resources && session.resources.length > 0 ? (
              <div className="flex flex-col gap-2">
                {session.resources.map((r) => {
                  const filename = r.original_filename || r.filename;
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{(filename.split(".").pop() || "file").slice(0, 4).toUpperCase()}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{filename}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes attached.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
