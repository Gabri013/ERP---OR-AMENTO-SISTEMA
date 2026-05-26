import { createContext, useContext, ReactNode, useEffect } from "react";
import {
  useGetMe,
  useLogout,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import type { AuthUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthStore } from "@/stores/auth.store";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  const setToken = useAuthStore((s: AuthStore) => s.setToken);
  const clearAuth = useAuthStore((s: AuthStore) => s.logout);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (token) {
      setToken(token, refreshToken);
      setAuthTokenGetter(() => localStorage.getItem("authToken"));
    }
  }, [setToken]);

  const { data: user, isLoading, isError } = useGetMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && isError && location !== "/login") {
      setLocation("/login");
    }
  }, [isLoading, isError, location, setLocation]);

  // Connect socket when authenticated
  useEffect(() => {
    if (user) {
      connectSocket();
    }
  }, [user]);

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    clearAuth();
    setAuthTokenGetter(() => null);
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        logout: handleLogout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
