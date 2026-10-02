import { useState, type ReactNode } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { asActionItem, sessionService, type SessionSummary } from "../../services/session.service";
import type { Terms } from "../../constants/terms";
import { Badge, Button, RichText } from "../ui";
import { EditMinutesModal } from "./EditMinutesModal";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

/** Minutes written from the meeting's transcript: always labelled with their source, draft until approved. */
export function MinutesView({ sessionId, summary, terms, canManage, transcriptByName, onChange }: {
  sessionId: number; summary: SessionSummary; terms: Terms; canManage: boolean; transcriptByName: string | null; onChange: (s: SessionSummary) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const noter = transcriptByName || "a member";
  const sourceLabel =
    summary.source === "transcript" ? "From transcript (speakers named)"
    : summary.source === "recording" ? "From recording (speakers not identified)"
    : `From notes by ${noter}`;
  const actions = (summary.action_items ?? []).map(asActionItem);

  const approve = async () => {
    setApproving(true);
    try {
      onChange(await sessionService.approveSummary(sessionId));
      toast.success(`${terms.minutes} approved and shared`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div>
      {editing && <EditMinutesModal sessionId={sessionId} summary={summary} title={`Edit ${terms.minutes.toLowerCase()}`} onClose={() => setEditing(false)} onSaved={(s) => { onChange(s); setEditing(false); }} />}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="info">{sourceLabel}</Badge>
        {summary.review_status === "DRAFT" && <Badge tone="warning">Draft — awaiting review</Badge>}
        {summary.review_status === "APPROVED" && <Badge tone="success"><CheckCircle2 className="h-3 w-3" />Approved</Badge>}
        {canManage && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
            {summary.review_status === "DRAFT" && <Button size="sm" icon={CheckCircle2} loading={approving} onClick={approve}>Approve</Button>}
          </div>
        )}
      </div>
      {summary.summary && <RichText text={summary.summary} className="text-base leading-relaxed text-foreground" />}
      {!!summary.decisions?.length && (
        <Section title="Decisions">
          <ul className="list-disc space-y-1 pl-5 text-base text-foreground">
            {summary.decisions.map((d) => <li key={d}>{summary.source === "notes" ? `As noted by ${noter}: ${d}` : d}</li>)}
          </ul>
        </Section>
      )}
      {!!actions.length && (
        <Section title="Action items">
          <ul className="flex flex-col gap-2">
            {actions.map((a, i) => (
              <li key={`${a.task}-${i}`} className="flex flex-wrap items-center gap-2 text-base text-foreground">
                <span className="min-w-0 flex-1">{a.task}</span>
                {a.owner && <Badge tone="brand">{a.owner}</Badge>}
                {a.due && <Badge>Due {a.due}</Badge>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {!!summary.open_questions?.length && (
        <Section title="Open questions">
          <ul className="list-disc space-y-1 pl-5 text-base text-foreground">{summary.open_questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </Section>
      )}
      {!!summary.key_concepts?.length && (
        <Section title="Key points">
          <div className="flex flex-wrap gap-2">{summary.key_concepts.map((k) => <Badge key={k} tone="brand">{k}</Badge>)}</div>
        </Section>
      )}
    </div>
  );
}
