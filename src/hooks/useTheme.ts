import { createContext, useContext } from "react"

type Theme = "light" | "dark" 

interface ThemeContextProps {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
