import { useState, useRef, useEffect } from "react";
import { Send, Plus, ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { Sparkle } from "../../components/Icons";
import { AIAssistantSkeleton } from "../../components/skeletons";
import { groupService, type Group } from "../../services/group.service";
import { resourceService, type Resource } from "../../services/resource.service";
import { aiService, type ChatSession, type ChatMessage } from "../../services/ai.service";

const SUGGESTIONS = [
  "Summarize my notes",
  "Explain key concepts",
  "Generate quiz questions",
  "What are the main formulas?"
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
      let errorMsg = "Sorry, I encountered an error. Please try again.";
      if (err.response?.status === 404) errorMsg = "No indexed documents found.";
      else if (err.response?.status === 429) errorMsg = "Rate limit exceeded. Please wait a moment.";
      else if (err.response?.status === 503) errorMsg = "AI Service unavailable.";
      else if (err.message === "Network Error") errorMsg = "Network error. Please check your connection.";
      else if (err.response?.data?.detail) errorMsg = err.response.data.detail;

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

  return (
    <div className="h-full flex overflow-hidden">
      {/* History sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-surface flex-col hidden lg:flex">
        <div className="px-4 py-3.5 border-b border-border-soft">
          <button onClick={newChat}
            className="w-full flex items-center gap-2 bg-primary-soft text-primary rounded-lg px-3 py-2 text-[13px] font-semibold hover:bg-primary hover:text-white transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
          {history.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-muted-foreground px-3">No conversations yet</div>
          ) : (
            history.map((s) => (
              <button key={s.id} onClick={() => loadSession(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] transition-colors truncate ${activeSessionId === s.id ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground hover:bg-background"}`}>
                {s.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold">AI Study Assistant</div>
              <div className="text-[12px] text-muted-foreground hidden sm:block">Ask questions about your uploaded materials</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {groups.length > 0 && (
              <div className="relative">
                <select 
                  className="appearance-none bg-background border border-border rounded-lg pl-3 pr-8 py-1.5 text-[12.5px] font-medium outline-none focus:border-primary/50 cursor-pointer max-w-[150px] truncate"
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const g = groups.find(g => g.id === Number(e.target.value));
                    if (g) { 
                      setSelectedGroup(g);
                    }
                  }}
                >
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            )}
            
            <button onClick={newChat} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                <Sparkle className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <div className="text-[17px] font-bold">👋 Welcome to StudyFlow AI</div>
                <div className="text-[13px] text-muted-foreground mt-1">Ask questions about your uploaded materials.</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-[480px]">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-[12.5px] bg-surface border border-border rounded-xl px-3.5 py-2 font-medium text-foreground hover:bg-primary-soft hover:border-primary/20 hover:text-primary transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] ${m.role === "user" ? "bg-primary text-white rounded-2xl rounded-tr-md px-4 py-2.5" : "bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3"}`}>
                  {m.thinking ? (
                    <div className="flex flex-col gap-2 py-1">
                      <div className="text-[12.5px] font-medium text-primary flex items-center gap-2">
                        <Sparkle className="w-3.5 h-3.5 animate-pulse" /> AI is searching your study materials...
                      </div>
                      <div className="text-[12.5px] font-medium text-muted-foreground flex items-center gap-2">
                        Generating answer...
                        <div className="flex gap-1 ml-1">
                           {[0, 1, 2].map(d => (
                            <div key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                           ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[13.5px] leading-relaxed">{m.content}</p>
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
                          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sources</div>
                          {m.citations.map((c, ci) => (
                            <div key={ci} className="flex items-center gap-2 bg-background border border-border-soft rounded-lg px-3 py-2">
                              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                <span className="text-[12px] font-medium text-foreground truncate">{c.filename}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] text-muted-foreground bg-surface border border-border-soft px-1.5 py-0.5 rounded">Page {c.page}</span>
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{Math.round(c.score * 100)}% match</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions chips (always shown when not sending) */}
        {messages.length > 0 && !sending && (
          <div className="px-5 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {SUGGESTIONS.slice(0, 3).map((s, i) => (
              <button key={i} onClick={() => send(s)}
                className="shrink-0 text-[12px] bg-surface border border-border rounded-xl px-3 py-1.5 font-medium text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary-soft transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="px-5 pb-5 pt-2">
          {(!selectedGroup) ? (
            <div className="text-center bg-surface border border-border rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground shadow-sm">
              Select a study group first.
            </div>
          ) : (groupResources.length === 0 && !loadingResources) ? (
            <div className="text-center bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] font-medium text-red-600 shadow-sm flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> No indexed study materials available. Upload and process resources before chatting.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Ask about your study materials…"
                  disabled={sending}
                  className="flex-1 bg-transparent outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground disabled:opacity-60"
                />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-center text-[11px] text-muted-foreground mt-2">Press Enter to send · Shift+Enter for new line</div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
