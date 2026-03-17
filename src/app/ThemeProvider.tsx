// src/app/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark" 

interface ThemeContextProps {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    } else {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
  }

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light"
    setTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
