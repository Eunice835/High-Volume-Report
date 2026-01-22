import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, setCsrfToken as setGlobalCsrfToken } from "./queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [localCsrfToken, setLocalCsrfToken] = useState<string | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (session?.csrfToken) {
      setLocalCsrfToken(session.csrfToken);
      setGlobalCsrfToken(session.csrfToken);
    }
  }, [session?.csrfToken]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.csrfToken) {
        setLocalCsrfToken(data.csrfToken);
        setGlobalCsrfToken(data.csrfToken);
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      setLocalCsrfToken(null);
      setGlobalCsrfToken(null);
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const hasRole = (...roles: string[]) => {
    if (!session?.authenticated || !session?.user?.role) return false;
    return roles.includes(session.user.role);
  };

  const value: AuthContextValue = {
    user: session?.authenticated ? session.user : null,
    isAuthenticated: session?.authenticated ?? false,
    isLoading,
    csrfToken: localCsrfToken,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
