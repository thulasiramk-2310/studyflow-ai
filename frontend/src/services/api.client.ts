/**
 * api.client.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Thin fetch wrapper that:
 *  - Points every request at the Spring Boot base URL
 *  - Reads the JWT from localStorage and attaches it as
 *    "Authorization: Bearer <token>" on every request automatically
 *  - Parses JSON responses and throws a structured ApiError on non-2xx
 *  - Exposes get / post helpers used by the rest of the service layer
 */

/**
 * Base URL for all API requests.
 *
 * Development  → Vite proxy intercepts /auth/* and forwards to :8080
 *                so we just use an empty string (relative URLs).
 * Production   → Set VITE_API_BASE_URL in your build environment to point
 *                at the real server, e.g. https://api.studyflow.ai
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const TOKEN_KEY = "sf_token";

// ─── Internal helper ───────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content – nothing to parse
  if (res.status === 204) return undefined as T;

  let data: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await res.json()) as Record<string, any>;
    if (json && typeof json === "object" && "success" in json) {
      if (json.success) {
        data = json.data;
      } else {
        const message = json.error?.message || res.statusText;
        const err = new Error(message);
        (err as Error & { status: number }).status = res.status;
        throw err;
      }
    } else {
      data = json;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    // Try to surface the error message from the Spring Boot error body
    const message =
      typeof data === "object" && data !== null
        ? ((data as Record<string, unknown>).message as string) ??
          ((data as Record<string, unknown>).error as string) ??
          res.statusText
        : res.statusText;

    const err = new Error(message);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return data as T;
}

// ─── Public API client ─────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>("GET", path),

  post: <T>(path: string, body: unknown): Promise<T> =>
    request<T>("POST", path, body),

  put: <T>(path: string, body: unknown): Promise<T> =>
    request<T>("PUT", path, body),

  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>("PATCH", path, body),

  delete: <T>(path: string): Promise<T> => request<T>("DELETE", path),
};
