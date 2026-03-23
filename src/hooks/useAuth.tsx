"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  role: "admin" | "voter";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOKIE_EXPIRY_DAYS = 7;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length);
    }
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

function parseCookies(): { token: string | null; user: User | null } {
  const token = getCookie("token");
  const userStr = getCookie("user");
  if (token && userStr) {
    try {
      return { token, user: JSON.parse(userStr) as User };
    } catch {
      deleteCookie("token");
      deleteCookie("user");
    }
  }
  return { token: null, user: null };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [auth, setAuth] = useState<{ token: string | null; user: User | null }>(() => parseCookies());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // hydration flag
    setIsHydrated(true);
  }, []);

  // Hydrate session from backend on load to validate token
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setAuth({ token: auth.token, user: data.user });
          }
        }
      } catch {
        // ignore
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.error ?? 'Login failed');

    setCookie("token", data.token, COOKIE_EXPIRY_DAYS);
    setCookie("user", JSON.stringify(data.user), COOKIE_EXPIRY_DAYS);

    setAuth({ token: data.token, user: data.user });

    return data;
  };

  const logout = () => {
    deleteCookie("token");
    deleteCookie("user");
    localStorage.removeItem("token");
    setAuth({ token: null, user: null });
  };

  if (!isHydrated) return null;

  const value: AuthContextType = {
    user: auth.user,
    token: auth.token,
    login,
    logout,
    isLoading: !authReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
