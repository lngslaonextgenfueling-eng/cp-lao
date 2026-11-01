"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  shop?: { id: string; name: string; slug: string; status: "PENDING" | "APPROVED" | "SUSPENDED" } | null;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  /** Re-reads the user from the API (e.g. after opening a shop or when it gets approved). */
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("token");
    } catch {}
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ token: string; user: User }>("/auth/me")
      .then((r) => finish(r))
      .catch(() => {
        try {
          localStorage.removeItem("token");
        } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const finish = (r: { token: string; user: User }) => {
    try {
      localStorage.setItem("token", r.token);
    } catch {}
    setUser(r.user);
  };

  const login = useCallback(async (email: string, password: string) => {
    finish(await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    finish(await api("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, phone }) }));
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    finish(await api("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ token: string; user: User }>("/auth/me");
      finish(r);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {}
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refresh }}>{children}</Ctx.Provider>;
}
