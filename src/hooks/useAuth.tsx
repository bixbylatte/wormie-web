import { createContext, useContext, useEffect, useState } from "react";

import { ApiError, authApi } from "../api/client";
import type { UserSummary } from "../api/types";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/session";

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setIsReady(true);
      return;
    }

    authApi
      .me(existingToken)
      .then((currentUser) => {
        setUser(currentUser);
        setToken(existingToken);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          clearStoredToken();
        }
        setUser(null);
        setToken(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  async function login(email: string, password: string) {
    const payload = await authApi.login({ email, password });
    setStoredToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }

  async function register(displayName: string, email: string, password: string) {
    const payload = await authApi.register({ display_name: displayName, email, password });
    setStoredToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }

  function logout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isReady, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}

