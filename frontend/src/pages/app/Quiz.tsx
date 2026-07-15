import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Sparkle } from "../../components/Icons";
import { sessionService } from "../../services/session.service";
import type { QuizResponse, Session, QuizGradeResponse } from "../../services/session.service";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function Quiz() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState<QuizGradeResponse | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!sessionId) return;
    
    Promise.all([
      sessionService.getSession(Number(sessionId)),
      sessionService.getSessionQuiz(Number(sessionId))
    ]).then(([sess, q]) => {
      if (!isMounted) return;
      setSession(sess);
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
    return <div className="max-w-[720px] mx-auto px-8 py-7">Loading quiz...</div>;
  }
  
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <div className="max-w-[720px] mx-auto px-8 py-7">Quiz is not ready or failed to generate.</div>;
  }

  // Pre-process questions to find the correct index based on `correct_answer`
  const questions = quizData.questions.map((q, i) => {
    const opts = q.options || ["True", "False"];
    let correctIdx = opts.findIndex(o => o.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase());
    if (correctIdx === -1) {
      // Fallback logic if exact string matching fails
      correctIdx = opts.findIndex(o => q.correct_answer?.toLowerCase().includes(o.toLowerCase()) || o.toLowerCase().includes(q.correct_answer?.toLowerCase() || ''));
      if (correctIdx === -1) correctIdx = 0; // Default fallback to avoid crashes
    }
    return {
      n: i + 1,
      question: q.question,
      options: opts,
      correct: correctIdx,
      explanation: q.explanation
    };
  });

  const answered = Object.keys(answers).length;

  return (
    <div className="max-w-[720px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      <Link to={`/sessions/${sessionId}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to session
      </Link>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-primary uppercase tracking-wider">
            <Sparkle className="w-3.5 h-3.5" /> AI-generated quiz
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-tight">Quiz: {session?.title || "Session"}</div>
          <div className="mt-1 text-muted-foreground text-[13px]">{questions.length} questions</div>
        </div>
        {submitted && gradeResult && (
          <div className="text-left md:text-right bg-surface border border-border px-4 py-3 rounded-xl shadow-sm">
            <div className="text-[28px] font-extrabold text-primary leading-tight">{gradeResult.score}/{gradeResult.total}</div>
            <div className="text-[13px] text-muted-foreground font-medium">
              {gradeResult.score / gradeResult.total >= 0.8 ? "Excellent!" : gradeResult.score / gradeResult.total >= 0.6 ? "Good work!" : "Keep studying"}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!submitted && (
        <div className="mt-6">
          <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
            <span>{answered} of {questions.length} answered</span>
            <span>{Math.round(answered / questions.length * 100)}%</span>
          </div>
          <div className="h-1.5 bg-border-soft rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${answered / questions.length * 100}%` }} />
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-5 mt-8">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-surface border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="text-[13px] font-semibold text-muted-foreground mb-2">Question {q.n}</div>
            <div className="text-[15px] font-bold leading-snug">{q.question}</div>

            <div className="flex flex-col gap-2 mt-4">
              {q.options.map((opt, oi) => {
                const isSel = answers[qi] === oi;
                const isCorrect = oi === q.correct;
                let border = "border-border", bg = "bg-surface", textColor = "text-foreground", dotBg = "bg-border-soft", dotText = "text-muted-foreground";

                if (submitted) {
                  if (isCorrect) { border = "border-emerald-300"; bg = "bg-emerald-50"; textColor = "text-emerald-800"; dotBg = "bg-emerald-500"; dotText = "text-white"; }
                  else if (isSel) { border = "border-red-300"; bg = "bg-red-50"; textColor = "text-red-800"; dotBg = "bg-red-500"; dotText = "text-white"; }
                } else if (isSel) {
                  border = "border-primary"; bg = "bg-primary-soft"; textColor = "text-primary"; dotBg = "bg-primary"; dotText = "text-white";
                }

                return (
                  <button key={oi} onClick={() => pick(qi, oi)}
                    className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-all w-full ${border} ${bg} ${submitted ? "cursor-default" : "cursor-pointer hover:border-primary/40"}`}>
                    <div className={`w-6 h-6 rounded-full ${dotBg} ${dotText} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                      {submitted && isCorrect ? "✓" : submitted && isSel && !isCorrect ? "✕" : LETTERS[oi]}
                    </div>
                    <span className={`text-[13.5px] font-medium ${textColor}`}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {submitted && gradeResult && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-[13px] font-medium leading-relaxed ${gradeResult.results[q.n - 1] ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"}`}>
                <div className="font-bold mb-1">
                  {gradeResult.results[q.n - 1] ? "✓ Correct" : `✕ Incorrect`}
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
              // Convert answers map { questionIndex: selectedOptionIndex } to string array for backend
              // E.g., answers: { 0: 1 } -> string["Option B"]
              const formattedAnswers = questions.map((q, i) => answers[i] !== undefined ? q.options[answers[i]] : "");
              
              const res = await sessionService.gradeQuiz(Number(sessionId), formattedAnswers);
              setGradeResult(res);
              setSubmitted(true);
            } catch (err: any) {
              alert(err.message || "Failed to grade");
            } finally {
              setIsGrading(false);
            }
          }}
          disabled={answered < questions.length || isGrading}
          className="mt-6 w-full bg-primary text-white rounded-xl py-3 text-[14.5px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20">
          {isGrading ? "Grading..." : "Submit quiz"}
        </button>
      ) : (
        <button onClick={() => { setAnswers({}); setSubmitted(false); setGradeResult(null); }}
          className="mt-6 w-full bg-surface border border-border rounded-xl py-3 text-[14.5px] font-bold hover:bg-background transition-colors">
          Retry quiz
        </button>
      )}
    </div>
  );
}
