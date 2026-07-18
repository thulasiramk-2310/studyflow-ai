/**
 * auth.service.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Handles all authentication API calls against the Spring Boot backend.
 *
 * Endpoints used:
 *   POST /auth/login    → { user }
 *   POST /auth/register → { user }
 *   GET  /auth/me       → User
 *
 * Session is maintained via HttpOnly cookies.
 * The User object is hydrated on load via /auth/me.
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

// localStorage keys
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
   */
  login: async (email: string, password: string): Promise<{ user: User }> => {
    const body: LoginRequest = { email, password };
    const data = await apiClient.post<LoginResponse>("/auth/login", body);

    let user: User;
    if (data.user) {
      user = normaliseUser(data.user);
    } else {
      user = await authService.me();
    }

    return { user };
  },

  /**
   * POST /auth/register
   */
  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User }> => {
    const body: RegisterRequest = { name, email, password };
    const data = await apiClient.post<RegisterResponse>("/auth/register", body);

    let user: User;
    if (data.user) {
      user = normaliseUser(data.user);
    } else {
      user = await authService.me();
    }

    return { user };
  },

  /**
   * GET /auth/me
   */
  me: async (): Promise<User> => {
    const raw = await apiClient.get<MeResponse>("/auth/me");
    return normaliseUser(raw);
  },

  /**
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout", {});
  },

  // ─── Session persistence ────────────────────────────────────────────────

  /** Removes all auth data from localStorage. */
  clearSession: () => {
    localStorage.removeItem(USER_KEY);
  },
};
