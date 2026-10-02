import { useRef, useState } from "react";
import { format } from "date-fns";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { sessionService, type Session, type TranscriptInfo } from "../../services/session.service";
import type { Terms } from "../../constants/terms";
import { Badge, Button, Card, CardHeader, Textarea } from "../ui";

const SOURCE_LABEL = { transcript: "Transcript file", recording: "Recording", notes: "Typed notes" } as const;

/** Where the meeting's own words come from: an exported transcript, or notes someone typed. */
export function TranscriptCard({ session, terms, onSaved }: { session: Session; terms: Terms; onSaved: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [shown, setShown] = useState<TranscriptInfo | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const started = session.status === "COMPLETED" || session.status === "LIVE" || new Date(session.scheduled_at) <= new Date();
  const completed = session.status === "COMPLETED";
  const source = session.meeting_transcript_source;

  const done = () => {
    toast.success(completed ? `Added. Writing the ${terms.minutes.toLowerCase()}…` : "Added.");
    setShown(null);
    onSaved();
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      await sessionService.uploadTranscriptFile(session.id, file);
      done();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await sessionService.saveTranscriptNotes(session.id, notes);
      setNotes("");
      setNotesOpen(false);
      done();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleText = async () => {
    if (shown) return setShown(null);
    setLoadingText(true);
    try {
      setShown(await sessionService.getTranscript(session.id));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingText(false);
    }
  };

  return (
    <Card data-testid="transcript-card">
      <CardHeader
        title={terms.sessionNotes}
        action={source && <button onClick={toggleText} disabled={loadingText} className="hover:text-foreground disabled:opacity-50">{shown ? "Hide" : "Show"}</button>}
      />
      {!started ? (
        <p className="text-sm text-muted-foreground">Available once the {terms.sessionLower} starts. {session.meeting_type !== "NONE" && "Turn on recording and transcription in Google Meet, Zoom or Teams so you can export the transcript afterwards."}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {source ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge tone="info"><FileText className="h-3 w-3" />{SOURCE_LABEL[source]}</Badge>
              {session.meeting_transcript_at && <span>Added {format(new Date(session.meeting_transcript_at), "d MMM, HH:mm")}</span>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add what was said, and StudyFlow writes {terms.minutes.toLowerCase()} from it.
              {session.meeting_type !== "NONE" && " Export the transcript from Google Meet, Zoom or Teams after the call."}
            </p>
          )}
          {shown && <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm text-foreground">{shown.text}</pre>}
          <div className="flex flex-wrap gap-2">
            <input ref={fileInput} type="file" accept=".vtt,.txt,.docx" className="hidden" aria-label="Transcript file" onChange={(e) => upload(e.target.files?.[0])} />
            <Button size="sm" variant="secondary" icon={Upload} loading={uploading} onClick={() => fileInput.current?.click()}>{source ? "Replace transcript" : "Upload transcript"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setNotesOpen((o) => !o)}>{notesOpen ? "Cancel" : "Paste notes"}</Button>
          </div>
          <p className="text-xs text-muted-foreground">.vtt, .txt or .docx, as exported by Google Meet, Zoom or Teams. Speaker names are kept.</p>
          {notesOpen && (
            <div className="flex flex-col gap-2">
              <Textarea label="Notes" placeholder="Who said what, what was decided, who will do what…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} />
              <div><Button size="sm" loading={saving} disabled={!notes.trim()} onClick={saveNotes}>Save notes</Button></div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
