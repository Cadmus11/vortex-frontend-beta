"use client"
import { API_URL } from "@/features/auth/auth.service"

import { createContext, ReactNode, useContext, useState } from "react"

type User = {
  id: string
  email: string
  role: "admin" | "voter"
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = async (email: string, password: string) => {

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) throw new Error(data.error)

    localStorage.setItem("token", data.token)

    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {

    localStorage.removeItem("token")

    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}