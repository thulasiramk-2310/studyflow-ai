import { useState, useRef, useEffect } from "react";
import { Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { MOCK_CHAT_HISTORY, MOCK_INITIAL_CHAT, MOCK_AI_SUGGESTIONS } from "../../lib/mock-data";
import { Sparkle } from "../../components/Icons";

interface Message {
  role: "user" | "ai";
  text?: string;
  body?: string;
  sources?: { type: string; name: string; loc: string; typeBg: string; typeColor: string }[];
  thinking?: boolean;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(MOCK_INITIAL_CHAT as Message[]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState(MOCK_CHAT_HISTORY);
  const [activeHistory, setActiveHistory] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: Message = { role: "user", text };
    setMessages(prev => [...prev, userMsg, { role: "ai", thinking: true }]);
    setInput("");
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setMessages(prev => {
      const next = [...prev];
      next[next.length - 1] = {
        role: "ai",
        body: `Based on your study materials, here's what I found about "${text}": This topic is covered in depth in your uploaded resources. The key concepts include the fundamental principles, their applications, and how they relate to other topics you've been studying. Would you like me to create a quiz on this topic or summarize it further?`,
        sources: [{ type: "PDF", name: "Study Guide.pdf", loc: "p. 12", typeBg: "bg-red-100", typeColor: "text-red-600" }],
      };
      return next;
    });
    setSending(false);
  };

  const newChat = () => {
    setMessages([]);
    setHistory(h => [input || "New conversation", ...h].slice(0, 8));
    toast.info("New conversation started");
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
            history.map((h, i) => (
              <button key={i} onClick={() => setActiveHistory(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] transition-colors truncate ${activeHistory === i ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground hover:bg-background"}`}>
                {h}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold">AI Study Assistant</div>
            <div className="text-[12px] text-muted-foreground">Biology 301 · 18 resources indexed</div>
          </div>
          <button onClick={newChat} className="ml-auto flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                <Sparkle className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <div className="text-[17px] font-bold">Ask me anything</div>
                <div className="text-[13px] text-muted-foreground mt-1">About your study materials, topics, or quizzes</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-[480px]">
                {MOCK_AI_SUGGESTIONS.map((s, i) => (
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
                    <div className="flex gap-1 py-1">
                      {[0, 1, 2].map(d => (
                        <div key={d} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-[13.5px] leading-relaxed">{m.text ?? m.body}</p>
                      {m.sources && (
                        <div className="mt-3 flex flex-col gap-1.5">
                          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sources</div>
                          {m.sources.map((s, si) => (
                            <div key={si} className={`flex items-center gap-2 ${s.typeBg} rounded-lg px-2.5 py-1.5`}>
                              <span className={`text-[10px] font-extrabold ${s.typeColor}`}>{s.type}</span>
                              <span className="text-[12px] font-medium flex-1 truncate">{s.name}</span>
                              <span className="text-[11px] text-muted-foreground">{s.loc}</span>
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
            {MOCK_AI_SUGGESTIONS.slice(0, 3).map((s, i) => (
              <button key={i} onClick={() => send(s)}
                className="shrink-0 text-[12px] bg-surface border border-border rounded-xl px-3 py-1.5 font-medium text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary-soft transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 pb-5 pt-2">
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
        </div>
      </div>
    </div>
  );
}
