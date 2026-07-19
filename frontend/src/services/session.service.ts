import { BASE_URL } from "./api.client";

export type SessionStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type MeetingType = "NONE" | "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "DISCORD" | "OTHER";
export type AttendanceStatus = "PRESENT" | "ABSENT";

export interface SessionResource {
  id: number;
  filename: string;
  original_filename: string;
}

export type SummaryStatus = "PENDING" | "GENERATING" | "READY" | "FAILED";

export interface SessionSummary {
  id: number;
  session_id: number;
  summary: string | null;
  key_concepts: string[] | null;
  important_points: string[] | null;
  action_items: string[] | null;
  status: SummaryStatus;
  model: string | null;
  generated_at: string | null;
  generation_time_ms: number | null;
}

export type QuizStatus = "PENDING" | "GENERATING" | "READY" | "FAILED";
export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT";

export interface QuizQuestionResponse {
  id: number;
  question: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
}

export interface QuizGradeResultItem {
  id: number;
  correct_answer: string;
  explanation: string | null;
  is_correct: boolean;
}

export interface QuizGradeResponse {
  score: number;
  total: number;
  percentage?: number;
  passed: boolean;
  results: QuizGradeResultItem[];
}

export interface QuizResponse {
  id: number;
  session_id: number;
  status: QuizStatus;
  model: string | null;
  generated_at: string | null;
  questions: QuizQuestionResponse[];
}

export type FlashcardDeckStatus = "PENDING" | "GENERATING" | "READY" | "FAILED";

export interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  difficulty: string | null;
  order_index: number;
  created_at: string;
}

export interface FlashcardDeckResponse {
  id: number;
  session_id: number;
  status: FlashcardDeckStatus;
  model: string | null;
  generated_at: string | null;
  generation_time_ms: number | null;
  flashcards: Flashcard[];
}

export interface AgendaItem {
  title: string;
  duration_minutes: number;
  description: string;
  activity_type: "revision" | "learning" | "practice" | "discussion" | "quiz" | "break";
}

export type StudySessionType = "REVISION" | "LECTURE" | "PRACTICE" | "DISCUSSION" | "EXAM_PREP" | "PROJECT" | "INTERVIEW_PREP" | "OTHER";

export interface Session {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  agenda: AgendaItem[] | null;
  objectives: string[] | null;
  expected_outcome: string | null;
  session_type: StudySessionType;
  learning_path_item_id: number | null;
  generated_by_ai: boolean;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  meeting_type: MeetingType;
  meeting_url: string | null;
  start_time: string | null;
  end_time: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  resources: SessionResource[];
}

export interface SessionAttendanceResponse {
  user_id: number;
  status: AttendanceStatus;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface SessionCreateParams {
  group_id: number;
  title: string;
  description?: string;
  agenda?: AgendaItem[];
  objectives?: string[];
  expected_outcome?: string;
  session_type?: StudySessionType;
  learning_path_item_id?: number | null;
  generated_by_ai?: boolean;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type?: MeetingType;
  meeting_url?: string;
  resource_ids: number[];
  generated_by?: string;
}

export interface SessionUpdateParams {
  title?: string;
  description?: string;
  agenda?: AgendaItem[];
  objectives?: string[];
  expected_outcome?: string;
  session_type?: StudySessionType;
  learning_path_item_id?: number | null;
  scheduled_at?: string;
  duration_minutes?: number;
  status?: SessionStatus;
  meeting_type?: MeetingType;
  meeting_url?: string;
}

class SessionService {
  private getHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  async getSessions(): Promise<Session[]> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch sessions");
    return json.data;
  }

  async getGroupSessions(groupId: number): Promise<Session[]> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/sessions`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch group sessions");
    return json.data;
  }

  async getSession(sessionId: number): Promise<Session> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch session");
    return json.data;
  }

  async createSession(params: SessionCreateParams): Promise<Session> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to create session");
    return json.data;
  }

  async updateSession(sessionId: number, params: SessionUpdateParams): Promise<Session> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to update session");
    return json.data;
  }

  async joinSession(sessionId: number): Promise<{ meeting_url?: string; meeting_type?: MeetingType }> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/join`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to join session");
    return json.data;
  }

  async getSessionAttendance(sessionId: number): Promise<SessionAttendanceResponse[]> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/attendance`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch attendance");
    return json.data;
  }

  async completeSession(sessionId: number): Promise<Session> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to complete session");
    return json.data;
  }

  async updateSessionStatus(sessionId: number, status: "LIVE" | "COMPLETED" | "CANCELLED"): Promise<Session> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/status`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to complete session");
    return json.data;
  }

  async getSessionSummary(sessionId: number): Promise<SessionSummary> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/summary`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch session summary");
    return json.data;
  }

  async regenerateSessionSummary(sessionId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/summary/regenerate`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to regenerate session summary");
  }

  async getSessionQuiz(sessionId: number): Promise<QuizResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/quiz`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch session quiz");
    return json.data;
  }

  async regenerateSessionQuiz(sessionId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/quiz/regenerate`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to regenerate session quiz");
  }

  async gradeQuiz(sessionId: number, answers: string[]): Promise<QuizGradeResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/quiz/grade`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ answers }),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to grade quiz");
    return json.data;
  }

  async getFlashcards(sessionId: number): Promise<FlashcardDeckResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/flashcards`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch flashcards");
    return json.data;
  }

  async generateFlashcards(sessionId: number, count: number = 15): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/flashcards/generate`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ count }),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to generate flashcards");
  }

  async regenerateFlashcards(sessionId: number, count: number = 15): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/sessions/${sessionId}/flashcards/regenerate`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ count }),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to regenerate flashcards");
  }
}

export const sessionService = new SessionService();
