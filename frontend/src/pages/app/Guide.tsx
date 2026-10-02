import { useState } from "react";
import { useTerms } from "../../hooks/useTerms";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Button, Card, CardHeader, PageHeader } from "../../components/ui";
import { IntroStage } from "../../components/intro/IntroStage";

const sections = (t: ReturnType<typeof useTerms>) => [
  { title: `${t.groups} and invites`, body: `Create a ${t.groupLower} for each subject and invite others with its code.`, to: "/groups", cta: `Open ${t.groupsLower}` },
  { title: `${t.library} and indexing`, body: `Upload PDFs, Word, PowerPoint or Markdown files. Each one is chunked, embedded and indexed for its ${t.groupLower}.`, to: "/resources", cta: `Open ${t.library.toLowerCase()}` },
  { title: "Ask AI with citations", body: `Ask questions about a ${t.groupLower}'s notes. Answers show the file and page they came from.`, to: "/ai", cta: "Ask a question" },
  { title: `${t.sessions} and the AI planner`, body: `Plan the next ${t.sessionLower} yourself or let the planner propose one from the ${t.learningPath.toLowerCase()}.`, to: "/sessions", cta: `Open ${t.sessionsLower}` },
  { title: `${t.quizzes} and ${t.flashcards.toLowerCase()}`, body: `Mark a ${t.sessionLower} completed to get its summary, then generate a ${t.quiz.toLowerCase()} and ${t.flashcards.toLowerCase()} from its notes.`, to: "/sessions", cta: `Find a ${t.sessionLower}` },
  { title: "Notifications", body: `Get notified when summaries, ${t.quizzes.toLowerCase()} and ${t.flashcards.toLowerCase()} are ready, and about ${t.groupLower} changes.`, to: "/notifications", cta: "Open notifications" },
];

export function Guide() {
  const terms = useTerms();
  const SECTIONS = sections(terms);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="mx-auto max-w-[900px] px-6 py-8 md:px-8">
      <PageHeader title="Guide" subtitle="How StudyFlow works and where to find each feature." />
      <Card className="overflow-hidden" padded={false}>
        <div className="relative isolate aspect-[16/10] overflow-clip bg-muted">
          {playing ? (
            <IntroStage embedded onDone={() => setPlaying(false)} />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <h2 className="font-serif text-xl text-foreground">How StudyFlow works</h2>
                <p className="mt-1 text-base text-muted-foreground">A 25-second tour: notes, cited answers, {terms.quizzes.toLowerCase()}.</p>
                <Button className="mt-4" icon={Play} onClick={() => setPlaying(true)}>Play</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader title={s.title} />
            <p className="text-base text-muted-foreground">{s.body}</p>
            <Link to={s.to} className="mt-3 inline-block text-sm font-semibold text-primary-text hover:underline">{s.cta} →</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
