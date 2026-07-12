// ─── User & Auth ───────────────────────────────────────────────────────────

/** User profile as returned by GET /auth/me */
export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: "organizer" | "member";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── API Request / Response shapes ────────────────────────────────────────

/** POST /auth/login  – request body */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login  – response body */
export interface LoginResponse {
  token: string;
  /** Some Spring Boot starters also return the user inline; optional here */
  user?: User;
}

/** POST /auth/register  – request body */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** POST /auth/register  – response body (same shape as login) */
export interface RegisterResponse {
  token: string;
  user?: User;
}

/** GET /auth/me  – response body */
export type MeResponse = User;

// ─── Generic API error ─────────────────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
}

// ─── Domain types (used by pages) ─────────────────────────────────────────
export interface Group {
  id: string;
  name: string;
  subject: string;
  members: number;
  resources: number;
  progress: number;
  isOrg: boolean;
  next: string;
}

export interface Session {
  id: string;
  topic: string;
  group: string;
  date: string;
  time: string;
  organizer: string;
  status: "upcoming" | "live" | "completed";
  attendance: string;
}

export interface Notification {
  id: string;
  type: "upload" | "session" | "ai" | "member";
  text: string;
  when: string;
  unread: boolean;
  group: "today" | "earlier";
}
