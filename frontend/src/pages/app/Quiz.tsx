import { useState, useEffect } from "react";
import { useGroupTerms } from "../../hooks/useTerms";
import { groupService } from "../../services/group.service";
import type { Audience } from "../../types";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Sparkle } from "../../components/Icons";
import { toast } from "sonner";
import { Button, Card, EmptyState, Skeleton } from "../../components/ui";
import { ListChecks } from "lucide-react";
import { sessionService } from "../../services/session.service";
import type { QuizResponse, Session, QuizGradeResponse } from "../../services/session.service";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function Quiz() {
  const { sessionId } = useParams();
  const [groupAudience, setGroupAudience] = useState<Audience | null>(null);
  const terms = useGroupTerms(groupAudience ? { audience: groupAudience } : null);
  const quizWord = terms.quiz.toLowerCase();
  const [session, setSession] = useState<Session | null>(null);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState<QuizGradeResponse | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!sessionId) return;
    
    // The session (and its group's wording) loads even when the quiz isn't ready yet.
    sessionService.getSession(Number(sessionId)).then((sess) => {
      if (!isMounted) return;
      setSession(sess);
      return groupService.getGroup(sess.group_id).then((g) => { if (isMounted && g.audience) setGroupAudience(g.audience); });
    }).catch(() => { /* the quiz request below reports errors */ });

    sessionService.getSessionQuiz(Number(sessionId)).then((q) => {
      if (!isMounted) return;
      setQuizData(q);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [sessionId]);

  const pick = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qi]: oi }));
  };

  if (loading) {
    return <div className="mx-auto max-w-[760px] px-6 py-8" aria-busy="true"><Skeleton className="mb-4 h-10 w-80" /><Skeleton className="mb-4 h-44" /><Skeleton className="h-44" /></div>;
  }
  
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <div className="mx-auto max-w-[760px] px-6 py-8"><Card><EmptyState icon={ListChecks} title={`This ${quizWord} isn't ready`} description={`It may still be generating, or it failed. Go back to the ${terms.sessionLower} to generate it again.`} action={<Link to={`/sessions/${sessionId}`}><Button variant="secondary">Back to {terms.sessionLower}</Button></Link>} /></Card></div>;
  }

  // Pre-process questions to find the correct index based on `correct_answer`
  const questions = quizData.questions.map((q, i) => {
    const isShort = q.question_type === "SHORT";
    const opts = q.options || (isShort ? [] : ["True", "False"]);
    let correctIdx = opts.findIndex(o => o.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase());
    if (correctIdx === -1 && opts.length > 0) {
      // Fallback logic if exact string matching fails
      correctIdx = opts.findIndex(o => q.correct_answer?.toLowerCase().includes(o.toLowerCase()) || o.toLowerCase().includes(q.correct_answer?.toLowerCase() || ''));
      if (correctIdx === -1) correctIdx = 0; // Default fallback to avoid crashes
    }
    return {
      n: i + 1,
      question: q.question,
      question_type: q.question_type,
      options: opts,
      correct: correctIdx,
      correct_answer: q.correct_answer,
      explanation: q.explanation
    };
  });

  const answered = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-[760px] px-6 py-8">
      <Link to={`/sessions/${sessionId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to {terms.sessionLower}
      </Link>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkle className="w-3.5 h-3.5" /> AI-generated {quizWord}
          </div>
          <h1 className="mt-1 font-serif text-xl text-foreground md:text-2xl">{session?.title || `${terms.session} ${quizWord}`}</h1>
          <div className="mt-1 text-muted-foreground text-sm">{questions.length} questions</div>
        </div>
        {submitted && gradeResult && (
          <div className="text-left md:text-right bg-surface border border-border px-4 py-3 rounded-xl shadow-sm">
            <div className="font-serif text-2xl leading-tight text-primary-text">{gradeResult.score}/{gradeResult.total}</div>
            <div className="text-sm text-muted-foreground font-medium">
              {gradeResult.score / gradeResult.total >= 0.8 ? "Excellent!" : gradeResult.score / gradeResult.total >= 0.6 ? "Good work!" : "Keep studying"}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!submitted && (
        <div className="mt-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{answered} of {questions.length} answered</span>
            <span>{Math.round(answered / questions.length * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${answered / questions.length * 100}%` }} />
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-5 mt-8">
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-border bg-surface p-5">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Question {q.n}</div>
            <div className="font-serif text-lg leading-snug text-foreground">{q.question}</div>

            <div className="flex flex-col gap-2 mt-4">
              {q.question_type === "SHORT" || (!q.options || q.options.length === 0) ? (
                <div className="mt-2">
                  <textarea
                    value={(answers[qi] as string) || ""}
                    onChange={(e) => {
                      if (!submitted) setAnswers(prev => ({ ...prev, [qi]: e.target.value }));
                    }}
                    disabled={submitted}
                    placeholder="Type your answer here..."
                    className={`w-full bg-surface border rounded-xl px-4 py-3 text-base min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${submitted ? "cursor-default opacity-80" : "border-border hover:border-primary/40"} ${submitted && gradeResult ? (gradeResult.results[q.n - 1]?.is_correct ? "border-success" : "border-danger") : ""}`}
                  />
                  {submitted && gradeResult && !gradeResult.results[q.n - 1]?.is_correct && q.correct_answer && (
                    <div className="mt-3 text-sm font-medium text-success bg-success-soft border border-success rounded-lg px-3 py-2">
                      <span className="font-bold">Correct Answer:</span> {q.correct_answer}
                    </div>
                  )}
                </div>
              ) : (
                q.options.map((opt, oi) => {
                  const isSel = answers[qi] === oi;
                  const isCorrect = oi === q.correct;
                  let border = "border-border", bg = "bg-surface", textColor = "text-foreground", dotBg = "bg-muted", dotText = "text-muted-foreground";

                  if (submitted) {
                    if (isCorrect) { border = "border-success"; bg = "bg-success-soft"; textColor = "text-success"; dotBg = "bg-success"; dotText = "text-primary-foreground"; }
                    else if (isSel) { border = "border-danger"; bg = "bg-danger-soft"; textColor = "text-danger"; dotBg = "bg-danger"; dotText = "text-primary-foreground"; }
                  } else if (isSel) {
                    border = "border-primary"; bg = "bg-primary-soft"; textColor = "text-primary"; dotBg = "bg-primary"; dotText = "text-primary-foreground";
                  }

                  return (
                    <button key={oi} onClick={() => pick(qi, oi)}
                      className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-all w-full ${border} ${bg} ${submitted ? "cursor-default" : "cursor-pointer hover:border-primary/40"}`}>
                      <div className={`w-6 h-6 rounded-full ${dotBg} ${dotText} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {submitted && isCorrect ? "✓" : submitted && isSel && !isCorrect ? "✕" : LETTERS[oi]}
                      </div>
                      <span className={`text-sm font-medium ${textColor}`}>{opt}</span>
                    </button>
                  );
                })
              )}
            </div>

            {submitted && gradeResult && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium leading-relaxed ${gradeResult.results[q.n - 1]?.is_correct ? "bg-success-soft text-success border border-success" : "bg-danger-soft text-danger border border-danger"}`}>
                <div className="font-bold mb-1">
                  {gradeResult.results[q.n - 1]?.is_correct ? "✓ Correct" : `✕ Incorrect`}
                </div>
                {q.explanation && <div className="opacity-90">{q.explanation}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      {!submitted ? (
        <button onClick={async () => {
            setIsGrading(true);
            try {
              // Convert answers map { questionIndex: selectedOptionIndex | string } to string array for backend
              const formattedAnswers = questions.map((q, i) => {
                const ans = answers[i];
                if (ans === undefined) return "";
                if (typeof ans === "string") return ans;
                return q.options[ans] || "";
              });
              
              const res = await sessionService.gradeQuiz(Number(sessionId), formattedAnswers);
              setGradeResult(res);
              setSubmitted(true);
            } catch (err: any) {
              toast.error(err.message || `Failed to grade the ${quizWord}`);
            } finally {
              setIsGrading(false);
            }
          }}
          disabled={answered < questions.length || isGrading}
          className="mt-6 w-full bg-primary text-primary-foreground rounded-xl py-3 text-base font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed ">
          {isGrading ? "Grading..." : `Submit ${quizWord}`}
        </button>
      ) : (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link 
            to={`/sessions/${sessionId}`}
            className="flex-1 bg-primary text-primary-foreground text-center rounded-xl py-3 text-base font-bold hover:bg-primary-hover transition-colors "
          >
            Return to {terms.sessionLower}
          </Link>
          <button 
            onClick={() => { setAnswers({}); setSubmitted(false); setGradeResult(null); }}
            className="flex-1 bg-surface border border-border rounded-xl py-3 text-base font-bold hover:bg-muted transition-colors"
          >
            Retry {quizWord}
          </button>
        </div>
      )}
    </div>
  );
}
