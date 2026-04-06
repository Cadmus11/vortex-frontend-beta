import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"
import "../App.css"
import Menu from "@/components/custom/Menu"
import { Shield } from "lucide-react"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="w-dvw h-dvh overflow-hidden bg-background">
        <div className="relative w-full h-full flex flex-col">
          <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background z-50">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">Vortex</span>
            </div>
            <Menu />
          </header>
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </NextThemesProvider>
  )
}
