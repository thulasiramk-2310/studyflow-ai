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
  isAuthenticated: boolean;
  /** True while login / register / session-restore is in flight */
  isLoading: boolean;
  /** Last error message from login or register */
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// ─── AuthProvider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── On mount: try to fetch user ────────
  useEffect(() => {
    let cancelled = false;

    authService
      .me()
      .then((freshUser) => {
        if (cancelled) return;
        setUser(freshUser);
      })
      .catch(() => {
        if (cancelled) return;
        authService.clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      throw err;
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
        setUser(result.user);
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
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      authService.clearSession();
      setUser(null);
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
