import { useState } from "react";
import { Sparkle } from "../../components/Icons";

const QUESTIONS = [
  {
    n: 1,
    question: "Where does transcription occur in eukaryotic cells?",
    options: ["Ribosome", "Nucleus", "Golgi apparatus", "Cytoplasm only"],
    correct: 1,
  },
  {
    n: 2,
    question: "The lac operon is best described as a(n):",
    options: ["Constitutive system", "Inducible system", "Silenced gene", "Non-coding region"],
    correct: 1,
  },
  {
    n: 3,
    question: "Which molecule is the direct product of transcription?",
    options: ["DNA", "mRNA", "A folded protein", "A lipid"],
    correct: 1,
  },
  {
    n: 4,
    question: "In eukaryotes, enhancers primarily act to:",
    options: ["Block all transcription", "Increase transcription rate", "Cut the DNA strand", "Replicate the genome"],
    correct: 1,
  },
  {
    n: 5,
    question: "Translation assembles proteins at the:",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Cell membrane"],
    correct: 1,
  },
];
const LETTERS = ["A", "B", "C", "D"];

export function Quiz() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const pick = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qi]: oi }));
  };

  const score = QUESTIONS.filter((q, i) => answers[i] === q.correct).length;
  const answered = Object.keys(answers).length;

  return (
    <div className="max-w-[720px] mx-auto px-8 py-7 pb-12 animate-[sfFade_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-primary uppercase tracking-wider">
            <Sparkle className="w-3.5 h-3.5" /> AI-generated quiz
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-tight">Chapter 4 — Gene Expression</div>
          <div className="mt-1 text-muted-foreground text-[13px]">5 questions · Biology 301</div>
        </div>
        {submitted && (
          <div className="text-right">
            <div className="text-[30px] font-extrabold text-primary">{score}/{QUESTIONS.length}</div>
            <div className="text-[13px] text-muted-foreground">{score >= 4 ? "Excellent!" : score >= 3 ? "Good work!" : "Keep studying"}</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!submitted && (
        <div className="mt-4">
          <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
            <span>{answered} of {QUESTIONS.length} answered</span>
            <span>{Math.round(answered / QUESTIONS.length * 100)}%</span>
          </div>
          <div className="h-1.5 bg-border-soft rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${answered / QUESTIONS.length * 100}%` }} />
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-5 mt-6">
        {QUESTIONS.map((q, qi) => (
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

            {submitted && (
              <div className={`mt-3 px-4 py-2.5 rounded-xl text-[12.5px] font-medium ${answers[qi] === q.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {answers[qi] === q.correct ? "✓ Correct — nicely done." : `Correct answer: ${q.options[q.correct]}.`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)}
          disabled={answered < QUESTIONS.length}
          className="mt-6 w-full bg-primary text-white rounded-xl py-3 text-[14.5px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20">
          Submit quiz
        </button>
      ) : (
        <button onClick={() => { setAnswers({}); setSubmitted(false); }}
          className="mt-6 w-full bg-surface border border-border rounded-xl py-3 text-[14.5px] font-bold hover:bg-background transition-colors">
          Retry quiz
        </button>
      )}
    </div>
  );
}
