import { ThemeProvider } from '@/context/NextThemer';
import type { ReactNode } from 'react';
import '../App.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <div
        className={`
          w-dvw h-dvh p-2
          relative flex justify-center items-center-safe
          bg-zinc-100 text-zinc-950
          dark:bg-zinc-950 dark:text-zinc-50
          overflow-hidden
        `}
      >
        {/* Background loader animation */}
        <div className="absolute inset-0 flex items-center justify-center  backdrop-blur-sm z-0 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute rounded-full h-40 w-40 bg-zinc-500/80 delay-75 dark:bg-zinc-100/40 animate-ping" />
            <div className="absolute rounded-full h-32 w-32 bg-zinc-500/40 delay-100 dark:bg-zinc-100/20 animate-ping animation-delay-300" />
            <div className="rounded-full h-24 w-24 bg-zinc-500/20 delay-150 dark:bg-zinc-100/10 animate-ping" />
          </div>
        </div>

        {/* Main scrollable content layer */}
        <div
          className={`
            relative z-10
            w-full h-full
            overflow-y-auto overscroll-contain
            scrollbar-hide
          `}
        >
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}