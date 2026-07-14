import { apiClient as api } from './api.client';

export interface SearchResult {
  id: number;
  title: string;
  description?: string;
  type: 'group' | 'resource' | 'session' | 'quiz' | 'flashcard' | 'chat';
  url: string;
  group_id?: number;
  created_at?: string;
}

export interface SearchResponse {
  groups: SearchResult[];
  resources: SearchResult[];
  sessions: SearchResult[];
  quizzes: SearchResult[];
  flashcards: SearchResult[];
  chatSessions: SearchResult[];
}

export const searchService = {
  async search(query: string): Promise<SearchResponse> {
    const data = await api.get<SearchResponse>(`/api/v1/search?q=${encodeURIComponent(query)}`);
    return data;
  }
};
