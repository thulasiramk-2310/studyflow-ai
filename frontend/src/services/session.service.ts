export type SessionStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface SessionResource {
  id: number;
  filename: string;
  original_filename: string;
}

export interface Session {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  agenda: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  resources: SessionResource[];
}

export interface SessionCreateParams {
  group_id: number;
  title: string;
  description?: string;
  agenda?: string;
  scheduled_at: string;
  duration_minutes: number;
  resource_ids: number[];
}

class SessionService {
  private getHeaders() {
    const token = localStorage.getItem("sf_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async getSessions(): Promise<Session[]> {
    const res = await fetch("/sessions/", {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch sessions");
    return json.data;
  }

  async getGroupSessions(groupId: number): Promise<Session[]> {
    const res = await fetch(`/groups/${groupId}/sessions`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch group sessions");
    return json.data;
  }

  async getSession(sessionId: number): Promise<Session> {
    const res = await fetch(`/sessions/${sessionId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed to fetch session");
    return json.data;
  }

  async createSession(params: SessionCreateParams): Promise<Session> {
    const res = await fetch("/sessions/", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to create session");
    return json.data;
  }

  async completeSession(sessionId: number): Promise<Session> {
    const res = await fetch(`/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => ({ success: false, error: { message: "Failed to parse response" } }));
    if (!json.success) throw new Error(json.error?.message || "Failed to complete session");
    return json.data;
  }
}

export const sessionService = new SessionService();
