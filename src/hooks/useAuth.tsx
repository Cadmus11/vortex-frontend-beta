"use client";
import { API_URL } from "@/features/auth/auth.service";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type User = {
  id: string;
  email: string;
  role: "admin" | "voter";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<unknown>;
  logout: () => void;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [{ token, user }, setAuth] = useState<{
    token: string | null;
    user: User | null;
  }>(() => parseCookies());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(
      `${API_URL ?? "http://localhost:3000/api"}/auth/sign-in`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

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

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
