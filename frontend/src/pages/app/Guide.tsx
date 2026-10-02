import { useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Button, Card, CardHeader, PageHeader } from "../../components/ui";
import { IntroStage } from "../../components/intro/IntroStage";

const SECTIONS = [
  { title: "Groups and invites", body: "Create a group for each subject and invite classmates with its code.", to: "/groups", cta: "Open groups" },
  { title: "Library and indexing", body: "Upload PDFs, slides or Markdown. Each file is chunked, embedded and indexed for its group.", to: "/resources", cta: "Open library" },
  { title: "Ask AI with citations", body: "Ask questions about a group's notes. Answers show the file and page they came from.", to: "/ai", cta: "Ask a question" },
  { title: "Sessions and the AI planner", body: "Plan the next session yourself or let the planner propose one from the learning path.", to: "/sessions", cta: "Open sessions" },
  { title: "Quizzes and flashcards", body: "Mark a session completed to get its summary, then generate a quiz and a flashcard deck from its notes.", to: "/sessions", cta: "Find a session" },
  { title: "Notifications", body: "Get notified when summaries, quizzes and flashcards are ready, and about group changes.", to: "/notifications", cta: "Open notifications" },
];

export function Guide() {
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
                <p className="mt-1 text-base text-muted-foreground">A 25-second tour: notes, cited answers, quizzes.</p>
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
