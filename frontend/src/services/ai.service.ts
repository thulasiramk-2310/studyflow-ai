import { apiClient } from "./api.client";

export interface ChatCitation {
  filename: string;
  page: number;
  score: number;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  confidence: number;
  citations: ChatCitation[];
  sessionId?: number;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: "user" | "ai";
  content: string;
  citations?: ChatCitation[];
  model?: string;
  created_at: string;
}

export interface ChatSession {
  id: number;
  user_id: number;
  group_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

class AIService {
  async chat(groupId: number, query: string, sessionId?: number): Promise<ChatResponse> {
    const payload: any = { groupId, query };
    if (sessionId) payload.sessionId = sessionId;
    const data = await apiClient.post<ChatResponse>("/api/v1/ai/chat", payload);
    return data;
  }

  async getChatSessions(groupId: number): Promise<ChatSession[]> {
    const data = await apiClient.get<ChatSession[]>(`/api/v1/ai/chat/sessions?group_id=${groupId}`);
    return data;
  }

  async getChatSessionMessages(sessionId: number, groupId: number): Promise<ChatMessage[]> {
    const data = await apiClient.get<ChatMessage[]>(`/api/v1/ai/chat/sessions/${sessionId}?group_id=${groupId}`);
    return data;
  }

  async deleteChatSession(sessionId: number, groupId: number): Promise<void> {
    await apiClient.delete(`/api/v1/ai/chat/sessions/${sessionId}?group_id=${groupId}`);
  }
}

export const aiService = new AIService();
