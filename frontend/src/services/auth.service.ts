/**
 * auth.service.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Handles all authentication API calls against the Spring Boot backend.
 *
 * Endpoints used:
 *   POST /auth/login    → { token, user? }
 *   POST /auth/register → { token, user? }
 *   GET  /auth/me       → User
 *
 * Session is persisted in localStorage under the keys:
 *   sf_token  – the raw JWT string
 *   sf_user   – JSON-serialised User object (cached copy)
 */

import { apiClient } from "./api.client";
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
} from "../types";

// localStorage keys – keep in sync with api.client.ts TOKEN_KEY
const TOKEN_KEY = "sf_token";
const USER_KEY = "sf_user";

// ─── Helper: derive initials from a full name ─────────────────────────────
function toInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Normalise the User object coming from the API.
 * Spring Boot may not return `initials` or `role`, so we compute them here
 * so the rest of the app can rely on those fields always being present.
 */
function normaliseUser(raw: Partial<User> & { name: string; email: string }): User {
  return {
    id: raw.id ?? "",
    name: raw.name,
    email: raw.email,
    initials: raw.initials ?? toInitials(raw.name),
  };
}

// ─── Auth Service ──────────────────────────────────────────────────────────
export const authService = {
  /**
   * POST /auth/login
   * Returns normalised { user, token } on success.
   * Throws Error with `.message` set to the server's error message.
   */
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const body: LoginRequest = { email, password };
    const data = await apiClient.post<LoginResponse>("/auth/login", body);

    // Persist the raw JWT immediately so that the follow-up /auth/me
    // request (if needed) can be authenticated.
    authService._storeToken(data.token);

    // If the server already returned the user profile in the login response,
    // use it. Otherwise, fetch it via GET /auth/me.
    let user: User;
    if (data.user) {
      user = normaliseUser(data.user);
    } else {
      user = await authService.me();
    }

    return { user, token: data.token };
  },

  /**
   * POST /auth/register
   * Creates a new account and returns normalised { user, token }.
   */
  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> => {
    const body: RegisterRequest = { name, email, password };
    const data = await apiClient.post<RegisterResponse>("/auth/register", body);

    authService._storeToken(data.token);

    let user: User;
    if (data.user) {
      user = normaliseUser(data.user);
    } else {
      user = await authService.me();
    }

    return { user, token: data.token };
  },

  /**
   * GET /auth/me
   * Returns the currently authenticated user's profile.
   * Requires a valid JWT to already be in localStorage (set by login/register).
   */
  me: async (): Promise<User> => {
    const raw = await apiClient.get<MeResponse>("/auth/me");
    return normaliseUser(raw);
  },

  // ─── Session persistence ────────────────────────────────────────────────

  /** Stores the JWT in localStorage (used by api.client.ts for header injection). */
  _storeToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /** Persists both token and user profile in localStorage. */
  persistSession: (user: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** Removes all auth data from localStorage. */
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Attempts to restore a previous session from localStorage.
   * Returns null if no valid session exists.
   */
  restoreSession: (): { user: User; token: string } | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!token || !raw) return null;
    try {
      return { user: JSON.parse(raw) as User, token };
    } catch {
      return null;
    }
  },
};
