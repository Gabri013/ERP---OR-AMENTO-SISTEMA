import { createContext, useContext, ReactNode, useEffect } from "react";
import { useGetMe, useLogout, setAuthTokenGetter } from "@workspace/api-client-react";
import type { AuthUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  // Restore JWT token from localStorage on app load (after refresh)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthTokenGetter(() => localStorage.getItem("authToken"));
    }
  }, []);

  const { data: user, isLoading, isError } = useGetMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && isError && location !== "/login") {
      setLocation("/login");
    }
  }, [isLoading, isError, location, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
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
