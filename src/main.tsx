
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './context/NextThemer.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <App />
        </ThemeProvider>
,
)
