import { createContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (res.status === 401) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!res.ok) throw new Error();

      const data = await res.json() as { user: User };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/sign-in`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json() as { user?: User; error?: string };

    if (!res.ok) {
      throw new Error(data?.error || "Login failed");
    }

    if (data.user) {
      setUser(data.user);
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
    }

    setUser(null);
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

    const data = await res.json() as { user?: User; error?: string };

    if (!res.ok) {
      throw new Error(data?.error || "Signup failed");
    }

    if (data.user) {
      setUser(data.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider };
export default AuthProvider;
