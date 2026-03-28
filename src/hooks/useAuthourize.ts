import { createContext, useContext } from "react"

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
