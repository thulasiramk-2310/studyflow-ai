import { useState } from "react";
import { toast } from "sonner";
import { asActionItem, sessionService, type ActionItem, type SessionSummary } from "../../services/session.service";
import { Button, Modal, Textarea } from "../ui";

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

/** Action items are edited one per line as "task | owner | due". */
const toActionItems = (text: string): ActionItem[] =>
  lines(text).map((line) => {
    const [task, owner = "", due = ""] = line.split("|").map((p) => p.trim());
    return { task, owner, due };
  }).filter((a) => a.task);

export function EditMinutesModal({ sessionId, summary, title, onClose, onSaved }: {
  sessionId: number; summary: SessionSummary; title: string; onClose: () => void; onSaved: (s: SessionSummary) => void;
}) {
  const [text, setText] = useState(summary.summary ?? "");
  const [decisions, setDecisions] = useState((summary.decisions ?? []).join("\n"));
  const [actions, setActions] = useState(
    (summary.action_items ?? []).map(asActionItem).map((a) => [a.task, a.owner || "", a.due || ""].join(" | ").replace(/( \| )+$/, "")).join("\n"),
  );
  const [questions, setQuestions] = useState((summary.open_questions ?? []).join("\n"));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await sessionService.updateSummary(sessionId, {
        summary: text, decisions: lines(decisions), action_items: toActionItems(actions), open_questions: lines(questions),
      }));
      toast.success("Changes saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={title} size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={save}>Save</Button>
      </>
    }>
      <div className="flex flex-col gap-4">
        <Textarea label="Summary" value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        <Textarea label="Decisions" hint="One per line." value={decisions} onChange={(e) => setDecisions(e.target.value)} rows={4} />
        <Textarea label="Action items" hint="One per line: task | owner | due. Leave owner and due out when nobody said them." value={actions} onChange={(e) => setActions(e.target.value)} rows={4} />
        <Textarea label="Open questions" hint="One per line." value={questions} onChange={(e) => setQuestions(e.target.value)} rows={3} />
      </div>
    </Modal>
  );
}
