"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as authApi from "@/lib/api/auth";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/lib/auth/token";
import { ApiError } from "@/lib/api/errors";
import type { LoginRequest, RegisterRequest, RegisterResult, User } from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<RegisterResult>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setSession: (accessToken: string, user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((accessToken: string, nextUser: User) => {
    setToken(accessToken);
    setStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const me = await authApi.getCurrentUser();
      setStoredUser(me);
      setUser(me);
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const cached = getStoredUser();
    if (cached) {
      setUser(cached);
    }
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (payload: LoginRequest): Promise<User> => {
      const response = await authApi.login(payload);
      if (!response.access_token || !response.user) {
        throw new ApiError(403, "ایمیل تأیید نشده است");
      }
      setSession(response.access_token, response.user);
      return response.user;
    },
    [setSession],
  );

  const register = useCallback(
    async (payload: RegisterRequest): Promise<RegisterResult> => {
      const response = await authApi.register(payload);
      if (response.needs_email_verification && response.email) {
        return { status: "verification_required", email: response.email };
      }
      if (!response.access_token || !response.user) {
        throw new ApiError(500, "ثبت‌نام کامل نشد");
      }
      setSession(response.access_token, response.user);
      return { status: "authenticated", user: response.user };
    },
    [setSession],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      setSession,
    }),
    [user, isLoading, login, register, logout, refreshUser, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
