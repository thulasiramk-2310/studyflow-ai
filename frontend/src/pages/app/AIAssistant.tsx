import { useState, useRef, useEffect } from "react";
import { Send, Plus, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AIAssistantSkeleton } from "../../components/skeletons";
import { groupService, type Group } from "../../services/group.service";
import { resourceService, type Resource } from "../../services/resource.service";
import { aiService, type ChatSession, type ChatMessage } from "../../services/ai.service";
import { Button, RichText } from "../../components/ui";

const SUGGESTIONS = [
  "Summarise my notes",
  "Quiz me on the key ideas",
  "Explain the hardest topic",
  "What should I revise first?"
];



export function AIAssistant() {
  const [messages, setMessages] = useState<(Omit<ChatMessage, "id"|"session_id"|"created_at"> & { thinking?: boolean })[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupResources, setGroupResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  
  useEffect(() => {
    groupService.getGroups().then(data => {
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0]);
      }
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load groups");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      setLoadingResources(true);
      resourceService.getResources(selectedGroup.id).then(data => {
        setGroupResources(data);
      }).catch(err => {
        console.error("Failed to fetch resources for group", err);
      }).finally(() => {
        setLoadingResources(false);
      });
      // Load chat sessions
      aiService.getChatSessions(selectedGroup.id).then(sessions => {
        setHistory(sessions);
        if (sessions.length > 0) {
          loadSession(sessions[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      });
    }
  }, [selectedGroup]);

  const loadSession = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    setMessages([]); // clear before load
    try {
      const msgs = await aiService.getChatSessionMessages(sessionId, selectedGroup!.id);
      setMessages(msgs);
    } catch (err) {
      toast.error("Failed to load chat history");
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (loading) {
    return <AIAssistantSkeleton />;
  }

  const send = async (text: string) => {
    if (!text.trim() || sending || !selectedGroup) return;
    const userMsg = { role: "user" as const, content: text };
    setMessages(prev => [...prev, userMsg, { role: "ai" as const, content: "", thinking: true }]);
    setInput("");
    setSending(true);
    
    try {
      const res = await aiService.chat(selectedGroup.id, text, activeSessionId || undefined);
      
      const aiBody = res ? (res.answer || "No response") : "No response";
      const aiCitations = res && res.citations ? res.citations : [];

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "ai" as const,
          content: aiBody,
          citations: aiCitations
        };
        return next;
      });

      if (res.sessionId && res.sessionId !== activeSessionId) {
        setActiveSessionId(res.sessionId);
        // Refresh session list to show the new title
        aiService.getChatSessions(selectedGroup.id).then(setHistory);
      }

    } catch (err: any) {
      // apiClient throws an Error carrying the HTTP status and the server's message.
      const status: number | undefined = err?.status;
      let errorMsg = "Sorry, I encountered an error. Please try again.";
      if (status === 404) errorMsg = "No indexed documents found.";
      else if (status === 429) errorMsg = "Rate limit exceeded. Please wait a moment.";
      else if (status && err.message) errorMsg = err.message;
      else if (err instanceof TypeError) errorMsg = "Network error. Please check your connection.";

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "ai" as const,
          content: `❌ ${errorMsg}`,
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  const newChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const noNotes = !!selectedGroup && groupResources.length === 0 && !loadingResources;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Conversation history */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="border-b border-border p-3">
          <Button size="sm" variant="secondary" icon={Plus} onClick={newChat} className="w-full">New chat</Button>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent chats</div>
          {history.length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            history.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeSessionId === s.id ? "bg-surface font-semibold text-foreground shadow-[0_0_0_1px_hsl(var(--border))]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {s.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <h1 className="font-serif text-lg text-foreground">Ask AI</h1>
          {groups.length > 0 && (
            <select
              aria-label="Study group"
              className="h-8 max-w-[220px] truncate rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus:border-primary focus:outline-none"
              value={selectedGroup?.id || ""}
              onChange={(e) => {
                const g = groups.find((g) => g.id === Number(e.target.value));
                if (g) setSelectedGroup(g);
              }}
            >
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <span className="hidden text-sm text-muted-foreground md:inline">Answers only from this group's notes</span>
          <Button size="sm" variant="ghost" icon={Plus} onClick={newChat} className="ml-auto lg:hidden">New chat</Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-5 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary-text"><Sparkles className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-serif text-xl text-foreground">What do you want to understand?</h2>
                  <p className="mt-1 text-base text-muted-foreground">Ask about {selectedGroup ? selectedGroup.name : "your study group"}. Every answer shows where it came from.</p>
                </div>
                {!noNotes && selectedGroup && (
                  <div className="flex max-w-[520px] flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft">{s}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((m, i) => {
                const isError = m.role === "ai" && m.content.startsWith("❌");
                return (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "ai" && (
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text"><Sparkles className="h-3.5 w-3.5" /></span>
                    )}
                    <div
                      className={`min-w-0 break-words ${
                        m.role === "user"
                          ? "max-w-[80%] rounded-xl bg-primary px-4 py-2.5 text-base text-primary-foreground"
                          : isError
                            ? "max-w-[85%] rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-base text-danger"
                            : "max-w-[85%] rounded-xl border border-border bg-surface px-4 py-3"
                      }`}
                    >
                      {m.thinking ? (
                        <div className="flex items-center gap-2 py-0.5 text-sm text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary-text" /> Searching your notes and writing an answer…
                        </div>
                      ) : m.role === "user" ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : isError ? (
                        <p>{m.content.replace(/^❌\s*/, "")}</p>
                      ) : (
                        <>
                          <RichText text={m.content} className="text-base leading-relaxed text-foreground" />
                          {m.citations && m.citations.length > 0 && (
                            <div className="mt-3 border-t border-border pt-3">
                              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</div>
                              <div className="flex flex-wrap gap-2">
                                {m.citations.map((c, ci) => (
                                  <span key={ci} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="truncate">{c.filename}</span>
                                    {c.page != null && <span className="shrink-0 text-muted-foreground">· p{c.page}</span>}
                                    {c.score != null && <span className="shrink-0 font-semibold text-primary-text">{Math.round(c.score * 100)}%</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-border bg-background/80 px-5 pb-4 pt-3 backdrop-blur">
          <div className="mx-auto w-full max-w-[760px]">
            {!selectedGroup ? (
              <p className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm text-muted-foreground">Join or create a study group to start asking questions.</p>
            ) : noNotes ? (
              <p className="flex items-center justify-center gap-2 rounded-xl border border-warning/20 bg-warning-soft px-4 py-3 text-center text-sm text-warning">
                <FileText className="h-4 w-4" /> This group has no notes yet. Upload some in the Library first.
              </p>
            ) : (
              <>
                {messages.length > 0 && !sending && (
                  <div className="mb-2 flex gap-2 overflow-x-auto">
                    {SUGGESTIONS.slice(0, 3).map((s) => (
                      <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">{s}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-xl border border-border bg-surface px-3 py-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                    placeholder="Ask about your study materials…"
                    disabled={sending}
                    className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
                  />
                  <Button size="sm" icon={Send} onClick={() => send(input)} disabled={!input.trim() || sending} aria-label="Send message" />
                </div>
                <p className="mt-1.5 text-center text-xs text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
