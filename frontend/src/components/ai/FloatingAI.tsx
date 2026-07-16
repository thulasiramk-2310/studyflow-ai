import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, FileText, BookOpen, BrainCircuit, Calendar, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { aiService, type ChatCitation } from "../../services/ai.service";
import { groupService, type Group } from "../../services/group.service";

interface Message {
  role: "user" | "ai";
  content: string;
  citations?: ChatCitation[];
  thinking?: boolean;
}

const QUICK_ACTIONS = [
  { icon: BookOpen, label: "Summarize notes", prompt: "Summarize the key concepts from my study materials" },
  { icon: BrainCircuit, label: "Generate quiz", action: "quiz" },
  { icon: Lightbulb, label: "Create flashcards", action: "flashcards" },
  { icon: Calendar, label: "Plan a session", action: "schedule" },
];

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on the /ai page (redundant)
  const isAIPage = location.pathname === "/ai";

  useEffect(() => {
    groupService.getGroups().then(data => {
      setGroups(data);
      if (data.length > 0) setSelectedGroup(data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.action === "quiz" && selectedGroup) {
      navigate(`/groups/${selectedGroup.id}`, { state: { openTab: "Sessions" } });
      setIsOpen(false);
      return;
    }
    if (action.action === "flashcards" && selectedGroup) {
      navigate(`/groups/${selectedGroup.id}`, { state: { openTab: "Sessions" } });
      setIsOpen(false);
      return;
    }
    if (action.action === "schedule" && selectedGroup) {
      navigate(`/groups/${selectedGroup.id}`, { state: { generatePlan: true } });
      setIsOpen(false);
      return;
    }
    if (action.prompt) {
      sendMessage(action.prompt);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !selectedGroup) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg, { role: "ai", content: "", thinking: true }]);
    setInput("");
    setSending(true);

    try {
      const res = await aiService.chat(selectedGroup.id, text, sessionId || undefined);
      const aiBody = res?.answer || "No response";
      const aiCitations = res?.citations || [];

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", content: aiBody, citations: aiCitations };
        return next;
      });

      if (res.sessionId && res.sessionId !== sessionId) {
        setSessionId(res.sessionId);
      }
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", content: "❌ Sorry, something went wrong. Try again." };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  if (isAIPage) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--primary)/0.8)] text-white shadow-lg shadow-primary/25 flex items-center justify-center hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200 group"
            aria-label="Ask StudyFlow AI"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-120px)] bg-surface border border-border rounded-2xl shadow-2xl shadow-black/10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-surface to-background flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-foreground">StudyFlow AI</div>
                    <div className="text-[11px] text-muted-foreground">Ask anything about your materials</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button onClick={handleNewChat} className="text-[11px] font-medium text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-primary-soft transition-colors">
                      New
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Selector */}
              {groups.length > 1 && (
                <div className="px-4 py-2 border-b border-border-soft bg-background/50 shrink-0">
                  <select
                    className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] font-medium outline-none focus:border-primary/50 cursor-pointer"
                    value={selectedGroup?.id || ""}
                    onChange={(e) => {
                      const g = groups.find(g => g.id === Number(e.target.value));
                      if (g) {
                        setSelectedGroup(g);
                        handleNewChat();
                      }
                    }}
                  >
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="text-[14px] font-bold text-foreground">How can I help?</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {selectedGroup ? `Studying: ${selectedGroup.name}` : "Select a group to get started"}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
                      {QUICK_ACTIONS.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickAction(a)}
                          disabled={!selectedGroup}
                          className="flex items-center gap-2 text-left px-3 py-2.5 bg-background border border-border rounded-xl text-[12px] font-medium text-foreground hover:bg-primary-soft hover:border-primary/20 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <a.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{a.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Full AI page link */}
                    <button
                      onClick={() => { navigate("/ai"); setIsOpen(false); }}
                      className="text-[11px] text-muted-foreground hover:text-primary font-medium transition-colors"
                    >
                      Open full AI Assistant →
                    </button>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      {m.role === "ai" && (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[85%] ${
                        m.role === "user"
                          ? "bg-primary text-white rounded-2xl rounded-tr-md px-3 py-2"
                          : "bg-background border border-border rounded-2xl rounded-tl-md px-3 py-2.5"
                      }`}>
                        {m.thinking ? (
                          <div className="flex items-center gap-2 py-0.5">
                            <Sparkles className="w-3 h-3 animate-pulse text-primary" />
                            <span className="text-[12px] text-muted-foreground font-medium">Thinking...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            {m.citations && m.citations.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1">
                                {m.citations.slice(0, 2).map((c, ci) => (
                                  <div key={ci} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                                    <FileText className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{c.filename}</span>
                                    <span className="shrink-0 text-emerald-600 font-bold">{Math.round(c.score * 100)}%</span>
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

              {/* Input */}
              <div className="px-4 py-3 border-t border-border bg-surface shrink-0">
                {!selectedGroup ? (
                  <div className="text-center text-[12px] text-muted-foreground font-medium py-1">
                    No study groups available
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(input);
                        }
                      }}
                      placeholder="Ask anything…"
                      disabled={sending}
                      className="flex-1 bg-transparent outline-none text-[12.5px] text-foreground placeholder:text-muted-foreground disabled:opacity-60"
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || sending}
                      className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
