import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "../types";
import { authService } from "../services/auth.service";

// ─── Context Shape ─────────────────────────────────────────────────────────
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while login / register / session-restore is in flight */
  isLoading: boolean;
  /** Last error message from login or register */
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// ─── AuthProvider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Optimistically restore session from localStorage on first render.
  // We also fire a /auth/me verification in the background to ensure the
  // token is still valid (e.g. hasn't been revoked by the server).
  const restored = authService.restoreSession();

  const [user, setUser] = useState<User | null>(restored?.user ?? null);
  const [token, setToken] = useState<string | null>(restored?.token ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!!restored); // true if we need to verify
  const [error, setError] = useState<string | null>(null);

  // ── On mount: silently verify the restored token via GET /auth/me ────────
  useEffect(() => {
    if (!restored) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    authService
      .me()
      .then((freshUser) => {
        if (cancelled) return;
        // Refresh the cached user with the latest server data
        setUser(freshUser);
        authService.persistSession(freshUser, restored.token);
      })
      .catch(() => {
        if (cancelled) return;
        // Token is invalid / expired — clear everything
        authService.clearSession();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      authService.persistSession(result.user, result.token);
      setUser(result.user);
      setToken(result.token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      throw err; // Re-throw so the form component can react if needed
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authService.register(name, email, password);
        authService.persistSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
