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
  AccountType,
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
    // Accounts created before account types existed read as students.
    accountType: raw.accountType === "PROFESSIONAL" ? "PROFESSIONAL" : "STUDENT",
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
    password: string,
    accountType: AccountType = "STUDENT"
  ): Promise<{ user: User }> => {
    const body: RegisterRequest = { name, email, password, accountType };
    const data = await apiClient.post<RegisterResponse>("/auth/register", body);

    let user: User;
    if (data.user) {
      user = normaliseUser(data.user);
    } else {
      user = await authService.me();
    }

    return { user };
  },

  /** PATCH /auth/me — change the display name. */
  updateName: async (name: string): Promise<User> => {
    const data = await apiClient.patch<User>("/auth/me", { name });
    return normaliseUser(data);
  },

  /** POST /auth/me/password — throws with the server's message (e.g. "Current password is incorrect"). */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post("/auth/me/password", { currentPassword, newPassword });
  },

  /** DELETE /auth/me — refuses (409) while the user owns groups with other members. */
  deleteAccount: async (password: string): Promise<void> => {
    await apiClient.delete("/auth/me", { password });
  },

  /** POST /auth/password/forgot — always succeeds, so emails can't be probed. */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post("/auth/password/forgot", { email });
  },

  /** POST /auth/password/reset — the token comes from the emailed link. */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post("/auth/password/reset", { token, newPassword });
  },

  /**
   * PATCH /auth/me — switch between student and professional wording.
   */
  updateAccountType: async (accountType: AccountType): Promise<User> => {
    const data = await apiClient.patch<User>("/auth/me", { accountType });
    return normaliseUser(data);
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
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable (private mode / blocked): nothing to clear */
    }
  },
};
