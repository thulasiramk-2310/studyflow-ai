import { useEffect, useRef, useState } from "react";
import { FileText, History, LoaderCircle, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import { useTerms } from "../../hooks/useTerms";
import { useAIConversation } from "../../hooks/useAIConversation";
import { AIAssistantSkeleton } from "../../components/skeletons";
import { Button, RichText } from "../../components/ui";

const SUGGESTIONS = ["Summarise my notes", "Explain the key ideas", "Compare the main concepts"];

export function AIAssistant() {
  const terms = useTerms();
  const chat = useAIConversation(terms.audience);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const draftVersion = useRef(0);
  const { messages, history, selectedGroup, activeSessionId, sending, loadingConversation, error } = chat;

  const lastMessage = messages.at(-1);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "nearest" }); }, [lastMessage]);

  const clearDraft = () => { draftVersion.current += 1; setInput(""); };
  const newChat = () => { clearDraft(); chat.newChat(); };
  const loadSession = (id: number) => { clearDraft(); void chat.loadSession(id); };
  const send = async (text: string) => {
    if (!text.trim() || sending || loadingConversation || error) return;
    const current = ++draftVersion.current;
    setInput("");
    const sent = await chat.send(text);
    if (!sent && current === draftVersion.current) setInput(text);
  };

  if (chat.loading) return <AIAssistantSkeleton />;
  const blocked = sending || loadingConversation || !!error;
  const noNotes = !!selectedGroup && !chat.groupResources.length && !loadingConversation && !error;

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0 overflow-hidden">
      <aside aria-label="Conversation history" className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="border-b border-border p-3">
          <Button size="sm" variant="secondary" icon={Plus} onClick={newChat} disabled={loadingConversation || !!error} className="w-full">New chat</Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase text-muted-foreground">Recent chats</div>
          {!history.length && <p className="px-2 py-6 text-sm text-muted-foreground">{loadingConversation ? "Loading conversations..." : "No conversations yet."}</p>}
          {history.map(session => (
            <button key={session.id} onClick={() => loadSession(session.id)} title={session.title}
              aria-current={activeSessionId === session.id ? "true" : undefined}
              className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeSessionId === session.id ? "bg-surface font-semibold text-foreground ring-1 ring-border" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {session.title}
            </button>
          ))}
          {chat.hasMoreSessions && <Button size="sm" variant="ghost" onClick={() => void chat.loadMoreSessions()} disabled={chat.loadingMoreSessions}>More conversations</Button>}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h1 className="font-serif text-lg text-foreground">Ask AI</h1>
          {!!chat.groups.length && (
            <select aria-label={terms.group} value={selectedGroup?.id || ""}
              onChange={event => {
                const group = chat.groups.find(g => g.id === Number(event.target.value));
                if (group) { clearDraft(); chat.selectGroup(group); }
              }}
              className="h-9 min-w-0 max-w-[220px] truncate rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus:border-primary focus:outline-none">
              {chat.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          )}
          <span className="hidden text-sm text-muted-foreground xl:inline">Answers from this {terms.groupLower}'s notes</span>
          <Button size="sm" variant="ghost" icon={Plus} onClick={newChat} disabled={loadingConversation || !!error} className="ml-auto lg:hidden">New chat</Button>
          <div className="flex w-full items-center gap-2 lg:hidden">
            <History className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <select aria-label="Recent chats" value={activeSessionId ?? ""} onChange={event => event.target.value ? loadSession(Number(event.target.value)) : newChat()}
              className="h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-sm text-foreground">
              <option value="">New conversation</option>
              {history.map(session => <option key={session.id} value={session.id}>{session.title}</option>)}
            </select>
            {chat.hasMoreSessions && <Button size="sm" variant="ghost" onClick={() => void chat.loadMoreSessions()} disabled={chat.loadingMoreSessions}>More</Button>}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={loadingConversation || sending}>
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-6 sm:px-5">
            {chat.paginationError && <p role="alert" className="text-sm text-danger">{chat.paginationError}</p>}
            {chat.hasOlderMessages && <Button size="sm" variant="ghost" onClick={() => void chat.loadOlderMessages()} disabled={chat.loadingOlder}>Load older messages</Button>}
            {error ? (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
                <p>{error}</p><Button size="sm" variant="secondary" icon={RefreshCw} onClick={chat.retry}>Try again</Button>
              </div>
            ) : loadingConversation ? (
              <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Loading conversation...</div>
            ) : !messages.length ? (
              <div className="flex flex-col items-center gap-5 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary-text"><Sparkles className="h-5 w-5" /></span>
                <div><h2 className="font-serif text-xl text-foreground">What do you want to understand?</h2>
                  <p className="mt-1 break-words text-base text-muted-foreground">{selectedGroup?.name ?? `Your ${terms.groupLower}'s notes`}</p>
                </div>
                {!noNotes && selectedGroup && <div className="flex max-w-[520px] flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map(suggestion => <button key={suggestion} onClick={() => void send(suggestion)} className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground hover:border-primary/30 hover:bg-primary-soft">{suggestion}</button>)}
                </div>}
              </div>
            ) : messages.map((message, index) => {
              const isError = message.role === "ai" && message.content.startsWith("❌");
              return (
                <div key={index} className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "ai" && <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text"><Sparkles className="h-3.5 w-3.5" /></span>}
                  <div className={`min-w-0 max-w-[85%] break-words rounded-lg border px-4 py-3 ${message.role === "user" ? "border-primary bg-primary text-primary-foreground" : isError ? "border-danger/20 bg-danger-soft text-danger" : "border-border bg-surface text-foreground"}`}>
                    {message.thinking ? <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />Searching your notes and writing an answer…</div>
                      : message.role === "user" ? <p className="whitespace-pre-wrap">{message.content}</p>
                      : isError ? <p role="alert">{message.content.replace(/^❌\s*/, "")}</p>
                      : <>
                        <RichText text={message.content} className="text-base leading-relaxed text-foreground" />
                        {!!message.citations?.length && <div className="mt-3 border-t border-border pt-3">
                          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Sources</div>
                          <div className="flex flex-wrap gap-2">{message.citations.map((citation, i) => (
                            <span key={i} title={citation.filename} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
                              <FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{citation.filename}</span>
                              {citation.page != null && <span className="shrink-0">· p{citation.page}</span>}
                            </span>
                          ))}</div>
                        </div>}
                      </>}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 py-3 sm:px-5">
          <div className="mx-auto w-full max-w-[760px]">
            {!selectedGroup ? <p className="py-2 text-center text-sm text-muted-foreground">Join or create a {terms.groupLower} to start asking questions.</p>
              : noNotes ? <p className="rounded-lg border border-warning/20 bg-warning-soft p-3 text-center text-sm text-warning">This {terms.groupLower} has no notes yet. Upload some in {terms.library} first.</p>
              : <div className="flex items-end gap-2 rounded-lg border border-border bg-surface px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <textarea rows={2} aria-label="Message" value={input} maxLength={8000} disabled={blocked}
                  onChange={event => { draftVersion.current += 1; setInput(event.target.value); }}
                  onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(input); } }}
                  placeholder={terms.askPlaceholder} className="max-h-40 min-w-0 flex-1 resize-y bg-transparent py-1.5 text-base outline-none placeholder:text-muted-foreground disabled:opacity-60" />
                <Button size="sm" icon={Send} onClick={() => void send(input)} disabled={!input.trim() || blocked} aria-label="Send message" />
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
