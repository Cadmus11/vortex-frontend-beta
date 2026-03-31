import { createContext, useState, useSyncExternalStore } from "react"

export type Theme = "light" | "dark" 

interface ThemeContextProps {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

const themeStorage = {
  get: (): Theme => {
    if (typeof window === "undefined") return "light"
    return (localStorage.getItem("theme") as Theme) || "light"
  },
  set: (theme: Theme) => {
    localStorage.setItem("theme", theme)
    document.documentElement.setAttribute("data-theme", theme)
  },
  subscribe: (_onStoreChange: () => void) => {
    return () => {}
  },
  getSnapshot: () => "light",
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme
      if (saved) {
        document.documentElement.setAttribute("data-theme", saved)
        return saved
      }
    }
    return "light"
  })

  useSyncExternalStore(
    themeStorage.subscribe,
    themeStorage.getSnapshot,
    themeStorage.getSnapshot
  )

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    themeStorage.set(newTheme)
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

