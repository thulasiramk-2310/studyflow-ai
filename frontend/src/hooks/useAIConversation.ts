import { useCallback, useEffect, useRef, useState } from "react";
import { aiService, type ChatMessage, type ChatSession } from "../services/ai.service";
import { groupService, type Group } from "../services/group.service";
import { resourceService, type Resource } from "../services/resource.service";
import type { Audience } from "../types";

type Message = Omit<ChatMessage, "id" | "session_id" | "created_at"> & { thinking?: boolean };

export function useAIConversation(audience: Audience) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [groupResources, setGroupResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const oldestId = useRef<number | undefined>(undefined);
  const pagingMessages = useRef(false);
  const pagingSessions = useRef(false);
  // Each navigation invalidates every pending response for the previous view.
  const version = useRef(0);
  const busy = useRef(false);

  const resetConversation = useCallback(() => {
    version.current += 1;
    busy.current = false;
    setSending(false);
    setMessages([]);
    setActiveSessionId(null);
    setError(null);
    setLoadingConversation(false);
    setHasOlderMessages(false);
    setLoadingOlder(false);
    setLoadingMoreSessions(false);
    setPaginationError(null);
    oldestId.current = undefined;
    pagingMessages.current = false;
    pagingSessions.current = false;
    return version.current;
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    groupService.getGroups().then(data => {
      if (!active) return;
      setGroups(data);
      setSelectedGroup(previous => data.find(g => g.id === previous?.id) ?? data[0] ?? null);
    }).catch(() => {
      if (active) setError("Couldn't load your workspaces. Try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    const current = resetConversation();
    setHistory([]);
    setHasMoreSessions(false);
    setGroupResources([]);
    if (!selectedGroup) return;
    setLoadingConversation(true);
    const groupId = selectedGroup.id;
    Promise.all([resourceService.getResources(groupId), aiService.getChatSessions(groupId)])
      .then(async ([resources, sessions]) => {
        if (version.current !== current) return;
        setGroupResources(resources);
        setHistory(sessions);
        setHasMoreSessions(sessions.length === 50);
        if (sessions.length) {
          const messages = await aiService.getChatSessionMessages(sessions[0].id, groupId);
          if (version.current !== current) return;
          setActiveSessionId(sessions[0].id);
          setMessages(messages);
          oldestId.current = messages[0]?.id;
          setHasOlderMessages(messages.length === 30);
        }
      }).catch(() => {
        if (version.current === current) setError("Couldn't load this conversation. Try again.");
      }).finally(() => {
        if (version.current === current) setLoadingConversation(false);
      });
    return () => { version.current += 1; busy.current = false; };
  }, [selectedGroup, resetConversation]);

  const selectGroup = (group: Group) => {
    if (group.id === selectedGroup?.id) return;
    resetConversation();
    setGroupResources([]);
    setHistory([]);
    setSelectedGroup(group);
    setLoadingConversation(true);
  };

  const loadSession = async (sessionId: number) => {
    if (!selectedGroup) return;
    const current = resetConversation();
    setLoadingConversation(true);
    try {
      const data = await aiService.getChatSessionMessages(sessionId, selectedGroup.id);
      if (version.current !== current) return;
      setActiveSessionId(sessionId);
      setMessages(data);
      oldestId.current = data[0]?.id;
      setHasOlderMessages(data.length === 30);
    } catch {
      if (version.current === current) setError("Couldn't load this conversation. Try again.");
    } finally {
      if (version.current === current) setLoadingConversation(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedGroup || !activeSessionId || !oldestId.current || pagingMessages.current) return;
    const current = version.current;
    pagingMessages.current = true;
    setLoadingOlder(true);
    setPaginationError(null);
    try {
      const data = await aiService.getChatSessionMessages(activeSessionId, selectedGroup.id, oldestId.current);
      if (version.current !== current) return;
      setMessages(previous => [...data, ...previous]);
      oldestId.current = data[0]?.id ?? oldestId.current;
      setHasOlderMessages(data.length === 30);
    } catch {
      if (version.current === current) setPaginationError("Couldn't load older messages. Please retry.");
    } finally {
      if (version.current === current) { pagingMessages.current = false; setLoadingOlder(false); }
    }
  };

  const loadMoreSessions = async () => {
    if (!selectedGroup || pagingSessions.current) return;
    const current = version.current;
    pagingSessions.current = true;
    setLoadingMoreSessions(true);
    setPaginationError(null);
    try {
      const data = await aiService.getChatSessions(selectedGroup.id, history.length);
      if (version.current !== current) return;
      setHistory(previous => [...previous, ...data.filter(item => !previous.some(old => old.id === item.id))]);
      setHasMoreSessions(data.length === 50 && history.length + data.length <= 10000);
    } catch {
      if (version.current === current) setPaginationError("Couldn't load more conversations. Please retry.");
    } finally {
      if (version.current === current) { pagingSessions.current = false; setLoadingMoreSessions(false); }
    }
  };

  const send = async (text: string): Promise<boolean> => {
    if (!text.trim() || busy.current || loadingConversation || error || !selectedGroup) return false;
    busy.current = true;
    const current = version.current;
    const groupId = selectedGroup.id;
    setSending(true);
    setMessages(prev => [...prev, { role: "user", content: text.trim() }, { role: "ai", content: "", thinking: true }]);
    try {
      const response = await aiService.chat(groupId, text.trim(), activeSessionId ?? undefined, audience);
      if (version.current !== current) return false;
      setMessages(prev => [...prev.slice(0, -1), { role: "ai", content: response.answer, citations: response.citations }]);
      if (response.sessionId) setActiveSessionId(response.sessionId);
      // Refresh failures must not replace an otherwise successful answer.
      aiService.getChatSessions(groupId).then(sessions => {
        if (version.current === current) {
          setHistory(previous => [...sessions, ...previous.filter(item => !sessions.some(newer => newer.id === item.id))]);
          setHasMoreSessions(sessions.length === 50);
        }
      }).catch(() => {});
      return true;
    } catch (err) {
      if (version.current !== current) return false;
      const message = err instanceof Error ? err.message : "Couldn't send your message. Try again.";
      setMessages(prev => [...prev.slice(0, -1), { role: "ai", content: `❌ ${message}` }]);
      return false;
    } finally {
      if (version.current === current) { busy.current = false; setSending(false); }
    }
  };

  return {
    groups, selectedGroup, selectGroup, messages, history, activeSessionId, groupResources,
    loading, loadingConversation, sending, error, send, loadSession,
    hasOlderMessages, loadingOlder, loadOlderMessages, hasMoreSessions, loadingMoreSessions, loadMoreSessions, paginationError,
    newChat: resetConversation,
    retry: () => setReload(n => n + 1),
  };
}
