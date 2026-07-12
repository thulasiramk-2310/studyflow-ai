import { useContext } from "react";
import { AuthContext, type AuthContextType } from "../context/AuthContext";

/**
 * useAuth — access the authentication context from any component
 * inside <AuthProvider>.
 *
 * Exposes: user, token, isAuthenticated, isLoading, error,
 *          login(), register(), logout(), clearError()
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>.");
  }
  return ctx;
}
