import { createContext, useEffect, useContext, useState, useCallback } from "react";
import { API_URL } from "../config/api";

export type User = {
  id: string;
  email: string;
  role: "admin" | "voter";
  isVerified?: boolean;
};

export type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, admission_number: string, role?: "admin" | "voter") => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error("Empty response from server");
  }
  const data = JSON.parse(text) as { error?: string; message?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data as T;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (res.status === 401) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await handleResponse<{ user: User }>(res);
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/sign-in`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse<{ user?: User }>(res);

    if (data.user) {
      setUser(data.user);
    } else {
      throw new Error("Login failed: No user data received");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore logout errors
    } finally {
      setUser(null);
    }
  };

  const signup = async (
    email: string,
    password: string,
    admission_number: string,
    role: "admin" | "voter" = "voter"
  ) => {
    const res = await fetch(`${API_URL}/auth/sign-up`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, admission_number, role }),
    });

    await handleResponse<{ user?: User; message?: string }>(res);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isLoading, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AuthProvider };
export default AuthProvider;
